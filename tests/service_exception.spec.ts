import { test } from '@japa/runner'
import { Exception } from '@adonisjs/core/exceptions'
import ServiceException from '../src/exceptions/service_exception.js'

test.group('ServiceException', () => {
  test('Default to a 400 status', async ({ assert }) => {
    const error = new ServiceException('Data not valid')

    assert.instanceOf(error, Exception)
    assert.equal(error.message, 'Data not valid')
    assert.equal(error.status, 400)
  })

  test('Accept a custom status', async ({ assert }) => {
    const error = new ServiceException('Not found', 404)

    assert.equal(error.message, 'Not found')
    assert.equal(error.status, 404)
  })
})
