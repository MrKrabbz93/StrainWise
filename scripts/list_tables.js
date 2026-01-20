import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function list() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        `);

        console.log("Public Tables:");
        res.rows.forEach(r => console.log(`- ${r.table_name}`));
    } catch (err) {
        console.error("Error listing tables:", err);
    } finally {
        await client.end();
    }
}

list();
