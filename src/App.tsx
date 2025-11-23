import { HeroSection } from "./components/HeroSection";
import { CashflowForecast } from "./components/CashflowForecast";
import { SpendingAnalysis } from "./components/SpendingAnalysis";
import { WhatIfSimulator } from "./components/WhatIfSimulator";
import { AIRecommendations } from "./components/AIRecommendations";
import { Header } from "./components/Header";

export default function App() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Decorative background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-[#0066FF]/5 via-transparent to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-[#00C9A7]/5 via-transparent to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="relative">
        <Header />

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <HeroSection />

          <div className="mt-12 space-y-8">
            <CashflowForecast />

            <div className="grid gap-8 lg:grid-cols-2">
              <SpendingAnalysis />
              <WhatIfSimulator />
            </div>

            <AIRecommendations />
          </div>
        </div>
      </div>
    </div>
  );
}
