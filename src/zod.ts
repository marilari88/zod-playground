import ts from 'typescript'
import {getPackageVersions} from './packageMetadata.ts'

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
 * A standalone z.* expression is one that:
 * 1. Appears at bracket depth 0 (not nested inside another expression)
 * 2. Starts at the beginning of a line (only whitespace before it)
 * If no standalone z.* expression is found, the code is returned as-is.
 */
export function ensureReturnInSchema(code: string): string {
  let depth = 0

  // Scan from the end to find the last standalone z.* expression
  // We track bracket depth to distinguish top-level expressions from nested ones
  for (let i = code.length - 1; i >= 1; i--) {
    const char = code[i]

    // Track bracket depth (reversed since we're scanning backwards)
    if (char === ')' || char === ']' || char === '}') {
      depth++
    } else if (char === '(' || char === '[' || char === '{') {
      depth--
    }

    // At depth 0, check for 'return' keyword at the start of a line
    // If found, stop - user already has an explicit return
    if (depth === 0 && char === 'r' && code.slice(i, i + 6) === 'return') {
      // Check 'return' is not part of a larger identifier
      const charBefore = i > 0 ? code[i - 1] : ''
      const charAfter = i + 6 < code.length ? code[i + 6] : ''
      if (!/[a-zA-Z0-9_$]/.test(charBefore) && !/[a-zA-Z0-9_$]/.test(charAfter)) {
        // Found 'return' keyword - check if it's at the start of its line
        let lineStart = i
        while (lineStart > 0 && code[lineStart - 1] !== '\n') {
          lineStart--
        }
        const beforeReturn = code.slice(lineStart, i)
        if (/^\s*$/.test(beforeReturn)) {
          // Top-level return found at start of line, return code as-is
          return code
        }
      }
    }

    // Look for 'z.' pattern at depth 0
    if (depth === 0 && code[i - 1] === 'z' && char === '.') {
      // Check z is not part of a larger identifier (e.g., not "xyz.")
      const zIndex = i - 1
      if (zIndex === 0 || !/[a-zA-Z0-9_$]/.test(code[zIndex - 1])) {
        // Found a z.* at depth 0. Now check if it's at the start of its line.
        // Find the start of the line containing this z
        let lineStart = zIndex
        while (lineStart > 0 && code[lineStart - 1] !== '\n') {
          lineStart--
        }

        // Get the content from line start to z
        const beforeZ = code.slice(lineStart, zIndex)

        // Check if everything before z on this line is whitespace
        // (This filters out assignments like "const x = z.string()")
        if (/^\s*$/.test(beforeZ)) {
          // This z.* is at the start of its line (ignoring whitespace)
          // This is our return target
          return code.slice(0, zIndex) + 'return ' + code.slice(zIndex)
        }
        // Otherwise, this z.* is part of an assignment or similar, continue scanning
      }
    }
  }

  // No standalone z.* expression found, return code as-is
  return code
}

export function validateSchema(schema: string): SchemaValidation {
  try {
    if (schema.length < 3) throw new Error('Schema is too short')

    // Add 'return' to the last standalone z.* expression (if any)
    const codeWithReturn = ensureReturnInSchema(schema)

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
