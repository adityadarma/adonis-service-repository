import { BaseCommand, args } from '@adonisjs/core/ace'
import { stubsRoot } from '../stubs/main.js'
import app from '@adonisjs/core/services/app'
import fs from 'node:fs'

export default class MakeService extends BaseCommand {
  static commandName = 'make:service'
  static description = 'Make a new Service Class'

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

    if (fs.existsSync(app.servicesPath('base_service.ts'))) {
      await codemods.makeUsingStub(stubsRoot, 'make/service/base.stub', {
        flags: this.parsed.flags,
        entity: this.app.generators.createEntity(this.name),
      })
    } else {
      await codemods.makeUsingStub(stubsRoot, 'make/service/main.stub', {
        flags: this.parsed.flags,
        entity: this.app.generators.createEntity(this.name),
      })
    }
  }
}
