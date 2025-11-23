import { Coffee, Car, Tv, ShoppingBag, Home, Zap, Heart, GraduationCap, Receipt, Gamepad2 } from "lucide-react";

export const categoryIconMap: Record<string, any> = {
  "Food & Dining": Coffee,
  "Transport": Car,
  "Subscriptions": Tv,
  "Shopping": ShoppingBag,
  "Housing": Home,
  "Utilities": Zap,
  "Health": Heart,
  "Education": GraduationCap,
  "Bills & Fees": Receipt,
  "Entertainment": Gamepad2,
  "Other": Receipt,
};

export const categoryColorMap: Record<string, string> = {
  "Food & Dining": "#F59E0B",
  "Transport": "#0066FF",
  "Subscriptions": "#6366F1",
  "Shopping": "#EC4899",
  "Housing": "#8B5CF6",
  "Utilities": "#00C9A7",
  "Health": "#EF4444",
  "Education": "#10B981",
  "Bills & Fees": "#64748B",
  "Entertainment": "#F97316",
  "Other": "#94A3B8",
};

export const categoryBgMap: Record<string, string> = {
  "Food & Dining": "from-[#F59E0B]/10 to-[#F59E0B]/5",
  "Transport": "from-[#0066FF]/10 to-[#0066FF]/5",
  "Subscriptions": "from-[#6366F1]/10 to-[#6366F1]/5",
  "Shopping": "from-[#EC4899]/10 to-[#EC4899]/5",
  "Housing": "from-[#8B5CF6]/10 to-[#8B5CF6]/5",
  "Utilities": "from-[#00C9A7]/10 to-[#00C9A7]/5",
  "Health": "from-[#EF4444]/10 to-[#EF4444]/5",
  "Education": "from-[#10B981]/10 to-[#10B981]/5",
  "Bills & Fees": "from-[#64748B]/10 to-[#64748B]/5",
  "Entertainment": "from-[#F97316]/10 to-[#F97316]/5",
  "Other": "from-[#94A3B8]/10 to-[#94A3B8]/5",
};

