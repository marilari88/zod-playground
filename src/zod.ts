export type ZodValidation = {
  success: boolean
  data?: any
  error?: string
}

let METADATA: any
let Z: any

export async function getDeclarationTypes(ver: string): Promise<string> {
  if (ver.startsWith('1'))
    return ''

  const res = await fetch(`https://cdn.jsdelivr.net/npm/zod@${ver}/lib/types.d.ts`)
  return await res.text()
}

export async function getVersions(tag?: string): Promise<string[]> {
  if (!METADATA) {
    const res = await fetch('https://data.jsdelivr.com/v1/packages/npm/zod')
    METADATA = await res.json()
  }

  if (tag) {
    const ver = METADATA.tags[tag]
    if (ver) return [ver]
    else throw new Error('Invalid tag')
  }

  const versions = []
  for (const el of METADATA.versions) {
    const ver = el.version
    if (!['alpha', 'beta', 'canary'].some((v) => ver.includes(v)))
      versions.push(ver)
  }

  versions.push(METADATA.tags.canary)

  return versions.toSorted((a, b) => b.localeCompare(a, undefined, {numeric: true}))
}

export async function setVersion(ver: string) {
  Z = await import(
    /* @vite-ignore */ `https://cdn.jsdelivr.net/npm/zod@${ver}/+esm`
  )
}

export function validateSchema(schema: string): ZodValidation {
  try {
    if (schema.length < 3) throw new Error('Schema is too short')

    const data = new Function('z', `return ${schema}`)(Z)

    return {
      success: true,
      data,
    }
  } catch (e: any) {
    return {
      success: false,
      error: e.message,
    }
  }
}

export function validateValue(schema: any, value: string): ZodValidation {
  const evaluatedValue = evalExp(value)
  if (!evaluatedValue.success)
    return evaluatedValue

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

function evalExp(expression: string): ZodValidation {
  try {
    const evaluatedExpression = new Function(`return ${expression}`)()
    return {
      success: true,
      data: evaluatedExpression,
    }
  } catch (e: any) {
    return {
      success: false,
      error: e.message,
    }
  }
}

function generateErrorMessage(issues: any[]) {
  const messages = []
  for (const issue of issues)
    messages.push(`${issue.path}: ${issue.code} - ${issue.message}`)

  return messages.join(' | ')
}