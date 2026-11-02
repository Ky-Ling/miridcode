import { TextAttributes } from '@opentui/core'

export const StatusBar = () => (
  <box flexDirection="row" gap={1}>
    <text fg="cyan">Build</text>
    <text attributes={TextAttributes.DIM} fg="gray">
      ›
    </text>
    <text>opus-4-6</text>
  </box>
)
