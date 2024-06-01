import {generateErrorMessage} from 'zod-error'

export type ZodValidation = {
  success: boolean
  data?: any
  error?: string
}

class _Zod {
  private metadata: any
  private z: any

  async getTypes(ver: string): Promise<string> {
    if (ver.startsWith('1'))
      return ''

    const res = await fetch(`https://cdn.jsdelivr.net/npm/zod@${ver}/lib/types.d.ts`)
    return await res.text()
  }

  async getVersions(tag?: string): Promise<string[]> {
    if (!this.metadata) {
      const res = await fetch('https://data.jsdelivr.com/v1/packages/npm/zod')
      this.metadata = await res.json()
    }

    const metadata = this.metadata
    if (tag) {
      const ver = metadata.tags[tag]
      if (ver) return [ver]
      else throw new Error('Invalid tag')
    }

    const versions = []
    for (const el of metadata.versions) {
      const ver = el.version
      if (!['alpha', 'beta', 'canary'].some((v) => ver.includes(v)))
        versions.push(ver)
    }

    versions.push(metadata.tags.canary)

    // const tags = metadata.tags
    // for (const k in tags) {
    //   const ver = tags[k]
    //   if (!versions.includes(ver))
    //     versions.push(ver)
    // }

    return versions.toSorted((a, b) => b.localeCompare(a, undefined, {numeric: true}))
  }

  async setVersion(ver: string) {
    this.z = await import(
      /* @vite-ignore */ `https://cdn.jsdelivr.net/npm/zod@${ver}/+esm`
    )
  }

  validateSchema(schema: string): ZodValidation {
    try {
      if (schema.length < 3) throw new Error('Schema is too short')

      const data = new Function('z', `return ${schema}`)(this.z)

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

  validateValue(schema: any, value: string): ZodValidation {
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