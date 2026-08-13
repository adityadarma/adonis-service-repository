import { test } from '@japa/runner'
import ResourcePublish from '../commands/resource_publish.js'
import ServicePublish from '../commands/service_publish.js'
import { createTestApp, TestApp } from './helpers/ace.js'

test.group('service:publish', (group) => {
  let app: TestApp

  group.each.setup(async () => {
    app = await createTestApp()
    return () => app.cleanup()
  })

  test('Expose the command name and description', async ({ assert }) => {
    assert.equal(ServicePublish.commandName, 'service:publish')
    assert.equal(ServicePublish.description, 'Make class Base Service')
  })

  test('Publish a base service that extends the package service', async ({ assert }) => {
    await app.run(ServicePublish)

    const contents = await app.read('app/services/base_service.ts')

    assert.include(contents, 'from "@adityadarma/adonis-service-repository"')
    assert.include(contents, 'BaseService as CoreService')
    assert.include(contents, 'export class BaseService extends CoreService {}')
  })

  test('Take no arguments', async ({ assert }) => {
    assert.lengthOf(ServicePublish.args, 0)
  })
})

test.group('resource:publish', (group) => {
  let app: TestApp

  group.each.setup(async () => {
    app = await createTestApp()
    return () => app.cleanup()
  })

  test('Expose the command name and description', async ({ assert }) => {
    assert.equal(ResourcePublish.commandName, 'resource:publish')
    assert.equal(ResourcePublish.description, 'Make class Base Resource')
  })

  test('Publish a base resource that extends the package resource', async ({ assert }) => {
    await app.run(ResourcePublish)

    const contents = await app.read('app/resources/base_resource.ts')

    assert.include(contents, 'from "@adityadarma/adonis-service-repository"')
    assert.include(contents, 'BaseResource as CoreResource')
    assert.include(contents, 'export abstract class BaseResource<T> extends CoreResource<')
  })

  test('Take no arguments', async ({ assert }) => {
    assert.lengthOf(ResourcePublish.args, 0)
  })
})
