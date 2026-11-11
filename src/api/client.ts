import type { paths } from './types'

type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch'
type ApiPath = keyof paths
type PathMethod<TPath extends ApiPath> = Extract<keyof paths[TPath], HttpMethod>
type Operation<
  TPath extends ApiPath,
  TMethod extends PathMethod<TPath>,
> = paths[TPath][TMethod]

type OperationParameters<TOperation> = TOperation extends {
  parameters: infer Parameters
}
  ? Parameters
  : never

type PathParameters<TOperation> =
  OperationParameters<TOperation> extends {
    path: infer Parameters
  }
    ? Parameters extends Record<string, string | number>
      ? Parameters
      : never
    : never

type QueryParameters<TOperation> =
  OperationParameters<TOperation> extends {
    query: infer Parameters
  }
    ? Parameters extends Record<string, unknown>
      ? Parameters
      : never
    : never

type RequestBody<TOperation> = TOperation extends {
  requestBody: { content: infer Content }
}
  ? Content extends { 'application/json': infer Body }
    ? Body
    : Content extends { 'multipart/form-data': unknown }
      ? FormData
      : never
  : never

type ResponseBody<TOperation> = TOperation extends {
  responses: { 200: { content: infer Content } }
}
  ? Content extends { 'application/json': infer Body }
    ? Body
    : never
  : never

type TokenResponse = {
  access_token: string
  expires_in?: number
  refresh_token?: string
}

type RequestOptions<TOperation> = {
  headers?: HeadersInit
  signal?: AbortSignal
} & (PathParameters<TOperation> extends never
  ? { path?: never }
  : { path: PathParameters<TOperation> }) &
  (QueryParameters<TOperation> extends never
    ? { query?: never }
    : { query?: QueryParameters<TOperation> }) &
  (RequestBody<TOperation> extends never
    ? { body?: never }
    : { body: RequestBody<TOperation> })

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ApiClient {
  private static readonly accessTokenKey = 'comida.access_token'
  private static readonly accessTokenExpiresAtKey =
    'comida.access_token_expires_at'
  private static readonly refreshTokenKey = 'comida.refresh_token'
  private static readonly refreshBufferMs = 60_000
  private readonly baseUrl: string
  private readonly authUrl: string
  private readonly authClientId: string
  private accessTokenPromise?: Promise<string | null>
  private refreshTokenPromise?: Promise<string>

  constructor(baseUrl = import.meta.env.VITE_API_URL) {
    if (!baseUrl) {
      throw new Error('VITE_API_URL is not configured.')
    }
    const authUrl = import.meta.env.VITE_AUTH_URL
    const authClientId = import.meta.env.VITE_AUTH_CLIENT_ID
    if (!authUrl) {
      throw new Error('VITE_AUTH_URL is not configured.')
    }
    if (!authClientId) {
      throw new Error('VITE_AUTH_CLIENT_ID is not configured.')
    }

    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.authUrl = authUrl.replace(/\/$/, '')
    this.authClientId = authClientId
  }

  async request<TPath extends ApiPath, TMethod extends PathMethod<TPath>>(
    path: TPath,
    method: TMethod,
    options?: RequestOptions<Operation<TPath, TMethod>>,
  ): Promise<ResponseBody<Operation<TPath, TMethod>>> {
    const accessToken = await this.getAccessToken()
    const requestOptions = options ?? {}
    const requestPath = this.replacePathParameters(
      path,
      'path' in requestOptions ? requestOptions.path : undefined,
    )
    const url = new URL(requestPath, `${this.baseUrl}/`)

    const query = Reflect.get(requestOptions, 'query') as
      Record<string, unknown> | undefined
    this.appendQueryParameters(url, query ?? {})

    const headers = new Headers(requestOptions.headers)
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`)
    }
    const hasBody = Object.hasOwn(requestOptions, 'body')
    const requestBody = Reflect.get(requestOptions, 'body')

    if (hasBody && !(requestBody instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }

    const response = await fetch(url, {
      method: method.toUpperCase(),
      headers,
      signal: requestOptions.signal,
      body:
        hasBody && requestBody instanceof FormData
          ? requestBody
          : hasBody
            ? JSON.stringify(requestBody)
            : undefined,
    })

    const responseBody = await this.parseResponseBody(response)

    if (response.status === 401) {
      this.clearStoredTokens()
      this.redirectToLogin()
    }

    if (!response.ok) {
      throw new ApiError(
        `API request failed with status ${response.status}.`,
        response.status,
        responseBody,
      )
    }

    return responseBody as ResponseBody<Operation<TPath, TMethod>>
  }

  logout(): void {
    this.clearStoredTokens()
    sessionStorage.removeItem('comida.auth_state')
    sessionStorage.removeItem('comida.pkce_verifier')

    const logoutUrl = new URL(
      '/realms/master/protocol/openid-connect/logout',
      this.authUrl,
    )
    logoutUrl.searchParams.set('client_id', this.authClientId)
    logoutUrl.searchParams.set(
      'post_logout_redirect_uri',
      `${window.location.origin}/`,
    )
    window.location.replace(logoutUrl)
  }

  private redirectToLogin(): void {
    const state = crypto.randomUUID()
    const verifier = this.createCodeVerifier()
    sessionStorage.setItem('comida.auth_state', state)
    sessionStorage.setItem('comida.pkce_verifier', verifier)

    const loginUrl = new URL(
      '/realms/master/protocol/openid-connect/auth',
      this.authUrl,
    )
    loginUrl.searchParams.set('client_id', this.authClientId)
    loginUrl.searchParams.set('redirect_uri', `${window.location.origin}/`)
    loginUrl.searchParams.set('response_type', 'code')
    loginUrl.searchParams.set('scope', 'openid')
    loginUrl.searchParams.set('state', state)
    loginUrl.searchParams.set('code_challenge', verifier)
    loginUrl.searchParams.set('code_challenge_method', 'plain')
    window.location.replace(loginUrl)
  }

  private async getAccessToken(): Promise<string | null> {
    this.accessTokenPromise ??= this.loadAccessToken()
    const accessToken = await this.accessTokenPromise
    if (!accessToken || !this.isAccessTokenExpiringSoon()) {
      return accessToken
    }

    const refreshToken = sessionStorage.getItem(ApiClient.refreshTokenKey)
    if (!refreshToken) return accessToken

    this.refreshTokenPromise ??= this.refreshAccessToken(refreshToken)
    try {
      return await this.refreshTokenPromise
    } finally {
      this.refreshTokenPromise = undefined
    }
  }

  private async loadAccessToken(): Promise<string | null> {
    const storedToken = sessionStorage.getItem(ApiClient.accessTokenKey)
    if (storedToken) return storedToken

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (!code) return null

    const state = params.get('state')
    const expectedState = sessionStorage.getItem('comida.auth_state')
    const verifier = sessionStorage.getItem('comida.pkce_verifier')
    if (!state || state !== expectedState || !verifier) {
      throw new Error('Invalid authentication response.')
    }

    const tokenUrl = new URL(
      '/realms/master/protocol/openid-connect/token',
      this.authUrl,
    )
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.authClientId,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${window.location.origin}/`,
        code_verifier: verifier,
      }),
    })
    const tokenBody = (await tokenResponse.json()) as
      TokenResponse | { error: string }
    if (!tokenResponse.ok || !('access_token' in tokenBody)) {
      throw new Error(
        `Authentication failed: ${'error' in tokenBody ? tokenBody.error : 'invalid token response'}.`,
      )
    }

    this.storeTokenResponse(tokenBody)
    sessionStorage.removeItem('comida.auth_state')
    sessionStorage.removeItem('comida.pkce_verifier')
    window.history.replaceState({}, document.title, window.location.pathname)
    return tokenBody.access_token
  }

  private async refreshAccessToken(refreshToken: string): Promise<string> {
    const tokenUrl = new URL(
      '/realms/master/protocol/openid-connect/token',
      this.authUrl,
    )
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.authClientId,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })
    const tokenBody = (await tokenResponse.json()) as
      TokenResponse | { error: string }
    if (!tokenResponse.ok || !('access_token' in tokenBody)) {
      this.clearStoredTokens()
      this.redirectToLogin()
      throw new Error(
        `Token refresh failed: ${'error' in tokenBody ? tokenBody.error : 'invalid token response'}.`,
      )
    }

    this.storeTokenResponse(tokenBody)
    return tokenBody.access_token
  }

  private storeTokenResponse(tokenResponse: TokenResponse): void {
    sessionStorage.setItem(ApiClient.accessTokenKey, tokenResponse.access_token)
    if (tokenResponse.expires_in !== undefined) {
      sessionStorage.setItem(
        ApiClient.accessTokenExpiresAtKey,
        String(Date.now() + tokenResponse.expires_in * 1000),
      )
    }
    if (tokenResponse.refresh_token) {
      sessionStorage.setItem(
        ApiClient.refreshTokenKey,
        tokenResponse.refresh_token,
      )
    }
  }

  private isAccessTokenExpiringSoon(): boolean {
    const expiresAt = Number(
      sessionStorage.getItem(ApiClient.accessTokenExpiresAtKey),
    )
    return (
      Number.isFinite(expiresAt) &&
      expiresAt - Date.now() <= ApiClient.refreshBufferMs
    )
  }

  private clearStoredTokens(): void {
    sessionStorage.removeItem(ApiClient.accessTokenKey)
    sessionStorage.removeItem(ApiClient.accessTokenExpiresAtKey)
    sessionStorage.removeItem(ApiClient.refreshTokenKey)
  }

  private createCodeVerifier(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(32))
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
      '',
    )
  }

  private replacePathParameters(
    path: string,
    parameters: Record<string, string | number> | undefined,
  ): string {
    return path.replace(/{([^}]+)}/g, (_, parameter: string) => {
      const value = parameters?.[parameter]

      if (value === undefined) {
        throw new Error(`Missing path parameter: ${parameter}`)
      }

      return encodeURIComponent(String(value))
    })
  }

  private appendQueryParameters(
    url: URL,
    parameters: Record<string, unknown>,
  ): void {
    for (const [key, value] of Object.entries(parameters)) {
      if (value === undefined || value === null) {
        continue
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          url.searchParams.append(key, String(item))
        }
      } else {
        url.searchParams.set(key, String(value))
      }
    }
  }

  private async parseResponseBody(response: Response): Promise<unknown> {
    if (
      response.status === 204 ||
      response.headers.get('content-length') === '0'
    ) {
      return undefined
    }

    const contentType = response.headers.get('content-type')

    if (contentType?.includes('application/json')) {
      return response.json()
    }

    if (contentType?.startsWith('image/')) {
      return response.blob()
    }

    return response.text()
  }
}

export const apiClient = new ApiClient()
