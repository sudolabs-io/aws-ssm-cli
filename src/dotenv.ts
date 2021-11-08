import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { Parameters } from './types.js'

export function toDotenvString(parameters: Parameters): string {
  return Object.entries(parameters)
    .map(([name, value]) => `${name}=${value}`)
    .join('\n')
}

export function parseDotenv(file: string): Parameters {
  const filePath = path.resolve(process.cwd(), file)
  const data = fs.readFileSync(filePath)

  return dotenv.parse(data)
}
