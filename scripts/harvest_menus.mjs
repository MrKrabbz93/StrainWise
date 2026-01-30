import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { callGemini } from '../src/lib/gemini.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function harvestMenus() {
    console.log("🥬 Starting Menu Harvest...");

    // 1. Fetch dispensaries with websites
    const { data: dispensaries, error: fetchError } = await supabase
        .from('dispensaries')
        .select('id, name, website')
        .not('website', 'is', null)
        .limit(10); // Batch size

    if (fetchError) {
        console.error("Error fetching dispensaries:", fetchError.message);
        return;
    }

    if (!dispensaries || dispensaries.length === 0) {
        console.log("✅ No dispensaries found to harvest.");
        return;
    }

    for (const d of dispensaries) {
        console.log(`🔎 Harvesting: ${d.name} (${d.website})...`);

        try {
            // Using AI to "Read" the website menu
            const prompt = `Research the live menu for "${d.name}" at ${d.website}. 
            Identify the current cannabis strains in stock.
            
            Return ONLY a JSON array of objects with keys: "strain_name", "price_eighth" (numeric), "type" (Indica/Sativa/Hybrid).
            Example: [{"strain_name": "Blue Dream", "price_eighth": 35, "type": "Sativa"}]`;

            const response = await callGemini({
                type: 'generate',
                prompt,
                tools: [{ googleSearch: {} }] // Critical for live inventory
            });

            if (!response) throw new Error("No response from AI");

            const jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
            const items = JSON.parse(jsonStr);

            if (Array.isArray(items)) {
                console.log(`📦 Found ${items.length} items for ${d.name}. Syncing...`);

                for (const item of items) {
                    const { error: invError } = await supabase
                        .from('dispensary_inventory')
                        .upsert({
                            dispensary_id: d.id,
                            strain_id: item.strain_name, // Using name as ID for now or lookup ID
                            price_eighth: item.price_eighth,
                            product_type: 'flower',
                            in_stock: true,
                            last_updated: new Date().toISOString()
                        }, { onConflict: 'dispensary_id,strain_id' });

                    if (invError) console.warn(`   ⚠️ Failed to sync ${item.strain_name}: ${invError.message}`);
                }
                console.log(`✅ Success: ${d.name} synced.`);
            }

        } catch (e) {
            console.error(`❌ Failed to harvest ${d.name}:`, e.message);
        }

        await new Promise(r => setTimeout(r, 3000));
    }

    console.log("🏁 Harvest batch complete.");
}

harvestMenus();
