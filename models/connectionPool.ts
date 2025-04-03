import Pool from "pg-pool"

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    ssl: {
        rejectUnauthorized: false,

    },
})

export default pool

