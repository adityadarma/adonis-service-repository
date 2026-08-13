/**
 * Only plain objects and arrays are traversed. Class instances (Lucid rows,
 * Date, etc.) are returned untouched so cleaning never reaches into them.
 */
function isPlainObject(value: any): value is Record<string, any> {
  if (value === null || typeof value !== 'object') {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function isMissing(value: any): boolean {
  return value instanceof MissingValue && value.isMissing()
}

/**
 * Builds a cleaned copy of the given value. The input is never mutated.
 */
function clean(data: any): any {
  if (Array.isArray(data)) {
    return data.filter((value) => !isMissing(value)).map((value) => clean(value))
  }

  if (!isPlainObject(data)) {
    return data
  }

  const result: Record<string, any> = {}
  let numericKeys = true
  let hasKeys = false

  for (const key of Object.keys(data)) {
    const value = data[key]

    if (isMissing(value)) {
      continue
    }

    hasKeys = true
    numericKeys = numericKeys && !Number.isNaN(Number(key))
    result[key] = clean(value)
  }

  /**
   * An object whose every remaining key is numeric is treated as a list. An
   * object with no keys left stays an object -- there is nothing to suggest it
   * was ever a list.
   */
  return hasKeys && numericKeys ? Object.values(result) : result
}

export class MissingValue {
  isMissing() {
    return true
  }

  /**
   * Returns a copy of `data` with every MissingValue removed, at any depth.
   */
  static removeMissingValues(data: any) {
    return clean(data)
  }
}
