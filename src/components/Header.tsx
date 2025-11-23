import { motion } from "motion/react";
import { Bell, Settings, User } from "lucide-react";
import { useState, useEffect } from "react";
import { LoginModal } from "./LoginModal";
import { api } from "../services/api";

export function Header() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    setIsLoggedIn(!!token);
    // You can fetch user info here if needed
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setIsLoginOpen(false);
  };

  const handleLogout = () => {
    api.logout();
    setIsLoggedIn(false);
    setUserName(null);
    window.location.reload();
  };

  return (
    <>
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLogin}
      />
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-[#E2E8F0]"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0066FF] to-[#00C9A7] flex items-center justify-center shadow-lg shadow-[#0066FF]/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h1 className="text-[#0F172A] tracking-tight">FinStock Flow</h1>
              <p className="text-[#64748B] text-[13px] -mt-0.5">AI-Powered Cashflow</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 rounded-xl hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] transition-all relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#EF4444] rounded-full ring-2 ring-white"></span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 rounded-xl hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] transition-all"
            >
              <Settings className="w-5 h-5" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (isLoggedIn) {
                  // Show user menu or logout
                  if (confirm("Do you want to log out?")) {
                    handleLogout();
                  }
                } else {
                  setIsLoginOpen(true);
                }
              }}
              className="p-2.5 rounded-xl bg-gradient-to-br from-[#0066FF] to-[#00C9A7] text-white ml-2 shadow-lg shadow-[#0066FF]/20 cursor-pointer"
              title={isLoggedIn ? "Click to logout" : "Click to login"}
            >
              <User className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
    </>
  );
}
