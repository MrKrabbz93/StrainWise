import { createClient } from '@supabase/supabase-js';

const url = 'https://ujhqqkbdkqiyoasdeunj.supabase.co';
const key = 'sb_publishable_Eaa3bFkeekHRgIsmTMZ_Zg_Uvag6AtW';

try {
    console.log("Attempting to create client...");
    const client = createClient(url, key);
    console.log("Client created successfully.");

    console.log("Attempting to fetch profiles...");
    const { data, error } = await client.from('profiles').select('count', { count: 'exact', head: true });

    if (error) {
        console.error("Fetch Error:", error.message);
    } else {
        console.log("Fetch Success. Connection verified.");
    }
} catch (error) {
    console.error("Error:", error.message);
}
