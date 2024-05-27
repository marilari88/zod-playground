import {ValidationResult} from "./types"
import {generateErrorMessage} from 'zod-error'

class _Zod {

  public readonly metadata: any
  private z: any

  private constructor(metadata: any) {
    this.metadata = metadata
  }

  static async init(): Promise<_Zod> {
    const res = await fetch('https://data.jsdelivr.com/v1/packages/npm/zod')
    const metadata = await res.json()

    // metadata.tags

    // alpha: "3.21.5-alpha.0"
    // beta: "3.23.0-beta.2"
    // canary: "3.24.0-canary.20240523T174819"
    // latest: "3.23.8"
    // next: "3.8.2-alpha.6"

    // 4.0.0-beta.1 in metadata.versions

    return new _Zod(metadata)
  }

  async setVersion(ver: string) {
    this.z = await import(/* @vite-ignore */ `https://cdn.jsdelivr.net/npm/zod@${ver}/+esm`)
  }

  validateSchema(schema: string): ValidationResult {
    try {
      if (schema.length < 3)
        throw new Error('Schema is too short')

      const data = eval(`const z = this.z;${schema}`)

      return {
        success: true,
        data
      }
    }
    catch (e: any) {
      return {
        success: false,
        error: e.message
      }
    }
  }

  validateValue(schema: any, value: string): ValidationResult {
    const _evalExp = (expression: string) => {
      try {
        const evaluatedExpression = new Function(`return ${expression}`)()
        return {
          success: true,
          data: evaluatedExpression
        }
      }
      catch (e: any) {
        return {
          success: false,
          error: e.message,
        }
      }
    }

    const evaluatedValue = _evalExp(value)
    if (!evaluatedValue.success) return evaluatedValue

    try {
      const validationRes = schema.safeParse(evaluatedValue.data)

      return validationRes.success
        ? { success: true, data: validationRes.data }
        : {
          success: false,
          error: generateErrorMessage(validationRes.error.issues),
        }
    }
    catch (e) {
      return {
        success: false,
        error: 'Cannot validate value. Please check the schema',
      }
    }
  }

}

export const Zod = await _Zod.init()
