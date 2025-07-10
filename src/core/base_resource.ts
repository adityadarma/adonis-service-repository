import { LucidRow } from '@adonisjs/lucid/types/model'
import { ExtractModelRelations } from '@adonisjs/lucid/types/relations'
import { MissingValue } from '../missing_value.js'

type ResourceConstructor<T, R> = {
  new (resource: T): R
}

export abstract class BaseResource<T extends LucidRow['$attributes']> {
  constructor(protected resource: T) {}

  abstract toObject(): any

  static async item<K extends LucidRow['$attributes'], R extends BaseResource<K>>(
    this: ResourceConstructor<K, R>,
    resource: K | null
  ): Promise<Awaited<ReturnType<R['toObject']>> | null> {
    if (!resource) {
      return null
    }

    const instance = new this(resource)
    const data = await instance.toObject()
    return await MissingValue.removeMissingValues(data)
  }

  static async collection<T extends LucidRow['$attributes'], R extends BaseResource<T>>(
    this: ResourceConstructor<T, R>,
    resources: T[]
  ): Promise<Awaited<ReturnType<R['toObject']>>[]> {
    return await Promise.all(
      resources.map(async (resource) => {
        const instance = new this(resource)
        const data = await instance.toObject()
        return await MissingValue.removeMissingValues(data)
      })
    )
  }

  protected when(condition: boolean, value: any, defaultValue?: any) {
    if (condition) {
      return typeof value === 'function' ? value() : value
    }

    return defaultValue !== undefined
      ? defaultValue === 'function'
        ? defaultValue()
        : defaultValue
      : new MissingValue()
  }

  protected merge(data: any) {
    return this.mergeWhen(true, data)
  }

  protected mergeWhen(condition: any, value: any, defaultValue?: any) {
    if (condition) {
      return typeof value === 'function' ? value() : value
    }
    return defaultValue !== undefined
      ? typeof defaultValue === 'function'
        ? defaultValue()
        : defaultValue
      : new MissingValue()
  }

  protected mergeResource<K>(data: K extends LucidRow | LucidRow[] ? K : never, resource: any) {
    return this.mergeResourceWhen(data, resource, null)
  }

  protected mergeResourceWhen<K>(
    data: K extends LucidRow | LucidRow[] ? K : never,
    resource: any,
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

  protected whenLoaded<K extends LucidRow>(
    relationship: ExtractModelRelations<K>,
    resource: any,
    defaultValue: any = undefined
  ) {
    const related = this.resource.get(relationship)
    if (related !== undefined && !(related instanceof MissingValue)) {
      return this.mergeResourceWhen(this.resource.get(relationship), resource)
    }

    return defaultValue !== undefined ? defaultValue : new MissingValue()
  }
}
