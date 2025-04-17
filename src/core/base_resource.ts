import { LucidRow } from '@adonisjs/lucid/types/model'
import { ExtractModelRelations } from '@adonisjs/lucid/types/relations'

type ResourceConstructor<T, R> = {
  new (resource: T): R
}

export abstract class BaseResource<T extends LucidRow['$attributes'] | LucidRow['$preloaded']> {
  constructor(protected resource: T) {}

  abstract toObject(): any

  async toJSON() {
    if (!this.resource) {
      return null
    }

    const data = await this.toObject()
    return await MissingValue.removeMissingValues(data)
  }

  static async collection<T extends LucidRow['$attributes'], R extends BaseResource<T>>(
    this: ResourceConstructor<T, R>,
    resources: T[]
  ): Promise<Awaited<ReturnType<R['toObject']>>[]> {
    return await Promise.all(
      resources.map(async (resource) => {
        const instance = new this(resource)
        return await instance.toJSON()
      })
    )
  }

  protected when(condition: boolean, value: any, defaultValue: any = undefined) {
    if (condition) {
      return value
    }

    return defaultValue !== undefined ? defaultValue : new MissingValue()
  }

  protected merge(data: any) {
    return this.mergeWhen(true, data)
  }

  protected mergeWhen(condition: any, data: any, defaultValue: any = undefined) {
    if (condition) {
      return data
    }
    return defaultValue !== undefined ? defaultValue : new MissingValue()
  }

  protected mergeResource<K extends LucidRow, L extends BaseResource<K>>(
    data: K,
    resource: { new (resource: K): L } & {
      collection(resources: K[]): any[]
      item(resource: K): any
    }
  ) {
    return this.mergeResourceWhen(data, resource, null)
  }

  protected mergeResourceWhen<K extends LucidRow, R extends BaseResource<K>>(
    data: K,
    resource: { new (resource: K): R } & {
      collection(resources: K[]): any[]
      item(resource: K): any
    },
    defaultValue: any = undefined
  ) {
    if (Array.isArray(data)) {
      return data && data !== undefined && data.length > 0
        ? resource.collection(data)
        : defaultValue !== undefined
          ? defaultValue
          : new MissingValue()
    } else {
      return data && data !== undefined
        ? resource.item(data)
        : defaultValue !== undefined
          ? defaultValue
          : new MissingValue()
    }
  }

  protected whenLoaded<K extends LucidRow, L extends BaseResource<T>>(
    relationship: ExtractModelRelations<K>,
    resource: { new (resource: T): L } & {
      collection(resources: T[]): any[]
      item(resource: T): any
    },
    defaultValue: any = undefined
  ) {
    const related = this.resource.get(relationship)
    if (related !== undefined && !(related instanceof MissingValue)) {
      return this.mergeResourceWhen(this.resource.get(relationship), resource)
    }

    return defaultValue !== undefined ? defaultValue : new MissingValue()
  }
}

class MissingValue {
  isMissing() {
    return true
  }

  static removeMissingValues(data: any) {
    let numericKeys = true

    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key]

        if (value instanceof MissingValue && value.isMissing()) {
          delete data[key]
        } else {
          numericKeys = numericKeys && !Number.isNaN(Number(key))
        }
      }
    }

    return numericKeys ? Object.values(data) : data
  }
}
