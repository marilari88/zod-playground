export type AppData = {
    schema: string
    values: string[]
}

export type Validation = {
    value?: string
    result?: {success: true; data: unknown} | {success: false; error: string}
}
