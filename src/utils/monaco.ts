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
    monaco.languages.typescript.typescriptDefaults.addExtraLib(text, uri)
  }
}

export function setMonacoGlobalDeclarationTypes({
  monaco,
  packageName,
}: {monaco: Monaco; packageName: string}) {
  const ambient = `
  declare global {
    const z: typeof import("${packageName}").z;
  }

  export {};
  `
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    ambient,
    `file:///global/${packageName}-global.d.ts`,
  )
}

export function resetMonacoDeclarationTypes(monaco: Monaco) {
  monaco.languages.typescript.typescriptDefaults.setExtraLibs([])
}
