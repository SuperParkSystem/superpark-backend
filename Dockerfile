FROM oven/bun

COPY . .
CMD rm -rfd node_modules
COPY *.ts .

RUN bun install

