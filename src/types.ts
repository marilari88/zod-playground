
export type AppData = {
  schema: string
  values: string[]
}

export type ValidationResult = {
  success: boolean
  data?: any
  error?: string
}
