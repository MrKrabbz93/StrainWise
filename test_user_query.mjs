import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function checkUser() {
    const email = 'tiahnsolomon@hotmail.com';

    console.log(`Checking for user: ${email}`);

    // Use admin API to list users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    const user = users.find(u => u.email === email);

    if (user) {
        console.log('User found:', JSON.stringify(user, null, 2));

        // Check profiles table too
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.warn('Profile not found or error:', profileError.message);
        } else {
            console.log('Profile found:', JSON.stringify(profile, null, 2));
        }
    } else {
        console.log('User not found in auth.users');
    }
}

checkUser();
