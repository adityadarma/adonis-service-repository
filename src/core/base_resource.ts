import { type LucidRow } from '@adonisjs/lucid/types/model'
import { type ExtractModelRelations } from '@adonisjs/lucid/types/relations'
import { MissingValue } from '../missing_value.js'

type ResourceConstructor<T, R> = {
  new (resource: T): R
}

/**
 * `toObject()` may be sync or async, and the static helpers mirror whichever
 * one the resource picked: an async `toObject()` yields a promise, a sync one
 * yields the value directly so callers are not forced to await.
 */
type ObjectOf<R extends BaseResource<any>> = ReturnType<R['toObject']>

type ItemResult<R extends BaseResource<any>> =
  ObjectOf<R> extends Promise<infer K> ? Promise<K | null> : ObjectOf<R> | null

type CollectionResult<R extends BaseResource<any>> =
  ObjectOf<R> extends Promise<infer K> ? Promise<K[]> : ObjectOf<R>[]

function isPromiseLike(value: any): value is PromiseLike<any> {
  return value !== null && typeof value === 'object' && typeof value.then === 'function'
}

export abstract class BaseResource<T extends LucidRow> {
  constructor(protected resource: T) {}

  abstract toObject(): any

  static item<K extends LucidRow, R extends BaseResource<K>>(
    this: ResourceConstructor<K, R>,
    resource: K | null
  ): ItemResult<R> {
    if (!resource) {
      return null as ItemResult<R>
    }

    const data = new this(resource).toObject()

    if (isPromiseLike(data)) {
      return Promise.resolve(data).then((value) =>
        MissingValue.removeMissingValues(value)
      ) as ItemResult<R>
    }

    return MissingValue.removeMissingValues(data) as ItemResult<R>
  }

  static collection<T extends LucidRow, R extends BaseResource<T>>(
    this: ResourceConstructor<T, R>,
    resources: T[]
  ): CollectionResult<R> {
    const mapped = resources.map((resource) => {
      const data = new this(resource).toObject()

      return isPromiseLike(data)
        ? Promise.resolve(data).then((value) => MissingValue.removeMissingValues(value))
        : MissingValue.removeMissingValues(data)
    })

    /**
     * A single async `toObject()` makes the whole collection async. When none of
     * them are, the array is returned as-is so a sync resource stays sync.
     */
    return (mapped.some(isPromiseLike) ? Promise.all(mapped) : mapped) as CollectionResult<R>
  }

  protected when(condition: boolean, value: any, defaultValue?: any) {
    if (condition) {
      return typeof value === 'function' ? value() : value
    }

    return defaultValue !== undefined
      ? typeof defaultValue === 'function'
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
      return data.length > 0
        ? resource.collection(data)
        : defaultValue !== undefined
          ? defaultValue
          : new MissingValue()
    } else {
      return data
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
    /**
     * `$getRelated` is the Lucid API for reading a preloaded relationship. It
     * returns undefined when the relationship was never preloaded.
     */
    const row = this.resource as any
    const related =
      typeof row.$getRelated === 'function' ? row.$getRelated(relationship) : undefined

    if (related !== undefined && !(related instanceof MissingValue)) {
      return this.mergeResourceWhen(related, resource)
    }

    return defaultValue !== undefined ? defaultValue : new MissingValue()
  }
}
