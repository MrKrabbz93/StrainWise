import React from 'react';
import { User, Map, BookOpen, Sparkles, Settings } from 'lucide-react';
import Background from './Background';

const Layout = ({ children, activeTab, onTabChange, user, onLoginClick, onSettingsClick }) => {
    const navItems = [
        { id: 'consult', label: 'Consult', icon: User },
        { id: 'strains', label: 'Strains', icon: BookOpen },
        { id: 'dispensaries', label: 'Dispensaries', icon: Map },
    ];

    return (
        <div className="relative min-h-screen flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                            <Sparkles className="w-5 h-5 text-slate-950" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                            Strain<span className="text-emerald-400">Wise</span>
                        </span>
                    </div>

                    <nav className="hidden md:flex items-center gap-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onTabChange && onTabChange(item.id)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${isActive
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <button
                                onClick={() => onTabChange && onTabChange('profile')}
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-full border border-white/5 hover:bg-slate-800 transition-colors"
                            >
                                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 text-xs font-bold">
                                    {user.email[0].toUpperCase()}
                                </div>
                                <span className="text-xs text-slate-300 hidden sm:block">{user.email.split('@')[0]}</span>
                            </button>
                        ) : (
                            <button
                                onClick={onLoginClick}
                                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                            >
                                Sign In
                            </button>
                        )}
                        <button
                            onClick={onSettingsClick}
                            className="p-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 relative z-10">
                {children}
            </main>
        </div>
    );
};

export default Layout;
