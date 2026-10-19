import {
    AccessControlView,
    type AccessControlProps,
} from '@/pages/access-control';
import type { BreadcrumbItem } from '@/types';
import { index } from '@/routes/access-control/permissions';
import { index as usersIndex } from '@/routes/access-control';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Usuarios', href: usersIndex() },
    { title: 'Permisos', href: index() },
];

export default function Permissions(props: AccessControlProps) {
    return <AccessControlView {...props} section="permissions" />;
}

Permissions.layout = { breadcrumbs };
