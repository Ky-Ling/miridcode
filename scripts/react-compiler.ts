// Runs React Compiler on the CLI source. Bun's own --react-compiler targets SSR for
// `bun` and only exists on `bun build`, so `bun run` needs this loader.
import { plugin } from 'bun'

// Bun's --watch ignores files a plugin loads, so `dev:cli` stays uncompiled to keep reloading.
if (!process.execArgv.includes('--watch')) {
  plugin({
    name: 'react-compiler',
    setup(build) {
      build.onLoad({ filter: /\/packages\/cli\/src\/.+\.tsx?$/ }, async ({ path }) => {
        const { transformAsync } = await import('@babel/core')

        const result = await transformAsync(await Bun.file(path).text(), {
          filename: path,
          babelrc: false,
          configFile: false,
          sourceMaps: 'inline',
          parserOpts: { plugins: ['typescript', 'jsx'] },
          plugins: [['babel-plugin-react-compiler', { target: '19' }]],
        })

        return { contents: result?.code ?? '', loader: path.endsWith('.tsx') ? 'tsx' : 'ts' }
      })
    },
  })
}
