import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { api } from "../services/api";
import { categoryIconMap, categoryColorMap, categoryBgMap } from "../utils/categoryIcons";

export function SpendingAnalysis() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpending, setTotalSpending] = useState(0);

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await api.getCategories();
        if (response.data && response.data.length > 0) {
          // Calculate total (all negative amounts are expenses)
          const total = response.data.reduce((sum: number, cat: any) => sum + Math.abs(cat.total || 0), 0);
          setTotalSpending(total);

          // Transform to match component format
          const transformed = response.data.map((cat: any) => {
            const categoryName = cat.category || "Other";
            const amount = Math.abs(cat.total || 0);
            const percentage = total > 0 ? Math.round((amount / total) * 100) : 0;

            return {
              name: categoryName,
              amount: `$${amount.toFixed(2)}`,
              percentage,
              trend: "stable" as const,
              change: 0,
              icon: categoryIconMap[categoryName] || categoryIconMap["Other"],
              color: categoryColorMap[categoryName] || categoryColorMap["Other"],
              bgColor: categoryBgMap[categoryName] || categoryBgMap["Other"],
            };
          }).sort((a, b) => b.percentage - a.percentage); // Sort by percentage descending

          setCategories(transformed);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error("Failed to load categories", error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return TrendingUp;
    if (trend === "down") return TrendingDown;
    return Minus;
  };

  const getTrendColor = (trend: string) => {
    if (trend === "up") return "text-[#EF4444]";
    if (trend === "down") return "text-[#10B981]";
    return "text-[#94A3B8]";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="rounded-3xl bg-white border border-[#E2E8F0] p-8 shadow-lg shadow-[#0F172A]/5"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[#0F172A] mb-1">Spending Analysis</h2>
          <p className="text-[#64748B]">Category breakdown for this month</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-[#64748B]">Loading spending data...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-[#64748B]">No spending data available. Add transactions to see your analysis.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {categories.map((category, index) => {
              const TrendIcon = getTrendIcon(category.trend);
              const trendColor = getTrendColor(category.trend);

              return (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
                  whileHover={{ x: 4, scale: 1.01 }}
                  className={`rounded-2xl bg-gradient-to-r ${category.bgColor} p-5 border border-white/50 transition-all cursor-pointer`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="rounded-xl p-3 shadow-sm"
                        style={{ backgroundColor: `${category.color}15` }}
                      >
                        <category.icon
                          className="h-5 w-5"
                          style={{ color: category.color }}
                        />
                      </div>
                      <div>
                        <p className="text-[#0F172A]">{category.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[#64748B]">{category.amount}</span>
                          {category.change > 0 && (
                            <>
                              <TrendIcon className={`h-3.5 w-3.5 ${trendColor}`} />
                              <span className={`${trendColor} text-sm`}>{category.change}%</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[#0F172A]">{category.percentage}%</p>
                    </div>
                  </div>

                  <div className="relative h-2 bg-white/60 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${category.percentage}%` }}
                      transition={{ duration: 1, delay: 0.4 + index * 0.05, ease: "easeOut" }}
                      className="h-full rounded-full shadow-sm"
                      style={{
                        background: `linear-gradient(90deg, ${category.color}, ${category.color}dd)`
                      }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 p-4 rounded-xl bg-gradient-to-r from-[#F1F5F9] to-[#E2E8F0] border border-[#CBD5E1]"
          >
            <p className="text-[#475569] text-center">
              Total Spending: <span className="text-[#0F172A] font-semibold">${totalSpending.toFixed(2)}</span>
            </p>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
