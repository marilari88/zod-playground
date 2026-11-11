import {loader, type Monaco} from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import EditorWorker from 'monaco-editor/editor/editor.worker?worker'
import TypeScriptWorker from 'monaco-editor/languages/features/typescript/ts.worker?worker'

// Vite builds and serves these workers alongside the installed Monaco runtime.
self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'typescript' || label === 'javascript') {
      return new TypeScriptWorker()
    }
    return new EditorWorker()
  },
}

loader.config({monaco})

export async function initMonaco() {
  const monaco = await loader.init()
  monaco.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: true,
  })
  monaco.typescript.typescriptDefaults.setCompilerOptions({
    strict: true,
    target: monaco.typescript.ScriptTarget.ES2020,
    module: monaco.typescript.ModuleKind.ESNext,
    moduleResolution: monaco.typescript.ModuleResolutionKind.NodeJs,
    allowNonTsExtensions: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
  })
}

export function setMonacoDeclarationTypes({
  monaco,
  dtsFiles,
  packageName,
}: {
  monaco: Monaco
  dtsFiles: Array<{path: string; text: string}>
  packageName: string
}) {
  for (const {path, text} of dtsFiles) {
    const uri = `file:///node_modules/${packageName}/${path}`
    monaco.typescript.typescriptDefaults.addExtraLib(text, uri)
  }
}

export function setMonacoGlobalDeclarationTypes({
  monaco,
  packageName,
  path = '',
}: {
  monaco: Monaco
  packageName: string
  path?: string
}) {
  const ambient = `
  declare global {
    const z: typeof import("${packageName}${path}").z;
  }

  export {};
  `
  monaco.typescript.typescriptDefaults.addExtraLib(
    ambient,
    `file:///global/${packageName}-global.d.ts`,
  )
}

export function resetMonacoDeclarationTypes(monaco: Monaco) {
  monaco.typescript.typescriptDefaults.setExtraLibs([])
}
