import assert from 'node:assert/strict'
import {test} from 'node:test'
// Exercise the installed Monaco compiler without a browser or network requests.
// @ts-expect-error Monaco's worker implementation does not ship declarations.
import {TypeScriptWorker} from 'monaco-editor/languages/features/typescript/tsWorker.js'
import {getInferenceSource, getInferredType} from '../src/utils/inferredType.ts'

// Minimal declarations isolate our compiler integration from downloaded Zod versions.
const declarations = `
export interface Schema<T> {
  _output: T
  transform<U>(fn: (value: T) => U): Schema<U>
}
export type infer<T extends Schema<unknown>> = T['_output']
export declare function custom<T>(): Schema<T>
export declare function string(): Schema<string>
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
    return await getInferredType(worker, fileName, source)
  } finally {
    worker.getLanguageService().dispose()
  }
}

test('infers explicit returns without collisions with the schema editor globals', async () => {
  const {text} = await infer(`const schema = z.custom<{
    name: string
    birth_year?: number
    address: { city: string } | null
  }>()
  return schema`)

  assert.match(text, /name: string;/)
  assert.match(text, /birth_year\?: number(?: \| undefined)?;/)
  assert.match(text, /address: \{\s+city: string;\s+\} \| null;/)
})

test('infers the last standalone schema expression', async () => {
  const {text} = await infer('z.string()\nz.custom<number>()')
  assert.equal(text, 'type Inferred = number')
})

test('infers transform outputs using the parameter type', async () => {
  const {text} = await infer('z.string().transform(value => value.length)')
  assert.equal(text, 'type Inferred = number')
})

test('resolves the Mini entry point', async () => {
  const {text} = await infer('z.string()', {isZodMini: true})
  assert.equal(text, 'type Inferred = string')
})

test('supports type aliases and z.infer inside the schema', async () => {
  const {text} = await infer(`const base = z.string()
  type Value = z.infer<typeof base>
  return z.custom<Value[]>()`)
  assert.equal(text, 'type Inferred = string[]')
})

test('does not execute schema code to infer a type', async () => {
  const {text} = await infer('throw new Error("Do not execute")\nreturn z.string()')
  assert.equal(text, 'type Inferred = string')
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
  assert.equal((await infer(`z.custom<{${fields}}>()`)).isAbbreviated, true)
  assert.equal((await infer('z.custom<[string, ...number[]]>()')).isAbbreviated, false)
  assert.equal((await infer('z.custom<"...">()')).isAbbreviated, false)
})
