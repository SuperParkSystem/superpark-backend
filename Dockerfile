FROM oven/bun

WORKDIR /app

COPY bun.lock package.json tsconfig.json .
RUN bun install

COPY . .
RUN bun install

