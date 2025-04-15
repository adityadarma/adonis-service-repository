# Adonis Service Repository

[![gh-workflow-image]][gh-workflow-url] [![npm-image]][npm-url] [![npm-downloads]][npm-downloads] ![][typescript-image] [![license-image]][license-url]

Service repository is a pattern to separate business logic and query logic. This package is designed to help simplify the maintenance of large and medium scale applications.

## Installation

```sh
node ace add @adityadarma/adonis-service-repository
```

## Usage

### \*Service

#### Create service

```bash
node ace make:service ServiceName
```

#### Using Core or Base

If you want to change the core service according to your wishes without changing the existing methods, you can publish it first.

```bash
node ace service:publish
```

#### Used on controller

```ts
construct(protected serviceName: Service) {}

async data()
{
  return this.serviceName.methodName().getData()
}

async json()
{
  return this.serviceName.methodName().toJson()
}
```

#### Use Service & Exception

Every all exception, must have handle to class ServiceException

```ts
async methodName()
{
  try {
    .........
    if (false) {
      throw new ServiceException('Error exception');
    }
    ..........
    return this.setMessage('Message data')
      .setCode(200)
      .setData(data)
    // OR
    return this.setMessage('Message data')
      .setCode(200)
      .setData(data)
      .setResource(ClassResource)
    // OR
    return await this.setMessage('Message data')
      .setCode(200)
      .setData(data)
      .setResourceAsync(ClassResource)
  } catch (error) {
    return this.exceptionResponse(error)
  }
}
```

### \*Repository

#### Create repository

```bash
node ace make:repository nameRepository
```

#### Used on service

```ts
construct(protected repositoryName: Repository) {}

async methodName()
{
  this.repositoryName.functionName();
}
```

### \*Resource

#### Create Resource

```bash
node ace make:resource nameResource
```

\*Note: use flag `--async` to create resource asyncronous

#### Used on service

```ts
async methodName()
{
  try {
    .........
    if (false) {
      throw new ServiceException('Error exception');
    }
    ..........
    return this.setMessage('Message data')
      .setCode(200)
      .setData(data)
      .setResource(ClassResource)
    // OR
    return await this.setMessage('Message data')
      .setCode(200)
      .setData(data)
      .setResourceAsync(ClassResource)
  } catch (error) {
    return this.exceptionResponse(error);
  }
}
```

## License

This package is open-sourced software licensed under the [MIT license](LICENSE.md).

[gh-workflow-image]: https://img.shields.io/github/actions/workflow/status/adityadarma/adonis-service-repository/release.yml?style=for-the-badge
[gh-workflow-url]: https://github.com/adityadarma/adonis-service-repository/actions/workflows/release.yml 'Github action'
[npm-image]: https://img.shields.io/npm/v/@adityadarma/adonis-service-repository/latest.svg?style=for-the-badge&logo=npm
[npm-url]: https://www.npmjs.com/package/@adityadarma/adonis-service-repository/v/latest 'npm'
[typescript-image]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript
[license-url]: LICENSE.md
[license-image]: https://img.shields.io/github/license/adityadarma/adonis-service-repository?style=for-the-badge
[npm-downloads]: https://img.shields.io/npm/dm/@adityadarma/adonis-service-repository.svg?style=for-the-badge
[count-downloads]: https://npmcharts.com/compare/@adityadarma/adonis-service-repository?minimal=true
