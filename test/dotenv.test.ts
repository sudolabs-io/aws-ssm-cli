import fs from 'fs'
import os from 'os'
import path from 'path'
import { toDotenvString, parseDotenv } from '../src/dotenv'

describe('dotenv helpers', () => {
  it('toDotenvString creates key=value lines', () => {
    const str = toDotenvString({ A: '1', B: 'two' })
    expect(str).toBe('A=1\nB=two')
  })

  it('parseDotenv reads and parses file', () => {
    const tmp = path.join(os.tmpdir(), `dotenv-${Date.now()}.env`)
    fs.writeFileSync(tmp, 'A=1\nB=two\n')
    try {
      const parsed = parseDotenv(tmp)
      expect(parsed).toEqual({ A: '1', B: 'two' })
    } finally {
      fs.unlinkSync(tmp)
    }
  })
})


