import { test } from '@japa/runner'
import { configure } from '../configure.js'

test.group('configure', () => {
  /**
   * The hook only needs `createCodemods()`, so a stub records what it does
   * with the rcfile instead of booting a full app.
   */
  function stubCommand() {
    const added: string[] = []

    const command = {
      async createCodemods() {
        return {
          async updateRcFile(callback: (rcFile: any) => void) {
            callback({
              addCommand(name: string) {
                added.push(name)
              },
            })
          },
        }
      },
    }

    return { command, added }
  }

  test('Register the package commands in the rcfile', async ({ assert }) => {
    const { command, added } = stubCommand()

    await configure(command as any)

    assert.deepEqual(added, ['@adityadarma/adonis-service-repository/commands'])
  })

  test('Register the commands exactly once', async ({ assert }) => {
    const { command, added } = stubCommand()

    await configure(command as any)

    assert.lengthOf(added, 1)
  })
})
