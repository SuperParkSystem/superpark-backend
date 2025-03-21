FROM postgres:17.4-alpine

ENV POSTGRES_PASSWORD="pgpassword"

RUN mkdir -p /docker-entrypoint-initdb.d
COPY ./schema/*.sql /docker-entrypoint-initdb.d/
COPY ./docker/test/postgres/*.sql /docker-entrypoint-initdb.d/
