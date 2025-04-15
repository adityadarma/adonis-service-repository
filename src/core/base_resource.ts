import { LucidRow } from '@adonisjs/lucid/types/model'

type ResourceConstructor<T, R> = {
  new (resource: T): R
}

export abstract class BaseResource<T extends LucidRow['$attributes']> {
  constructor(protected resource: T) {}

  abstract toObject(): any

  toJSON() {
    return this.toObject()
  }

  static async collection<T extends LucidRow['$attributes'], R extends BaseResource<T>>(
    this: ResourceConstructor<T, R>,
    resources: T[]
  ): Promise<Awaited<ReturnType<R['toObject']>>[]> {
    return await Promise.all(
      resources.map(async (resource) => {
        const instance = new this(resource)
        return await instance.toObject()
      })
    )
  }

  static async item<T extends LucidRow['$attributes'], R extends BaseResource<T>>(
    this: ResourceConstructor<T, R>,
    resource: T
  ): Promise<Record<string, any> | null> {
    if (!resource) {
      return null
    }

    const data = await new this(resource).toObject()
    return await MissingValue.removeMissingValues(data)
  }

  protected when(condition: boolean, value: any, defaultValue: any = null) {
    if (condition) {
      return value
    }

    return defaultValue !== undefined ? defaultValue : new MissingValue()
  }

  protected merge(data: any) {
    return this.mergeWhen(true, data)
  }

  protected mergeWhen(condition: any, data: any) {
    return condition && condition !== undefined ? data : new MissingValue()
  }

  protected mergeResource(data: any, resource: any) {
    return this.mergeResourceWhen(data, resource, null)
  }

  protected mergeResourceWhen(data: any, resource: any, defaultValue: any = undefined) {
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

  protected whenLoaded(relationship: any, resource: any, defaultValue: any = undefined) {
    if (relationship !== undefined) {
      return this.mergeResourceWhen(relationship, resource)
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
