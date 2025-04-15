import { Exception } from '@adonisjs/core/exceptions'
import { SimplePaginator } from '@adonisjs/lucid/database'
import { LucidRow } from '@adonisjs/lucid/types/model'
import ServiceException from '../exceptions/service_exception.js'
import app from '@adonisjs/core/services/app'
import { BaseResource } from './base_resource.js'
import string from '@adonisjs/core/helpers/string'

export class BaseService {
  private code: number = 200
  private message: string = ''
  private data: any = undefined
  private error: any = undefined
  private meta: Record<string, any> | undefined = undefined
  private paginateCase: string | undefined = undefined

  /**
   * Set paginate string case
   */
  protected setPaginateCase(stringCase: 'camelCase' | 'snakeCase') {
    this.paginateCase = stringCase
    return this
  }

  protected convertPaginateCase(meta: Record<string, any>) {
    if (this.paginateCase) {
      const method: string = this.paginateCase
      meta = Object.entries(meta).reduce(
        (acc, [key, value]) => {
          acc[(string as any)[method](key)] = value
          return acc
        },
        {} as Record<string, any>
      )
    }

    return meta
  }

  /**
   * Set code response
   */
  protected setCode(code: number) {
    this.code = code
    return this
  }

  /**
   * Set message response
   */
  protected setMessage(message: string) {
    this.message = message
    return this
  }

  /**
   * Set data response
   */
  protected setData(data: any) {
    this.data = data
    return this
  }

  /**
   * Set error response
   */
  protected setError(error: any) {
    this.error = error
    return this
  }

  /**
   * Get code response
   */
  getCode() {
    return this.code
  }

  /**
   * Get data response
   */
  getData() {
    return this.data
  }

  /**
   * Set data to resource
   */
  async setResource<T extends LucidRow, R extends BaseResource<T>>(
    ResourceClass: { new (resource: T): R } & {
      collection(resources: T[]): Promise<any[]>
      item(resource: T): Promise<any>
    }
  ) {
    if (!this.error) {
      if (this.data instanceof SimplePaginator) {
        this.meta = this.convertPaginateCase(this.data.getMeta())
        this.data = await ResourceClass.collection(this.data.all())
      } else if (Array.isArray(this.data)) {
        this.data = await ResourceClass.collection(this.data)
      } else {
        this.data = await ResourceClass.item(this.data)
      }
    }

    return this
  }

  /**
   * get Api response to json
   */
  getApiResponse() {
    if (this.error) {
      this.data = undefined
    }

    if (this.data instanceof SimplePaginator) {
      this.meta = this.data.getMeta()
      this.data = this.data.all()
    }

    return Object.fromEntries(
      Object.entries({
        code: this.code,
        message: this.message,
        meta: this.meta,
        data: this.data,
        errors: this.error,
      }).filter(([, v]) => typeof v !== 'undefined')
    )
  }

  toJSON() {
    return this.getApiResponse()
  }

  /**
   * Reformat exception response
   */
  protected exceptionCustom(error: Exception, message = 'Something Wrong!') {
    let code =
      error.status !== undefined && error.status >= 100 && error.status < 600 ? error.status : 500

    if (error instanceof ServiceException) {
      message = error.message
    }

    if (!app.inProduction) {
      message = error.message
      this.error = error.stack
    }

    this.code = code
    this.message = message

    return this
  }
}
