import { createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/lib/services/jobs.service";
import {
  Briefcase,
  Sparkles,
  Bookmark,
  Send,
  MessageSquare,
  Trophy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
}

function StatCard({ label, value, icon: Icon, colorClass, bgClass }: StatCardProps) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-1 tabular-nums">{value.toLocaleString()}</p>
          </div>
          <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg", bgClass)}>
            <Icon className={cn("w-5 h-5", colorClass)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DashboardStatsProps {
  userId: string;
}

export async function DashboardStats({ userId }: DashboardStatsProps) {
  const stats = await getDashboardStats(userId);

  const cards: StatCardProps[] = [
    {
      label: "Total Jobs",
      value: stats.total,
      icon: Briefcase,
      colorClass: "text-blue-600 dark:text-blue-400",
      bgClass: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "New",
      value: stats.newJobs,
      icon: Sparkles,
      colorClass: "text-violet-600 dark:text-violet-400",
      bgClass: "bg-violet-50 dark:bg-violet-950",
    },
    {
      label: "Saved",
      value: stats.saved,
      icon: Bookmark,
      colorClass: "text-yellow-600 dark:text-yellow-400",
      bgClass: "bg-yellow-50 dark:bg-yellow-950",
    },
    {
      label: "Applied",
      value: stats.applied,
      icon: Send,
      colorClass: "text-purple-600 dark:text-purple-400",
      bgClass: "bg-purple-50 dark:bg-purple-950",
    },
    {
      label: "Interviews",
      value: stats.interviews,
      icon: MessageSquare,
      colorClass: "text-orange-600 dark:text-orange-400",
      bgClass: "bg-orange-50 dark:bg-orange-950",
    },
    {
      label: "Offers",
      value: stats.offers,
      icon: Trophy,
      colorClass: "text-green-600 dark:text-green-400",
      bgClass: "bg-green-50 dark:bg-green-950",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}
