import {type Monaco, loader} from '@monaco-editor/react'
import {getDeclarationTypes} from '../metadata'

export async function initMonaco() {
  const monaco = await loader.init()
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: true,
  })
}

export async function setMonacoDeclarationTypes({
  monaco,
  version,
  packageName,
}: {
  monaco: Monaco
  version: string
  packageName: string
}) {
  const declarationTypes = await getDeclarationTypes({version, packageName})

  monaco.languages.typescript.typescriptDefaults.setExtraLibs([
    {
      content: `declare namespace z{${declarationTypes}}`,
    },
  ])
}
