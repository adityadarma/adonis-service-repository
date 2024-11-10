import { Exception } from '@adonisjs/core/exceptions'
import { SimplePaginator } from '@adonisjs/lucid/database'
import ServiceException from '../exceptions/service_exception.js'
import app from '@adonisjs/core/services/app'

export class BaseService {
  private code: number = 200
  private message: string = ''
  private data: any = null
  private error: any = undefined
  private meta: any = undefined

  /**
   * Set code response
   */
  setCode(code: number) {
    this.code = code
    return this
  }

  /**
   * Set message response
   */
  setMessage(message: string) {
    this.message = message
    return this
  }

  /**
   * Set data response
   */
  setData(data: any) {
    this.data = data
    return this
  }

  /**
   * Set error response
   */
  setError(error: any) {
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
  setResource(resource: any) {
    if (!this.error) {
      if (this.data instanceof SimplePaginator) {
        const dataMeta = this.data.getMeta()
        this.meta = {
          total: dataMeta.total,
          per_page: dataMeta.perPage,
          current_page: dataMeta.currentPage,
          total_pages: dataMeta.lastPage,
        }
        this.data = resource.collection(this.data.all())
      } else if (Array.isArray(this.data)) {
        this.data = resource.collection(this.data)
      } else {
        this.data = resource.item(this.data)
      }
    }

    return this
  }

  /**
   * Set data to resource with async
   */
  async setResourceAsync(resource: any) {
    if (!this.error) {
      if (this.data instanceof SimplePaginator) {
        const dataMeta = this.data.getMeta()
        this.meta = {
          total: dataMeta.total,
          per_page: dataMeta.perPage,
          current_page: dataMeta.currentPage,
          total_pages: dataMeta.lastPage,
        }
        this.data = await resource.collectionAsync(this.data.all())
      } else if (Array.isArray(this.data)) {
        this.data = await resource.collectionAsync(this.data)
      } else {
        this.data = await resource.itemAsync(this.data)
      }
    }

    return this
  }

  /**
   * Set response to json
   */
  toJson() {
    if (this.error) {
      this.data = undefined
    }

    return Object.fromEntries(
      Object.entries({
        code: this.code,
        message: this.message,
        data: this.data,
        meta: this.meta,
        errors: this.error,
      }).filter(([, v]) => typeof v !== 'undefined')
    )
  }

  /**
   * Reformat exception response
   */
  exceptionCustom(error: Exception, message = 'Something Wrong!') {
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
