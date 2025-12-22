import ts from 'typescript'
import {getPackageVersions} from './packageMetadata'

let _z: unknown

export const PACKAGE_NAME = 'zod'

export async function getVersions(
  tag?: string,
): Promise<Array<{version: string; hasZodMini: boolean}>> {
  const packageVersions = await getPackageVersions({packageName: PACKAGE_NAME, tag})

  return packageVersions.map((packageVersion) => {
    // zod-mini has been introduced starting from v4.0.0
    const majorVersion = Number.parseInt(packageVersion.split('.')[0], 10)
    const hasZodMini = majorVersion >= 4

    return {version: packageVersion, hasZodMini}
  })
}

export async function loadVersion({version, isZodMini}: {version: string; isZodMini: boolean}) {
  const pathSegment = isZodMini ? '/mini' : ''
  _z = await import(
    /* @vite-ignore */ `https://cdn.jsdelivr.net/npm/${PACKAGE_NAME}@${version}${pathSegment}/+esm`
  )
}

/**
 * Find the last standalone z.* expression in the code and wrap it with return.
 * A standalone z.* expression is one that starts at the beginning of a line
 * (not assigned to a variable like `const x = z.object(...)`).
 * If no standalone z.* expression is found, the code is returned as-is.
 */
function addReturnToLastSchema(code: string): string {
  const lines = code.split('\n')

  // Find the last standalone z.* expression by scanning from the end
  // We need to find lines that start with `z.` (possibly with leading whitespace)
  // and are not part of an assignment
  let zLineIndex = -1

  // Scan from end to find the last line that starts a standalone z.* expression
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]
    const trimmedLine = line.trim()

    // Skip empty lines
    if (!trimmedLine) continue

    // Check if this line starts a standalone z.* expression (the schema to return)
    // It should start with z. and not be an assignment (no = before z.)
    if (trimmedLine.startsWith('z.')) {
      zLineIndex = i
      break
    }
  }

  if (zLineIndex === -1) {
    // No standalone z.* expression found, return code as-is
    return code
  }

  // Reconstruct the code with 'return' added before the found z.* expression
  return [
    ...lines.slice(0, zLineIndex), // Lines before the z.* expression
    `return ${lines[zLineIndex]}`, // The z.* expression with 'return'
    ...lines.slice(zLineIndex + 1), // Lines after the z.* expression
  ].join('\n')
}

export function validateSchema(schema: string): SchemaValidation {
  try {
    if (schema.length < 3) throw new Error('Schema is too short')

    // Add 'return' to the last standalone z.* expression (if any)
    const codeWithReturn = addReturnToLastSchema(schema)

    // Transpile the code
    const transpiledCode = ts.transpile(codeWithReturn)

    // Execute the transpiled code
    const data = new Function('z', transpiledCode)(_z) as ZodSchema

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
  } catch (_e) {
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
