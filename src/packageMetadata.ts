type JsDelivrMetadata = {
  type: string
  name: string
  tags: Record<string, string>
  versions: {
    version: string
    links: {
      self: string
      entrypoints: string
      stats: string
    }
  }[]
}

const cache = new Map<string, JsDelivrMetadata>()

async function fetchPackageMetadata(packageName: string): Promise<JsDelivrMetadata> {
  const res = await fetch(`https://data.jsdelivr.com/v1/packages/npm/${packageName}`)
  return await res.json()
}

async function getPackageMetadata(packageName: string): Promise<JsDelivrMetadata> {
  const packageMetadata = cache.get(packageName)
  if (packageMetadata) return packageMetadata

  const newMetadata = await fetchPackageMetadata(packageName)
  cache.set(packageName, newMetadata)
  return newMetadata
}

export async function getDeclarationTypes({
  version,
  packageName,
}: {version: string; packageName: string}): Promise<string> {
  const res = await fetch(`https://cdn.jsdelivr.net/npm/${packageName}@${version}/lib/types.d.ts`)
  return await res.text()
}

export async function getPackageVersions({
  packageName,
  tag,
}: {packageName: string; tag?: string}): Promise<string[]> {
  const packageMetadata = await getPackageMetadata(packageName)

  if (tag) {
    const ver = packageMetadata.tags[tag]
    if (ver) return [ver]
    throw new Error('Invalid tag')
  }

  const versions = []
  for (const el of packageMetadata.versions) {
    const ver = el.version

    if (ver.startsWith('1')) continue

    if (['alpha', 'beta', 'canary'].some((v) => ver.includes(v))) continue

    versions.push(ver)
  }

  if (packageMetadata.tags.canary) versions.push(packageMetadata.tags.canary)
  if (packageMetadata.tags.next) versions.push(packageMetadata.tags.next)

  return versions.toSorted((a, b) => b.localeCompare(a, undefined, {numeric: true}))
}
