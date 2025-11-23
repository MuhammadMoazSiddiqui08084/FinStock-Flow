import { motion, AnimatePresence } from "motion/react";
import { X, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { api } from "../services/api";

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const categories = [
  "Food & Dining",
  "Transport",
  "Shopping",
  "Subscriptions",
  "Utilities",
  "Housing",
  "Entertainment",
  "Health",
  "Education",
  "Bills & Fees",
  "Other",
];

export function TransactionForm({ isOpen, onClose, onSuccess }: TransactionFormProps) {
  const [type, setType] = useState<"expense" | "revenue">("expense");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food & Dining");
  const [description, setDescription] = useState("");
  const [merchant, setMerchant] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);

    try {
      const response = await api.addTransaction(
        date,
        parseFloat(amount),
        category,
        type,
        description || undefined,
        merchant || undefined
      );

      if (response.error) {
        setError(response.error);
      } else {
        // Reset form
        setAmount("");
        setDescription("");
        setMerchant("");
        setCategory("Food & Dining");
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Failed to add transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Transaction</h2>
                <p className="text-gray-600">Record an expense or revenue</p>
              </div>

              <div className="mb-6 flex gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setType("expense")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all ${
                    type === "expense"
                      ? "bg-white text-red-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <TrendingDown className="w-4 h-4" />
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType("revenue")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all ${
                    type === "revenue"
                      ? "bg-white text-green-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Revenue
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder="What was this for?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Merchant (optional)
                  </label>
                  <input
                    type="text"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder="Store or company name"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#00C9A7] text-white font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  {loading ? "Adding..." : "Add Transaction"}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

