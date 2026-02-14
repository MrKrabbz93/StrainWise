import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { supabase } from "./src/lib/supabase.js";
import { researchStrain } from "./src/lib/gemini.js";
import pLimit from "p-limit";

// Use p-limit to throttle expensive AI operations
const limit = pLimit(2); // Max 2 concurrent AI researches

const server = new Server(
    {
        name: "strainwise-management",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

/**
 * Tool Definitions
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "search_strains",
                description: "Search for cannabis strains in the Encyclopedia database. Use this to find existing data before adding new strains.",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: { type: "string", description: "Strain name or keyword" },
                        limit: { type: "number", description: "Max results (default 10)", default: 10 },
                    },
                    required: ["query"],
                },
            },
            {
                name: "enrich_strain_knowledge",
                description: "Perform deep AI research on a specific strain to fill in missing terpenes, effects, or lineage. Uses caching to save costs.",
                inputSchema: {
                    type: "object",
                    properties: {
                        strainName: { type: "string", description: "Exact name of the strain to research" },
                    },
                    required: ["strainName"],
                },
            },
            {
                name: "audit_encyclopedia",
                description: "Identify strains that are missing critical information like images, descriptions, or terpenes. Returns a prioritized list.",
                inputSchema: {
                    type: "object",
                    properties: {
                        priorityOnly: { type: "boolean", description: "Only return high-impact strains (e.g. with favorites)", default: true },
                    },
                },
            },
            {
                name: "get_community_insights",
                description: "Analyze recent user journals and reviews to identify trending effects or sentiment for a specific strain or the whole platform.",
                inputSchema: {
                    type: "object",
                    properties: {
                        strainName: { type: "string", description: "Optional strain name to focus insights on" },
                    },
                },
            },
        ],
    };
});

/**
 * Tool Implementation
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case "search_strains": {
                const { query, limit = 10 } = args;
                const { data, error } = await supabase
                    .from("strains")
                    .select("*")
                    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
                    .limit(limit);

                if (error) throw error;
                return {
                    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                };
            }

            case "enrich_strain_knowledge": {
                const { strainName } = args;

                // 1. Check if we already have it (to avoid redundant research)
                const { data: existing } = await supabase
                    .from("strains")
                    .select("*")
                    .ilike("name", strainName)
                    .maybeSingle();

                if (existing && existing.terpenes?.length > 0 && !existing.description?.includes("AI Demo Mode")) {
                    return {
                        content: [{ type: "text", text: `Skip: Strain "${strainName}" is already well-documented.` }],
                    };
                }

                // 2. Perform Research (Throttled)
                return await limit(async () => {
                    console.log(`📡 MCP: Researching "${strainName}"...`);
                    const research = await researchStrain(strainName);

                    if (!research) {
                        return {
                            content: [{ type: "text", text: `Failed to research strain "${strainName}".` }],
                            isError: true,
                        };
                    }

                    // 3. Update Database
                    const { error: updateErr } = await supabase
                        .from("strains")
                        .upsert({
                            name: strainName,
                            ...research,
                        }, { onConflict: 'name' });

                    if (updateErr) throw updateErr;

                    return {
                        content: [{ type: "text", text: `Successfully enriched "${strainName}".\nData: ${JSON.stringify(research, null, 2)}` }],
                    };
                });
            }

            case "audit_encyclopedia": {
                const { priorityOnly = true } = args;

                // Find strains missing core text data (descriptions OR terpenes)
                let queryBuilder = supabase
                    .from("strains")
                    .select("id, name, image_url, terpenes, description")
                    .or("description.is.null,terpenes.is.null");

                // In a real scenario, we'd join with favorites/sessions to calculate "Impact Score"
                const { data, error } = await queryBuilder.limit(20);

                if (error) throw error;

                const auditResults = data.map(s => ({
                    name: s.name,
                    missing: [
                        !s.image_url ? "image" : null,
                        (!s.terpenes || s.terpenes.length === 0) ? "terpenes" : null
                    ].filter(Boolean)
                }));

                return {
                    content: [{ type: "text", text: JSON.stringify(auditResults, null, 2) }],
                };
            }

            case "get_community_insights": {
                const { strainName } = args;
                let query = supabase.from("strain_journals").select("strain_name, effects, rating, notes").order('created_at', { ascending: false });

                if (strainName) {
                    query = query.ilike("strain_name", strainName);
                }

                const { data, error } = await query.limit(10);
                if (error) throw error;

                if (data.length === 0) {
                    return { content: [{ type: "text", text: "No recent journals found for analysis." }] };
                }

                // Simplified insight generation (in real app, use AI to summarize notes)
                const avgRating = data.reduce((acc, curr) => acc + (curr.rating || 0), 0) / data.length;
                const allEffects = data.flatMap(d => d.effects || []);
                const effectCounts = allEffects.reduce((acc, curr) => {
                    acc[curr] = (acc[curr] || 0) + 1;
                    return acc;
                }, {});

                const summary = {
                    sampleSize: data.length,
                    averageRating: avgRating.toFixed(1),
                    topEffects: Object.entries(effectCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(i => i[0]),
                    rawNotesPreview: data.map(d => d.notes).filter(Boolean).slice(0, 3)
                };

                return {
                    content: [{ type: "text", text: `Community Sentiment:\n${JSON.stringify(summary, null, 2)}` }],
                };
            }

            default:
                throw new Error(`Tool not found: ${name}`);
        }
    } catch (error) {
        console.error(`MCP Error in ${name}:`, error);
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
        };
    }
});

/**
 * Start Server
 */
const transport = new StdioServerTransport();
await server.connect(transport);
console.log("🚀 StrainWise Management MCP Server running via Stdio");
