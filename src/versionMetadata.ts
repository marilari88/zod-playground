type FileMetadata = {
  name: string
  files?: FileMetadata[]
}

type VersionMetadata = {
  name: string
  version: string
  files: FileMetadata[]
}

const dtsFilesCache = new Map<string, Array<{path: string; text: string}>>()

async function fetchVersionMetadata({
  packageName,
  version,
}: {
  packageName: string
  version: string
}): Promise<VersionMetadata> {
  const res = await fetch(`https://data.jsdelivr.com/v1/packages/npm/${packageName}@${version}`)
  return await res.json()
}

export async function getVersionDtsContents({
  packageName,
  version,
}: {
  packageName: string
  version: string
}): Promise<Array<{path: string; text: string}> | null> {
  try {
    const cacheKey = `${packageName}@${version}`
    const dtsFiles = dtsFilesCache.get(cacheKey)
    if (dtsFiles) return dtsFiles

    const versionMetadata = await fetchVersionMetadata({packageName, version})
    const dtsFilesPaths = collectDtsFilesPaths(versionMetadata.files)
    const filesContent = await fetchFilesContent({packageName, version, paths: dtsFilesPaths})

    dtsFilesCache.set(cacheKey, filesContent)
    return filesContent
  } catch (e) {
    console.error({e})
    return null
  }
}

const collectDtsFilesPaths = (files: FileMetadata[], path = ''): string[] => {
  const dtsFiles: string[] = []
  for (const file of files ?? []) {
    if (file.name.endsWith('.d.ts')) {
      dtsFiles.push(`${path}${file.name}`)

      // zod 4 bundles types in /dist/esm and /dist/cjs. We only need the /dist/esm one
    } else if (file.files && file.name !== 'commonjs') {
      const nestedFiles = collectDtsFilesPaths(file.files, `${path}${file.name}/`)
      dtsFiles.push(...nestedFiles)
    }
  }
  return dtsFiles
}

const fetchFilesContent = async ({
  packageName,
  version,
  paths,
}: {
  packageName: string
  version: string
  paths: string[]
}): Promise<Array<{path: string; text: string}>> => {
  return await Promise.all(
    paths.map(async (path) => {
      const res = await fetch(`https://cdn.jsdelivr.net/npm/${packageName}@${version}/${path}`)

      const pathWithoutDistEsm = path.replace('dist/esm/', '')

      if (!res.ok) return {path: pathWithoutDistEsm, text: ''}
      return {path: pathWithoutDistEsm, text: await res.text()}
    }),
  )
}
