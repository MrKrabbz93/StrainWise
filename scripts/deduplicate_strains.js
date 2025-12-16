
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Environment Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Must use Service Role to DELETE

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials. Ensure .env has VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deduplicateStrains() {
    console.log("🔍 Fetching all strains...");

    // Fetch minimal fields needed for deduplication
    const { data: strains, error } = await supabase
        .from('strains')
        .select('id, name, image_url, visual_profile, created_at');

    if (error) {
        console.error("Error fetching strains:", error);
        return;
    }

    console.log(`📊 Total Strains Found: ${strains.length}`);

    // Group by Name (Case Insensitive)
    const groups = {};
    strains.forEach(strain => {
        const normalizedName = strain.name.trim().toLowerCase();
        if (!groups[normalizedName]) {
            groups[normalizedName] = [];
        }
        groups[normalizedName].push(strain);
    });

    const idsToDelete = [];
    let duplicateGroupsFound = 0;

    for (const [name, group] of Object.entries(groups)) {
        if (group.length > 1) {
            duplicateGroupsFound++;
            console.log(`\nFound ${group.length} duplicates for '${name}':`);

            // Sort to determine winner:
            // 1. Has image_url? (Highest Priority)
            // 2. Has visual_profile?
            // 3. Newest created_at?

            group.sort((a, b) => {
                const aHasImage = !!a.image_url;
                const bHasImage = !!b.image_url;
                if (aHasImage && !bHasImage) return -1; // a comes first (winner)
                if (!aHasImage && bHasImage) return 1;  // b comes first (winner)

                // Tie-break: Visual Profile
                const aHasVisual = !!a.visual_profile;
                const bHasVisual = !!b.visual_profile;
                if (aHasVisual && !bHasVisual) return -1;
                if (!aHasVisual && bHasVisual) return 1;

                // Tie-break: Newest wins (assuming newer data is better/corrected)
                const dateA = new Date(a.created_at).getTime();
                const dateB = new Date(b.created_at).getTime();
                return dateB - dateA; // Descending date
            });

            const winner = group[0];
            const losers = group.slice(1);

            console.log(`   ✅ KEEP: [${winner.id}] Img:${!!winner.image_url ? 'Yes' : 'No'} (${winner.created_at})`);

            losers.forEach(loser => {
                console.log(`   ❌ DELETE: [${loser.id}] Img:${!!loser.image_url ? 'Yes' : 'No'} (${loser.created_at})`);
                idsToDelete.push(loser.id);
            });
        }
    }

    console.log(`\n-----------------------------------`);
    console.log(`Duplicate Groups: ${duplicateGroupsFound}`);
    console.log(`Records to Delete: ${idsToDelete.length}`);

    if (idsToDelete.length === 0) {
        console.log("✅ No duplicates found.");
        return;
    }

    // Batch Delete
    // Supabase URL length limits might apply, so batching 50 at a time is safer
    const BATCH_SIZE = 50;
    for (let i = 0; i < idsToDelete.length; i += BATCH_SIZE) {
        const batch = idsToDelete.slice(i, i + BATCH_SIZE);
        console.log(`\n🗑️ Deleting batch ${i / BATCH_SIZE + 1}... (${batch.length} items)`);

        const { error: deleteError } = await supabase
            .from('strains')
            .delete()
            .in('id', batch);

        if (deleteError) {
            console.error("   ❌ Error deleting batch:", deleteError);
        } else {
            console.log("   ✅ Batch deleted successfully.");
        }
    }

    console.log(`\n✨ Deduplication Complete.`);
}

deduplicateStrains();
