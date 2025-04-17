import { BaseCommand, args } from '@adonisjs/core/ace'
import { stubsRoot } from '../stubs/main.js'
import generators from '../contracts/generators.js'
import fs from 'node:fs'

export default class MakeResource extends BaseCommand {
  static commandName = 'make:resource'
  static description = 'Make a new Resource Class'

  /**
   * The name of the model file.
   */
  @args.string({ description: 'Name of the resource class' })
  declare name: string

  /**
   * Execute command
   */
  async run(): Promise<void> {
    const codemods = await this.createCodemods()

    if (fs.existsSync(this.app.makePath('app/resources/base_resource.ts'))) {
      await codemods.makeUsingStub(stubsRoot, 'make/resource/base.stub', {
        flags: this.parsed.flags,
        entity: this.app.generators.createEntity(this.name),
        generators: generators,
      })
    } else {
      await codemods.makeUsingStub(stubsRoot, 'make/resource/main.stub', {
        flags: this.parsed.flags,
        entity: this.app.generators.createEntity(this.name),
        generators: generators,
      })
    }
  }
}
