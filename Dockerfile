FROM oven/bun

WORKDIR /app

COPY . .

RUN bun install

