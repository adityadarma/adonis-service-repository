import { BaseCommand } from '@adonisjs/core/ace'
import { stubsRoot } from '../stubs/main.js'

export default class MakeService extends BaseCommand {
  static commandName = 'service:publish'
  static description = 'Make class Base Service'

  /**
   * Execute command
   */
  async run(): Promise<void> {
    const codemods = await this.createCodemods()

    await codemods.makeUsingStub(stubsRoot, 'make/service/publish.stub', {
      entity: this.app.generators.createEntity('BaseService'),
    })
  }
}
