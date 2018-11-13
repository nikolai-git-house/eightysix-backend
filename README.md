# EightySix Analytics Server

## Getting Started

### Prerequisites

- NodeJS 8.11.1 & NPM 5.x+
- PostgreSQL 9+

### Installing

- Install node modules
  ```
  npm install
  ```
- Create new database for the project

### file `.env` creat and configure

- file .env create
  ```
  cp .env .env.example
  ```
- Set frontend app url
  ```
  APP_URL=http://localhost:4000
  ```

## Running in development environment

    npm run start:dev

## ESLint

- Lint your code
  ```
  npm run eslint
  ```
- Run eslint with auto-fix flag
  ```
  npm run eslint:fix
  ```

## ApiDoc

- Generate apidoc
  ```
  npm run apidoc:generate
  ```
- Serve apidoc
  ```
  npm run apidoc:serve
  ```
- Open the link in your browser

## Migrations

Migrations are stored in ./db/migrations catalog. Use `npm run migration:create my-migration-name` to create a new one.

#### Auto run

All new migrations are automatically applied on server startup

#### Manual run

If you need to apply/rollback migrations manually you can use the following commands:

- Apply pending migrations
  ```
  npm run migrate
  ```
- Rollback last migration
  ```
  npm run migrate:undo
  ```
- Rollback all migrations
  ```
  npm run migrate:undo:all
  ```

## Production run

The production application is run through AWS Elastic Beanstalk. To set up this configuration copy the `example-variables.config` file into the `.ebextensions` directory and alter the variables as required. The application can then be deployed using the `eb deploy` command for the Elastic Beanstalk CLI.
