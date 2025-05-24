import { test } from '@japa/runner'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { BaseResource } from '../src/core/base_resource.js'

test.group('Service', () => {
  class Role extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare name: string
  }

  class RoleResource extends BaseResource<Role> {
    async toObject() {
      return {
        id: this.resource.id,
        name: this.resource.name,
      }
    }
  }

  test('Set resource collection', async ({ assert }) => {
    const role = new Role()
    role.id = 1
    role.name = 'Admin'

    const role2 = new Role()
    role2.id = 2
    role2.name = 'Admin2'

    const resource = await RoleResource.collection([role, role2])
    assert.deepEqual(resource, [
      {
        id: 1,
        name: 'Admin',
      },
      {
        id: 2,
        name: 'Admin2',
      },
    ])
  })

  test('Set resource item', async ({ assert }) => {
    const role = new Role()
    role.id = 1
    role.name = 'Admin'

    const resource = await RoleResource.item(role)
    assert.deepEqual(resource, {
      id: 1,
      name: 'Admin',
    })
  })
})
