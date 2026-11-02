import { isEmpty, trim } from '@/lib/utils'

// Undefined means there's nothing to send.
export const getSubmitText = (text: string) => {
  const trimmed = trim(text)

  return isEmpty(trimmed) ? undefined : trimmed
}
