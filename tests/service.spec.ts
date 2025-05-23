import { test } from '@japa/runner'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { BaseResource } from '../src/core/base_resource.js'
import { BaseService } from '../src/core/base_service.js'
import { BelongsTo } from '@adonisjs/lucid/types/relations'

test.group('Service', () => {
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

    @column()
    declare name: string

    @column()
    declare email: string

    @belongsTo(() => Role)
    declare role: BelongsTo<typeof Role>
  }

  class RoleResource extends BaseResource<Role> {
    async toObject() {
      return {
        id: this.resource.id,
        name: this.resource.name,
      }
    }
  }

  class UserResource extends BaseResource<User> {
    async toObject() {
      return {
        id: this.resource.id,
        roleId: this.resource.roleId,
        name: this.resource.name,
        email: this.resource.email,
        role1: await this.mergeResourceWhen(this.resource.role, RoleResource),
        role2: await this.mergeResource(this.resource.role, RoleResource),
        role3: await this.merge(this.resource.role),
        role4: await this.mergeWhen(this.resource.role, this.resource.role),
        role5: await this.when(true, this.resource.role),
      }
    }
  }

  class FakeService extends BaseService {
    public async getUsers() {
      const user = new User()
      user.id = 1
      user.roleId = 1
      user.name = 'John Doe'
      user.email = 'john.doe@example.com'

      const role = new Role()
      role.id = 1
      role.name = 'Admin'
      user.$preloaded = {
        role: role,
      } as any

      return this.setCode(200).setData([user]).setResource(UserResource)
    }

    public async findUser() {
      const user = new User()
      user.id = 1
      user.roleId = 1
      user.name = 'John Doe'
      user.email = 'john.doe@example.com'

      // const role = new Role()
      // role.id = 1
      // role.name = 'Admin'
      // user.$preloaded = {
      //   role: role,
      // } as any

      return this.setCode(200).setData(user).setResource(UserResource)
    }
  }

  test('Set resource collection from service', async ({ assert }) => {
    const service = new FakeService()
    const result = await service.getUsers()
    console.log(result.getApiResponse())
    assert.equal(result.getCode(), 200)
  })

  test('Set resource item from service', async ({ assert }) => {
    const service = new FakeService()
    const result = await service.findUser()
    console.log(result.getApiResponse())
    assert.equal(result.getCode(), 200)
  })
})
