import { test } from '@japa/runner'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { BaseResource } from '../src/core/base_resource.js'
import { MissingValue } from '../src/missing_value.js'

class MockModel extends BaseModel {
  @column()
  declare id: number
  @column()
  declare name: string
  @column()
  declare secret: string
  @column()
  declare role: any

  constructor(data: any = {}) {
    super()
    if (data) Object.assign(this, data)
  }
}
type Row = MockModel

/**
 * Exposes BaseResource's protected conditional helpers so each branch can be
 * asserted directly.
 */
class Probe extends BaseResource<Row> {
  async toObject() {
    return { id: this.resource.id, role: this.resource.role }
  }

  callWhen(condition: boolean, value: any, defaultValue?: any) {
    return this.when(condition, value, defaultValue)
  }

  callMerge(data: any) {
    return this.merge(data)
  }

  callMergeWhen(condition: any, value: any, defaultValue?: any) {
    return this.mergeWhen(condition, value, defaultValue)
  }

  callMergeResource(data: any, resource: any) {
    return this.mergeResource(data, resource)
  }

  callMergeResourceWhen(data: any, resource: any, defaultValue?: any) {
    return this.mergeResourceWhen(data, resource, defaultValue)
  }

  callWhenLoaded(relationship: any, resource: any, defaultValue?: any) {
    return this.whenLoaded(relationship, resource, defaultValue)
  }
}

class RoleResource extends BaseResource<Row> {
  async toObject() {
    return { id: this.resource.id, name: this.resource.name }
  }
}

/**
 * Same shape as RoleResource, but a plain toObject(). Pairing the two keeps the
 * sync and async paths asserted against identical input.
 */
class SyncRoleResource extends BaseResource<Row> {
  toObject() {
    return { id: this.resource.id, name: this.resource.name }
  }
}

function probe(resource: any = {}) {
  return new Probe(new MockModel(resource))
}

/**
 * Widens an object literal to `Row` so it matches the resource generic that
 * `item()` / `collection()` infer from the resource class.
 */
function row(value: any): Row {
  return new MockModel(value)
}

test.group('BaseResource | item', () => {
  test('Map a record through toObject', async ({ assert }) => {
    const result = await RoleResource.item(row({ id: 1, name: 'Admin', secret: 'hidden' }))

    assert.deepEqual(result, { id: 1, name: 'Admin' })
  })

  test('Return null for a null record', async ({ assert }) => {
    assert.isNull(await RoleResource.item(null))
  })

  test('Return null for an undefined record', async ({ assert }) => {
    assert.isNull(await RoleResource.item(undefined as any))
  })

  test('Strip missing values from the mapped object', async ({ assert }) => {
    const result = await Probe.item(row({ id: 1, role: new MissingValue() }))

    assert.deepEqual(result, { id: 1 })
  })
})

test.group('BaseResource | collection', () => {
  test('Map every record through toObject', async ({ assert }) => {
    const result = await RoleResource.collection([
      row({ id: 1, name: 'Admin' }),
      row({ id: 2, name: 'User' }),
    ])

    assert.deepEqual(result, [
      { id: 1, name: 'Admin' },
      { id: 2, name: 'User' },
    ])
  })

  test('Return an empty list for an empty collection', async ({ assert }) => {
    assert.deepEqual(await RoleResource.collection([]), [])
  })

  test('Strip missing values from each mapped object', async ({ assert }) => {
    const result = await Probe.collection([row({ id: 1, role: new MissingValue() })])

    assert.deepEqual(result, [{ id: 1 }])
  })
})

test.group('BaseResource | sync toObject', () => {
  test('Return the item without a promise', ({ assert }) => {
    const result = SyncRoleResource.item(row({ id: 1, name: 'Admin', secret: 'hidden' }))

    assert.notInstanceOf(result, Promise)
    assert.deepEqual(result, { id: 1, name: 'Admin' })
  })

  test('Return null for a null record without a promise', ({ assert }) => {
    assert.isNull(SyncRoleResource.item(null))
  })

  test('Return the collection without a promise', ({ assert }) => {
    const result = SyncRoleResource.collection([
      row({ id: 1, name: 'Admin' }),
      row({ id: 2, name: 'User' }),
    ])

    assert.notInstanceOf(result, Promise)
    assert.deepEqual(result, [
      { id: 1, name: 'Admin' },
      { id: 2, name: 'User' },
    ])
  })

  test('Strip missing values on the sync path', ({ assert }) => {
    class SyncProbe extends BaseResource<Row> {
      toObject() {
        return { id: this.resource.id, role: new MissingValue() }
      }
    }

    assert.deepEqual(SyncProbe.item(row({ id: 1 })), { id: 1 })
    assert.deepEqual(SyncProbe.collection([row({ id: 1 })]), [{ id: 1 }])
  })

  test('Stay awaitable so callers may await either kind', async ({ assert }) => {
    assert.deepEqual(await SyncRoleResource.item(row({ id: 1, name: 'Admin' })), {
      id: 1,
      name: 'Admin',
    })
    assert.deepEqual(await SyncRoleResource.collection([row({ id: 1, name: 'Admin' })]), [
      { id: 1, name: 'Admin' },
    ])
  })
})

test.group('BaseResource | when', () => {
  test('Return the value when the condition is true', async ({ assert }) => {
    assert.equal(probe().callWhen(true, 'kept'), 'kept')
  })

  test('Resolve a callback value when the condition is true', async ({ assert }) => {
    assert.equal(
      probe().callWhen(true, () => 'lazy'),
      'lazy'
    )
  })

  test('Return a MissingValue when false without a default', async ({ assert }) => {
    assert.instanceOf(probe().callWhen(false, 'kept'), MissingValue)
  })

  test('Return the default when false', async ({ assert }) => {
    assert.equal(probe().callWhen(false, 'kept', 'fallback'), 'fallback')
  })

  test('Return a falsy default rather than a MissingValue', async ({ assert }) => {
    assert.equal(probe().callWhen(false, 'kept', null), null)
  })

  test('Resolve a callback default', async ({ assert }) => {
    assert.equal(
      probe().callWhen(false, 'kept', () => 'lazy'),
      'lazy'
    )
  })

  test('Return the literal string function as a plain default', async ({ assert }) => {
    assert.equal(probe().callWhen(false, 'kept', 'function'), 'function')
  })
})

test.group('BaseResource | merge and mergeWhen', () => {
  test('Merge always returns the data', async ({ assert }) => {
    assert.deepEqual(probe().callMerge({ id: 1 }), { id: 1 })
  })

  test('Merge resolves a callback', async ({ assert }) => {
    assert.equal(
      probe().callMerge(() => 'lazy'),
      'lazy'
    )
  })

  test('MergeWhen returns the value on a truthy condition', async ({ assert }) => {
    assert.equal(probe().callMergeWhen(1, 'kept'), 'kept')
  })

  test('MergeWhen resolves a callback value', async ({ assert }) => {
    assert.equal(
      probe().callMergeWhen(true, () => 'lazy'),
      'lazy'
    )
  })

  test('MergeWhen returns a MissingValue on a falsy condition', async ({ assert }) => {
    assert.instanceOf(probe().callMergeWhen(0, 'kept'), MissingValue)
  })

  test('MergeWhen returns the default on a falsy condition', async ({ assert }) => {
    assert.equal(probe().callMergeWhen(false, 'kept', 'fallback'), 'fallback')
  })

  test('MergeWhen resolves a callback default', async ({ assert }) => {
    assert.equal(
      probe().callMergeWhen(false, 'kept', () => 'lazy'),
      'lazy'
    )
  })
})

test.group('BaseResource | mergeResource', () => {
  test('Map a single relation through the resource', async ({ assert }) => {
    const result = await probe().callMergeResource({ id: 1, name: 'Admin' }, RoleResource)

    assert.deepEqual(result, { id: 1, name: 'Admin' })
  })

  test('Map a relation array through the resource collection', async ({ assert }) => {
    const result = await probe().callMergeResource([{ id: 1, name: 'Admin' }], RoleResource)

    assert.deepEqual(result, [{ id: 1, name: 'Admin' }])
  })

  test('Return null for a missing single relation', async ({ assert }) => {
    assert.isNull(await probe().callMergeResource(null, RoleResource))
  })

  test('Return null for an empty relation array', async ({ assert }) => {
    assert.isNull(await probe().callMergeResource([], RoleResource))
  })
})

test.group('BaseResource | mergeResourceWhen', () => {
  test('Map a present single relation', async ({ assert }) => {
    const result = await probe().callMergeResourceWhen({ id: 1, name: 'Admin' }, RoleResource)

    assert.deepEqual(result, { id: 1, name: 'Admin' })
  })

  test('Return a MissingValue for a null relation without a default', async ({ assert }) => {
    assert.instanceOf(probe().callMergeResourceWhen(null, RoleResource), MissingValue)
  })

  test('Return a MissingValue for an empty array without a default', async ({ assert }) => {
    assert.instanceOf(probe().callMergeResourceWhen([], RoleResource), MissingValue)
  })

  test('Return the default for a null relation', async ({ assert }) => {
    assert.equal(probe().callMergeResourceWhen(null, RoleResource, 'none'), 'none')
  })

  test('Return the default for an empty array', async ({ assert }) => {
    assert.equal(probe().callMergeResourceWhen([], RoleResource, 'none'), 'none')
  })
})

/**
 * whenLoaded() reads a preloaded relationship off a Lucid row, so these run
 * against real models. A hand-rolled stub would not exercise the same API and
 * would hide a mismatch with Lucid.
 */
test.group('BaseResource | whenLoaded', () => {
  class Role extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare name: string
  }

  class User extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare roleId: number

    @belongsTo(() => Role)
    declare role: BelongsTo<typeof Role>
  }

  function user() {
    const instance = new User()
    instance.id = 1
    instance.roleId = 1
    return instance
  }

  function preloadRole(instance: User) {
    const role = new Role()
    role.id = 1
    role.name = 'Admin'
    instance.$setRelated('role', role)
    return instance
  }

  test('Map the relation when it is preloaded', async ({ assert }) => {
    const result = await new Probe(preloadRole(user()) as any).callWhenLoaded('role', RoleResource)

    assert.deepEqual(result, { id: 1, name: 'Admin' })
  })

  test('Return a MissingValue when the relation is not preloaded', async ({ assert }) => {
    assert.instanceOf(new Probe(user() as any).callWhenLoaded('role', RoleResource), MissingValue)
  })

  test('Return the default when the relation is not preloaded', async ({ assert }) => {
    assert.equal(new Probe(user() as any).callWhenLoaded('role', RoleResource, 'none'), 'none')
  })

  test('Map a preloaded relation through the full resource pipeline', async ({ assert }) => {
    class UserResource extends BaseResource<Row> {
      async toObject() {
        return {
          id: this.resource.id,
          role: await this.whenLoaded('role' as any, RoleResource),
        }
      }
    }

    assert.deepEqual(await UserResource.item(preloadRole(user()) as any), {
      id: 1,
      role: { id: 1, name: 'Admin' },
    })
  })

  test('Omit an unloaded relation from the mapped object', async ({ assert }) => {
    class UserResource extends BaseResource<Row> {
      async toObject() {
        return {
          id: this.resource.id,
          role: await this.whenLoaded('role' as any, RoleResource),
        }
      }
    }

    assert.deepEqual(await UserResource.item(user() as any), { id: 1 })
  })

  test('Return a MissingValue when the relation holds a MissingValue', async ({ assert }) => {
    const resource = { $getRelated: () => new MissingValue() }

    assert.instanceOf(new Probe(resource as any).callWhenLoaded('role', RoleResource), MissingValue)
  })

  test('Return a MissingValue when the row has no relationship API', async ({ assert }) => {
    assert.instanceOf(new Probe({} as any).callWhenLoaded('role', RoleResource), MissingValue)
  })
})
