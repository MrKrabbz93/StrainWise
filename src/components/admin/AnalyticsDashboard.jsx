import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { analyticsService } from '../../lib/services/analytics.service';

const AnalyticsDashboard = () => {
    const [data, setData] = useState({ userGrowth: [], topActions: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const metrics = await analyticsService.getDashboardMetrics(30); // Last 30 days
            setData(metrics);
            setLoading(false);
        };
        loadData();
    }, []);

    if (loading) return <div className="text-white text-center p-10 animate-pulse">Loading Analytics...</div>;

    return (
        <div className="p-6 space-y-8">
            <h1 className="text-3xl font-bold text-white mb-6">Analytics Dashboard</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Growth Chart */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xl font-semibold text-gray-200 mb-4">User Growth (30 Days)</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.userGrowth}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="date" stroke="#888" />
                                <YAxis stroke="#888" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="users" stroke="#4ade80" fillOpacity={1} fill="url(#colorUsers)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Actions Chart */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xl font-semibold text-gray-200 mb-4">Top User Actions</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.topActions}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="name" stroke="#888" />
                                <YAxis stroke="#888" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff' }}
                                />
                                <Legend />
                                <Bar dataKey="count" fill="#8884d8" name="Events" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-xl">
                    <h3 className="text-gray-400 text-sm uppercase">Total Events</h3>
                    <p className="text-3xl font-bold text-white mt-2">
                        {data.topActions.reduce((acc, curr) => acc + curr.count, 0)}
                    </p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-xl">
                    <h3 className="text-gray-400 text-sm uppercase">Active Users</h3>
                    <p className="text-3xl font-bold text-white mt-2">
                        {data.userGrowth.length > 0 ? data.userGrowth[data.userGrowth.length - 1].users : 0}
                    </p>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 p-6 rounded-xl">
                    <h3 className="text-gray-400 text-sm uppercase">System Status</h3>
                    <p className="text-3xl font-bold text-green-400 mt-2">Scaleable</p>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
