import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { supabase } from "./src/lib/supabase.js";

const server = new Server(
    {
        name: "strainwise-inventory-server",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_nearby_stock",
                description: "Search for specific strain availability in nearby dispensaries.",
                inputSchema: {
                    type: "object",
                    properties: {
                        strainName: { type: "string", description: "Name of the strain" },
                        location: { type: "string", description: "City or Zip code" },
                        radius: { type: "number", description: "Search radius in miles", default: 25 },
                    },
                    required: ["strainName", "location"],
                },
            },
            {
                name: "get_dispensary_deal",
                description: "Find the best price for a strain in a specific city.",
                inputSchema: {
                    type: "object",
                    properties: {
                        strainName: { type: "string" },
                        city: { type: "string" },
                    },
                    required: ["strainName", "city"],
                },
            },
            {
                name: "check_availability",
                description: "Get real-time stock details for a specific dispensary.",
                inputSchema: {
                    type: "object",
                    properties: {
                        dispensaryId: { type: "string" },
                    },
                    required: ["dispensaryId"],
                },
            },
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case "get_nearby_stock": {
                const { strainName, location } = args;

                // 1. Find dispensaries in the location
                const { data: shops, error: shopErr } = await supabase
                    .from("dispensaries")
                    .select("id, name, address, rating")
                    .ilike("city", `%${location}%`);

                if (shopErr || !shops.length) {
                    return {
                        content: [{ type: "text", text: `No dispensaries found in ${location}.` }],
                    };
                }

                // 2. Cross-reference with inventory
                const shopIds = shops.map(s => s.id);
                const { data: inventory, error: invErr } = await supabase
                    .from("dispensary_inventory")
                    .select("dispensary_id, price_eighth, price_metric, in_stock")
                    .in("dispensary_id", shopIds)
                    .ilike("strain_id", `%${strainName}%`)
                    .eq("in_stock", true);

                if (invErr || !inventory.length) {
                    return {
                        content: [{ type: "text", text: `Strain "${strainName}" is currently out of stock in ${location}.` }],
                    };
                }

                // 3. Combine
                const results = inventory.map(item => {
                    const shop = shops.find(s => s.id === item.dispensary_id);
                    return {
                        dispensary: shop.name,
                        address: shop.address,
                        rating: shop.rating,
                        price_eighth: item.price_eighth,
                        price_gram: item.price_metric
                    };
                });

                return {
                    content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
                };
            }

            case "get_dispensary_deal": {
                const { strainName, city } = args;

                // Similar logic but sorting by price
                const { data: deals, error } = await supabase
                    .from("dispensary_inventory")
                    .select(`
                        price_eighth,
                        dispensaries ( name, city )
                    `)
                    .ilike("strain_id", `%${strainName}%`)
                    .eq("in_stock", true)
                    .filter("dispensaries.city", "ilike", `%${city}%`)
                    .order("price_eighth", { ascending: true })
                    .limit(3);

                if (error || !deals.length) {
                    return { content: [{ type: "text", text: `No deals found for ${strainName} in ${city}.` }] };
                }

                return {
                    content: [{ type: "text", text: JSON.stringify(deals, null, 2) }],
                };
            }

            case "check_availability": {
                const { dispensaryId } = args;
                const { data, error } = await supabase
                    .from("dispensary_inventory")
                    .select("strain_id, price_eighth, in_stock")
                    .eq("dispensary_id", dispensaryId)
                    .limit(10);

                if (error) throw error;
                return {
                    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                };
            }

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        return {
            content: [{ type: "text", text: `Inventory Error: ${error.message}` }],
            isError: true,
        };
    }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("📦 StrainWise Inventory MCP Server running on stdio");
