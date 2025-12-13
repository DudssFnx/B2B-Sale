import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("", className)} data-testid={`card-stat-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {trend && (
              <div className={cn(
                "flex items-center gap-1 mt-2 text-xs font-medium",
                trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{trend.value}% from last month</span>
              </div>
            )}
          </div>
          <div className="flex-shrink-0 p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
