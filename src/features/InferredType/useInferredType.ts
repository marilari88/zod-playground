import {useMonaco} from '@monaco-editor/react'
import type {editor} from 'monaco-editor'
import {useEffect, useMemo, useState} from 'react'
import {getInferenceSource, getInferredType, type InferredType} from '../../utils/inferredType'

let nextModelId = 0

export function useInferredType({
  schema,
  isZodMini,
  isLoading,
  hasTypeDefinitions,
}: {
  schema: string
  isZodMini: boolean
  isLoading: boolean
  hasTypeDefinitions: boolean
}) {
  const monaco = useMonaco()
  const source = useMemo(() => getInferenceSource(schema, isZodMini), [schema, isZodMini])
  const [result, setResult] = useState<{type?: InferredType; message?: string}>({})

  useEffect(() => {
    if (!schema.trim()) {
      setResult({message: 'Write a schema to see its inferred type.'})
      return
    }
    if (!monaco || isLoading) return
    if (!hasTypeDefinitions) {
      setResult({message: 'Type definitions could not be loaded. Try reloading.'})
      return
    }

    // Keep the previous result visible until this inference succeeds or fails.
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
        if (!cancelled) setResult({type})
      } catch (error) {
        if (!cancelled) {
          setResult({
            message:
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
  }, [monaco, source, schema, isLoading, hasTypeDefinitions])

  return result
}
