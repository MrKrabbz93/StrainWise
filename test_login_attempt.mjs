import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
    const email = 'tiahnsolomon@hotmail.com';
    const passwords = ['password123', 'Password123!', 'StrainWise123!', 'cannabis123'];

    for (const password of passwords) {
        console.log(`Trying password: ${password}`);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            console.log(`❌ Login failed: ${error.message}`);
        } else {
            console.log(`✅ Login SUCCESS with password: ${password}`);
            console.log('User ID:', data.user.id);
            return;
        }
    }
    console.log('All attempted passwords failed.');
}

testLogin();
