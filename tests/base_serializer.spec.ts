import { test } from '@japa/runner'
import { BaseTransformer } from '@adonisjs/core/transformers'
import BaseSerializer from '../src/core/base_serializer.js'

type Row = { id: number; name: string }

class RowTransformer extends BaseTransformer<Row> {
  toObject() {
    return { id: this.resource.id, name: this.resource.name }
  }
}

const serializer = new BaseSerializer()

test.group('BaseSerializer', () => {
  test('Serialize an item without a wrapper key', async ({ assert }) => {
    const output = await serializer.serialize(RowTransformer.transform({ id: 1, name: 'Admin' }))

    assert.deepEqual(output, { id: 1, name: 'Admin' })
  })

  test('Serialize a collection without a wrapper key', async ({ assert }) => {
    const output = await serializer.serialize(
      RowTransformer.transform([
        { id: 1, name: 'Admin' },
        { id: 2, name: 'User' },
      ])
    )

    assert.deepEqual(output, [
      { id: 1, name: 'Admin' },
      { id: 2, name: 'User' },
    ])
  })

  test('Leave wrapping disabled', async ({ assert }) => {
    assert.isUndefined(serializer.wrap)
  })

  /**
   * `BaseService` unwraps a Lucid paginator itself and builds its own meta, so
   * this branch is only reachable by handing the serializer a transformer
   * paginator directly. The meta has to survive untouched either way.
   */
  test('Pass pagination meta through untouched', async ({ assert }) => {
    const meta = { total: 1, perPage: 10, currentPage: 1 }
    const output = await serializer.serialize(
      RowTransformer.paginate([{ id: 1, name: 'Admin' }], meta)
    )

    assert.deepEqual(output, { data: [{ id: 1, name: 'Admin' }], metadata: meta })
  })

  test('Return pagination meta by reference rather than rebuilding it', async ({ assert }) => {
    const meta = { total: 1, perPage: 10, currentPage: 1 }

    assert.strictEqual(serializer.definePaginationMetaData(meta), meta)
  })
})
