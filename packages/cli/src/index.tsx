import { createCliRenderer } from '@opentui/core'
import { createRoot } from '@opentui/react'

import { Header, InputBar } from './components'

const App = () => (
  <box
    alignItems="center"
    justifyContent="center"
    backgroundColor="#0D0D12"
    width="100%"
    height="100%"
    gap={2}
  >
    <Header />
    <box width="100%" maxWidth={78} paddingX={2}>
      <InputBar onSubmit={() => {}} />
    </box>
  </box>
)

const renderer = await createCliRenderer({
  targetFps: 60,
  exitOnCtrlC: false,
  // Focus follows the `focused` prop. A click would otherwise blur the input for good.
  autoFocus: false,
})
createRoot(renderer).render(<App />)

// `bun --watch` outlives a drained event loop, so quit explicitly or dev:cli never returns.
await renderer.closed
process.exit(0)
