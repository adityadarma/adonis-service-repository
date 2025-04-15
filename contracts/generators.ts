import { generators as baseGenerators } from '@adonisjs/application'
import StringBuilder from '@poppinss/utils/string_builder'

const generators = {
  ...baseGenerators,

  /**
   * Converts an entity name to repository name
   */
  repositoryName(entityName: string) {
    return new StringBuilder(entityName)
      .removeExtension()
      .removeSuffix('repository')
      .removeSuffix('model')
      .singular()
      .pascalCase()
      .suffix('Repository')
      .toString()
  },

  /**
   * Converts an entity name to repository file name
   */
  repositoryFileName(entityName: string) {
    return new StringBuilder(this.repositoryName(entityName)).snakeCase().ext('.ts').toString()
  },

  /**
   * Converts an entity name to resource name
   */
  resourceName(entityName: string) {
    return new StringBuilder(entityName)
      .removeExtension()
      .removeSuffix('resource')
      .removeSuffix('model')
      .singular()
      .pascalCase()
      .suffix('Resource')
      .toString()
  },

  /**
   * Converts an entity name to resource file name
   */
  resourceFileName(entityName: string) {
    return new StringBuilder(this.resourceName(entityName)).snakeCase().ext('.ts').toString()
  },
}

export default generators
