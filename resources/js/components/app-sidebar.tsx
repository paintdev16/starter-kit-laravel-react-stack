import { usePage } from '@inertiajs/react';
import {
    CircleHelp,
    ChevronsUpDown,
    ExternalLink,
    BookOpen,
    LayoutGrid,
    MoreHorizontal,
    Settings2,
    UsersRound,
    ClipboardList,
    HeartPulse,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { NavMain } from '@/components/nav-main';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as accessControl } from '@/routes/access-control';
import { edit as editProfile } from '@/routes/profile';
import { index as auditIndex } from '@/routes/advanced/audit';
import { index as healthIndex } from '@/routes/advanced/health';
import { index as appSettingsIndex } from '@/routes/advanced/settings';
import {
    dropdownMenuContentStyles,
    dropdownMenuItemStyles,
    dropdownMenuLabelStyles,
} from '@/lib/dropdown-menu-styles';
import type { Auth, NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Panel de control',
        href: dashboard(),
        icon: LayoutGrid,
    },
];

const bottomNavItems: NavItem[] = [
    {
        title: 'Configuración',
        href: editProfile(),
        icon: Settings2,
    },
    {
        title: 'Ayuda',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: CircleHelp,
    },
];

export function AppSidebar() {
    const { name, auth } = usePage<{
        name: string;
        auth: Auth;
    }>().props;
    const visibleMainNavItems = auth.can.viewUsers
        ? [
              ...mainNavItems,
              {
                  title: 'Usuarios',
                  href: accessControl(),
                  icon: UsersRound,
              },
          ]
        : mainNavItems;

    const advancedItems: NavItem[] = auth.can.manageAdvanced
        ? [
              { title: 'Auditoría', href: auditIndex(), icon: ClipboardList },
              { title: 'Salud del sistema', href: healthIndex(), icon: HeartPulse },
              {
                  title: 'Configuración general',
                  href: appSettingsIndex(),
                  icon: Settings2,
              },
          ]
        : [];
    const navigationItems = [...visibleMainNavItems, ...advancedItems];

    return (
        <Sidebar
            collapsible="icon"
            variant="floating"
            className="[&_[data-slot=sidebar-container]]:pt-2 [&_[data-slot=sidebar-container]]:pr-0 [&_[data-slot=sidebar-inner]]:rounded-xl [&_[data-slot=sidebar-inner]]:border [&_[data-slot=sidebar-inner]]:border-white/60 [&_[data-slot=sidebar-inner]]:shadow-xl [&_[data-slot=sidebar-inner]]:shadow-sidebar-primary/15 dark:[&_[data-slot=sidebar-inner]]:border-sidebar-border dark:[&_[data-slot=sidebar-inner]]:shadow-black/20"
        >
            <SidebarHeader className="border-b border-sidebar-border/70 bg-linear-to-br from-white/70 via-sidebar-primary/10 to-transparent dark:bg-none">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <SidebarMenuButton
                                        size="lg"
                                        className="hover:bg-sidebar-accent data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
                                    />
                                }
                            >
                                <span className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-sidebar-primary/25">
                                    <AppLogoIcon className="size-5 fill-current" />
                                </span>
                                <span className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">
                                        {name}
                                    </span>
                                    <span className="truncate text-xs text-sidebar-foreground/65">
                                        Empresa
                                    </span>
                                </span>
                                <ChevronsUpDown className="ml-auto size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className={`w-(--anchor-width) ${dropdownMenuContentStyles}`}
                                side="bottom"
                                align="start"
                                sideOffset={4}
                            >
                                <DropdownMenuGroup>
                                    <DropdownMenuLabel
                                        className={dropdownMenuLabelStyles}
                                    >
                                        Equipos
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem
                                        className={`${dropdownMenuItemStyles} bg-sidebar-accent text-sidebar-accent-foreground`}
                                    >
                                        <span className="flex size-6 items-center justify-center rounded-md border border-sidebar-border bg-sidebar text-sidebar-primary">
                                            <AppLogoIcon className="size-4 fill-current" />
                                        </span>
                                        <span className="truncate">{name}</span>
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navigationItems} bottomItems={bottomNavItems} />
            </SidebarContent>

            <SidebarFooter className="bg-sidebar-accent/30">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <SidebarMenuButton
                                        tooltip="Más"
                                        className="text-sidebar-foreground hover:bg-sidebar-accent data-popup-open:bg-sidebar-accent group-data-[collapsible=icon]:[&>span:last-child]:hidden"
                                    />
                                }
                            >
                                <MoreHorizontal className="size-4" />
                                <span>Más</span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className={`w-(--anchor-width) ${dropdownMenuContentStyles}`}
                                side="top"
                                align="start"
                                sideOffset={4}
                            >
                                <DropdownMenuGroup>
                                    <DropdownMenuLabel
                                        className={dropdownMenuLabelStyles}
                                    >
                                        Recursos
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem
                                        className={dropdownMenuItemStyles}
                                        render={
                                            <a
                                                href="https://laravel.com/docs"
                                                target="_blank"
                                                rel="noreferrer"
                                            />
                                        }
                                    >
                                        <CircleHelp />
                                        Documentación
                                        <ExternalLink className="ml-auto size-3 text-sidebar-foreground/55" />
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className={dropdownMenuItemStyles}
                                        render={
                                            <a
                                                href="https://github.com/laravel/react-starter-kit"
                                                target="_blank"
                                                rel="noreferrer"
                                            />
                                        }
                                    >
                                        <BookOpen />
                                        Recursos del proyecto
                                        <ExternalLink className="ml-auto size-3 text-sidebar-foreground/55" />
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
