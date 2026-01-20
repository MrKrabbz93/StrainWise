#!/usr/bin/env node

/**
 * STRAINWISE MASTER STARTER BLUEPRINT
 * Use this to kickstart any "Premium Modern" App Idea.
 * Stack: Vite, React, Tailwind 4.0, Zustand, Supabase, Framer Motion, Lucide.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const projectName = process.argv[2] || 'my-premium-app';

console.log(`🚀 Kickstarting your next big idea: ${projectName}...`);

// 1. Initialize Vite
try {
    execSync(`npm create vite@latest ${projectName} -- --template react`, { stdio: 'inherit' });
} catch (error) {
    console.error('Failed to create vite project. Make sure you have npm installed.');
    process.exit(1);
}

const root = path.join(process.cwd(), projectName);
process.chdir(root);

// 2. Install Core Dependencies
console.log('📦 Installing Premium Stack dependencies...');
const deps = [
    'lucide-react',
    'framer-motion',
    'zustand',
    '@supabase/supabase-js',
    '@google/generative-ai',
    'react-router-dom',
    'clsx',
    'tailwind-merge'
];

const devDeps = [
    'tailwindcss',
    '@tailwindcss/postcss',
    'postcss',
    'autoprefixer'
];

execSync(`npm install ${deps.join(' ')}`, { stdio: 'inherit' });
execSync(`npm install -D ${devDeps.join(' ')}`, { stdio: 'inherit' });

// 3. Setup Tailwind 4.0 (Modern Approach)
console.log('🎨 Configuring Premium UI (Tailwind 4.0)...');
const postcssConfig = `export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};`;

const cssContent = `@import "tailwindcss";

@theme {
  --color-brand-primary: #10b981;
  --color-brand-secondary: #06b6d4;
  --color-surface-950: #020617;
  --color-surface-900: #0f172a;
}

@layer base {
  body {
    @apply bg-surface-950 text-slate-200 antialiased;
    font-family: 'Inter', system-ui, sans-serif;
  }
}

@layer components {
  .glass-card {
    @apply bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl;
  }
  
  .premium-gradient {
    @apply bg-gradient-to-br from-brand-primary to-brand-secondary;
  }
  
  .premium-button {
    @apply px-6 py-2.5 rounded-full font-bold transition-all active:scale-95 shadow-lg hover:shadow-brand-primary/20 bg-white text-slate-950 hover:bg-brand-primary hover:text-white flex items-center gap-2;
  }
}
`;

fs.writeFileSync('postcss.config.js', postcssConfig);
fs.writeFileSync('src/index.css', cssContent);

// 4. Create Folder Structure
console.log('📂 Organizing workspace...');
const dirs = [
    'src/lib',
    'src/lib/stores',
    'src/lib/services',
    'src/components',
    'src/pages',
    'src/assets'
];
dirs.forEach(dir => fs.mkdirSync(dir, { recursive: true }));

// 5. Provide Boilerplate Files
console.log('📝 Injecting boilerplate logic...');

// Supabase Client
const supabaseClient = `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
`;
fs.writeFileSync('src/lib/supabase.js', supabaseClient);

// User Store (Zustand)
const userStore = `import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    { name: 'app-user-storage' }
  )
);
`;
fs.writeFileSync('src/lib/stores/user.store.js', userStore);

// Image Utils (The Fix for Profile Images)
const imageUtils = `export const processImage = (file, maxWidth = 200, quality = 0.6) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    };
    reader.onerror = reject;
  });
};
`;
fs.writeFileSync('src/lib/image-utils.js', imageUtils);

// Premium Layout Component
const layoutComponent = `import React from 'react';
import { motion } from 'framer-motion';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-secondary/10 rounded-full blur-[120px]" />
      </div>
      
      <main className="max-w-7xl mx-auto px-6 py-20 relative z-10">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
`;
fs.writeFileSync('src/components/Layout.jsx', layoutComponent);

// 6. Update App.jsx with Demo
const appDemo = `import React from 'react';
import Layout from './components/Layout';
import { Sparkles, ArrowRight } from 'lucide-react';

function App() {
  return (
    <Layout>
      <div className="text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold uppercase tracking-widest">
          <Sparkles className="w-3 h-3" /> Starter Pack Active
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white">
          Build Something <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">Legendary.</span>
        </h1>
        
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Welcome to your premium blueprint. Supabase, Zustand, and Tailwind 4.0 are pre-configured and ready for launch.
        </p>

        <div className="flex justify-center gap-4">
          <button className="premium-button">
            Get Started <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default App;
`;
fs.writeFileSync('src/App.jsx', appDemo);

// 7. Cleanup & Finish
console.log('\\n✨ FINISHED! Your premium bridge is ready.');
console.log(\`\\nTo start:
  cd \${projectName}
  npm run dev
\`);
console.log('Remember to set up your .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY!');
