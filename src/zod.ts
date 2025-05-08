import ts from 'typescript'
import {getPackageVersions} from './packageMetadata'

let _z: unknown

export const ZOD_PACKAGE_NAMES = ['zod', '@zod/mini'] as const satisfies string[]
export type ZodPackageName = (typeof ZOD_PACKAGE_NAMES)[number]

export function assertIsZodPackageName(
  packageName: unknown,
): asserts packageName is ZodPackageName {
  if (!ZOD_PACKAGE_NAMES.includes(packageName as ZodPackageName))
    throw Error('Invalid package name')
}

export async function getVersions(
  tag?: string,
): Promise<Array<{packageName: string; version: string}>> {
  const versions = []

  for (const packageName of ZOD_PACKAGE_NAMES) {
    const packageVersions = await getPackageVersions({packageName, tag})
    versions.push(...packageVersions.map((v) => ({packageName, version: v})))
  }

  return versions
}

export async function loadVersion({
  version,
  packageName,
}: {version: string; packageName: ZodPackageName}) {
  _z = await import(
    /* @vite-ignore */ `https://cdn.jsdelivr.net/npm/${packageName}@${version}/+esm`
  )
}

export function validateSchema(schema: string): SchemaValidation {
  try {
    if (schema.length < 3) throw new Error('Schema is too short')

    const js = ts.transpile(schema)
    const data = new Function('z', `return ${js}`)(_z) as ZodSchema

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

export type ZodSchema = {
  safeParse: (data: unknown) => {
    success: boolean
    data: unknown
    error: {
      issues: ZodIssue[]
    }
  }
}

type ZodIssue = {
  code: string
  path: (string | number)[]
  message: string
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
