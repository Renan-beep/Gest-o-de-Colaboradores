import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  trend?: {
    value: number;
    label: string;
  };
  loading?: boolean;
  className?: string;
}
const variantStyles = {
  default: {
    icon: "bg-muted text-muted-foreground",
    card: "glass-card hover:shadow-medium"
  },
  primary: {
    icon: "bg-primary/10 text-primary glow-hover",
    card: "glass-card hover:shadow-glow border-primary/20"
  },
  success: {
    icon: "bg-success/10 text-success",
    card: "glass-card hover:shadow-medium border-success/20"
  },
  warning: {
    icon: "bg-warning/10 text-warning",
    card: "glass-card hover:shadow-medium border-warning/20"
  },
  error: {
    icon: "bg-error/10 text-error",
    card: "glass-card hover:shadow-medium border-error/20"
  }
};
export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
  loading = false,
  className
}: StatCardProps) {
  const styles = variantStyles[variant];
  return;
}