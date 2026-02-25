import assert from 'node:assert'
import {performance} from 'node:perf_hooks'
import {describe, test} from 'node:test'
import {ensureReturnInSchema} from '../src/zod.ts'

/**
 * Performance tests for ensureReturnInSchema
 *
 * These tests verify that the function performs within acceptable time bounds.
 * CI environments are typically slower than local development machines,
 * so we apply a multiplier to the thresholds when running in CI.
 */

// CI environments sometimes are slower, so we apply a multiplier
const CI_SLOWDOWN_FACTOR = process.env.CI ? 2 : 1

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

function generateLargeSchemaWithStatements(statementCount: number, objectCount: number): string {
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

describe('ensureReturnInSchema performance', () => {
  test('small schema (baseline)', () => {
    const input = 'z.string()'
    const threshold = 2 * CI_SLOWDOWN_FACTOR

    const start = performance.now()
    for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
      ensureReturnInSchema(input)
    }
    const duration = performance.now() - start

    assert.ok(duration < threshold, `Expected duration < ${threshold}ms, got ${duration}ms`)
  })

  test('medium schema (~1KB)', () => {
    const input = generateLargeSchema(10, 10)
    const threshold = 40 * CI_SLOWDOWN_FACTOR

    assert.ok(input.length > 1000)
    assert.ok(input.length < 5000)

    const start = performance.now()
    for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
      ensureReturnInSchema(input)
    }
    const duration = performance.now() - start

    assert.ok(duration < threshold, `Expected duration < ${threshold}ms, got ${duration}ms`)
  })

  test('large schema (~10KB)', () => {
    const input = generateLargeSchema(50, 20)
    const threshold = 320 * CI_SLOWDOWN_FACTOR

    assert.ok(input.length > 10000)

    const start = performance.now()
    for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
      ensureReturnInSchema(input)
    }
    const duration = performance.now() - start

    assert.ok(duration < threshold, `Expected duration < ${threshold}ms, got ${duration}ms`)
  })

  test('schema with many statements', () => {
    const input = generateLargeSchemaWithStatements(100, 20)
    const threshold = 12 * CI_SLOWDOWN_FACTOR

    const start = performance.now()
    for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
      ensureReturnInSchema(input)
    }
    const duration = performance.now() - start

    assert.ok(duration < threshold, `Expected duration < ${threshold}ms, got ${duration}ms`)
  })

  test('many z.* at depth 0', () => {
    // The algorithm stops at first z.* it finds at depth 0 (from the end)
    const lines: string[] = []
    for (let i = 0; i < 100; i++) {
      lines.push(`z.string()`)
    }
    const input = lines.join('\n')
    const threshold = 1 * CI_SLOWDOWN_FACTOR

    const start = performance.now()
    for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
      ensureReturnInSchema(input)
    }
    const duration = performance.now() - start

    assert.ok(duration < threshold, `Expected duration < ${threshold}ms, got ${duration}ms`)
  })
})
