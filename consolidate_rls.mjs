
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function fixPolicies() {
    const client = new pg.Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        console.log("🧐 Auditing RLS policies on 'strains'...");

        const res = await client.query(`
            SELECT policyname, roles, cmd, qual 
            FROM pg_policies 
            WHERE tablename = 'strains' AND schemaname = 'public';
        `);

        console.log("Current Policies:", res.rows);

        // Consolidation logic
        // 1. Remove redundant SELECT policies
        // If "Strains are viewable by everyone" exists (FOR SELECT TO public/anon/authenticated), 
        // then any other SELECT policy for authenticated users is redundant.

        const hasPublicSelect = res.rows.some(p => p.cmd === 'SELECT' && (p.roles.includes('public') || p.roles.includes('anon')));

        if (hasPublicSelect) {
            console.log("🚀 Found public SELECT policy. Cleaning up redundant authenticated policies...");

            // Drop "strains_admin_all" if it's permissive for SELECT
            await client.query(`DROP POLICY IF EXISTS "strains_admin_all" ON public.strains;`);

            // Re-add "strains_admin_all" but ONLY for non-SELECT actions (INSERT, UPDATE, DELETE) 
            // OR just keep it simple if admins rely on service_role for writes.
            // Actually, the user suggested split by role scopes or merge.

            // Let's create a CLEAN state:
            // 1. One public SELECT policy
            // 2. One service_role ALL policy (optional but good for clarity)

            await client.query(`
                DROP POLICY IF EXISTS "Strains are viewable by everyone" ON public.strains;
                DROP POLICY IF EXISTS "strains_public_select" ON public.strains;
                
                CREATE POLICY "strains_public_select" ON public.strains
                FOR SELECT TO public
                USING (true);
                
                -- Admin write access (INSERT, UPDATE, DELETE)
                DROP POLICY IF EXISTS "strains_admin_write" ON public.strains;
                CREATE POLICY "strains_admin_write" ON public.strains
                FOR ALL TO authenticated
                USING (((SELECT auth.jwt() ->> 'role') = 'admin'))
                WITH CHECK (((SELECT auth.jwt() ->> 'role') = 'admin'));
            `);

            console.log("✅ Policies consolidated: 'strains_public_select' (read) and 'strains_admin_write' (write) are set.");
        }

    } catch (err) {
        console.error("❌ Error fixing policies:", err);
    } finally {
        await client.end();
    }
}

fixPolicies();
