import React, { useState } from "react";
import { Upload, FileCheck, Loader2, AlertTriangle, CheckCircle, FileText, X, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { analyzeCSV } from "../../llmService";
import { TransactionForm } from "./TransactionForm";

export function HeroSection() {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFile = async (file: File) => {
    const isCSV = file.type === "text/csv" || file.name.endsWith('.csv');
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (!isCSV && !isExcel) {
      alert("Please upload a CSV or Excel file (.xlsx, .xls)");
      return;
    }

    setIsAnalyzing(true);

    try {
      const { api } = await import("../services/api");

      if (isCSV) {
        // Upload CSV to backend
        const response = await api.uploadCSV(file);
        if (response.error) {
          alert(`Upload failed: ${response.error}`);
          setIsAnalyzing(false);
          return;
        }

        // Get analysis using LLM
        const reader = new FileReader();
        reader.onload = async (e) => {
          const text = e.target?.result as string;
          try {
            const result = await analyzeCSV(text);
            setAnalysisResult(result);
          } catch (error) {
            console.error("Analysis failed", error);
          } finally {
            setIsAnalyzing(false);
          }
        };
        reader.readAsText(file);
      } else if (isExcel) {
        // Upload Excel to backend (Python service will parse it)
        const response = await api.uploadExcel(file);
        if (response.error) {
          alert(`Upload failed: ${response.error}`);
          setIsAnalyzing(false);
          return;
        }

        // Show success message
        setAnalysisResult({
          summary: `Successfully imported ${response.data?.count || 0} transactions from Excel file. Transactions have been categorized and saved to your account.`,
          flagged_transactions: [],
          advice: "Check your spending analysis to see categorized transactions.",
        });
        setIsAnalyzing(false);

        // Refresh the page to show new data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error: any) {
      console.error("Upload failed", error);
      alert(`Upload failed: ${error.message || "Unknown error"}`);
      setIsAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <>
      <TransactionForm
        isOpen={showTransactionForm}
        onClose={() => setShowTransactionForm(false)}
        onSuccess={() => {
          // Refresh page to show new data
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }}
      />

      <div className="flex justify-end mb-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowTransactionForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#00C9A7] text-white font-medium hover:shadow-lg hover:shadow-[#0066FF]/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center py-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#0066FF]/10 to-[#00C9A7]/10 border border-[#0066FF]/20 mb-6"
        >
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#0066FF] to-[#00C9A7] animate-pulse"></div>
          <span className="text-[#0066FF]">Powered by Advanced AI</span>
        </motion.div>

        <h1 className="bg-gradient-to-r from-[#0F172A] via-[#0066FF] to-[#00C9A7] bg-clip-text text-transparent mb-3">
          Optimize Your Cashflow with AI
        </h1>

        <p className="text-[#64748B] mb-10 max-w-2xl mx-auto text-lg">
          Upload your transaction data and get instant predictions, insights, and personalized recommendations
        </p>

        <AnimatePresence mode="wait">
          {!analysisResult ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`mx-auto max-w-2xl rounded-2xl border-2 border-dashed p-12 transition-all ${isDragging
                ? "border-[#0066FF] bg-[#0066FF]/5 shadow-lg shadow-[#0066FF]/10"
                : "border-[#E2E8F0] bg-white hover:border-[#0066FF]/40 hover:shadow-xl hover:shadow-[#0066FF]/5"
                }`}
            >
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <Loader2 className="h-16 w-16 text-[#0066FF] animate-spin mb-6" />
                  <h3 className="text-[#0F172A] text-xl font-medium mb-2">Analyzing Financial Data...</h3>
                  <p className="text-[#64748B]">Our AI is detecting patterns and anomalies</p>
                </div>
              ) : (
                <>
                  <motion.div
                    animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
                    className="mb-6"
                  >
                    {isDragging ? (
                      <FileCheck className="mx-auto h-16 w-16 text-[#0066FF]" />
                    ) : (
                      <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0066FF] to-[#00C9A7] flex items-center justify-center shadow-lg shadow-[#0066FF]/20">
                        <Upload className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </motion.div>

                  <h3 className="text-[#0F172A] mb-2 text-xl font-medium">
                    {isDragging ? "Drop your file here" : "Upload Transaction History"}
                  </h3>
                  <p className="text-[#64748B] mb-8">
                    Drop your CSV or Excel file here or click to browse
                  </p>

                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    id="csv-upload"
                    onChange={handleFileSelect}
                  />
                  <label
                    htmlFor="csv-upload"
                    className="inline-flex items-center gap-2 cursor-pointer rounded-xl bg-gradient-to-r from-[#0066FF] to-[#00C9A7] px-8 py-3.5 text-white transition-all hover:shadow-xl hover:shadow-[#0066FF]/30 hover:-translate-y-0.5 font-medium"
                  >
                    <Upload className="w-5 h-5" />
                    Choose File
                  </label>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-3xl rounded-3xl bg-white border border-[#E2E8F0] shadow-xl shadow-[#0F172A]/5 overflow-hidden text-left"
            >
              <div className="p-6 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[#0066FF] to-[#00C9A7]">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-[#0F172A] font-semibold">Analysis Results</h3>
                    <p className="text-[#64748B] text-sm">AI-powered insights from your data</p>
                  </div>
                </div>
                <button
                  onClick={() => setAnalysisResult(null)}
                  className="p-2 hover:bg-white rounded-full transition-colors text-[#64748B] hover:text-[#EF4444]"
                  title="Close"
                  aria-label="Close analysis results"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Summary */}
                <div className="flex gap-4">
                  <div className="shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-[#0066FF]/10 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-[#0066FF]" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[#0F172A] font-medium mb-2">Executive Summary</h4>
                    <p className="text-[#64748B] leading-relaxed">{analysisResult.summary}</p>
                  </div>
                </div>

                {/* Flagged Transactions */}
                {analysisResult.flagged_transactions?.length > 0 && (
                  <div className="flex gap-4">
                    <div className="shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-full bg-[#EF4444]/10 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-[#EF4444]" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[#0F172A] font-medium mb-3">Flagged Transactions</h4>
                      <div className="space-y-3">
                        {analysisResult.flagged_transactions.map((tx: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-[#FFF1F2] border border-[#FECDD3]">
                            <div>
                              <p className="text-[#9F1239] font-medium">{tx.description}</p>
                              <p className="text-[#BE123C] text-sm mt-0.5">{tx.date} • {tx.reason}</p>
                            </div>
                            <span className="text-[#9F1239] font-bold">-${tx.amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Advice */}
                <div className="rounded-2xl bg-gradient-to-r from-[#0066FF]/5 to-[#00C9A7]/5 p-6 border border-[#0066FF]/10">
                  <h4 className="text-[#0066FF] font-medium mb-2 flex items-center gap-2">
                    <span className="text-xl">💡</span> Strategic Advice
                  </h4>
                  <p className="text-[#334155] font-medium">
                    {analysisResult.advice}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
