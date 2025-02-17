import Pool from "pg-pool"

var pool = new Pool({
    database: process.env.POSTGRES_DB || 'superpark',
    user: process.env.POSTGRES_USERNAME || 'superpark',
    password: process.env.POSTGRES_PASSWORD || 'superparkapi',
    port: Number(process.env.POSTGRES_PORT || '5432'),
    host: process.env.POSTGRES_HOST || 'localhost',
    max: 20
})

export default pool

