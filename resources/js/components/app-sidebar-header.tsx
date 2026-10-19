import { Breadcrumbs } from '@/components/breadcrumbs';
import { AppearanceDropdown } from '@/components/appearance-dropdown';
import AppearanceToggleTab from '@/components/appearance-tabs';
import { NavUser } from '@/components/nav-user';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
    scrolled = false,
}: {
    breadcrumbs?: BreadcrumbItemType[];
    scrolled?: boolean;
}) {
    return (
        <header
            className={`mx-3 mt-2 mb-2 flex h-12 shrink-0 items-center justify-between gap-2 rounded-xl border border-border/70 px-3 shadow-sm shadow-black/5 ${scrolled ? 'bg-card shadow-md' : 'bg-background'} dark:shadow-black/20`}
        >
            <div className="flex min-w-0 items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="flex shrink-0 items-center gap-2">
                <AppearanceToggleTab compact className="hidden md:inline-flex" />
                <AppearanceDropdown placement="navbar" className="md:hidden" />
                <NavUser />
            </div>
        </header>
    );
}
