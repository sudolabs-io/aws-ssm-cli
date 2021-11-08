import fs from 'fs'
import dotenv from 'dotenv'
import { Parameters } from './types'

export function toDotenvString(parameters: Parameters): string {
  return Object.entries(parameters)
    .map(([name, value]) => `${name}=${value}`)
    .join('\n')
}

export function parseDotenv(file: string): Parameters {
  const data = fs.readFileSync(file)

  return dotenv.parse(data)
}
