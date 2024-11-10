import { Exception } from '@adonisjs/core/exceptions'

export default class ServiceException extends Exception {
  constructor(message?: string, status = 400) {
    super(message, { status: status })
  }
}
