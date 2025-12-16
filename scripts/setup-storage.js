import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DIRECT_URL;

if (!connectionString) {
    console.error("DATABASE_URL not found in environment.");
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for Supabase TCP pooler
});

async function run() {
    try {
        console.log("Connecting to database...");
        await client.connect();

        console.log("Creating 'avatars' bucket if needed...");
        await client.query(`
            insert into storage.buckets (id, name, public)
            values ('avatars', 'avatars', true)
            on conflict (id) do nothing;
        `);

        console.log("Enabling RLS on storage.objects...");
        await client.query(`alter table storage.objects enable row level security;`);

        console.log("Adding upload policy for authenticated users...");
        // Drop existing policy if exists to avoid error
        await client.query(`drop policy if exists "Authenticated users can upload avatars" on storage.objects;`);
        await client.query(`
            create policy "Authenticated users can upload avatars"
            on storage.objects for insert
            to authenticated
            with check ( bucket_id = 'avatars' and auth.uid() = owner );
        `);

        console.log("Adding public read policy...");
        await client.query(`drop policy if exists "Public Access to Avatars" on storage.objects;`);
        await client.query(`
            create policy "Public Access to Avatars"
            on storage.objects for select
            to public
            using ( bucket_id = 'avatars' );
        `);

        console.log("✅ Storage Policies Applied Successfully!");

    } catch (e) {
        console.error("Error applying policies:", e);
    } finally {
        await client.end();
    }
}

run();
