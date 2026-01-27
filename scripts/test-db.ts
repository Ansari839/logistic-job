import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
    const connectionString = process.env.DATABASE_URL;
    console.log('Testing connection to:', connectionString?.split('@')[1]); // Log host only for safety

    const pool = new Pool({
        connectionString,
        connectionTimeoutMillis: 5000,
    });

    try {
        const client = await pool.connect();
        console.log('Successfully connected to the database!');
        const res = await client.query('SELECT NOW()');
        console.log('Current time from DB:', res.rows[0]);
        client.release();
    } catch (err: any) {
        console.error('Connection failed!');
        console.error('Error Code:', err.code);
        console.error('Error Message:', err.message);
        if (err.message.includes('ETIMEDOUT')) {
            console.log('\nPossible causes:');
            console.log('1. Database is paused (Neon)');
            console.log('2. Firewall or Antivirus is blocking port 5432');
            console.log('3. Your current IP is not allowed in Neon settings');
        }
    } finally {
        await pool.end();
    }
}

testConnection();
