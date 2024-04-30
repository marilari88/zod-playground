export type Value = {
  value?: string
  validationResult?:
    | {success: true; data: unknown}
    | {success: false; error: string}
}
