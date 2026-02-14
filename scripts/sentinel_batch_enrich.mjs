import "dotenv/config";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function runSentinelEnrichment() {
    console.log("🚀 Sentinel: Starting Batch Enrichment...");

    const transport = new StdioClientTransport({
        command: "node",
        args: ["mcp_server.mjs"],
    });

    const client = new Client(
        { name: "sentinel-enrichment-client", version: "1.0.0" },
        { capabilities: {} }
    );

    await client.connect(transport);
    console.log("✅ Sentinel: Connected to Discovery MCP.");

    try {
        // 1. Audit missing data
        console.log("📋 Auditing Encyclopedia for missing data...");
        const auditResult = await client.callTool({
            name: "audit_encyclopedia",
            arguments: { priorityOnly: true }
        });

        const missingStrains = auditResult.content[0].text ? JSON.parse(auditResult.content[0].text) : auditResult;

        if (!Array.isArray(missingStrains) || missingStrains.length === 0) {
            console.log("✨ All strains are currently well-documented. Nothing to enrich.");
            return;
        }

        console.log(`🔍 Found ${missingStrains.length} strains requiring attention.`);

        // 2. Enrich Top 5 (Safety limit for first run)
        const batchSize = 5;
        const batch = missingStrains.slice(0, batchSize);

        for (const strain of batch) {
            console.log(`\n📡 Enriching: ${strain.name}...`);
            const enrichResult = await client.callTool({
                name: "enrich_strain_knowledge",
                arguments: { strainName: strain.name }
            });
            console.log(`Result: ${enrichResult.content[0].text}`);
        }

        console.log("\n✅ Sentinel: Batch enrichment cycle complete.");
    } catch (error) {
        console.error("❌ Sentinel Error:", error);
    } finally {
        // Transport close logic if needed
    }
}

runSentinelEnrichment().catch(console.error);
