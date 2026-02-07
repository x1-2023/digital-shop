'use client';

import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface DashboardChartsProps {
    revenueData: any[];
    orderData: any[];
}

export function DashboardCharts({ revenueData, orderData }: DashboardChartsProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue Chart */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-6 flex items-center">
                    <span className="w-1 h-6 bg-success rounded-full mr-3"></span>
                    Biểu đồ Doanh Thu (7 ngày qua)
                </h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                            <XAxis
                                dataKey="date"
                                stroke="#94A3B8"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#94A3B8"
                                fontSize={12}
                                tickFormatter={(value) => `${value / 1000}k`}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1E293B',
                                    borderColor: '#334155',
                                    color: '#F8FAFC',
                                    borderRadius: '8px',
                                }}
                                itemStyle={{ color: '#10B981' }}
                                formatter={(value: any) => [`${new Intl.NumberFormat('vi-VN').format(value)} đ`, 'Doanh thu']}
                            />
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#10B981"
                                strokeWidth={3}
                                fill="url(#colorRevenue)"
                                dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#1E293B' }}
                                activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2, fill: '#1E293B' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Orders Chart */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-6 flex items-center">
                    <span className="w-1 h-6 bg-brand rounded-full mr-3"></span>
                    Đơn hàng mới (7 ngày qua)
                </h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={orderData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#232634" opacity={0.5} />
                            <XAxis
                                dataKey="date"
                                stroke="#94A3B8"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#94A3B8"
                                fontSize={12}
                                allowDecimals={false}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: '#232634', opacity: 0.2 }}
                                contentStyle={{
                                    backgroundColor: '#13141C',
                                    borderColor: '#232634',
                                    color: '#E6E8EC',
                                    borderRadius: '8px',
                                }}
                                itemStyle={{ color: '#8B5CF6' }}
                            />
                            <Bar
                                dataKey="count"
                                name="Đơn hàng"
                                fill="#8B5CF6"
                                radius={[4, 4, 0, 0]}
                                barSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
