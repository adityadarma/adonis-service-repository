import { test } from '@japa/runner'
import MakeRepository from '../commands/repository.js'
import MakeResource from '../commands/resource.js'
import MakeService from '../commands/service.js'
import { createTestApp, TestApp } from './helpers/ace.js'

test.group('make:repository', (group) => {
  let app: TestApp

  group.each.setup(async () => {
    app = await createTestApp()
    return () => app.cleanup()
  })

  test('Expose the command name and description', async ({ assert }) => {
    assert.equal(MakeRepository.commandName, 'make:repository')
    assert.equal(MakeRepository.description, 'Make a new Repository Class')
  })

  test('Generate a repository class', async ({ assert }) => {
    await app.run(MakeRepository, ['User'])

    const contents = await app.read('app/repositories/user_repository.ts')

    assert.include(contents, 'export default class UserRepository {')
  })

  test('Singularise and suffix the class name', async ({ assert }) => {
    await app.run(MakeRepository, ['users'])

    assert.isTrue(app.exists('app/repositories/user_repository.ts'))
  })

  test('Not duplicate an existing Repository suffix', async ({ assert }) => {
    await app.run(MakeRepository, ['UserRepository'])

    const contents = await app.read('app/repositories/user_repository.ts')

    assert.include(contents, 'class UserRepository')
    assert.notInclude(contents, 'RepositoryRepository')
  })

  test('Strip a Model suffix from the name', async ({ assert }) => {
    await app.run(MakeRepository, ['UserModel'])

    assert.isTrue(app.exists('app/repositories/user_repository.ts'))
  })

  test('Respect a nested entity path', async ({ assert }) => {
    await app.run(MakeRepository, ['admin/user'])

    assert.isTrue(app.exists('app/repositories/admin/user_repository.ts'))
  })
})

test.group('make:service', (group) => {
  let app: TestApp

  group.each.setup(async () => {
    app = await createTestApp()
    return () => app.cleanup()
  })

  test('Expose the command name and description', async ({ assert }) => {
    assert.equal(MakeService.commandName, 'make:service')
    assert.equal(MakeService.description, 'Make a new Service Class')
  })

  test('Import from the package when no base service exists', async ({ assert }) => {
    await app.run(MakeService, ['User'])

    const contents = await app.read('app/services/user_service.ts')

    assert.include(contents, 'from "@adityadarma/adonis-service-repository"')
    assert.include(contents, 'export default class UserService extends BaseService')
  })

  test('Import from #services when a base service exists', async ({ assert }) => {
    await app.seed('app/services/base_service.ts', 'export class BaseService {}')

    await app.run(MakeService, ['User'])

    const contents = await app.read('app/services/user_service.ts')

    assert.include(contents, 'from "#services/base_service"')
  })

  test('Not duplicate an existing Service suffix', async ({ assert }) => {
    await app.run(MakeService, ['UserService'])

    const contents = await app.read('app/services/user_service.ts')

    assert.include(contents, 'class UserService')
    assert.notInclude(contents, 'ServiceService')
  })

  test('Respect a nested entity path', async ({ assert }) => {
    await app.run(MakeService, ['admin/user'])

    assert.isTrue(app.exists('app/services/admin/user_service.ts'))
  })
})

test.group('make:resource', (group) => {
  let app: TestApp

  group.each.setup(async () => {
    app = await createTestApp()
    return () => app.cleanup()
  })

  test('Expose the command name and description', async ({ assert }) => {
    assert.equal(MakeResource.commandName, 'make:resource')
    assert.equal(MakeResource.description, 'Make a new Resource Class')
  })

  test('Import from the package when no base resource exists', async ({ assert }) => {
    await app.run(MakeResource, ['User'])

    const contents = await app.read('app/resources/user_resource.ts')

    assert.include(contents, 'from "@adityadarma/adonis-service-repository"')
    assert.include(
      contents,
      'export default class UserResource extends BaseResource<ResourceModel>'
    )
    assert.include(contents, 'async toObject(): Promise<Record<string, any>>')
  })

  test('Import from #resources when a base resource exists', async ({ assert }) => {
    await app.seed('app/resources/base_resource.ts', 'export class BaseResource {}')

    await app.run(MakeResource, ['User'])

    const contents = await app.read('app/resources/user_resource.ts')

    assert.include(contents, 'from "#resources/base_resource"')
  })

  test('Not duplicate an existing Resource suffix', async ({ assert }) => {
    await app.run(MakeResource, ['UserResource'])

    const contents = await app.read('app/resources/user_resource.ts')

    assert.include(contents, 'class UserResource')
    assert.notInclude(contents, 'ResourceResource')
  })

  test('Strip a Model suffix from the name', async ({ assert }) => {
    await app.run(MakeResource, ['UserModel'])

    assert.isTrue(app.exists('app/resources/user_resource.ts'))
  })

  test('Respect a nested entity path', async ({ assert }) => {
    await app.run(MakeResource, ['admin/user'])

    assert.isTrue(app.exists('app/resources/admin/user_resource.ts'))
  })
})
