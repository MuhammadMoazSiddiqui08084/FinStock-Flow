import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, TrendingUp, Percent, RefreshCw } from "lucide-react";
import { api } from "../services/api";

const categories = ["Food & Dining", "Shopping", "Transport"];

export function WhatIfSimulator() {
  const [reductions, setReductions] = useState({
    "Food & Dining": 0,
    "Shopping": 0,
    "Transport": 0,
  });

  const [simulated, setSimulated] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const handleSliderChange = (category: string, value: number) => {
    setReductions((prev) => ({ ...prev, [category]: value }));
    setSimulated(false);
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    setSimulated(false);

    try {
      // Create action from first non-zero reduction
      const activeReductions = Object.entries(reductions).filter(([_, val]) => val > 0);

      if (activeReductions.length === 0) {
        alert("Please set at least one reduction percentage");
        setIsSimulating(false);
        return;
      }

      // Use first active reduction for simulation
      const [category, percentage] = activeReductions[0];

      const action = {
        id: "custom",
        title: `Reduce ${category} by ${percentage}%`,
        change: { category, pct: percentage },
        buffer_gain_days: 0,
        risk: "medium",
        explanation: "Custom simulation",
      };

      const result = await api.simulate(action);

      if (result.error) {
        alert(`Simulation failed: ${result.error}`);
        setIsSimulating(false);
        return;
      }

      if (result.data) {
        setSimulationResult({
          improvement_days: result.data.metrics?.improvement_days || 0,
          brief_explain: result.data.explanation || "Simulation completed successfully",
          newBalance: result.data.after?.balances?.[result.data.after.balances.length - 1] || 0,
        });
        setSimulated(true);
      }
    } catch (error: any) {
      console.error("Simulation failed", error);
      alert(`Simulation failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const totalReduction = Object.values(reductions).reduce((sum, val) => sum + val, 0) / 3;
  const newBalance = simulationResult?.newBalance || 3850 + (totalReduction * 45);
  // Use AI probability if available, else fallback
  const probability = simulationResult?.improvement_days
    ? Math.min(99, 50 + (simulationResult.improvement_days * 5))
    : Math.min(95, 75 + totalReduction);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="rounded-3xl bg-white border border-[#E2E8F0] p-8 shadow-lg shadow-[#0F172A]/5"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] p-3 shadow-lg shadow-[#6366F1]/20">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-[#0F172A] mb-0.5">What-If Simulator</h2>
          <p className="text-[#64748B]">Test spending reduction scenarios</p>
        </div>
      </div>

      <div className="space-y-6 mb-8">
        {categories.map((category, index) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
            className="p-5 rounded-2xl bg-gradient-to-r from-[#F8FAFC] to-white border border-[#E2E8F0]"
          >
            <div className="flex items-center justify-between mb-3">
              <label className="text-[#0F172A]">{category}</label>
              <motion.span
                key={reductions[category as keyof typeof reductions]}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-lg shadow-[#6366F1]/20"
              >
                -{reductions[category as keyof typeof reductions]}%
              </motion.span>
            </div>
            <label htmlFor={`slider-${category}`} className="sr-only">
              {category} reduction percentage
            </label>
            <input
              id={`slider-${category}`}
              type="range"
              min="0"
              max="50"
              value={reductions[category as keyof typeof reductions]}
              onChange={(e) => handleSliderChange(category, parseInt(e.target.value))}
              className="w-full h-2.5 bg-[#E2E8F0] rounded-full appearance-none cursor-pointer transition-all"
              style={{
                background: `linear-gradient(to right, #6366F1 0%, #8B5CF6 ${reductions[category as keyof typeof reductions] * 2}%, #E2E8F0 ${reductions[category as keyof typeof reductions] * 2}%, #E2E8F0 100%)`
              }}
              aria-label={`${category} reduction percentage`}
            />
          </motion.div>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={runSimulation}
        disabled={isSimulating}
        className="w-full rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-8 py-4 text-white transition-all hover:shadow-xl hover:shadow-[#6366F1]/30 flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {isSimulating ? (
          <>
            <RefreshCw className="h-5 w-5 animate-spin" />
            Simulating...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            Run Simulation
          </>
        )}
      </motion.button>

      {simulated && simulationResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6 space-y-4"
        >
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-gradient-to-br from-[#10B981]/10 to-[#00C9A7]/10 p-6 border border-[#10B981]/20"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[#64748B]">New Predicted Balance</p>
              <div className="p-2 rounded-lg bg-[#10B981]/10">
                <TrendingUp className="h-5 w-5 text-[#10B981]" />
              </div>
            </div>
            <p className="text-[#10B981] mb-1">${Math.abs(newBalance).toFixed(0)}</p>
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 bg-white/60 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "75%" }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-[#10B981] to-[#00C9A7]"
                />
              </div>
              <span className="text-[#10B981]">+{simulationResult.improvement_days} Days Runway</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-gradient-to-br from-[#0066FF]/10 to-[#3B82F6]/10 p-6 border border-[#0066FF]/20"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[#64748B]">AI Analysis</p>
              <div className="p-2 rounded-lg bg-[#0066FF]/10">
                <Percent className="h-5 w-5 text-[#0066FF]" />
              </div>
            </div>
            <p className="text-[#0066FF] mb-1 text-lg font-medium leading-tight">
              {simulationResult.brief_explain}
            </p>
            <p className="text-[#64748B] text-sm mt-2">
              {probability >= 90 ? "🎯 Excellent outlook" : probability >= 80 ? "✨ Strong outlook" : "👍 Good outlook"}
            </p>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
