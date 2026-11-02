// Lists installed es-toolkit exports matching a pattern, and whether `@/lib/utils` exposes them.
// Usage: bun .claude/skills/es-toolkit-recommend/find-exports.ts '<regex>'
import { createRequire } from 'node:module'
import { join } from 'node:path'

const PACKAGE_DIR = join(import.meta.dir, '../../../packages/cli/')

const require = createRequire(PACKAGE_DIR)
const pattern = new RegExp(process.argv[2] ?? '.', 'i')

const { exports: subpaths, version } = require('es-toolkit/package.json')
const entries = Object.keys(subpaths)
  .filter((subpath) => subpath !== './package.json' && !subpath.includes('*'))
  .map((subpath) => (subpath === '.' ? 'es-toolkit' : `es-toolkit/${subpath.slice(2)}`))

// es-toolkit/types is type-only, so it has nothing to import at runtime.
const loadEntry = async (entry: string) => {
  try {
    return await import(require.resolve(entry))
  } catch {
    return null
  }
}

const modules = await Promise.all(entries.map(loadEntry))
const utils = await import(join(PACKAGE_DIR, 'src/lib/utils.ts'))

const matches = new Map<string, string[]>()

entries.forEach((entry, index) => {
  const names = Object.keys(modules[index] ?? {}).filter((name) => pattern.test(name))

  for (const name of names) {
    matches.set(name, [...(matches.get(name) ?? []), entry])
  }
})

console.log(`es-toolkit ${version}: ${matches.size} matches`)
console.log(`${'name'.padEnd(24)}${'@/lib/utils'.padEnd(14)}entry points`)

for (const [name, found] of [...matches].toSorted(([a], [b]) => a.localeCompare(b))) {
  console.log(`${name.padEnd(24)}${(name in utils ? 'yes' : 'no').padEnd(14)}${found.join(', ')}`)
}
