import { test } from '@japa/runner'
import { SimplePaginator } from '@adonisjs/lucid/database'
import { setApp } from '@adonisjs/core/services/app'
import { Container } from '@adonisjs/core/container'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { BaseResource } from '../src/core/base_resource.js'
import { BaseService } from '../src/core/base_service.js'
import ServiceException from '../src/exceptions/service_exception.js'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'

/**
 * Loads Lucid's `declare module '@adonisjs/core/transformers'` augmentation, the
 * same way a real application picks it up through the database provider. It adds
 * relation aware helpers whose parameter type depends on the model, so it has to
 * be in the program for the setTransform assignability tests to mean anything.
 */
import type {} from '@adonisjs/lucid/database_provider'

/**
 * exceptionCustom() reads `app.inProduction` and setTransform() reads
 * `app.container`, so the app service needs to be primed. Those two are all
 * that get touched, so a stub is enough.
 */
function useApp(inProduction: boolean, container: Container<any> = new Container()) {
  setApp({ inProduction, container } as any)
}

class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string
}

/**
 * Exposes BaseService's protected setters so each branch can be driven
 * directly instead of through a full service implementation.
 */
class TestService extends BaseService {
  withCode(code: number) {
    return this.setCode(code)
  }

  withMessage(message: string) {
    return this.setMessage(message)
  }

  fail(error: any) {
    return this.setError(error)
  }

  withPaginateCase(stringCase: 'camelCase' | 'snakeCase') {
    return this.setPaginateCase(stringCase)
  }

  fromException(error: any, message?: string) {
    return message === undefined
      ? this.exceptionCustom(error)
      : this.exceptionCustom(error, message)
  }
}

class PlainResource extends BaseResource<User> {
  async toObject() {
    return { id: this.resource.id, name: this.resource.name }
  }
}

class PlainTransformer extends BaseTransformer<User> {
  toObject() {
    return { id: this.resource.id, name: this.resource.name }
  }
}

class RoleTransformer extends BaseTransformer<{ id: number; title: string }> {
  toObject() {
    return { id: this.resource.id, title: this.resource.title }
  }
}

class NestedTransformer extends BaseTransformer<{
  id: number
  name: string
  roles: { id: number; title: string }[]
}> {
  toObject() {
    return {
      id: this.resource.id,
      name: this.resource.name,
      roles: RoleTransformer.transform(this.resource.roles),
    }
  }
}

class Post extends BaseModel {
  @column({ isPrimary: true })
  declare id: number
}

class Author extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @hasMany(() => Post)
  declare posts: HasMany<typeof Post>
}

/**
 * Regression guard for a compile time failure: Lucid's augmentation types
 * `withCount()` as `T extends LucidRow ? ExtractModelRelations<T> : string`.
 * Pinning the transformer instance to `BaseTransformer<any>` collapsed that to
 * `string`, and a transformer for a model with declared relations stopped being
 * assignable to setTransform(). The value of this test is that it type checks.
 */
class AuthorTransformer extends BaseTransformer<Author> {
  toObject() {
    return { id: this.resource.id }
  }
}

class Greeter {
  greet(name: string) {
    return `Hello ${name}`
  }
}

/**
 * Proves the resolver handed to the serializer is the application container's:
 * the container calls `toObject()`, so a rebound Greeter has to show up here.
 */
class InjectedTransformer extends BaseTransformer<{ name: string }> {
  static containerInjections = {
    toObject: { dependencies: [Greeter] },
  }

  toObject(greeter: Greeter) {
    return { greeting: greeter.greet(this.resource.name) }
  }
}

function paginator(rows: any[], perPage = 10, currentPage = 1) {
  return new SimplePaginator(rows.length, perPage, currentPage, ...rows)
}

test.group('BaseService | response payload', () => {
  test('Default to a 200 code and an empty message', async ({ assert }) => {
    const service = new TestService()

    assert.equal(service.getCode(), 200)
    assert.deepEqual(service.getApiResponse(), { code: 200, message: '' })
  })

  test('Omit undefined keys from the response', async ({ assert }) => {
    const response = new TestService().getApiResponse()

    assert.notProperty(response, 'data')
    assert.notProperty(response, 'meta')
    assert.notProperty(response, 'errors')
  })

  test('Chain setters and expose them on the response', async ({ assert }) => {
    const service = new TestService()
    const result = service.withCode(201).withMessage('Created').setData({ id: 1 })

    assert.strictEqual(result, service, 'setters should return the same instance')
    assert.deepEqual(service.getApiResponse(), {
      code: 201,
      message: 'Created',
      data: { id: 1 },
    })
  })

  test('Drop the code when withoutCode is used', async ({ assert }) => {
    const service = new TestService().setData({ id: 1 })
    service.withoutCode()

    assert.isUndefined(service.getCode())
    assert.deepEqual(service.getApiResponse(), { message: '', data: { id: 1 } })
  })

  test('Discard data when an error is present', async ({ assert }) => {
    const service = new TestService()
    service.setData({ id: 1 })
    service.withCode(422).withMessage('Validation failed').fail({ name: 'required' })

    assert.deepEqual(service.getApiResponse(), {
      code: 422,
      message: 'Validation failed',
      errors: { name: 'required' },
    })
  })

  test('Keep null data in the response', async ({ assert }) => {
    const service = new TestService().setData(null)

    assert.deepEqual(service.getApiResponse(), { code: 200, message: '', data: null })
  })

  test('Expose raw data through getData and toJSON', async ({ assert }) => {
    const service = new TestService().setData([{ id: 1 }])

    assert.deepEqual(service.getData(), [{ id: 1 }])
    assert.deepEqual(service.toJSON(), [{ id: 1 }])
  })
})

/**
 * The internal state uses ECMAScript private fields (`#code`), so a subclass is
 * free to declare members under those same names. With TypeScript `private`
 * fields the initialiser would shadow these methods at runtime.
 */
test.group('BaseService | subclass name collisions', () => {
  class CollidingService extends BaseService {
    code() {
      return 'subclass code'
    }

    message() {
      return 'subclass message'
    }

    data() {
      return 'subclass data'
    }

    error() {
      return 'subclass error'
    }

    meta() {
      return 'subclass meta'
    }

    paginateCase() {
      return 'subclass paginateCase'
    }
  }

  test('Keep subclass methods callable', async ({ assert }) => {
    const service = new CollidingService()

    assert.equal(service.code(), 'subclass code')
    assert.equal(service.message(), 'subclass message')
    assert.equal(service.data(), 'subclass data')
    assert.equal(service.error(), 'subclass error')
    assert.equal(service.meta(), 'subclass meta')
    assert.equal(service.paginateCase(), 'subclass paginateCase')
  })

  test('Keep the base response independent of the subclass members', async ({ assert }) => {
    const service = new CollidingService().setData({ id: 1 })

    assert.deepEqual(service.getApiResponse(), { code: 200, message: '', data: { id: 1 } })
  })
})

test.group('BaseService | pagination', () => {
  test('Flatten a paginator into data plus meta', async ({ assert }) => {
    const service = new TestService().setData(paginator([{ id: 1 }, { id: 2 }]))
    const response = service.getApiResponse()

    assert.deepEqual(response.data, [{ id: 1 }, { id: 2 }])
    assert.equal(response.meta.total, 2)
    assert.equal(response.meta.perPage, 10)
    assert.equal(response.meta.currentPage, 1)
  })

  test('Report the computed last page', async ({ assert }) => {
    const service = new TestService().setData(paginator([{ id: 1 }, { id: 2 }], 1, 1))

    assert.equal(service.getApiResponse().meta.lastPage, 2)
  })

  test('Flatten an empty paginator to an empty list', async ({ assert }) => {
    const service = new TestService().setData(paginator([]))
    const response = service.getApiResponse()

    assert.deepEqual(response.data, [])
    assert.equal(response.meta.total, 0)
  })

  test('Leave meta keys camelCase by default', async ({ assert }) => {
    const service = new TestService().setData(paginator([{ id: 1, name: 'Admin' }]))

    await service.setResource(PlainResource)

    assert.property(service.getApiResponse().meta, 'perPage')
  })

  test('Convert paginate meta keys to snake_case', async ({ assert }) => {
    const service = new TestService()
    service.withPaginateCase('snakeCase')
    service.setData(paginator([{ id: 1, name: 'Admin' }]))

    await service.setResource(PlainResource)
    const response = service.getApiResponse()

    assert.deepEqual(response.data, [{ id: 1, name: 'Admin' }])
    assert.property(response.meta, 'per_page')
    assert.property(response.meta, 'current_page')
    assert.notProperty(response.meta, 'perPage')
  })

  test('Keep camelCase meta keys when asked for camelCase', async ({ assert }) => {
    const service = new TestService()
    service.withPaginateCase('camelCase')
    service.setData(paginator([{ id: 1, name: 'Admin' }]))

    await service.setResource(PlainResource)

    assert.property(service.getApiResponse().meta, 'perPage')
  })

  test('Convert meta keys to snake_case without a resource', async ({ assert }) => {
    const service = new TestService()
    service.withPaginateCase('snakeCase')
    service.setData(paginator([{ id: 1 }]))

    const meta = service.getApiResponse().meta

    assert.property(meta, 'per_page')
    assert.property(meta, 'current_page')
    assert.notProperty(meta, 'perPage')
  })

  test('Produce the same meta keys with and without a resource', async ({ assert }) => {
    const withoutResource = new TestService()
    withoutResource.withPaginateCase('snakeCase')
    withoutResource.setData(paginator([{ id: 1, name: 'Admin' }]))

    const withResource = new TestService()
    withResource.withPaginateCase('snakeCase')
    withResource.setData(paginator([{ id: 1, name: 'Admin' }]))
    await withResource.setResource(PlainResource)

    assert.deepEqual(
      Object.keys(withoutResource.getApiResponse().meta),
      Object.keys(withResource.getApiResponse().meta)
    )
  })

  test('Map paginated rows through the resource collection', async ({ assert }) => {
    const service = new TestService()
    service.setData(paginator([{ id: 1, name: 'Admin', secret: 'hidden' }]))

    await service.setResource(PlainResource)

    assert.deepEqual(service.getData(), [{ id: 1, name: 'Admin' }])
  })
})

test.group('BaseService | setResource', () => {
  test('Map a single record through the resource', async ({ assert }) => {
    const service = new TestService().setData({ id: 1, name: 'Admin', secret: 'hidden' })

    await service.setResource(PlainResource)

    assert.deepEqual(service.getData(), { id: 1, name: 'Admin' })
  })

  test('Map an array through the resource collection', async ({ assert }) => {
    const service = new TestService().setData([
      { id: 1, name: 'Admin' },
      { id: 2, name: 'User' },
    ])

    await service.setResource(PlainResource)

    assert.deepEqual(service.getData(), [
      { id: 1, name: 'Admin' },
      { id: 2, name: 'User' },
    ])
  })

  test('Map an empty array to an empty list', async ({ assert }) => {
    const service = new TestService().setData([])

    await service.setResource(PlainResource)

    assert.deepEqual(service.getData(), [])
  })

  test('Map a null record to null', async ({ assert }) => {
    const service = new TestService().setData(null)

    await service.setResource(PlainResource)

    assert.isNull(service.getData())
  })

  test('Skip the resource entirely when an error is set', async ({ assert }) => {
    const service = new TestService()
    service.setData({ id: 1, name: 'Admin', secret: 'hidden' })
    service.fail('boom')

    await service.setResource(PlainResource)

    assert.deepEqual(service.getData(), { id: 1, name: 'Admin', secret: 'hidden' })
  })

  test('Return the service instance for chaining', async ({ assert }) => {
    const service = new TestService().setData({ id: 1, name: 'Admin' })

    assert.strictEqual(await service.setResource(PlainResource), service)
  })
})

test.group('BaseService | setTransform', (group) => {
  group.each.setup(() => useApp(false))

  test('Map a single record through the transformer', async ({ assert }) => {
    const service = new TestService().setData({ id: 1, name: 'Admin', secret: 'hidden' })

    await service.setTransform(PlainTransformer)

    assert.deepEqual(service.getData(), { id: 1, name: 'Admin' })
  })

  test('Map an array through the transformer collection', async ({ assert }) => {
    const service = new TestService().setData([
      { id: 1, name: 'Admin' },
      { id: 2, name: 'User' },
    ])

    await service.setTransform(PlainTransformer)

    assert.deepEqual(service.getData(), [
      { id: 1, name: 'Admin' },
      { id: 2, name: 'User' },
    ])
  })

  test('Map an empty array to an empty list', async ({ assert }) => {
    const service = new TestService().setData([])

    await service.setTransform(PlainTransformer)

    assert.deepEqual(service.getData(), [])
  })

  test('Map a null record to null', async ({ assert }) => {
    const service = new TestService().setData(null)

    await service.setTransform(PlainTransformer)

    assert.isNull(service.getData())
  })

  test('Map an undefined record to null', async ({ assert }) => {
    const service = new TestService().setData(undefined)

    await service.setTransform(PlainTransformer)

    assert.isNull(service.getData())
  })

  test('Skip the transformer entirely when an error is set', async ({ assert }) => {
    const service = new TestService()
    service.setData({ id: 1, name: 'Admin', secret: 'hidden' })
    service.fail('boom')

    await service.setTransform(PlainTransformer)

    assert.deepEqual(service.getData(), { id: 1, name: 'Admin', secret: 'hidden' })
  })

  test('Return the service instance for chaining', async ({ assert }) => {
    const service = new TestService().setData({ id: 1, name: 'Admin' })

    assert.strictEqual(await service.setTransform(PlainTransformer), service)
  })

  test('Leave the response unwrapped', async ({ assert }) => {
    const service = new TestService().setData({ id: 1, name: 'Admin' })

    await service.setTransform(PlainTransformer)

    assert.deepEqual(service.getApiResponse(), {
      code: 200,
      message: '',
      data: { id: 1, name: 'Admin' },
    })
  })

  test('Resolve nested transformers', async ({ assert }) => {
    const service = new TestService().setData({
      id: 1,
      name: 'Admin',
      roles: [{ id: 7, title: 'Owner' }],
    })

    await service.setTransform(NestedTransformer)

    assert.deepEqual(service.getData(), {
      id: 1,
      name: 'Admin',
      roles: [{ id: 7, title: 'Owner' }],
    })
  })

  test('Accept a transformer for a model with declared relations', async ({ assert }) => {
    const service = new TestService().setData({ id: 1 })

    await service.setTransform(AuthorTransformer)

    assert.deepEqual(service.getData(), { id: 1 })
  })

  test('Resolve transformer dependencies from the application container', async ({ assert }) => {
    const container = new Container()
    container.bindValue(Greeter, { greet: (name: string) => `Injected ${name}` } as Greeter)
    useApp(false, container)

    const service = new TestService().setData({ name: 'Admin' })

    await service.setTransform(InjectedTransformer)

    assert.deepEqual(service.getData(), { greeting: 'Injected Admin' })
  })
})

test.group('BaseService | setTransform | pagination', (group) => {
  group.each.setup(() => useApp(false))

  test('Flatten a paginator into transformed data plus meta', async ({ assert }) => {
    const service = new TestService()
    service.setData(paginator([{ id: 1, name: 'Admin', secret: 'hidden' }]))

    await service.setTransform(PlainTransformer)
    const response = service.getApiResponse()

    assert.deepEqual(response.data, [{ id: 1, name: 'Admin' }])
    assert.equal(response.meta.total, 1)
    assert.equal(response.meta.currentPage, 1)
  })

  test('Flatten an empty paginator to an empty list', async ({ assert }) => {
    const service = new TestService().setData(paginator([]))

    await service.setTransform(PlainTransformer)
    const response = service.getApiResponse()

    assert.deepEqual(response.data, [])
    assert.equal(response.meta.total, 0)
  })

  test('Convert paginate meta keys to snake_case', async ({ assert }) => {
    const service = new TestService()
    service.withPaginateCase('snakeCase')
    service.setData(paginator([{ id: 1, name: 'Admin' }]))

    await service.setTransform(PlainTransformer)
    const response = service.getApiResponse()

    assert.deepEqual(response.data, [{ id: 1, name: 'Admin' }])
    assert.property(response.meta, 'per_page')
    assert.notProperty(response.meta, 'perPage')
  })

  test('Produce the same meta keys as setResource', async ({ assert }) => {
    const withResource = new TestService()
    withResource.setData(paginator([{ id: 1, name: 'Admin' }]))
    await withResource.setResource(PlainResource)

    const withTransform = new TestService()
    withTransform.setData(paginator([{ id: 1, name: 'Admin' }]))
    await withTransform.setTransform(PlainTransformer)

    assert.deepEqual(
      Object.keys(withResource.getApiResponse().meta),
      Object.keys(withTransform.getApiResponse().meta)
    )
    assert.deepEqual(withResource.getData(), withTransform.getData())
  })
})

test.group('BaseService | exceptionCustom | status resolution', (group) => {
  group.each.setup(() => useApp(true))

  test('Reuse the status of a ServiceException', async ({ assert }) => {
    const service = new TestService()
    service.fromException(new ServiceException('Data not valid', 422))

    assert.equal(service.getCode(), 422)
    assert.equal(service.getApiResponse().message, 'Data not valid')
  })

  test('Default a ServiceException to 400', async ({ assert }) => {
    const service = new TestService()
    service.fromException(new ServiceException('Data not valid'))

    assert.equal(service.getCode(), 400)
  })

  test('Fall back to 500 for an out-of-range status', async ({ assert }) => {
    const error = new ServiceException('Broken')
    Object.assign(error, { status: 9999 })

    const service = new TestService()
    service.fromException(error)

    assert.equal(service.getCode(), 500)
  })

  test('Fall back to 500 for a below-range status', async ({ assert }) => {
    const error = new ServiceException('Broken')
    Object.assign(error, { status: 99 })

    const service = new TestService()
    service.fromException(error)

    assert.equal(service.getCode(), 500)
  })

  test('Fall back to 500 when the error carries no status', async ({ assert }) => {
    const service = new TestService()
    service.fromException(new Error('Unexpected'))

    assert.equal(service.getCode(), 500)
  })

  test('Keep an in-range status from a non-service exception', async ({ assert }) => {
    const error = new Error('Missing')
    Object.assign(error, { status: 404 })

    const service = new TestService()
    service.fromException(error)

    assert.equal(service.getCode(), 404)
  })

  test('Return the service instance for chaining', async ({ assert }) => {
    const service = new TestService()

    assert.strictEqual(service.fromException(new ServiceException('Nope')), service)
  })
})

test.group('BaseService | exceptionCustom | in production', (group) => {
  group.each.setup(() => useApp(true))

  test('Use the ServiceException message and hide the stack', async ({ assert }) => {
    const service = new TestService()
    service.fromException(new ServiceException('Data not valid', 422))

    const response = service.getApiResponse()

    assert.equal(response.message, 'Data not valid')
    assert.notProperty(response, 'errors')
  })

  test('Hide a generic error message behind the default message', async ({ assert }) => {
    const service = new TestService()
    service.fromException(new Error('Internal detail leaked'))

    const response = service.getApiResponse()

    assert.equal(response.message, 'Something Wrong!')
    assert.notProperty(response, 'errors')
  })

  test('Honour a custom fallback message', async ({ assert }) => {
    const service = new TestService()
    service.fromException(new Error('Internal detail leaked'), 'Please retry')

    assert.equal(service.getApiResponse().message, 'Please retry')
  })
})

test.group('BaseService | exceptionCustom | outside production', (group) => {
  group.each.setup(() => useApp(false))

  test('Expose the real message and the stack', async ({ assert }) => {
    const service = new TestService()
    service.fromException(new Error('Internal detail leaked'))

    const response = service.getApiResponse()

    assert.equal(response.message, 'Internal detail leaked')
    assert.isString(response.errors)
  })

  test('Expose the stack even for a ServiceException', async ({ assert }) => {
    const service = new TestService()
    service.fromException(new ServiceException('Data not valid', 422))

    const response = service.getApiResponse()

    assert.equal(response.code, 422)
    assert.equal(response.message, 'Data not valid')
    assert.isString(response.errors)
  })

  test('Override a custom fallback message with the real one', async ({ assert }) => {
    const service = new TestService()
    service.fromException(new Error('Internal detail leaked'), 'Please retry')

    assert.equal(service.getApiResponse().message, 'Internal detail leaked')
  })
})
