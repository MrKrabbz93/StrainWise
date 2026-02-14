import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function testMCP() {
    console.log("🧪 Starting MCP Verification...");

    const transport = new StdioClientTransport({
        command: "node",
        args: ["mcp_server.mjs"],
    });

    const client = new Client({
        name: "test-client",
        version: "1.0.0",
    }, {
        capabilities: {}
    });

    await client.connect(transport);
    console.log("✅ Connected to MCP Server.");

    // 1. List Tools
    const tools = await client.listTools();
    console.log("🛠️ Available Tools:", tools.tools.map(t => t.name));

    // 2. Test search_strains
    console.log("\n🔍 Testing 'search_strains'...");
    const searchResult = await client.callTool({
        name: "search_strains",
        arguments: { query: "Kush", limit: 3 }
    });
    console.log("Result:", searchResult.content[0].text.substring(0, 100) + "...");

    // 3. Test audit_encyclopedia
    console.log("\n📋 Testing 'audit_encyclopedia'...");
    const auditResult = await client.callTool({
        name: "audit_encyclopedia",
        arguments: { priorityOnly: true }
    });
    console.log("Result:", auditResult.content[0].text);

    await client.close();
    console.log("\n🏁 Verification Complete.");
}

testMCP().catch(console.error);
