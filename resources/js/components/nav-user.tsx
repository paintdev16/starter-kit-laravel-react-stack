import { usePage } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { UserInfo } from '@/components/user-info';
import { useIsMobile } from '@/hooks/use-mobile';
import { dropdownMenuContentStyles } from '@/lib/dropdown-menu-styles';

export function NavUser({
    placement = 'navbar',
}: {
    placement?: 'navbar' | 'sidebar';
}) {
    const { auth } = usePage().props;
    const getInitials = useInitials();
    const { state } = useSidebar();
    const isMobile = useIsMobile();

    if (!auth.user) {
        return null;
    }

    const menu = (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={placement === 'sidebar' ? (
                    <SidebarMenuButton
                        size="lg"
                        className="group text-sidebar-accent-foreground hover:bg-sidebar-accent data-popup-open:bg-sidebar-accent"
                        aria-label={`Menú de usuario: ${auth.user.name}`}
                        data-test="sidebar-menu-button"
                    />
                ) : (
                    <button
                        type="button"
                        className="flex h-9 items-center gap-2 rounded-lg px-2 text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-accent"
                        aria-label={`Menú de usuario: ${auth.user.name}`}
                        data-test="navbar-user-button"
                    />
                )}
            >
                {placement === 'sidebar' ? (
                    <>
                        <UserInfo
                            user={auth.user}
                            showEmail
                            className="bg-sidebar-accent text-sidebar-accent-foreground"
                        />
                        <ChevronDown className="ml-auto size-4" />
                    </>
                ) : (
                    <>
                        <Avatar size="sm">
                            <AvatarImage
                                src={auth.user.avatar ?? undefined}
                                alt={auth.user.name}
                            />
                            <AvatarFallback className="bg-primary/15 text-primary">
                                {getInitials(auth.user.name)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
                            {auth.user.name}
                        </span>
                        <ChevronDown className="size-4 text-muted-foreground" />
                    </>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className={
                    placement === 'sidebar'
                        ? `w-(--anchor-width) ${dropdownMenuContentStyles}`
                        : dropdownMenuContentStyles
                }
                align="end"
                side={
                    placement === 'navbar'
                        ? 'bottom'
                        : isMobile
                          ? 'bottom'
                          : state === 'collapsed'
                            ? 'right'
                            : 'top'
                }
            >
                <UserMenuContent user={auth.user} />
            </DropdownMenuContent>
        </DropdownMenu>
    );

    if (placement === 'sidebar') {
        return (
            <SidebarMenu>
                <SidebarMenuItem>{menu}</SidebarMenuItem>
            </SidebarMenu>
        );
    }

    return menu;
}
