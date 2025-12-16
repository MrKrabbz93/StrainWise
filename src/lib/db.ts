import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

// Required for Neon serverless driver to work with Prisma
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);

const globalForPrisma = global;

export const prisma = globalForPrisma.prisma || new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

prisma.$on('query', (e) => {
    if (process.env.NODE_ENV === 'development') {
        // Basic query logging
        // console.log('Query: ' + e.query);
        // console.log('Duration: ' + e.duration + 'ms');
    }
});

// Graceful shutdown handling
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
