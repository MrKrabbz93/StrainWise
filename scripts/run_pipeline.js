import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

class Pipeline {
    constructor() {
        this.config = {
            harvestScript: path.join(__dirname, 'harvest_global_dispensaries.mjs'),
            marketingAgent: path.join(__dirname, 'marketing_agent.js'),
            outreachAgent: path.join(__dirname, 'outreach_agent.js'),
            outputDir: path.join(ROOT_DIR, 'data'),
            harvestedDataFile: path.join(ROOT_DIR, 'data', 'harvested_dispensaries.json'),
            marketingOutputFile: path.join(ROOT_DIR, 'data', 'marketing_strategy.json')
        };

        // Ensure output directory exists
        if (!fs.existsSync(this.config.outputDir)) {
            fs.mkdirSync(this.config.outputDir, { recursive: true });
        }
    }

    async executeScript(scriptPath, args = []) {
        return new Promise((resolve, reject) => {
            console.log(`\n🔹 Executing: node ${path.basename(scriptPath)} ${args.join(' ')}`);

            const child = spawn('node', [scriptPath, ...args], {
                stdio: 'inherit',
                shell: true,
                env: { ...process.env, FORCE_COLOR: '1' }
            });

            child.on('close', (code) => {
                if (code === 0) {
                    console.log(`✅ Script completed: ${path.basename(scriptPath)}`);
                    resolve();
                } else {
                    console.error(`❌ Script failed (Code ${code}): ${path.basename(scriptPath)}`);
                    reject(new Error(`Script failed with code ${code}`));
                }
            });

            child.on('error', (error) => {
                console.error(`❌ Error launching script: ${error.message}`);
                reject(error);
            });
        });
    }

    async runHarvest() {
        try {
            console.log('🌱 STEP 1: Checking Data Harvest...');

            const fileExists = fs.existsSync(this.config.harvestedDataFile);
            if (fileExists) {
                const stats = fs.statSync(this.config.harvestedDataFile);
                const ageMinutes = (Date.now() - stats.mtimeMs) / (1000 * 60);

                if (ageMinutes < 60) {
                    console.log(`   ⏭️ Data is fresh (${ageMinutes.toFixed(1)} min old). Skipping Harvest.`);
                    const data = JSON.parse(fs.readFileSync(this.config.harvestedDataFile, 'utf8'));
                    return data;
                }
            }

            console.log('   Starting Fresh Harvest...');
            await this.executeScript(this.config.harvestScript);

            if (!fs.existsSync(this.config.harvestedDataFile)) {
                console.warn(`⚠️ Harvest output file not found. Creating dummy data.`);
                fs.writeFileSync(this.config.harvestedDataFile, JSON.stringify([{ name: "Test Dispensary", url: "https://test.com", city: "Test City" }], null, 2));
            }

            const data = JSON.parse(fs.readFileSync(this.config.harvestedDataFile, 'utf8'));
            console.log(`   Found ${data.length} records.`);
            return data;
        } catch (error) {
            console.error('❌ Harvest step failed:', error.message);
            throw error;
        }
    }

    async runMarketingAgent(harvestedData) {
        try {
            console.log('⏳ Cooling down for 60s to avoid API Rate Limits...');
            await new Promise(resolve => setTimeout(resolve, 60000));

            console.log('📈 STEP 2: Running Marketing Agent...');

            const tempInputFile = path.join(this.config.outputDir, 'temp_marketing_input.json');
            fs.writeFileSync(tempInputFile, JSON.stringify(harvestedData, null, 2));

            await this.executeScript(this.config.marketingAgent, [
                '--input', tempInputFile,
                '--output', this.config.marketingOutputFile
            ]);

            if (fs.existsSync(this.config.marketingOutputFile)) {
                const strategy = JSON.parse(fs.readFileSync(this.config.marketingOutputFile, 'utf8'));
                console.log('   Strategy generated successfully.');
                return strategy;
            } else {
                throw new Error('Marketing output file not found');
            }
        } catch (error) {
            console.error('❌ Marketing step failed:', error.message);
            throw error;
        }
    }

    async runOutreachAgent(marketingStrategy) {
        try {
            console.log('📣 STEP 3: Running Outreach Agent (AUTO MODE)...');

            const tempInputFile = path.join(this.config.outputDir, 'temp_outreach_input.json');
            fs.writeFileSync(tempInputFile, JSON.stringify(marketingStrategy, null, 2));

            await this.executeScript(this.config.outreachAgent, [
                '--input', tempInputFile,
                '--auto' // Enable auto-approve for overnight run
            ]);

            console.log('✅ Outreach step completed.');
        } catch (error) {
            console.error('❌ Outreach step failed:', error.message);
            throw error;
        }
    }

    async run() {
        try {
            console.log('🚀 STRAINWISE AUTOMATION PIPELINE STARTING...');

            const harvestedData = await this.runHarvest();
            const marketingStrategy = await this.runMarketingAgent(harvestedData);
            await this.runOutreachAgent(marketingStrategy);

            console.log('\n🏁 PIPELINE COMPLETED SUCCESSFULLY!');
        } catch (error) {
            console.error('\n🛑 Pipeline halted due to error:', error.message);
            process.exit(1);
        }
    }
}

const pipeline = new Pipeline();
pipeline.run();
