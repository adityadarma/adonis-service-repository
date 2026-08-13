import { test } from '@japa/runner'
import { MissingValue } from '../src/missing_value.js'

test.group('MissingValue', () => {
  test('Instance is always flagged as missing', async ({ assert }) => {
    assert.isTrue(new MissingValue().isMissing())
  })

  test('Remove missing values from an object', async ({ assert }) => {
    const result = MissingValue.removeMissingValues({
      id: 1,
      name: 'Admin',
      role: new MissingValue(),
    })

    assert.deepEqual(result, { id: 1, name: 'Admin' })
  })

  test('Keep falsy values that are not missing', async ({ assert }) => {
    const result = MissingValue.removeMissingValues({
      zero: 0,
      empty: '',
      nullable: null,
      falsy: false,
      missing: new MissingValue(),
    })

    assert.deepEqual(result, { zero: 0, empty: '', nullable: null, falsy: false })
  })

  test('Return an array when every remaining key is numeric', async ({ assert }) => {
    const result = MissingValue.removeMissingValues({
      0: 'first',
      1: new MissingValue(),
      2: 'third',
    })

    assert.deepEqual(result, ['first', 'third'])
  })

  test('Return an object untouched when no value is missing', async ({ assert }) => {
    const result = MissingValue.removeMissingValues({ id: 1 })

    assert.deepEqual(result, { id: 1 })
  })

  test('Keep an empty object an object', async ({ assert }) => {
    assert.deepEqual(MissingValue.removeMissingValues({}), {})
  })

  test('Keep an object an object once every value is missing', async ({ assert }) => {
    assert.deepEqual(MissingValue.removeMissingValues({ role: new MissingValue() }), {})
  })

  test('Strip missing values nested inside an object', async ({ assert }) => {
    const result = MissingValue.removeMissingValues({
      id: 1,
      nested: { keep: 1, role: new MissingValue() },
    })

    assert.deepEqual(result, { id: 1, nested: { keep: 1 } })
  })

  test('Strip missing values nested at depth', async ({ assert }) => {
    const result = MissingValue.removeMissingValues({
      a: { b: { c: { keep: 1, drop: new MissingValue() } } },
    })

    assert.deepEqual(result, { a: { b: { c: { keep: 1 } } } })
  })

  test('Strip missing entries from an array', async ({ assert }) => {
    const result = MissingValue.removeMissingValues({
      items: [1, new MissingValue(), 3],
    })

    assert.deepEqual(result, { items: [1, 3] })
  })

  test('Strip missing values inside objects held in an array', async ({ assert }) => {
    const result = MissingValue.removeMissingValues({
      items: [{ keep: 1, drop: new MissingValue() }],
    })

    assert.deepEqual(result, { items: [{ keep: 1 }] })
  })

  test('Clean a top level array', async ({ assert }) => {
    const result = MissingValue.removeMissingValues([1, new MissingValue(), 3])

    assert.deepEqual(result, [1, 3])
  })

  test('Not mutate the given object', async ({ assert }) => {
    const input: Record<string, any> = { id: 1, role: new MissingValue() }

    MissingValue.removeMissingValues(input)

    assert.property(input, 'role')
    assert.instanceOf(input.role, MissingValue)
  })

  test('Not mutate a nested object', async ({ assert }) => {
    const nested: Record<string, any> = { keep: 1, role: new MissingValue() }

    MissingValue.removeMissingValues({ nested })

    assert.property(nested, 'role')
  })

  test('Leave class instances untouched', async ({ assert }) => {
    class Model {
      id = 1
      role = new MissingValue()
    }
    const model = new Model()

    const result = MissingValue.removeMissingValues({ model })

    assert.strictEqual(result.model, model)
    assert.instanceOf(result.model.role, MissingValue)
  })

  test('Leave a date untouched', async ({ assert }) => {
    const date = new Date()

    assert.strictEqual(MissingValue.removeMissingValues({ date }).date, date)
  })

  test('Preserve a null value', async ({ assert }) => {
    assert.deepEqual(MissingValue.removeMissingValues({ nullable: null }), { nullable: null })
  })
})
