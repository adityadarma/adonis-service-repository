import { LucidRow } from '@adonisjs/lucid/types/model'
import { BaseResource } from './core/base_resource.js'

type ResourceConstructor<T> = abstract new (
  resource: T
) => BaseResource<T extends LucidRow['$attributes'] ? T : never>
export interface MethodResource<T> extends ResourceConstructor<T> {
  collection(resources: T[]): any[]
  item(resource: T): any
}
