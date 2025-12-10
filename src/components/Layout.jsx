import React from 'react';
import { useTranslation } from 'react-i18next';
import { User, Map, BookOpen, Sparkles, Settings, PlusCircle } from 'lucide-react';
import Background from './Background';

const Layout = ({ children, activeTab, onTabChange, user, onLoginClick, onSettingsClick, onOpenTerms }) => {
    const { t } = useTranslation();

    const navItems = [
        { id: 'consult', label: t('tabs.consultant'), icon: User },
        { id: 'strains', label: t('tabs.library'), icon: BookOpen },
        { id: 'dispensaries', label: t('tabs.dispensaries'), icon: Map },
        { id: 'contribute', label: 'Contribute', icon: PlusCircle },
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

            <main className="flex-1 relative z-10 pb-20 md:pb-0 flex flex-col">
                <div className="flex-1">
                    {children}
                </div>

                {/* Footer */}
                <footer className="w-full py-8 mt-12 bg-slate-950/50 border-t border-white/5 backdrop-blur-sm">
                    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
                        <div>
                            &copy; 2025 StrainWise. All rights reserved.
                        </div>
                        <div className="flex gap-6">
                            <button onClick={onOpenTerms} className="hover:text-emerald-400 transition-colors">
                                Terms & Conditions
                            </button>
                            <button className="hover:text-emerald-400 transition-colors">
                                Privacy Policy
                            </button>
                        </div>
                    </div>
                </footer>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-xl border-t border-white/10 z-50 px-6 py-4 flex justify-between items-center safe-area-bottom">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange && onTabChange(item.id)}
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <div className={`p-1.5 rounded-full ${isActive ? 'bg-emerald-500/10' : ''}`}>
                                <Icon className={`w-6 h-6 ${isActive ? 'fill-current/20' : ''}`} />
                            </div>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    );
                })}
                {/* Profile Button Mobile */}
                <button
                    onClick={() => onTabChange && onTabChange('profile')}
                    className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-emerald-400' : 'text-slate-500'}`}
                >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${activeTab === 'profile' ? 'border-emerald-500' : 'border-slate-700'
                        } ${!user ? 'bg-slate-800' : 'bg-emerald-500 text-slate-950'}`}>
                        {user ? (
                            <span className="text-xs font-bold">{user.email[0].toUpperCase()}</span>
                        ) : (
                            <User className="w-5 h-5" />
                        )}
                    </div>
                    <span className="text-[10px] font-medium">{user ? 'Profile' : 'Sign In'}</span>
                </button>
            </nav>
        </div>
    );
};

export default Layout;
