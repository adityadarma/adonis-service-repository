import { BaseCommand, args } from '@adonisjs/core/ace'
import { stubsRoot } from '../stubs/main.js'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class MakeService extends BaseCommand {
  static commandName = 'make:service'
  static description = 'Make a new Service Class'
  static options: CommandOptions = {
    allowUnknownFlags: true,
  }

  /**
   * The name of the model file.
   */
  @args.string({ description: 'Name of the service class' })
  declare name: string

  /**
   * Execute command
   */
  async run(): Promise<void> {
    const codemods = await this.createCodemods()
    await codemods.makeUsingStub(stubsRoot, 'make/service/main.stub', {
      flags: this.parsed.flags,
      entity: this.app.generators.createEntity(this.name),
    })
  }
}
