import type {typescript} from 'monaco-editor'
import {ensureReturnInSchema} from '../zod.ts'

export function getInferenceSource(schema: string, isZodMini: boolean): string {
  // This module is only type-checked, never executed. Keep its return semantics
  // identical to the schema evaluator, including standalone z.* expressions.
  return `import * as z from '${isZodMini ? 'zod/mini' : 'zod'}'
function __getSchema() {
${ensureReturnInSchema(schema)}
}
type Inferred = z.infer<ReturnType<typeof __getSchema>>
`
}

export type InferredType = {text: string; isAbbreviated: boolean}

export async function getInferredType(
  worker: Pick<
    typescript.TypeScriptWorker,
    'getSyntacticDiagnostics' | 'getSemanticDiagnostics' | 'getQuickInfoAtPosition'
  >,
  fileName: string,
  source: string,
): Promise<InferredType> {
  const diagnostics = [
    ...(await worker.getSyntacticDiagnostics(fileName)),
    ...(await worker.getSemanticDiagnostics(fileName)),
  ]
  const error = diagnostics.find((diagnostic) => diagnostic.category === 1)
  if (error) {
    const message = error.messageText
    throw new Error(
      (typeof message === 'string' ? message : message?.messageText) ||
        'Fix the schema’s TypeScript errors to infer its type.',
    )
  }

  const info = await worker.getQuickInfoAtPosition(fileName, source.lastIndexOf('Inferred'))
  const parts: Array<{text: string; kind: string}> | undefined = info?.displayParts
  const text = parts?.map((part) => part.text).join('')
  if (!text) throw new Error('Could not infer a type from this schema.')

  // Quick Info is a preview: TypeScript may shorten large or recursive types.
  // Keep the indication visible and avoid offering incomplete code for copying.
  const isAbbreviated =
    parts?.some(
      (part) =>
        part.kind !== 'punctuation' &&
        part.kind !== 'stringLiteral' &&
        /^\.\.\.(?: \d+ more \.\.\.)?$/.test(part.text),
    ) ?? false
  return {text, isAbbreviated}
}
