import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Shield, Calendar, ArrowUpRight } from "lucide-react";
import { api } from "../services/api";

export function CashflowForecast() {
  const [forecast, setForecast] = useState<{ dates: string[]; balances: number[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsState, setStatsState] = useState({
    projectedBalance: "$0",
    riskLevel: "Unknown",
    daysUntilZero: "N/A",
  });

  useEffect(() => {
    async function loadForecast() {
      try {
        const response = await api.getForecast();
        if (response.data) {
          setForecast(response.data);

          // Calculate stats
          const balances = response.data.balances || [];
          const lastBalance = balances[balances.length - 1] || 0;
          const firstNegativeIndex = balances.findIndex((b: number) => b < 0);
          const daysUntilZero = firstNegativeIndex >= 0 ? firstNegativeIndex + 1 : balances.length;

          setStatsState({
            projectedBalance: `$${Math.abs(lastBalance).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
            riskLevel: firstNegativeIndex >= 0 ? (daysUntilZero < 7 ? "High" : daysUntilZero < 14 ? "Medium" : "Low") : "Low",
            daysUntilZero: firstNegativeIndex >= 0 ? String(daysUntilZero) : "45+",
          });
        }
      } catch (error) {
        console.error("Failed to load forecast", error);
      } finally {
        setLoading(false);
      }
    }
    loadForecast();
  }, []);

  // Transform forecast data for chart
  const chartData = forecast ? forecast.dates.map((date, index) => ({
    day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
    balance: index < forecast.balances.length ? forecast.balances[index] : null,
    predicted: forecast.balances[index] || null,
  })) : [];

  const statsConfig = [
    {
      label: "Projected Balance",
      value: statsState.projectedBalance,
      change: "+$0",
      icon: TrendingUp,
      gradient: "from-[#10B981] to-[#00C9A7]",
      bgGradient: "from-[#10B981]/10 to-[#00C9A7]/10",
      iconBg: "bg-[#10B981]/10",
      textColor: "text-[#10B981]"
    },
    {
      label: "Risk Level",
      value: statsState.riskLevel,
      change: "Stable",
      icon: Shield,
      gradient: "from-[#0066FF] to-[#3B82F6]",
      bgGradient: "from-[#0066FF]/10 to-[#3B82F6]/10",
      iconBg: "bg-[#0066FF]/10",
      textColor: "text-[#0066FF]"
    },
    {
      label: "Days Until Zero",
      value: statsState.daysUntilZero,
      change: "Excellent",
      icon: Calendar,
      gradient: "from-[#6366F1] to-[#8B5CF6]",
      bgGradient: "from-[#6366F1]/10 to-[#8B5CF6]/10",
      iconBg: "bg-[#6366F1]/10",
      textColor: "text-[#6366F1]"
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="rounded-3xl bg-white border border-[#E2E8F0] p-8 shadow-lg shadow-[#0F172A]/5"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-[#0F172A] mb-1">Cashflow Forecast</h2>
          <p className="text-[#64748B]">14-day prediction based on your spending patterns</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 rounded-xl bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] transition-colors"
        >
          Export Data
        </motion.button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-[#64748B]">Loading forecast...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 mb-8 md:grid-cols-3">
            {statsConfig.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                whileHover={{ y: -4 }}
                className={`rounded-2xl bg-gradient-to-br ${stat.bgGradient} p-6 border border-white/20 transition-all cursor-pointer`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`rounded-xl ${stat.iconBg} p-3`}>
                    <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
                  </div>
                  <div className="flex items-center gap-1 text-[#10B981]">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>{stat.change}</span>
                  </div>
                </div>
                <p className="text-[#64748B] mb-2">{stat.label}</p>
                <p className={`${stat.textColor}`}>{stat.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="h-80 bg-gradient-to-br from-[#F8FAFC] to-white rounded-2xl p-6 border border-[#E2E8F0]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0066FF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0066FF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00C9A7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00C9A7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="#94A3B8"
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    axisLine={{ stroke: '#E2E8F0' }}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: number) => [`$${value}`, '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#0066FF"
                    strokeWidth={3}
                    fill="url(#colorBalance)"
                    dot={{ fill: '#0066FF', r: 5, strokeWidth: 2, stroke: 'white' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="predicted"
                    stroke="#00C9A7"
                    strokeWidth={3}
                    strokeDasharray="8 4"
                    fill="url(#colorPredicted)"
                    dot={{ fill: '#00C9A7', r: 4, strokeWidth: 2, stroke: 'white' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-[#64748B]">No forecast data available</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-center gap-8">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#0066FF] shadow-sm"></div>
              <span className="text-[#64748B]">Actual Balance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#00C9A7] shadow-sm"></div>
              <span className="text-[#64748B]">AI Prediction</span>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
