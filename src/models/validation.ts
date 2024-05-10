export type Validation = {
  value?: string
  result?: {success: true; data: unknown} | {success: false; error: string}
}
