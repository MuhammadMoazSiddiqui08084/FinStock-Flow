import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Brain, Coffee, CreditCard, TrendingDown, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { api } from "../services/api";

// Map risk/impact to colors
const getImpactColor = (risk: string) => {
  switch (risk.toLowerCase()) {
    case 'high': return "from-[#EF4444] to-[#DC2626]";
    case 'medium': return "from-[#F59E0B] to-[#D97706]";
    case 'low': return "from-[#0066FF] to-[#0052CC]";
    default: return "from-[#0066FF] to-[#0052CC]";
  }
};

const getIcon = (title: string) => {
  if (title.toLowerCase().includes('food') || title.toLowerCase().includes('dining')) return Coffee;
  if (title.toLowerCase().includes('subscription') || title.toLowerCase().includes('bill')) return CreditCard;
  return TrendingDown;
};

export function AIRecommendations() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      console.log("Fetching AI recommendations...");
      try {
        // Get forecast and categories first
        const [forecastRes, categoriesRes] = await Promise.all([
          api.getForecast(),
          api.getCategories()
        ]);

        if (forecastRes.data && categoriesRes.data) {
          // Transform categories format
          const categories = categoriesRes.data.map((cat: any) => ({
            name: cat.category || "Other",
            amount: Math.abs(cat.total || 0)
          }));

          // Get actions from backend
          const actionsRes = await api.getActions(forecastRes.data, categories);
          if (actionsRes.data?.actions) {
            setRecommendations(actionsRes.data.actions);
          } else {
            console.warn("Received empty actions from AI");
          }
        } else {
          console.warn("Failed to load forecast or categories");
        }
      } catch (error) {
        console.error("Failed to fetch AI recommendations", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] p-8 shadow-2xl shadow-[#0F172A]/40 border border-white/5 overflow-hidden relative min-h-[400px]"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#0066FF]/10 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#00C9A7]/10 to-transparent rounded-full blur-3xl"></div>

      <div className="relative">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-[#0066FF] to-[#00C9A7] p-3 shadow-lg shadow-[#0066FF]/20">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-white mb-0.5">Smart Actions From AI</h2>
              <p className="text-[#94A3B8]">Personalized recommendations for you</p>
            </div>
          </div>

          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#0066FF]/20 to-[#00C9A7]/20 border border-[#0066FF]/30"
          >
            <Sparkles className="w-4 h-4 text-[#00C9A7]" />
            <span className="text-[#00C9A7]">AI Active</span>
          </motion.div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-8 h-8 text-[#00C9A7] animate-spin" />
            <p className="text-[#94A3B8]">Analyzing your finances...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec, index) => {
              const Icon = getIcon(rec.title);
              const impactColor = getImpactColor(rec.risk);

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
                  whileHover={{ x: 4, scale: 1.01 }}
                  className="group rounded-2xl bg-white/5 backdrop-blur-xl p-6 transition-all hover:bg-white/10 cursor-pointer border border-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-[#0066FF]/10"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="rounded-xl p-3 shrink-0 shadow-lg bg-white/5"
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-white group-hover:text-[#00C9A7] transition-colors font-medium">{rec.title}</h3>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-3 py-1 rounded-full bg-gradient-to-r ${impactColor} text-white text-xs font-bold shadow-lg`}>
                            +{rec.buffer_gain_days} DAYS
                          </span>
                        </div>
                      </div>
                      <p className="text-[#CBD5E1] mb-3 text-sm leading-relaxed">
                        {rec.explanation}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[#94A3B8] text-xs bg-white/5 px-2 py-1 rounded border border-white/10">
                          {rec.change?.pct
                            ? `${rec.change.category || 'Category'}: -${rec.change.pct}%`
                            : rec.change?.amount
                              ? `${rec.change.category || 'Category'}: -$${rec.change.amount}`
                              : rec.change?.category || 'Adjustment'}
                        </span>
                        <motion.div
                          className="text-[#00C9A7] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                          whileHover={{ x: 4 }}
                        >
                          <span>Apply</span>
                          <ArrowRight className="w-3 h-3" />
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="mt-6 rounded-2xl bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm p-5 border border-white/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shadow-lg shadow-[#10B981]/50"></div>
                <p className="text-[#CBD5E1] text-sm">
                  Potential runway extension: <span className="text-white font-semibold">
                    {recommendations.reduce((acc, curr) => acc + (curr.buffer_gain_days || 0), 0)} days
                  </span>
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={async () => {
                  if (recommendations.length === 0) return;
                  try {
                    await api.applyActions(recommendations);
                    alert("All actions have been simulated! Check your forecast to see the impact.");
                  } catch (error) {
                    console.error("Failed to apply actions:", error);
                    alert("Failed to apply actions. Please try again.");
                  }
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#00C9A7] text-white text-sm font-medium hover:shadow-lg hover:shadow-[#0066FF]/30 transition-all cursor-pointer"
              >
                Apply All
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
