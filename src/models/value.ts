export type Value = {
  value?: string
  defaultValue?: string
  validationResult?:
    | {success: true; data: unknown}
    | {success: false; error: string}
}
