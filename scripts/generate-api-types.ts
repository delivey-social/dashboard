/// <reference types="node" />

import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

const API_URL = process.env.VITE_API_URL
const OUTPUT_PATH = join(process.cwd(), 'src/api/types.d.ts')
const execFileAsync = promisify(execFile)

if (!API_URL) {
  throw new Error(
    'VITE_API_URL is not set. Add it to .env before generating API types.',
  )
}

const response = await fetch(`${API_URL}/schema`)

if (!response.ok) {
  throw new Error(
    `Failed to fetch the API schema: ${response.status} ${response.statusText}`,
  )
}

const schema = await response.text()
let temporaryDirectory: string | undefined

try {
  temporaryDirectory = await mkdtemp(join(tmpdir(), 'comida-api-schema-'))
  const schemaPath = join(temporaryDirectory, 'openapi.json')

  JSON.parse(schema)
  await writeFile(schemaPath, schema)
  await mkdir(join(process.cwd(), 'src/api'), { recursive: true })
  await execFileAsync('npx', [
    '--yes',
    'openapi-typescript',
    schemaPath,
    '-o',
    OUTPUT_PATH,
  ])
} finally {
  if (temporaryDirectory) {
    await rm(temporaryDirectory, { recursive: true, force: true })
  }
}
