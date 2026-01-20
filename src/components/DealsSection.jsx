import React from 'react';
import { Sparkles, Tag, Percent, ExternalLink } from 'lucide-react';
import affiliateDb from '../../marketing/affiliate_database.json';

const DealsSection = () => {
    // Filter and transform database entries for the section
    const deals = affiliateDb
        .filter(entry =>
            entry.category === 'Gear' ||
            entry.category === 'Seeds' ||
            entry.category === 'Hardware' ||
            entry.category === 'Marketplace'
        )
        .slice(0, 12) // Show top 12 deals
        .map(entry => ({
            id: entry.id,
            partner: entry.name,
            title: entry.offer,
            description: entry.details,
            // Prioritize specific active codes, fallback to generic
            code: (entry.active_codes && entry.active_codes[0]) || 'STRAINWISE',
            discount: entry.offer.split(' ')[0] || 'DEAL',
            link: `/api/redirect?partnerId=${entry.id}`,
            color: entry.category === 'Seeds' ? 'emerald' :
                entry.category === 'Hardware' ? 'purple' :
                    entry.category === 'Gear' ? 'blue' : 'amber',
            icon: entry.category === 'Seeds' ? <Sparkles className="w-5 h-5 text-emerald-400" /> :
                entry.category === 'Hardware' ? <Tag className="w-5 h-5 text-purple-400" /> :
                    <Percent className="w-5 h-5 text-blue-400" />
        }));

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <Percent className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-white">Member Exclusive Deals</h3>
                    <p className="text-slate-400 text-sm">Curated offers from our trusted partners.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deals.map((deal) => (
                    <div
                        key={deal.id}
                        className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-emerald-500/30 transition-all group relative flex flex-col"
                    >
                        {/* Discount Badge */}
                        <div className="absolute top-0 right-0 bg-gradient-to-bl from-amber-500 to-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-bl-xl shadow-lg z-10">
                            {deal.discount}
                        </div>

                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-lg bg-${deal.color}-500/10 border border-${deal.color}-500/20`}>
                                    {deal.icon}
                                </div>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{deal.partner}</span>
                            </div>

                            <h4 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                                {deal.title}
                            </h4>
                            <p className="text-sm text-slate-400 mb-6 flex-1">
                                {deal.description}
                            </p>

                            <div className="mt-auto">
                                <div className="bg-slate-950 rounded-lg p-3 flex items-center justify-between mb-3 border border-white/5">
                                    <span className="text-xs text-slate-500 font-mono">CODE:</span>
                                    <span className="font-mono text-emerald-400 font-bold tracking-widest">{deal.code}</span>
                                </div>

                                <a
                                    href={deal.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-slate-950 font-bold rounded-lg hover:bg-emerald-400 transition-colors"
                                >
                                    Shop Now <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 p-4 bg-slate-800/50 rounded-xl border border-white/5 text-center">
                <p className="text-sm text-slate-400">
                    Offers are subject to change by partners. We may earn a commission on qualifying purchases.
                </p>
            </div>
        </div>
    );
};

export default DealsSection;
