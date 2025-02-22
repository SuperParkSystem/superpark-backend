# superpark-backend

This project was created using `bun init` in bun v1.2.2. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run server.ts
```

To run development version:

```bash
bun run dev
```

**NOTE**: Before running development version, enter `docker/test/` folder and run 
```bash
docker compose up --build
```
This will bring up the PostgresQL server for testing.


Refer each directory for information on what it contains. Overall project structure
has been determined based on [this blog](https://medium.com/@bthncm/building-scalable-and-maintainable-apis-with-node-js-and-express-js-9621c89b).

## Documentation

Run the following command to run a developmental version:

```bash
bun run dev
```

Now open `localhost:8080/docs` in your browser to view the documentation.

## Contributing

Do **NOT** push to the `main` branch. Create a separate branch for whatever issue you are
working on and create a pull request once done.
