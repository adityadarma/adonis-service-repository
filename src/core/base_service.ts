import { SimplePaginator } from '@adonisjs/lucid/database'
import ServiceException from '../exceptions/service_exception.js'
import app from '@adonisjs/core/services/app'
import string from '@adonisjs/core/helpers/string'

/**
 * Paginate meta key converters. Keyed explicitly rather than looked up on the
 * string helper by name, so a rename breaks at compile time.
 */
const PAGINATE_CASE_CONVERTERS = {
  camelCase: (key: string) => string.camelCase(key),
  snakeCase: (key: string) => string.snakeCase(key),
}

export type PaginateCase = keyof typeof PAGINATE_CASE_CONVERTERS

export class BaseService {
  /**
   * Declared as ECMAScript private fields rather than TypeScript `private`.
   * TypeScript's `private` is compile-time only, so a subclass method named
   * `code`, `message` or `data` would be silently overwritten by the field
   * initialiser at runtime.
   */
  #code?: number = 200
  #message: string = ''
  #data: any = undefined
  #error: any = undefined
  #meta: Record<string, any> | undefined = undefined
  #paginateCase: PaginateCase | undefined = undefined

  /**
   * Set paginate string case
   */
  protected setPaginateCase(stringCase: PaginateCase) {
    this.#paginateCase = stringCase
    return this
  }

  protected convertPaginateCase(meta: Record<string, any>) {
    const paginateCase = this.#paginateCase

    if (!paginateCase) {
      return meta
    }

    const convert = PAGINATE_CASE_CONVERTERS[paginateCase]

    return Object.entries(meta).reduce(
      (acc, [key, value]) => {
        acc[convert(key)] = value
        return acc
      },
      {} as Record<string, any>
    )
  }

  /**
   * Set code
   */
  protected setCode(code: number) {
    this.#code = code
    return this
  }

  /**
   * Set message
   */
  protected setMessage(message: string) {
    this.#message = message
    return this
  }

  /**
   * Set data
   */
  setData(data: any) {
    this.#data = data
    return this
  }

  /**
   * Set error
   */
  protected setError(error: any) {
    this.#error = error
    return this
  }

  /**
   * Get code
   */
  getCode() {
    return this.#code
  }

  /**
   * Get data
   */
  getData() {
    return this.#data
  }

  /**
   * Remove code
   */
  withoutCode() {
    this.#code = undefined
    return this
  }

  /**
   * Set data to resource
   */
  async setResource(resource: any) {
    if (!this.#error) {
      if (this.#data instanceof SimplePaginator) {
        this.#meta = this.convertPaginateCase(this.#data.getMeta())
        this.#data = await resource.collection(this.#data.all())
      } else if (Array.isArray(this.#data)) {
        this.#data = await resource.collection(this.#data)
      } else {
        this.#data = await resource.item(this.#data)
      }
    }

    return this
  }

  /**
   * Set data to resource
   */
  async setTransform(resource: any) {
    if (!this.#error) {
      if (this.#data instanceof SimplePaginator) {
        this.#meta = this.convertPaginateCase(this.#data.getMeta())
        this.#data = await resource.transform(this.#data.all())
      } else {
        this.#data = await resource.transform(this.#data)
      }
    }

    return this
  }

  /**
   * get Api response to json
   */
  getApiResponse() {
    if (this.#error) {
      this.#data = undefined
    }

    if (this.#data instanceof SimplePaginator) {
      this.#meta = this.convertPaginateCase(this.#data.getMeta())
      this.#data = this.#data.all()
    }

    return Object.fromEntries(
      Object.entries({
        code: this.#code,
        message: this.#message,
        meta: this.#meta,
        data: this.#data,
        errors: this.#error,
      }).filter(([, v]) => typeof v !== 'undefined')
    )
  }

  toJSON() {
    return this.getData()
  }

  /**
   * Reformat exception response
   */
  protected exceptionCustom(error: any, message = 'Something Wrong!') {
    const code =
      error.status !== undefined && error.status >= 100 && error.status < 600 ? error.status : 500

    if (error instanceof ServiceException) {
      message = error.message
    }

    if (!app.inProduction) {
      message = error.message
      this.#error = error.stack
    }

    this.#code = code
    this.#message = message

    return this
  }
}
