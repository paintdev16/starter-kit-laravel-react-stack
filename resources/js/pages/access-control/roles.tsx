import {
    AccessControlView,
    type AccessControlProps,
} from '@/pages/access-control';
import { index as usersIndex } from '@/routes/access-control';
import { index as rolesIndex } from '@/routes/access-control/roles';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Usuarios', href: usersIndex() },
    { title: 'Roles', href: rolesIndex() },
];

export default function Roles(props: AccessControlProps) {
    return <AccessControlView {...props} section="roles" />;
}

Roles.layout = { breadcrumbs };
