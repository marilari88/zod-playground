import assert from 'node:assert/strict'
import {test} from 'node:test'
// Exercise the installed Monaco compiler without a browser or network requests.
// @ts-expect-error Monaco's worker implementation does not ship declarations.
import {TypeScriptWorker} from 'monaco-editor/languages/features/typescript/tsWorker.js'
import {getInferenceSource, getInferredTypes} from '../src/utils/inferredType.ts'

// Minimal declarations isolate our compiler integration from downloaded Zod versions.
const declarations = `
export interface Schema<Output, Input = Output> {
  _input: Input
  _output: Output
  transform<U>(fn: (value: Output) => U): Schema<U, Input>
  default(value: Output): Schema<Output, Input | undefined>
}
export type input<T extends Schema<unknown>> = T['_input']
export type output<T extends Schema<unknown>> = T['_output']
export type infer<T extends Schema<unknown>> = output<T>
export declare function custom<T>(): Schema<T>
export declare function string(): Schema<string>
export declare const coerce: {number(): Schema<number, unknown>}
`

async function infer(schema: string, {isZodMini = false, hasTypes = true} = {}) {
  const source = getInferenceSource(schema, isZodMini)
  const fileName = 'file:///inferred-type.ts'
  const packageName = isZodMini ? 'zod/mini' : 'zod'
  const worker = new TypeScriptWorker(
    {
      getMirrorModels: () => [
        {
          uri: {toString: () => fileName, path: '/inferred-type.ts'},
          version: 1,
          getValue: () => source,
        },
      ],
    },
    {
      compilerOptions: {strict: true, target: 7, module: 99, moduleResolution: 2},
      extraLibs: hasTypes
        ? {
            [`file:///node_modules/${packageName}/index.d.ts`]: {
              content: declarations,
              version: 1,
            },
            'file:///editor.ts': {
              // The actual schema editor is a script with globals of its own.
              content: 'const schema = 123; const __getSchema = false;',
              version: 1,
            },
          }
        : {},
    },
  )
  try {
    return await getInferredTypes(worker, fileName, source)
  } finally {
    worker.getLanguageService().dispose()
  }
}

test('infers explicit returns without collisions with the schema editor globals', async () => {
  const {input, output} = await infer(`const schema = z.custom<{
    name: string
    birth_year?: number
    address: { city: string } | null
  }>()
  return schema`)

  for (const {text} of [input, output]) {
    assert.match(text, /name: string;/)
    assert.match(text, /birth_year\?: number(?: \| undefined)?;/)
    assert.match(text, /address: \{\s+city: string;\s+\} \| null;/)
  }
})

test('infers the last standalone schema expression', async () => {
  const {input, output} = await infer('z.string()\nz.custom<number>()')
  assert.equal(input.text, 'type InferredInput = number')
  assert.equal(output.text, 'type InferredOutput = number')
})

test('infers both the original input and the transformed output', async () => {
  const {input, output} = await infer('z.string().transform(value => value.length)')
  assert.equal(input.text, 'type InferredInput = string')
  assert.equal(output.text, 'type InferredOutput = number')
})

test('preserves input across chained transforms', async () => {
  const {input, output} = await infer(
    'z.string().transform(value => value.length).transform(length => length > 0)',
  )
  assert.equal(input.text, 'type InferredInput = string')
  assert.equal(output.text, 'type InferredOutput = boolean')
})

test('shows undefined in defaulted inputs and unknown in coerced inputs', async () => {
  const defaulted = await infer('z.string().default("fallback")')
  assert.equal(defaulted.input.text, 'type InferredInput = string | undefined')
  assert.equal(defaulted.output.text, 'type InferredOutput = string')

  const coerced = await infer('z.coerce.number()')
  assert.equal(coerced.input.text, 'type InferredInput = unknown')
  assert.equal(coerced.output.text, 'type InferredOutput = number')
})

test('resolves the Mini entry point', async () => {
  const {input, output} = await infer('z.string()', {isZodMini: true})
  assert.equal(input.text, 'type InferredInput = string')
  assert.equal(output.text, 'type InferredOutput = string')
})

test('supports type aliases and z.infer inside the schema', async () => {
  const {output} = await infer(`const base = z.string()
  type Value = z.infer<typeof base>
  return z.custom<Value[]>()`)
  assert.equal(output.text, 'type InferredOutput = string[]')
})

test('does not execute schema code to infer a type', async () => {
  const {output} = await infer('throw new Error("Do not execute")\nreturn z.string()')
  assert.equal(output.text, 'type InferredOutput = string')
})

test('reports syntax and type errors instead of presenting misleading inference', async () => {
  await assert.rejects(infer('z.custom<>()'))
  await assert.rejects(infer('z.missing()'), /does not exist/)
  await assert.rejects(infer('const schema = z.string()'), /void/)
  await assert.rejects(infer('return 42'), /constraint/)
})

test('reports missing declarations instead of displaying any', async () => {
  await assert.rejects(infer('z.string()', {hasTypes: false}), /Cannot find module/)
})

test('identifies abbreviated types without mistaking rest tuples or literals for truncation', async () => {
  const fields = Array.from({length: 100}, (_, index) => `field${index}: string`).join(';')
  const {input, output} = await infer(`z.custom<{${fields}}>().transform(value => value.field0)`)
  assert.equal(input.isAbbreviated, true)
  assert.equal(output.isAbbreviated, false)
  assert.equal(output.text, 'type InferredOutput = string')
  for (const schema of ['z.custom<[string, ...number[]]>()', 'z.custom<"...">()']) {
    const {input, output} = await infer(schema)
    assert.equal(input.isAbbreviated, false)
    assert.equal(output.isAbbreviated, false)
  }
})
