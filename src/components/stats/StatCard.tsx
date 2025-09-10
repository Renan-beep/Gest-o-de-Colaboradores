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

  return (
    <Card className={cn("transition-all duration-300 card-hover", styles.card, className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                styles.icon
              )}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <div className="text-3xl font-bold tabular-nums">
                  {loading ? (
                    <div className="w-16 h-8 bg-muted animate-pulse rounded" />
                  ) : (
                    value
                  )}
                </div>
              </div>
            </div>
            
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
            
            {trend && (
              <div className="flex items-center gap-1 text-xs">
                <span className={cn(
                  "font-medium",
                  trend.value > 0 ? "text-success" : trend.value < 0 ? "text-error" : "text-muted-foreground"
                )}>
                  {trend.value > 0 ? "+" : ""}{trend.value}%
                </span>
                <span className="text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}