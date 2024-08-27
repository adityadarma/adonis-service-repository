import { Exception } from '@adonisjs/core/exceptions'

export default class CustomException extends Exception {
  constructor(message?: string, status = 400) {
    super(message, { status: status })
  }
}
