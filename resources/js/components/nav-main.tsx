import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({
    items,
    bottomItems = [],
}: {
    items: NavItem[];
    bottomItems?: NavItem[];
}) {
    const { isCurrentUrl } = useCurrentUrl();
    const { setOpenMobile } = useSidebar();

    const renderItems = (navItems: NavItem[]) => navItems.map((item) => (
        <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
                render={<Link href={item.href} prefetch />}
                isActive={isCurrentUrl(item.href)}
                tooltip={{ children: item.title }}
                onClick={() => setOpenMobile(false)}
                className="font-medium data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:shadow-md data-active:shadow-sidebar-primary/20 [&>svg]:text-sidebar-foreground/70 hover:[&>svg]:text-sidebar-primary data-active:[&>svg]:text-sidebar-primary-foreground"
            >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
            </SidebarMenuButton>
        </SidebarMenuItem>
    ));

    return (
        <>
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel className="font-semibold tracking-wider text-sidebar-primary/80 uppercase">
                Navegación
            </SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {renderItems(items)}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
        {bottomItems.length > 0 && (
            <SidebarGroup className="mt-auto border-t border-sidebar-border/70 px-2 py-2">
                <SidebarGroupContent>
                    <SidebarMenu>{renderItems(bottomItems)}</SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        )}
        </>
    );
}
