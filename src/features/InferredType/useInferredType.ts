import {useMonaco} from '@monaco-editor/react'
import type {editor} from 'monaco-editor'
import {useEffect, useMemo, useState} from 'react'
import {getInferenceSource, getInferredType, type InferredType} from '../../utils/inferredType'

let nextModelId = 0

type Result = {source: string; version: string} & (
  | {type: InferredType; error?: never}
  | {type?: never; error: string}
)

export function useInferredType({
  schema,
  version,
  isZodMini,
  isLoading,
  hasTypeDefinitions,
}: {
  schema: string
  version: string
  isZodMini: boolean
  isLoading: boolean
  hasTypeDefinitions: boolean
}) {
  const monaco = useMonaco()
  const source = useMemo(() => getInferenceSource(schema, isZodMini), [schema, isZodMini])
  const [result, setResult] = useState<Result>()

  useEffect(() => {
    setResult(undefined)
    if (!monaco || isLoading || !hasTypeDefinitions || !schema.trim()) return

    let cancelled = false
    let model: editor.ITextModel | undefined
    const timer = window.setTimeout(async () => {
      try {
        // An isolated module avoids polluting the editable models' global scope.
        model = monaco.editor.createModel(
          source,
          'typescript',
          monaco.Uri.parse(`file:///inferred-type-${nextModelId++}.ts`),
        )
        const getWorker = await monaco.typescript.getTypeScriptWorker()
        if (cancelled) return
        const worker = await getWorker(model.uri)
        if (cancelled) return
        const type = await getInferredType(worker, model.uri.toString(), source)
        if (!cancelled) setResult({source, version, type})
      } catch (error) {
        if (!cancelled) {
          setResult({
            source,
            version,
            error:
              error instanceof Error ? error.message : 'Could not infer a type from this schema.',
          })
        }
      } finally {
        model?.dispose()
      }
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      model?.dispose()
    }
  }, [monaco, source, schema, version, isLoading, hasTypeDefinitions])

  if (!schema.trim()) return {message: 'Write a schema to see its inferred type.'}
  if (isLoading || !monaco) return {message: 'Loading type definitions…', isPending: true}
  if (!hasTypeDefinitions) return {message: 'Type definitions could not be loaded. Try reloading.'}
  // Hide an old result immediately, before the effect runs for a new schema.
  if (!result || result.source !== source || result.version !== version) {
    return {message: 'Inferring type…', isPending: true}
  }
  if (result.error !== undefined) return {message: result.error}
  return {type: result.type}
}
