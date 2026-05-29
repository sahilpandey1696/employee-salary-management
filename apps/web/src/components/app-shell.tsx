import { AppNav } from "@/components/app-nav";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside
          aria-label="Sidebar"
          className="hidden w-64 shrink-0 border-r border-border bg-card p-6 md:flex md:flex-col"
        >
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              HR Platform
            </p>
            <h1 className="mt-1 text-lg font-semibold text-foreground">
              Salary Management
            </h1>
          </div>
          <AppNav />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-border bg-card px-4 py-4 md:hidden">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              HR Platform
            </p>
            <h1 className="text-lg font-semibold text-foreground">
              Salary Management
            </h1>
            <div className="mt-4">
              <AppNav />
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
