import { LucidRow } from '@adonisjs/lucid/types/model'

export class BaseResource<T extends LucidRow['$attributes']> {
  constructor(public resource: T) {}

  static collection<T extends LucidRow['$attributes']>(resources: T[]): any {
    if (resources !== undefined) {
      return resources
        .map((resource: T) => {
          return new this(resource).toObject()
        })
        .map((data: T) => {
          return removeMissingValues(data)
        })
    }

    return null
  }

  static async collectionAsync<T extends LucidRow['$attributes']>(resources: T[]): Promise<any> {
    if (resources !== undefined) {
      let data = await Promise.all(
        resources.map(async (resource: T) => {
          return await new this(resource).toObject()
        })
      )

      data = await Promise.all(
        data.map(async (value: T) => {
          return await removeMissingValuesAsync(value)
        })
      )

      return data
    }

    return null
  }

  static item<T extends LucidRow['$attributes']>(resource: T): any {
    if (resource !== undefined) {
      return removeMissingValues(new this(resource).toObject())
    }

    return null
  }

  static async itemAsync<T extends LucidRow['$attributes']>(resource: T): Promise<any> {
    if (resource !== undefined) {
      return await removeMissingValues(await new this(resource).toObject())
    }

    return null
  }

  toObject(): any {
    throw new Error('Method toObject must be implemented')
  }

  when(condition: boolean, value: any, defaultValue: any = null) {
    if (condition) {
      return value
    }

    return defaultValue !== undefined ? defaultValue : new MissingValue()
  }

  merge(data: any) {
    return this.mergeWhen(true, data)
  }

  mergeWhen(condition: any, data: any) {
    return condition && condition !== undefined ? data : new MissingValue()
  }

  mergeResource(data: any, resource: any) {
    return this.mergeResourceWhen(data, resource, null)
  }

  mergeResourceWhen(data: any, resource: any, defaultValue: any = undefined) {
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

  whenLoaded(relationship: any, resource: any, defaultValue: any = undefined) {
    if (relationship !== undefined) {
      return this.mergeResourceWhen(relationship, resource)
    }

    return defaultValue !== undefined ? defaultValue : new MissingValue()
  }
}

function removeMissingValues(data: any) {
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

async function removeMissingValuesAsync(data: any) {
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

class MissingValue {
  isMissing() {
    return true
  }
}
