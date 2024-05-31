import {ValidationResult} from './types'
import {generateErrorMessage} from 'zod-error'

class _Zod {
  private versions: string[] | undefined
  private z: any

  async getVersions(): Promise<string[]> {
    if (!this.versions) {
      const res = await fetch('https://data.jsdelivr.com/v1/packages/npm/zod')
      const metadata = await res.json()
      const versions = []

      for (const el of metadata.versions) {
        if (!['alpha', 'beta', 'canary'].some((v) => el.version.includes(v))) {
          versions.push(el.version)
        }
      }

      versions.push(metadata.tags.canary)

      // const tags = metadata.tags
      // for (const k in tags) {
      //   const ver = tags[k]
      //   if (!versions.includes(ver))
      //     versions.push(ver)
      // }

      this.versions = versions.sort((a, b) => {
        return b.localeCompare(a, undefined, {numeric: true})
      })
    }

    return this.versions
  }

  async setVersion(ver: string) {
    this.z = await import(
      /* @vite-ignore */ `https://cdn.jsdelivr.net/npm/zod@${ver}/+esm`
    )
  }

  validateSchema(schema: string): ValidationResult {
    try {
      if (schema.length < 3) throw new Error('Schema is too short')

      const data = eval(`const z = this.z;${schema}`)

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

  validateValue(schema: any, value: string): ValidationResult {
    const _evalExp = (expression: string) => {
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

    const evaluatedValue = _evalExp(value)
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
}

export const Zod = new _Zod()
