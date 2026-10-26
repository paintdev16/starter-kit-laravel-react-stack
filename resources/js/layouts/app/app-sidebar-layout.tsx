import { useEffect, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const [scrolled, setScrolled] = useState(false);
    const { name } = usePage<{ name: string }>().props;
    const previousAppName = useRef(name);

    useEffect(() => {
        const previousSuffix = ` - ${previousAppName.current}`;
        const currentSuffix = ` - ${name}`;
        const currentTitle = document.title;

        if (currentTitle.endsWith(currentSuffix)) {
            previousAppName.current = name;
            return;
        }

        const pageTitle = currentTitle.endsWith(previousSuffix)
            ? currentTitle.slice(0, -previousSuffix.length)
            : currentTitle === previousAppName.current
              ? ''
              : currentTitle;

        document.title = pageTitle ? `${pageTitle} - ${name}` : name;
        previousAppName.current = name;
    }, [name]);

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent
                variant="sidebar"
                className="h-svh max-h-svh min-w-0 overflow-hidden bg-background"
            >
                <AppSidebarHeader
                    breadcrumbs={breadcrumbs}
                    scrolled={scrolled}
                />
                <div
                    className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto"
                    onScroll={(event) =>
                        setScrolled(event.currentTarget.scrollTop > 0)
                    }
                >
                    {children}
                </div>
            </AppContent>
        </AppShell>
    );
}
