import {useEffect, useRef, useState} from 'react'
import {ZodSchema} from 'zod'
import {generateErrorMessage} from 'zod-error'

import {ValidationResult} from './types'

const validateValue = (schema: ZodSchema, value: string): ValidationResult => {
  const evaluatedValue = evaluateExpression(value)
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

const evaluateExpression = (expression: string) => {
  try {
    const evaluatedExpression = new Function(`return ${expression}`)()
    return {
      success: true,
      data: evaluatedExpression,
    }
  } catch (e) {
    if (e instanceof Error) {
      return {
        success: false,
        error: e.message,
      }
    }
    return {
      success: false,
      error: 'Unknown error',
    }
  }
}

const importZod = async (version: string) => {
  const lib = await import(
    /* @vite-ignore */ `https://cdn.jsdelivr.net/npm/zod@${version}/+esm`
  )
  return lib
}

export const useZod = (defaultVersion?: string) => {
  const [version, setVersion] = useState<string | undefined>(defaultVersion)
  const [isLoading, setIsLoading] = useState(false)
  const zodRef = useRef<any>()

  useEffect(() => {
    const fetchVersion = async () => {
      setIsLoading(true)
      const zod = await importZod(version ?? 'latest')
      setIsLoading(false)
      zodRef.current = zod
    }

    fetchVersion()
  }, [version])

  const validateSchema = (schema: string): ValidationResult => {
    try {
      if (schema.length < 3) throw new Error('Schema is too short')

      const z = zodRef.current.z
      const data = new Function('z', `return ${schema}`)(z)

      return {
        success: true,
        data,
      }
    } catch (e) {
      if (e instanceof Error) {
        return {
          success: false,
          error: e.message,
        }
      }
      return {
        success: false,
        error: 'Unknown error',
      }
    }
  }

  const validate = (schema: string, values: string[]) => {
    const schemaResult = validateSchema(schema)
    const valuesResult = values.map((value) =>
      validateValue(schemaResult.data, value),
    )
    return {schemaResult, valuesResult}
  }

  return {isLoading, version, updateVersion: setVersion, validate}
}
