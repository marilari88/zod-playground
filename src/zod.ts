export type ZodSchema = {
  safeParse: (data: unknown) => {
    success: boolean
    data: unknown
    error: {
      issues: ZodIssue[]
    }
  }
}

type SchemaValidation =
  | {
      success: true
      data: ZodSchema
    }
  | {
      success: false
      error: string
    }

type ValueValidation =
  | {
      success: true
      data: unknown
    }
  | {
      success: false
      error: string
    }

type ZodIssue = {
  code: string
  path: (string | number)[]
  message: string
}

type JsDelivrMetadata = {
  type: string
  name: string
  tags: Record<string, string>
  versions: {
    version: string
    links: {
      self: string
      entrypoints: string
      stats: string
    }
  }[]
  links: {
    stats: string
  }
}

let _metadata: JsDelivrMetadata
let _z: unknown

export async function getDeclarationTypes(ver: string): Promise<string> {
  const res = await fetch(`https://cdn.jsdelivr.net/npm/zod@${ver}/lib/types.d.ts`)
  return await res.text()
}

export async function getVersions(tag?: string): Promise<string[]> {
  if (!_metadata) {
    const res = await fetch('https://data.jsdelivr.com/v1/packages/npm/zod')
    _metadata = await res.json()
  }

  if (tag) {
    const ver = _metadata.tags[tag]
    if (ver) return [ver]
    throw new Error('Invalid tag')
  }

  const versions = []
  for (const el of _metadata.versions) {
    const ver = el.version

    if (ver.startsWith('1')) continue

    if (['alpha', 'beta', 'canary'].some((v) => ver.includes(v))) continue

    versions.push(ver)
  }

  versions.push(_metadata.tags.canary)

  return versions.toSorted((a, b) => b.localeCompare(a, undefined, {numeric: true}))
}

export async function setVersion(ver: string) {
  _z = await import(/* @vite-ignore */ `https://cdn.jsdelivr.net/npm/zod@${ver}/+esm`)
}

export function validateSchema(schema: string): SchemaValidation {
  try {
    if (schema.length < 3) throw new Error('Schema is too short')

    const data = new Function('z', `return ${schema}`)(_z) as ZodSchema

    return {
      success: true,
      data,
    }
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown error'
    return {
      success: false,
      error,
    }
  }
}

export function validateValue(schema: ZodSchema, value: string): ValueValidation {
  const evaluatedValue = evalExp(value)
  if (!evaluatedValue.success) return evaluatedValue

  try {
    const validationRes = schema.safeParse(evaluatedValue.data)

    return validationRes.success
      ? {success: true, data: validationRes.data}
      : {
          success: false,
          error: generateErrorMessage(validationRes.error.issues),
        }
  } catch (e) {
    return {
      success: false,
      error: 'Cannot validate value. Please check the schema',
    }
  }
}

function evalExp(expression: string): ValueValidation {
  try {
    const evaluatedExpression = new Function(`return ${expression}`)()
    return {
      success: true,
      data: evaluatedExpression,
    }
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown error'
    return {
      success: false,
      error,
    }
  }
}

function generateErrorMessage(issues: ZodIssue[]) {
  const messages = []
  for (const issue of issues) {
    const path = issue.path
    if (path.length > 0) messages.push(`${path}: ${issue.code} - ${issue.message}`)
    else messages.push(`${issue.code} - ${issue.message}`)
  }

  return messages.join('\n')
}
