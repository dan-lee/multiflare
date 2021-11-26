import { lstatSync, readdirSync } from 'node:fs'
import path from 'node:path'

export const readDirRecursive = (filePath: string) => {
  const files = []

  for (const file of readdirSync(filePath)) {
    const fullPath = path.join(filePath, file)

    if (lstatSync(fullPath).isDirectory()) {
      readDirRecursive(fullPath).forEach((childFile) =>
        files.push(path.join(file, childFile)),
      )
    } else {
      files.push(file)
    }
  }

  return files
}
