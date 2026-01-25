import { Sidebar } from './sidebar';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-transparent text-foreground">
            {/* Permanent Sidebar */}
            <Sidebar className="flex" />

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto">
                <div className="container mx-auto p-8 max-w-7xl">
                    {children}
                </div>
            </main>
        </div>
    );
}
