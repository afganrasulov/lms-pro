import { Sidebar } from '@/components/layout/sidebar';
import '@/app/globals.css';

export default function DashboardRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-spotlight text-foreground overflow-x-hidden">
            {/* Permanent Sidebar Shell */}
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
