import { describe, expect, it } from 'vitest'

import { getSubmitText } from '../utils'

describe('getSubmitText', () => {
  it('returns text as typed when there is nothing to trim', () => {
    expect(getSubmitText('Fix a bug')).toBe('Fix a bug')
  })

  it('trims spaces and newlines from both ends', () => {
    expect(getSubmitText(' \n Fix a bug \n ')).toBe('Fix a bug')
  })

  it('keeps line breaks inside the text', () => {
    expect(getSubmitText('first\n\nsecond')).toBe('first\n\nsecond')
  })

  it('treats empty text as nothing to send', () => {
    expect(getSubmitText('')).toBeUndefined()
  })

  it('treats whitespace-only text as nothing to send', () => {
    expect(getSubmitText(' \n\t ')).toBeUndefined()
  })
})
