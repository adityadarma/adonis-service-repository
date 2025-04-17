import { BaseCommand } from '@adonisjs/core/ace'
import { stubsRoot } from '../stubs/main.js'
import generators from '../contracts/generators.js'

export default class ResourcePublish extends BaseCommand {
  static commandName = 'resource:publish'
  static description = 'Make class Base Resource'

  /**
   * Execute command
   */
  async run(): Promise<void> {
    const codemods = await this.createCodemods()

    await codemods.makeUsingStub(stubsRoot, 'make/resource/publish.stub', {
      entity: this.app.generators.createEntity('BaseResource'),
      generators: generators,
    })
  }
}
