import { test } from '@japa/runner'
import generators from '../contracts/generators.js'

test.group('generators | repositoryName', () => {
  test('Pascal case and suffix a plain name', async ({ assert }) => {
    assert.equal(generators.repositoryName('user'), 'UserRepository')
  })

  test('Singularise a plural name', async ({ assert }) => {
    assert.equal(generators.repositoryName('users'), 'UserRepository')
  })

  test('Not duplicate an existing suffix', async ({ assert }) => {
    assert.equal(generators.repositoryName('UserRepository'), 'UserRepository')
  })

  test('Strip a Model suffix', async ({ assert }) => {
    assert.equal(generators.repositoryName('UserModel'), 'UserRepository')
  })

  test('Strip a file extension', async ({ assert }) => {
    assert.equal(generators.repositoryName('user.ts'), 'UserRepository')
  })

  test('Normalise a snake_case name', async ({ assert }) => {
    assert.equal(generators.repositoryName('user_profile'), 'UserProfileRepository')
  })
})

test.group('generators | repositoryFileName', () => {
  test('Snake case the name and add a ts extension', async ({ assert }) => {
    assert.equal(generators.repositoryFileName('User'), 'user_repository.ts')
  })

  test('Snake case a multi word name', async ({ assert }) => {
    assert.equal(generators.repositoryFileName('UserProfile'), 'user_profile_repository.ts')
  })

  test('Stay stable when the name already carries the suffix', async ({ assert }) => {
    assert.equal(generators.repositoryFileName('UserRepository'), 'user_repository.ts')
  })
})

test.group('generators | resourceName', () => {
  test('Pascal case and suffix a plain name', async ({ assert }) => {
    assert.equal(generators.resourceName('user'), 'UserResource')
  })

  test('Singularise a plural name', async ({ assert }) => {
    assert.equal(generators.resourceName('users'), 'UserResource')
  })

  test('Not duplicate an existing suffix', async ({ assert }) => {
    assert.equal(generators.resourceName('UserResource'), 'UserResource')
  })

  test('Strip a Model suffix', async ({ assert }) => {
    assert.equal(generators.resourceName('UserModel'), 'UserResource')
  })

  test('Strip a file extension', async ({ assert }) => {
    assert.equal(generators.resourceName('user.ts'), 'UserResource')
  })

  test('Normalise a snake_case name', async ({ assert }) => {
    assert.equal(generators.resourceName('user_profile'), 'UserProfileResource')
  })
})

test.group('generators | resourceFileName', () => {
  test('Snake case the name and add a ts extension', async ({ assert }) => {
    assert.equal(generators.resourceFileName('User'), 'user_resource.ts')
  })

  test('Snake case a multi word name', async ({ assert }) => {
    assert.equal(generators.resourceFileName('UserProfile'), 'user_profile_resource.ts')
  })

  test('Stay stable when the name already carries the suffix', async ({ assert }) => {
    assert.equal(generators.resourceFileName('UserResource'), 'user_resource.ts')
  })
})

test.group('generators | inherited base generators', () => {
  test('Keep the base service generators available', async ({ assert }) => {
    assert.equal(generators.serviceName('user'), 'UserService')
    assert.equal(generators.serviceFileName('user'), 'user_service.ts')
  })

  test('Keep the base model generators available', async ({ assert }) => {
    assert.equal(generators.modelName('users'), 'User')
  })
})
