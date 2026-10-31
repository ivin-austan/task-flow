import {
  ArrowUpRight,
  CheckCircle2,
  CircleDashed,
  Flame,
  ListTodo,
} from "lucide-react";
import type { DashboardStats } from "../../types/task.types";

interface StatsGridProps {
  stats: DashboardStats;
}

const cards = [
  {
    key: "total",
    label: "Total tasks",
    icon: ListTodo,
    iconStyle: "bg-indigo-50 text-indigo-600",
    value: (stats: DashboardStats) => stats.total,
    note: () => "Across your workspace",
  },
  {
    key: "completed",
    label: "Completed",
    icon: CheckCircle2,
    iconStyle: "bg-emerald-50 text-emerald-600",
    value: (stats: DashboardStats) => stats.completed,
    note: (stats: DashboardStats) => `${stats.completionPercent}% completion rate`,
  },
  {
    key: "active",
    label: "In progress",
    icon: CircleDashed,
    iconStyle: "bg-sky-50 text-sky-600",
    value: (stats: DashboardStats) => stats.inProgress,
    note: () => "Currently being worked on",
  },
  {
    key: "pending",
    label: "To do",
    icon: CircleDashed,
    iconStyle: "bg-violet-50 text-violet-600",
    value: (stats: DashboardStats) => stats.pending,
    note: () => "Waiting to be started",
  },
  {
    key: "priority",
    label: "High priority",
    icon: Flame,
    iconStyle: "bg-orange-50 text-orange-600",
    value: (stats: DashboardStats) => stats.highPriority,
    note: () => "Keep these on your radar",
  },
];

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <section
      aria-label="Task statistics"
      className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-5"
    >
      {cards.map(({ key, label, icon: Icon, iconStyle, value, note }) => (
        <article
          key={key}
          className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.025)]"
        >
          <div className="flex items-start justify-between">
            <div className={`grid size-10 place-items-center rounded-xl ${iconStyle}`}>
              <Icon size={19} />
            </div>
            <ArrowUpRight size={17} className="text-slate-300" />
          </div>
          <p className="mt-5 text-sm font-medium text-slate-500">{label}</p>
          <div className="mt-1 flex items-end justify-between gap-2">
            <strong className="text-3xl font-semibold tracking-tight text-slate-950">
              {value(stats)}
            </strong>
            <span className="pb-1 text-[11px] text-slate-400">{note(stats)}</span>
          </div>
        </article>
      ))}
    </section>
  );
}
