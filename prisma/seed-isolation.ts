import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    console.log(`Separating companies for strict data isolation (via raw SQL)...`);
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Get Main Company
        const mainCompanyRes = await client.query(`SELECT id FROM "Company" WHERE "uniqueId" = $1`, ['LOGOS-001']);
        if (mainCompanyRes.rows.length === 0) throw new Error("Main company LOGOS-001 not found");
        const mainCompanyId = mainCompanyRes.rows[0].id;

        // 2. Ensure Feed Company Exists
        const feedCompanyRes = await client.query(`
            INSERT INTO "Company" ("name", "uniqueId", "address", "phone", "email", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            ON CONFLICT ("uniqueId") DO UPDATE 
            SET "name" = EXCLUDED."name"
            RETURNING id
        `, ["Animal Feed Co.", "FEED-001", "Industrial Zone, Plot 45", "+92 300 0000000", "info@feedco.com"]);
        const feedCompanyId = feedCompanyRes.rows[0].id;
        console.log("Feed Company ID:", feedCompanyId);

        // 3. Move Admin User to new Company
        const feedPass = await bcrypt.hash('admin125', 10);
        await client.query(`
            INSERT INTO "User" ("name", "email", "password", "role", "division", "companyId", "branch", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            ON CONFLICT ("email") DO UPDATE
            SET "companyId" = $6, "division" = $5, "password" = $3
        `, ["Animal Feed Admin", "admin@feed.com", feedPass, "ADMIN", "animal-feed", feedCompanyId, "Head Office"]);

        // 4. Clone Chart of Accounts
        const countRes = await client.query(`SELECT count(*) FROM "Account" WHERE "companyId" = $1`, [feedCompanyId]);

        if (parseInt(countRes.rows[0].count) === 0) {
            console.log("Cloning Chart of Accounts from Logistics...");

            // Get Root Accounts
            const roots = await client.query(`SELECT * FROM "Account" WHERE "companyId" = $1 AND "parentId" IS NULL`, [mainCompanyId]);

            for (const root of roots.rows) {
                const newRootRes = await client.query(`
                    INSERT INTO "Account" ("name", "code", "type", "companyId", "parentId", "createdAt", "updatedAt")
                    VALUES ($1, $2, $3, $4, NULL, NOW(), NOW())
                    RETURNING id
                `, [root.name, root.code, root.type, feedCompanyId]);
                const newRootId = newRootRes.rows[0].id;

                // Get Children
                const children = await client.query(`SELECT * FROM "Account" WHERE "companyId" = $1 AND "parentId" = $2`, [mainCompanyId, root.id]);

                for (const child of children.rows) {
                    await client.query(`
                        INSERT INTO "Account" ("name", "code", "type", "companyId", "parentId", "createdAt", "updatedAt")
                        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                    `, [child.name, child.code, child.type, feedCompanyId, newRootId]);
                }
            }
            console.log("COA Cloned.");
        } else {
            console.log("Feed Company already has accounts. Skipping Clone.");
        }

        await client.query('COMMIT');
        console.log('✅ Isolation complete.');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Migration failed:", e);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
