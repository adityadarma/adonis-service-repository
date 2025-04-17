export class MissingValue {
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
