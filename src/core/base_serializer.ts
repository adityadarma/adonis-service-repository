import { BaseSerializer as CoreSerializer } from '@adonisjs/core/transformers'

/**
 * Resolves transformers into plain objects for the service response envelope.
 *
 * Wrapping is disabled: `BaseService.getApiResponse()` already builds the
 * `code` / `message` / `meta` / `data` envelope, and pagination meta is handled
 * by `convertPaginateCase()`, so meta is passed through untouched here.
 */
export default class BaseSerializer extends CoreSerializer<{
  PaginationMetaData: Record<string, any>
}> {
  wrap = undefined

  definePaginationMetaData(metaData: unknown): Record<string, any> {
    return metaData as Record<string, any>
  }
}
