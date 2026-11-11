import assert from 'node:assert/strict'
import {test} from 'node:test'
import {setImmediate} from 'node:timers/promises'
import {getTypeScriptWorkerWhenReady} from '../src/utils/typescriptWorker.ts'

// These tests exercise registration readiness, before requesting an actual worker.
const workerFactory = async () => {
  throw new Error('A worker should not be requested by the readiness helper')
}

test('waits for delayed TypeScript registration before returning the worker factory', async (t) => {
  t.mock.timers.enable({apis: ['setTimeout']})
  let registered = false
  let attempts = 0
  const ready = getTypeScriptWorkerWhenReady(
    async () => {
      attempts++
      if (!registered) throw 'TypeScript not registered!'
      return workerFactory
    },
    () => false,
  )

  await setImmediate()
  t.mock.timers.tick(50)
  await setImmediate()
  assert.equal(attempts, 2)

  registered = true
  t.mock.timers.tick(50)
  assert.equal(await ready, workerFactory)
})

test('does not retry unrelated worker errors', async () => {
  const failure = new Error('Worker failed to load')
  let attempts = 0
  await assert.rejects(
    getTypeScriptWorkerWhenReady(
      async () => {
        attempts++
        throw failure
      },
      () => false,
    ),
    (error) => error === failure,
  )
  assert.equal(attempts, 1)
})

test('stops waiting when the inference request is cancelled', async (t) => {
  t.mock.timers.enable({apis: ['setTimeout']})
  let cancelled = false
  let attempts = 0
  const ready = getTypeScriptWorkerWhenReady(
    async () => {
      attempts++
      throw 'TypeScript not registered!'
    },
    () => cancelled,
  )

  await setImmediate()
  cancelled = true
  t.mock.timers.tick(50)
  assert.equal(await ready, undefined)
  assert.equal(attempts, 1)
})

test('surfaces registration failure after the bounded startup wait', async (t) => {
  t.mock.timers.enable({apis: ['setTimeout']})
  const ready = getTypeScriptWorkerWhenReady(
    async () => {
      throw 'TypeScript not registered!'
    },
    () => false,
  )
  const rejected = assert.rejects(ready, (error) => error === 'TypeScript not registered!')

  for (let i = 0; i < 20; i++) {
    await setImmediate()
    t.mock.timers.tick(50)
  }
  await rejected
})
