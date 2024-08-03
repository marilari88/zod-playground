import {Monaco} from '@monaco-editor/react'
import * as zod from '../zod'

const setMonacoDeclarationTypes = async (monaco: Monaco, ver: string) => {
  const declarationTypes = await zod.getDeclarationTypes(ver)

  monaco.languages.typescript.typescriptDefaults.setExtraLibs([
    {
      content: `declare namespace z{${declarationTypes}}`,
    },
  ])
}

export default setMonacoDeclarationTypes
