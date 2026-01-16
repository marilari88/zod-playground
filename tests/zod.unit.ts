import assert from 'node:assert'
import {describe, test} from 'node:test'
import {ensureReturnInSchema} from '../src/zod.ts'

describe('ensureReturnInSchema', () => {
  describe('correctness', () => {
    test('simple single-line expression', () => {
      const input = 'z.string()'
      const result = ensureReturnInSchema(input)
      assert.strictEqual(result, 'return z.string()')
    })

    test('single-line expression with leading whitespace', () => {
      const input = '    z.string()'
      const result = ensureReturnInSchema(input)
      assert.strictEqual(result, '    return z.string()')
    })

    test('multi-line z.union with nested z.object', () => {
      const input = `z.union([
  // Multidirectional glossary entry deletion
  z.object({
    guid: z.string(),
  }),
  // Unidirectional glossary entry deletion
  z.object({
    term: z.object({
      language: z.string().min(2),
      value: z.string().min(1),
    }),
  })
])`
      const result = ensureReturnInSchema(input)
      assert.strictEqual(
        result,
        `return z.union([
  // Multidirectional glossary entry deletion
  z.object({
    guid: z.string(),
  }),
  // Unidirectional glossary entry deletion
  z.object({
    term: z.object({
      language: z.string().min(2),
      value: z.string().min(1),
    }),
  })
])`,
      )
    })

    test('multi-line z.union with leading indentation', () => {
      const input = `    z.union([
  z.object({
    guid: z.string(),
  }),
  z.object({
    term: z.object({
      language: z.string().min(2),
      value: z.string().min(1),
    }),
  })
])`
      const result = ensureReturnInSchema(input)
      assert.ok(result.startsWith('    return z.union(['))
    })

    test('multi-line z.union with consistent indentation', () => {
      const input = `    z.union([
    z.object({
        guid: z.string(),
    }),
    z.object({
        term: z.object({
        language: z.string().min(2),
        value: z.string().min(1),
        }),
    })
    ])`
      const result = ensureReturnInSchema(input)
      assert.ok(result.startsWith('    return z.union(['))
    })

    test('single-line z.union with nested z.object', () => {
      const input = 'z.union([z.object({a: z.string()}), z.object({b: z.number()})])'
      const result = ensureReturnInSchema(input)
      assert.strictEqual(
        result,
        'return z.union([z.object({a: z.string()}), z.object({b: z.number()})])',
      )
    })

    test('const declaration after z expression', () => {
      const input = `z.object({
  name: nameSchema,
  age: z.number()
})

const nameSchema = z.string().min(2)`

      const result = ensureReturnInSchema(input)
      assert.strictEqual(
        result,
        `return z.object({
  name: nameSchema,
  age: z.number()
})

const nameSchema = z.string().min(2)`,
      )
    })

    test('const declaration followed by z expression', () => {
      const input = `const nameSchema = z.string().min(2)

z.object({
  name: nameSchema,
  age: z.number()
})`
      const result = ensureReturnInSchema(input)
      assert.strictEqual(
        result,
        `const nameSchema = z.string().min(2)

return z.object({
  name: nameSchema,
  age: z.number()
})`,
      )
    })

    test('only const declaration (no standalone z expression)', () => {
      const input = 'const x = z.string()'
      const result = ensureReturnInSchema(input)
      // Should return as-is since z.string() is part of assignment
      assert.strictEqual(result, 'const x = z.string()')
    })

    test('multiple const declarations with final z expression', () => {
      const input = `const a = z.string()
const b = z.number()
z.object({a, b})`
      const result = ensureReturnInSchema(input)
      assert.strictEqual(
        result,
        `const a = z.string()
const b = z.number()
return z.object({a, b})`,
      )
    })

    test('enum followed by z.nativeEnum', () => {
      const input = `enum Status {
  Active = "active",
  Inactive = "inactive"
}

z.nativeEnum(Status)`
      const result = ensureReturnInSchema(input)
      assert.strictEqual(
        result,
        `enum Status {
  Active = "active",
  Inactive = "inactive"
}

return z.nativeEnum(Status)`,
      )
    })

    test('code without any z expression', () => {
      const input = 'const x = 42'
      const result = ensureReturnInSchema(input)
      assert.strictEqual(result, 'const x = 42')
    })

    test('z inside identifier should not match (xyz.something)', () => {
      const input = 'const xyz = {}'
      const result = ensureReturnInSchema(input)
      assert.strictEqual(result, 'const xyz = {}')
    })

    test('multiple standalone z expressions returns the last one', () => {
      const input = `z.string()
z.number()
z.boolean()`
      const result = ensureReturnInSchema(input)
      assert.strictEqual(
        result,
        `z.string()
z.number()
return z.boolean()`,
      )
    })

    test('explicit return statement already present', () => {
      const input = `const x = z.string()
return z.object({name: x})`
      const result = ensureReturnInSchema(input)
      // When a top-level return is found, the code is returned as-is
      assert.strictEqual(
        result,
        `const x = z.string()
return z.object({name: x})`,
      )
    })

    test('stops at top-level return even with z expressions before it', () => {
      const input = `z.string()
return z.object({name: z.string()})`
      const result = ensureReturnInSchema(input)
      // Should NOT add return to z.string() because there's already a return
      assert.strictEqual(
        result,
        `z.string()
return z.object({name: z.string()})`,
      )
    })

    test('return inside nested scope does not stop processing', () => {
      const input = `const beforefn = () => { return z.string() }
z.object({name: z.string()})
const afterfn = () => { return z.string() }`
      const result = ensureReturnInSchema(input)
      // The return inside the arrow function is not at top level
      assert.strictEqual(
        result,
        `const beforefn = () => { return z.string() }
return z.object({name: z.string()})
const afterfn = () => { return z.string() }`,
      )
    })

    test('return with leading whitespace is still detected', () => {
      const input = `const x = z.string()
  return z.object({name: x})`
      const result = ensureReturnInSchema(input)
      // Return with whitespace before it should still be detected
      assert.strictEqual(
        result,
        `const x = z.string()
  return z.object({name: x})`,
      )
    })

    test('return as part of identifier should not stop processing', () => {
      const input = `const beforereturn = z.string()
z.object({name: noreturn})
const afterreturn = z.string()`
      const result = ensureReturnInSchema(input)
      // "afterreturn" contains "return" but is an identifier,
      // same for "beforereturn" (though should not reach it, search is backward)
      assert.strictEqual(
        result,
        `const beforereturn = z.string()
return z.object({name: noreturn})
const afterreturn = z.string()`,
      )
    })
  })
})