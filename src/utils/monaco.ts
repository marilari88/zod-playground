import {type Monaco, loader} from '@monaco-editor/react'

export async function initMonaco() {
  const monaco = await loader.init()
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: true,
  })
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    allowNonTsExtensions: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
  })
}

export async function setMonacoDeclarationTypes({
  monaco,
  dtsFiles,
}: {
  monaco: Monaco
  dtsFiles: Array<{path: string; text: string}>
}) {
  for (const {path, text} of dtsFiles) {
    const uri = `file:///node_modules/zod/${path}`
    monaco.languages.typescript.typescriptDefaults.addExtraLib(text, uri)
  }

  const ambient = `
  declare global {
    const z: typeof import("zod").z;
  }

  export {};
  `
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    ambient,
    'file:///global/zod-global.d.ts',
  )
}

export async function resetMonacoDeclarationTypes(monaco: Monaco) {
  monaco.languages.typescript.typescriptDefaults.setExtraLibs([])
}
