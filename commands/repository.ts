import { BaseCommand, args } from '@adonisjs/core/ace'
import { stubsRoot } from '../stubs/main.js'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class MakeRepository extends BaseCommand {
  static commandName = 'make:repository'
  static description = 'Make a new Repository Class'
  static options: CommandOptions = {
    allowUnknownFlags: true,
  }

  /**
   * The name of the model file.
   */
  @args.string({ description: 'Name of the repository class' })
  declare name: string

  /**
   * Execute command
   */
  async run(): Promise<void> {
    const codemods = await this.createCodemods()
    await codemods.makeUsingStub(stubsRoot, 'make/repository/main.stub', {
      flags: this.parsed.flags,
      entity: this.app.generators.createEntity(this.name),
    })
  }
}
