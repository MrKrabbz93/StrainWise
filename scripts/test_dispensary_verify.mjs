import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function testDispensaryVerify() {
    console.log("🚀 Testing Dispensary Verification Agent...");

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const tavilyApiKey = process.env.TAVILY_API_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("❌ Missing Supabase Credentials.");
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Mock Data
    const mockSubmission = {
        name: "Cloud 9 Dispensary",
        address: "123 High St",
        city: "Bangkok",
        state: "Bangkok",
        user_id: "04d84869-fe5e-4aef-a21e-e147035cc087" // Verified existence
    };

    try {
        console.log(`🔍 Verifying '${mockSubmission.name}' via Tavily...`);
        // Note: Real fetch to Tavily if API key exists, otherwise mock success for logic test
        if (tavilyApiKey) {
            const query = `${mockSubmission.name} dispensary ${mockSubmission.address}`;
            const response = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ api_key: tavilyApiKey, query, max_results: 1 })
            });
            const data = await response.json();
            console.log("✅ Tavily Response received.");
        } else {
            console.log("⚠️ No TAVILY_API_KEY, skipping web verification check.");
        }

        console.log("📤 Inserting dispensary record...");
        const { data: dispensary, error: insertError } = await supabase
            .from('dispensaries')
            .insert([{
                name: mockSubmission.name,
                address: `${mockSubmission.address}, ${mockSubmission.city}`,
                country: 'Thailand',
                submitted_by: mockSubmission.user_id
            }])
            .select()
            .single();

        if (insertError) throw insertError;
        console.log("✅ Dispensary record created.");

        console.log("🏆 Processing Gamification (XP)...");
        const { data: profile } = await supabase
            .from('profiles')
            .select('xp, contributions_count')
            .eq('id', mockSubmission.user_id)
            .single();

        if (profile) {
            const currentCount = (profile.contributions_count || 0) + 1;
            const xpToAdd = 20 + (currentCount % 5 === 0 ? 100 : 0);

            console.log(`✨ User earned ${xpToAdd} XP! (New Count: ${currentCount})`);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    xp: (profile.xp || 0) + xpToAdd,
                    contributions_count: currentCount
                })
                .eq('id', mockSubmission.user_id);

            if (updateError) throw updateError;
            console.log("✅ Profile XP updated.");
        } else {
            console.log("⚠️ Could not find user profile to award XP.");
        }

        console.log("🏁 Test Complete!");

    } catch (error) {
        console.error("❌ Test Failed:", error.message);
    }
}

testDispensaryVerify();
