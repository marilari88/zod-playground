import {z} from 'zod'

export const appDataSchema = z.object({
  schema: z.string(),
  values: z.array(z.string()),
})

export type AppData = z.infer<typeof appDataSchema>

export type Validation = {
  value?: string
  result?: {success: true; data: unknown} | {success: false; error: string}
}
