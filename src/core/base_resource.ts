export class BaseResource {
  constructor(public resource: any) {}

  static collection(resources: any): any {
    if (resources !== undefined) {
      return resources
        .map((resource: any) => {
          return new this(resource).toObject()
        })
        .map((data: any) => {
          return removeMissingValues(data)
        })
    }

    return null
  }

  static async collectionAsync(resources: any): Promise<any> {
    if (resources !== undefined) {
      let data = await Promise.all(
        resources.map(async (resource: any) => {
          return await new this(resource).toObject()
        })
      )

      data = await Promise.all(
        data.map(async (value: any) => {
          return await removeMissingValuesAsync(value)
        })
      )

      return data
    }

    return null
  }

  static item(resource: any): any {
    if (resource !== undefined) {
      return removeMissingValues(new this(resource).toObject())
    }

    return null
  }

  static async itemAsync(resource: any): Promise<any> {
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
