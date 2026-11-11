import type {typescript} from 'monaco-editor'

export async function getTypeScriptWorkerWhenReady(
  getWorker: typeof typescript.getTypeScriptWorker,
  isCancelled: () => boolean,
) {
  // Creating a TypeScript model starts lazy language registration. Its worker
  // accessor can reject with this string until registration has finished.
  for (let attempt = 0; attempt < 20; attempt++) {
    if (isCancelled()) return
    try {
      return await getWorker()
    } catch (error) {
      if (error !== 'TypeScript not registered!' || attempt === 19) throw error
      await new Promise<void>((resolve) => setTimeout(resolve, 50))
    }
  }
}
