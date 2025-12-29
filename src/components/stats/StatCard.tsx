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

  if (loading) {
    return (
      <Card className={cn(styles.card, "animate-pulse", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-3 flex-1">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-8 bg-muted rounded w-16" />
              <div className="h-3 bg-muted rounded w-32" />
            </div>
            <div className="h-12 w-12 bg-muted rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(styles.card, "transition-all duration-300", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trend.value >= 0 ? "text-success" : "text-error"
              )}>
                <span>{trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%</span>
                <span className="text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={cn("p-3 rounded-xl", styles.icon)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}