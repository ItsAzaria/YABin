<h1 align="center">Pastecord</h1>

Forked from [YABin](https://github.com/Yureien/YABin)
Just a few customisations to streamline it and update packages where needed


## API Documentation

See [API.md](API.md).

## How to Host

### .env Configuration

By default, it is configured to use PostgreSQL. However, it can be run using any SQL DB such as SQLite or MySQL. To use other backends, please update the provider in [schema.prisma](src/lib/server/prisma/schema.prisma).

- `DB_NAME` is the database name;
- `DB_HOST` database host (defaults to 'db', but can be changed to aything like localhost)
- `DB_USER` database user
- `DB_PORT` database port 5432
- `DB_PASSWORD` the database user password
- `DATABASE_URL` you don't need to modify this variable (thanks to dotenv-expand). keep it though!

Remember to modify `SALT` to something secure if you plan on using user accounts.

#### Locally

```bash
npm install
cp .env.example .env
# Modify .env to add the database URL and other parameters
npm run dev
```

#### Using Docker

```bash
docker run --env-file .env -it -p 3000:3000 yureien/yabin:latest
# Or with Docker Compose
# Remember to change the DB password!
docker compose up -d
```