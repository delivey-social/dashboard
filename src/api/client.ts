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
    : never
  : never

type ResponseBody<TOperation> = TOperation extends {
  responses: { 200: { content: infer Content } }
}
  ? Content extends { 'application/json': infer Body }
    ? Body
    : never
  : never

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
  private readonly baseUrl: string

  constructor(baseUrl = import.meta.env.VITE_API_URL) {
    if (!baseUrl) {
      throw new Error('VITE_API_URL is not configured.')
    }

    this.baseUrl = baseUrl.replace(/\/$/, '')
  }

  async request<TPath extends ApiPath, TMethod extends PathMethod<TPath>>(
    path: TPath,
    method: TMethod,
    options?: RequestOptions<Operation<TPath, TMethod>>,
  ): Promise<ResponseBody<Operation<TPath, TMethod>>> {
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
    const hasBody = Object.hasOwn(requestOptions, 'body')
    const requestBody = Reflect.get(requestOptions, 'body')

    if (hasBody) {
      headers.set('Content-Type', 'application/json')
    }

    const response = await fetch(url, {
      method: method.toUpperCase(),
      headers,
      signal: requestOptions.signal,
      body: hasBody ? JSON.stringify(requestBody) : undefined,
    })

    const responseBody = await this.parseResponseBody(response)

    if (!response.ok) {
      throw new ApiError(
        `API request failed with status ${response.status}.`,
        response.status,
        responseBody,
      )
    }

    return responseBody as ResponseBody<Operation<TPath, TMethod>>
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

    return response.text()
  }
}

export const apiClient = new ApiClient()
