import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { User, Map, BookOpen, Sparkles, Settings, PlusCircle, Book, Users, Shield } from 'lucide-react';
import Logo from './Logo';

const Layout = ({ children, activeTab, onTabChange, user, onLoginClick, onSettingsClick, onOpenTerms }) => {
    const { t } = useTranslation();
    const [isNavVisible, setIsNavVisible] = React.useState(true);
    const [lastScrollY, setLastScrollY] = React.useState(0);

    React.useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Show nav if scrolling up or at the very top
            if (currentScrollY < lastScrollY || currentScrollY < 50) {
                setIsNavVisible(true);
            }
            // Hide nav if scrolling down and not at the top
            else if (currentScrollY > lastScrollY && currentScrollY > 50) {
                setIsNavVisible(false);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const navItems = [
        { id: 'consult', label: t('tabs.consultant'), icon: User },
        { id: 'strains', label: t('tabs.library'), icon: BookOpen },
        { id: 'community', label: 'Community', icon: Users },
        { id: 'journal', label: 'My Journal', icon: Book },
        { id: 'dispensaries', label: t('tabs.dispensaries'), icon: Map },
        { id: 'contribute', label: 'Contribute', icon: PlusCircle },
    ];

    if (user?.account_type === 'admin') {
        navItems.push({ id: 'admin', label: 'Admin', icon: Shield });
    }

    return (
        <div className="relative min-h-screen flex flex-col selection:bg-emerald-500/30">
            {/* Premium Header */}
            <header className="sticky top-0 z-50 glass-nav">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4 group cursor-pointer" onClick={() => onTabChange && onTabChange('consult')}>
                        <Logo className="w-12 h-12 transition-transform group-hover:rotate-12 duration-500" withText={false} />
                        <span className="hidden md:block text-2xl font-black tracking-tighter premium-gradient-text uppercase">
                            StrainWise
                        </span>
                    </div>

                    <nav className="hidden lg:flex items-center gap-1 bg-white/5 p-1.5 rounded-full border border-white/5 backdrop-blur-sm shadow-inner">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onTabChange && onTabChange(item.id)}
                                    className={`relative px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 overflow-hidden group ${isActive
                                        ? 'text-slate-950'
                                        : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                                            transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                                        />
                                    )}
                                    <Icon className={`relative z-10 w-4 h-4 ${isActive ? 'scale-110' : 'group-hover:scale-110 transition-transform'}`} />
                                    <span className="relative z-10">{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <button
                                onClick={() => onTabChange && onTabChange('profile')}
                                className="flex items-center gap-3 px-4 py-2 bg-slate-900/80 border border-white/10 rounded-full hover:bg-slate-800 transition-all hover:border-emerald-500/30 group"
                            >
                                <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20 shadow-lg bg-slate-800 flex items-center justify-center">
                                    {user.avatar_url ? (
                                        <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 text-xs font-black">
                                            {user.email[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs font-bold text-slate-300 hidden sm:block group-hover:text-white">
                                    {user.username || user.email.split('@')[0]}
                                </span>
                            </button>
                        ) : (
                            <button
                                onClick={onLoginClick}
                                className="premium-button text-sm !px-6 !py-2.5"
                            >
                                Sign In
                            </button>
                        )}
                        <button
                            onClick={onSettingsClick}
                            className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 relative z-10 pb-24 lg:pb-0">
                <div className="max-w-7xl mx-auto p-4 md:p-8">
                    {children}
                </div>

                {/* Refined Footer */}
                <footer className="w-full py-12 mt-20 bg-slate-950/80 border-t border-white/5 backdrop-blur-xl">
                    <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 items-center gap-8">
                        <div className="text-sm font-medium text-slate-500 text-center md:text-left">
                            &copy; 2025 <span className="text-emerald-500 font-bold">StrainWise</span>. All rights reserved.
                        </div>
                        <div className="flex justify-center gap-12 text-sm">
                            <button onClick={onOpenTerms} className="text-slate-400 hover:text-emerald-400 transition-colors">
                                Terms & Conditions
                            </button>
                            <button className="text-slate-400 hover:text-emerald-400 transition-colors">
                                Privacy Policy
                            </button>
                        </div>
                        <div className="flex justify-center md:justify-end gap-4 text-slate-600">
                            {/* Social links placeholder */}
                            <span className="text-xs uppercase tracking-widest font-black opacity-20">Premium Edition</span>
                        </div>
                    </div>
                </footer>
            </main>

            {/* Mobile Bottom Navigation - Glassmorphic Floating */}
            <div
                className={`lg:hidden fixed left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md transition-all duration-300 ease-in-out ${isNavVisible ? 'bottom-6 opacity-100' : '-bottom-32 opacity-0'}`}
                style={{ willChange: 'transform, opacity' }}
            >
                <nav className="glass-card rounded-[2.5rem] px-8 py-4 flex justify-between items-center shadow-2xl border-white/20 backdrop-blur-xl bg-slate-900/80">
                    {navItems.slice(0, 5).map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onTabChange && onTabChange(item.id)}
                                className={`relative flex flex-col items-center gap-1 transition-all ${isActive ? 'text-emerald-400 scale-110' : 'text-slate-500 active:scale-90 hover:text-slate-300'
                                    }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="mobileActiveTab"
                                        className="absolute -top-1 w-1 h-1 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"
                                    />
                                )}
                                <Icon className={`w-7 h-7 ${isActive ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : ''}`} />
                            </button>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
};

export default Layout;

