// ============================================================
// Spendly — Dynamic Lucide Icon Component
// ============================================================
import React from 'react';
import {
  UtensilsCrossed, Coffee, Car, ShoppingCart, ShoppingBag, Receipt,
  Gamepad2, Heart, GraduationCap, Repeat, Banknote, Laptop,
  TrendingUp, Gift, Landmark, Wallet, Smartphone, Shield,
  ArrowRightLeft, HelpCircle, CreditCard,
} from 'lucide-react';

const iconMap: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  UtensilsCrossed, Coffee, Car, ShoppingCart, ShoppingBag, Receipt,
  Gamepad2, Heart, GraduationCap, Repeat, Banknote, Laptop,
  TrendingUp, Gift, Landmark, Wallet, Smartphone, Shield,
  ArrowRightLeft, HelpCircle, CreditCard,
};

interface DynamicIconProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

export function DynamicIcon({ name, className, style }: DynamicIconProps) {
  const Icon = iconMap[name] || HelpCircle;
  return <Icon className={className} style={style} />;
}
