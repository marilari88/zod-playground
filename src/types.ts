export type AppData = {
  schema: string
  values: string[]
}

export type ValidationResult =
  | {
      success: true
      data: any
    }
  | {
      data?: undefined
      success: false
      error?: string
    }
