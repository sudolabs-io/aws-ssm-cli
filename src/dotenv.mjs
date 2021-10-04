import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

export function toDotenvString(parameters) {
  return Object.entries(parameters)
    .map(([name, value]) => `${name}=${value}`)
    .join('\n')
}

export function parseDotenv(file) {
  const filePath = path.resolve(process.cwd(), file)
  const data = fs.readFileSync(filePath)

  return dotenv.parse(data)
}
