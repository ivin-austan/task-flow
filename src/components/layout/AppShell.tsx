import {
  CheckSquare2,
  LayoutDashboard,
  ListTodo,
  LogOut,
  PanelLeftClose,
} from "lucide-react";
import type { ReactNode } from "react";
import type { TaskPage } from "../../types/task.types";

interface AppShellProps {
  activePage: TaskPage;
  onNavigate: (page: TaskPage) => void;
  userEmail: string;
  onSignOut: () => void;
  children: ReactNode;
}

const navigation: { page: TaskPage; label: string; icon: typeof LayoutDashboard }[] = [
  { page: "overview", label: "Overview", icon: LayoutDashboard },
  { page: "tasks", label: "My tasks", icon: ListTodo },
];

export function AppShell({
  activePage,
  onNavigate,
  userEmail,
  onSignOut,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-200 bg-white px-5 py-7 lg:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <CheckSquare2 size={21} />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-slate-950">Taskflow</p>
            <p className="text-xs text-slate-500">Personal workspace</p>
          </div>
        </div>
        <div className="mt-12 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Workspace
        </div>
        <nav className="mt-3 space-y-1">
          {navigation.map(({ page, label, icon: Icon }) => (
            <button
              key={page}
              type="button"
              onClick={() => onNavigate(page)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                activePage === page
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
              aria-current={activePage === page ? "page" : undefined}
            >
              <Icon size={18} />
              {label}
              {activePage === page && (
                <span className="ml-auto size-1.5 rounded-full bg-indigo-600" />
              )}
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <PanelLeftClose size={15} className="text-indigo-600" />
            A little progress adds up.
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Keep your priorities clear and make room for focused work.
          </p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-indigo-600 text-white lg:hidden">
              <CheckSquare2 size={19} />
            </div>
            <span className="text-sm font-semibold text-slate-800 lg:hidden">Taskflow</span>
            <span className="hidden text-sm text-slate-400 lg:inline">Workspace</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">{userEmail}</span>
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>
        <nav className="flex gap-2 border-b border-slate-200 bg-white px-5 py-2 lg:hidden">
          {navigation.map(({ page, label, icon: Icon }) => (
            <button
              key={page}
              type="button"
              onClick={() => onNavigate(page)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                activePage === page
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
              aria-current={activePage === page ? "page" : undefined}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
        <main className="mx-auto max-w-[1440px] px-5 py-8 md:px-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
