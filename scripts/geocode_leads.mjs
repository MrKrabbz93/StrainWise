import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { callGemini } from '../src/lib/gemini.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function geocodeLeads() {
    console.log("📍 Starting Lead Geocoding...");

    // 1. Fetch leads without coordinates
    const { data: leads, error: fetchError } = await supabase
        .from('dispensaries')
        .select('id, name, address, city, country')
        .or('latitude.is.null,longitude.is.null')
        .limit(20); // Process in batches

    if (fetchError) {
        console.error("Error fetching leads:", fetchError.message);
        return;
    }

    if (!leads || leads.length === 0) {
        console.log("✅ All leads are already geocoded.");
        return;
    }

    console.log(`📡 Processing ${leads.length} leads...`);

    for (const lead of leads) {
        const fullAddress = `${lead.name}, ${lead.address}, ${lead.city}, ${lead.country}`;
        console.log(`🔍 Geocoding: ${lead.name}...`);

        try {
            const prompt = `Find the exact GPS coordinates (Latitude and Longitude) for this location: "${fullAddress}".
            
            Return ONLY a JSON object with keys "lat" and "lng" as numbers.
            Example: {"lat": -31.9505, "lng": 115.8605}`;

            const response = await callGemini({
                type: 'generate',
                prompt,
                tools: [{ googleSearch: {} }] // Use search for accuracy
            });

            if (!response) throw new Error("No response from AI");

            const jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
            const coords = JSON.parse(jsonStr);

            if (coords.lat && coords.lng) {
                const { error: updateError } = await supabase
                    .from('dispensaries')
                    .update({
                        latitude: coords.lat,
                        longitude: coords.lng
                    })
                    .eq('id', lead.id);

                if (updateError) throw updateError;
                console.log(`✅ Success: ${lead.name} -> [${coords.lat}, ${coords.lng}]`);
            } else {
                throw new Error("Invalid coordinate format received");
            }

        } catch (e) {
            console.error(`❌ Failed to geocode ${lead.name}:`, e.message);
        }

        // Rate limit protection
        await new Promise(r => setTimeout(r, 2000));
    }

    console.log("🏁 Batch processing complete.");
}

geocodeLeads();
