import assert from 'node:assert'
import {performance} from 'node:perf_hooks'
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

  describe('performance', () => {
    /**
     * Why Iteration is Necessary in Performance Tests
     *
     * Modern JavaScript runtimes use Just-In-Time (JIT) compilation, which means:
     * 1. The first few executions run in "interpreted mode" (slow)
     * 2. After detecting "hot" code paths, the JIT compiles to optimized machine code
     * 3. Subsequent executions run much faster
     *
     * Additionally, measuring a single call has problems:
     * - Timer resolution: `performance.now()` typically has ~1μs resolution, but OS scheduling
     *   and other factors can introduce noise of 10-100μs
     * - CPU caching: First call may have cache misses; subsequent calls benefit from warm caches
     * - Garbage collection: A single GC pause could skew a single measurement by milliseconds
     *
     * By running many iterations:
     * - We amortize the JIT warm-up cost
     * - We average out random noise (GC pauses, OS interrupts, etc.)
     * - We get a statistically meaningful measurement
     *
     * For very fast operations (< 1μs), even 1000 iterations may complete in < 1ms,
     * making iteration essential to get any measurable signal.
     */
    const BENCHMARK_ITERATIONS = 1000

    // Generate a large schema for performance testing
    function generateLargeSchema(objectCount: number, fieldsPerObject: number): string {
      const objects: string[] = []
      for (let i = 0; i < objectCount; i++) {
        const fields: string[] = []
        for (let j = 0; j < fieldsPerObject; j++) {
          fields.push(`    field${j}: z.string().min(1).max(100)`)
        }
        objects.push(`  z.object({\n${fields.join(',\n')}\n  })`)
      }
      return `z.union([\n${objects.join(',\n')}\n])`
    }

    function generateLargeSchemaWithStatements(
      statementCount: number,
      objectCount: number,
    ): string {
      const statements: string[] = []
      for (let i = 0; i < statementCount; i++) {
        statements.push(`const schema${i} = z.string().min(${i})`)
      }
      const objects: string[] = []
      for (let i = 0; i < objectCount; i++) {
        objects.push(`  z.object({ field: z.string() })`)
      }
      statements.push(`z.union([\n${objects.join(',\n')}\n])`)
      return statements.join('\n')
    }

    test('small schema (baseline)', () => {
      const input = 'z.string()'

      const start = performance.now()
      for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
        ensureReturnInSchema(input)
      }
      const duration = performance.now() - start

      assert.ok(duration < 2, `Expected duration < 2ms, got ${duration}ms`)
    })

    test('medium schema (~1KB)', () => {
      const input = generateLargeSchema(10, 10)

      assert.ok(input.length > 1000)
      assert.ok(input.length < 5000)

      const start = performance.now()
      for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
        ensureReturnInSchema(input)
      }
      const duration = performance.now() - start

      assert.ok(duration < 40, `Expected duration < 40ms, got ${duration}ms`)
    })

    test('large schema (~10KB)', () => {
      const input = generateLargeSchema(50, 20)

      assert.ok(input.length > 10000)

      const start = performance.now()
      for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
        ensureReturnInSchema(input)
      }
      const duration = performance.now() - start

      assert.ok(duration < 320, `Expected duration < 320ms, got ${duration}ms`)
    })

    test('schema with many statements', () => {
      const input = generateLargeSchemaWithStatements(100, 20)

      const start = performance.now()
      for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
        ensureReturnInSchema(input)
      }
      const duration = performance.now() - start

      assert.ok(duration < 5, `Expected duration < 5ms, got ${duration}ms`)
    })

    test('many z.* at depth 0', () => {
      // The algorithm stops at first z.* it finds at depth 0 (from the end)
      const lines: string[] = []
      for (let i = 0; i < 100; i++) {
        lines.push(`z.string()`)
      }
      const input = lines.join('\n')

      const start = performance.now()
      for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
        ensureReturnInSchema(input)
      }
      const duration = performance.now() - start

      assert.ok(duration < 1, `Expected duration < 1ms, got ${duration}ms`)
    })
  })
})
