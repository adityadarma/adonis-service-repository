import { AceFactory } from '@adonisjs/core/factories'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * A throwaway AdonisJS app on disk, just complete enough for the generator
 * commands to resolve paths and write stubs into it.
 */
export interface TestApp {
  root: string
  /**
   * Runs a command class with the given argv against this app.
   */
  run(command: any, argv?: string[]): Promise<any>
  /**
   * Seeds a file relative to the app root, creating parent directories.
   */
  seed(relativePath: string, contents?: string): Promise<void>
  read(relativePath: string): Promise<string>
  exists(relativePath: string): boolean
  cleanup(): Promise<void>
}

export async function createTestApp(): Promise<TestApp> {
  const root = await mkdtemp(join(tmpdir(), 'adonis-service-repository-'))

  await mkdir(join(root, 'app'), { recursive: true })
  await writeFile(join(root, 'adonisrc.ts'), 'export default {}')

  const app: TestApp = {
    root,

    async run(command: any, argv: string[] = []) {
      const ace = await new AceFactory().make(pathToFileURL(join(root, '/')))
      await ace.app.init()
      ace.ui.switchMode('raw')

      const instance = await ace.create(command, argv)
      await instance.exec()

      return instance
    },

    async seed(relativePath: string, contents = '') {
      const target = join(root, relativePath)
      await mkdir(join(target, '..'), { recursive: true })
      await writeFile(target, contents)
    },

    read(relativePath: string) {
      return readFile(join(root, relativePath), 'utf-8')
    },

    exists(relativePath: string) {
      return existsSync(join(root, relativePath))
    },

    async cleanup() {
      await rm(root, { recursive: true, force: true })
    },
  }

  return app
}
