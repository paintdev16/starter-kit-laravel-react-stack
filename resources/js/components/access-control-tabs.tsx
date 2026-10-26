import { Link, usePage } from '@inertiajs/react';
import { KeyRound, ShieldCheck, UsersRound } from 'lucide-react';
import { index as accessControl } from '@/routes/access-control';
import { index as accessControlRoles } from '@/routes/access-control/roles';
import { index as permissionsIndex } from '@/routes/access-control/permissions';
import { index as usersIndex } from '@/routes/access-control/users';
import type { Auth } from '@/types';

type Section = 'roles' | 'permissions' | 'users';

const tabs: { id: Section; label: string; icon: typeof ShieldCheck }[] = [
    { id: 'users', label: 'Usuarios', icon: UsersRound },
    { id: 'roles', label: 'Roles', icon: ShieldCheck },
    { id: 'permissions', label: 'Permisos', icon: KeyRound },
];

export function AccessControlTabs({ active }: { active: Section }) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const visibleTabs = tabs.filter((tab) => {
        if (tab.id === 'users') return auth.can.viewUsers;

        return auth.can.viewAccessControl;
    });

    return (
        <nav
            aria-label="Secciones de acceso"
            className="inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-border/70 bg-muted/40 p-1"
        >
            {visibleTabs.map((tab) => {
                const isActive = active === tab.id;
                const href = {
                    roles: accessControlRoles(),
                    permissions: permissionsIndex(),
                    users: accessControl(),
                }[tab.id];

                return (
                    <Link
                        key={tab.id}
                        href={href}
                        aria-current={isActive ? 'page' : undefined}
                        className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${
                            isActive
                                ? 'bg-secondary text-secondary-foreground shadow-sm'
                                : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
                        }`}
                    >
                        <tab.icon className="size-4" />
                        {tab.label}
                    </Link>
                );
            })}
        </nav>
    );
}
