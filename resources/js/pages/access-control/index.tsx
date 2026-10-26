import { Form, Head, usePage } from '@inertiajs/react';
import {
    KeyRound,
    LockKeyhole,
    Pencil,
    Plus,
    ShieldCheck,
    Trash2,
    UsersRound,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactElement } from 'react';
import PermissionController from '@/actions/App/Http/Controllers/Web/AccessControl/PermissionController';
import RoleController from '@/actions/App/Http/Controllers/Web/AccessControl/RoleController';
import InputError from '@/components/input-error';
import { AccessControlTabs } from '@/components/access-control-tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index as rolesIndex } from '@/routes/access-control/roles';
import type { Auth, BreadcrumbItem } from '@/types';

type Permission = {
    id: number;
    name: string;
    label: string;
    guard_name: string;
    roles_count: number;
};

type Role = {
    id: number;
    name: string;
    guard_name: string;
    users_count: number;
    permissions: Pick<Permission, 'id' | 'name' | 'label'>[];
};

export type AccessControlProps = {
    roles: Role[];
    permissions: Permission[];
    stats: {
        roles: number;
        permissions: number;
        usersWithRoles: number;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Roles', href: rolesIndex() },
];

function PermissionSelector({
    permissions,
    selected = [],
}: {
    permissions: Permission[];
    selected?: number[];
}) {
    return (
        <div className="grid max-h-64 gap-2 overflow-y-auto rounded-xl border border-border/70 bg-muted/25 p-3 sm:grid-cols-2">
            {permissions.map((permission) => (
                <Label
                    key={permission.id}
                    className="flex cursor-pointer items-start gap-2.5 rounded-lg p-2.5 transition-colors hover:bg-background"
                >
                    <Checkbox
                        name="permissions[]"
                        value={String(permission.id)}
                        defaultChecked={selected.includes(permission.id)}
                        className="mt-0.5"
                    />
                    <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                            {permission.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Guardia {permission.guard_name}
                        </span>
                    </span>
                </Label>
            ))}
            {permissions.length === 0 && (
                <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
                    Crea un permiso antes de asignarlo a un rol.
                </p>
            )}
        </div>
    );
}

function RoleDialog({
    role,
    permissions,
    trigger,
}: {
    role?: Role;
    permissions: Permission[];
    trigger: ReactElement;
}) {
    const [open, setOpen] = useState(false);
    const selected = role?.permissions.map((permission) => permission.id) ?? [];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={trigger} />
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <ShieldCheck className="size-5" />
                    </span>
                    <DialogTitle>
                        {role ? 'Editar rol' : 'Crear rol'}
                    </DialogTitle>
                    <DialogDescription>
                        Define el nombre y los permisos que recibirá este rol.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...(role
                        ? RoleController.update.form(role.id)
                        : RoleController.store.form())}
                    options={{ preserveScroll: true }}
                    onSuccess={() => setOpen(false)}
                    className="space-y-5"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor={`role-name-${role?.id ?? 'new'}`}>
                                    Nombre del rol
                                </Label>
                                <Input
                                    id={`role-name-${role?.id ?? 'new'}`}
                                    name="name"
                                    defaultValue={role?.name}
                                    placeholder="Ej. supervisor"
                                    disabled={
                                        role?.name === 'super-admin'
                                    }
                                    required
                                    aria-invalid={Boolean(errors.name)}
                                />
                                {role &&
                                    role.name === 'super-admin' && (
                                        <input
                                            type="hidden"
                                            name="name"
                                            value={role.name}
                                        />
                                    )}
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <div>
                                    <Label>Permisos</Label>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Puedes cambiarlos en cualquier momento.
                                    </p>
                                </div>
                                <PermissionSelector
                                    permissions={permissions}
                                    selected={selected}
                                />
                                <InputError message={errors.permissions} />
                            </div>

                            <DialogFooter>
                                <DialogClose
                                    render={
                                        <Button type="button" variant="outline" />
                                    }
                                >
                                    Cancelar
                                </DialogClose>
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? 'Guardando…'
                                        : role
                                          ? 'Guardar cambios'
                                          : 'Crear rol'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function PermissionDialog({
    permission,
    trigger,
}: {
    permission?: Permission;
    trigger: ReactElement;
}) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={trigger} />
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <KeyRound className="size-5" />
                    </span>
                    <DialogTitle>
                        {permission ? 'Editar permiso' : 'Crear permiso'}
                    </DialogTitle>
                    <DialogDescription>
                        Define una etiqueta visible y un identificador estable
                        para autorizar acciones.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...(permission
                        ? PermissionController.update.form(permission.id)
                        : PermissionController.store.form())}
                    options={{ preserveScroll: true }}
                    onSuccess={() => setOpen(false)}
                    className="space-y-5"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="grid gap-2">
                                <Label
                                    htmlFor={`permission-label-${permission?.id ?? 'new'}`}
                                >
                                    Etiqueta visible
                                </Label>
                                <Input
                                    id={`permission-label-${permission?.id ?? 'new'}`}
                                    name="label"
                                    defaultValue={permission?.label}
                                    placeholder="Ej. Exportar reportes"
                                    required
                                    aria-invalid={Boolean(errors.label)}
                                />
                                <InputError message={errors.label} />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor={`permission-name-${permission?.id ?? 'new'}`}
                                >
                                    Identificador del permiso
                                </Label>
                                <Input
                                    id={`permission-name-${permission?.id ?? 'new'}`}
                                    name="name"
                                    defaultValue={permission?.name}
                                    placeholder="Ej. permissions.delete"
                                    lang="en"
                                    spellCheck={false}
                                    autoComplete="off"
                                    required
                                    aria-invalid={Boolean(errors.name)}
                                />
                                <p className="text-xs leading-5 text-muted-foreground">
                                    Escríbelo en inglés, en minúsculas y con el
                                    formato recurso.acción.
                                </p>
                                <InputError message={errors.name} />
                            </div>

                            <DialogFooter>
                                <DialogClose
                                    render={
                                        <Button type="button" variant="outline" />
                                    }
                                >
                                    Cancelar
                                </DialogClose>
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? 'Guardando…'
                                        : permission
                                          ? 'Guardar cambios'
                                          : 'Crear permiso'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function DeleteDialog({
    title,
    description,
    form,
    errorKey,
}: {
    title: string;
    description: string;
    form: { action: string; method: 'post' };
    errorKey: string;
}) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                    />
                }
            >
                <Trash2 />
                <span className="sr-only">Eliminar</span>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <span className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                        <Trash2 className="size-5" />
                    </span>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <Form
                    {...form}
                    options={{ preserveScroll: true }}
                    onSuccess={() => setOpen(false)}
                >
                    {({ errors, processing }) => (
                        <>
                            <InputError message={errors[errorKey]} />
                            <DialogFooter className="mt-5">
                                <DialogClose
                                    render={
                                        <Button type="button" variant="outline" />
                                    }
                                >
                                    Cancelar
                                </DialogClose>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    disabled={processing}
                                >
                                    {processing ? 'Eliminando…' : 'Eliminar'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export function AccessControlView({
    roles,
    permissions,
    stats,
    section,
}: AccessControlProps & { section: 'roles' | 'permissions' }) {
    const { auth } = usePage<{ auth: Auth }>().props;

    return (
        <>
            <Head title={section === 'roles' ? 'Roles' : 'Permisos'} />

            <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-lg shadow-primary/5 sm:p-8">
                    <div className="absolute -top-24 -right-20 size-64 rounded-full bg-primary/12 blur-3xl" />
                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                <LockKeyhole className="size-3.5" />
                                Control de acceso
                            </span>
                            <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                                {section === 'roles' ? 'Roles' : 'Permisos'}
                            </h1>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                                {section === 'roles'
                                    ? 'Organiza los roles y los permisos de acceso de tu equipo.'
                                    : 'Define los permisos que controlan las acciones de la aplicación.'}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {section === 'permissions' && auth.can.createPermissions && (
                                <PermissionDialog
                                    trigger={
                                        <Button variant="outline" size="lg">
                                            <KeyRound />
                                            Nuevo permiso
                                        </Button>
                                    }
                                />
                            )}
                            {section === 'roles' && auth.can.createRoles && (
                                <RoleDialog
                                    permissions={permissions}
                                    trigger={
                                        <Button size="lg">
                                            <Plus />
                                            Nuevo rol
                                        </Button>
                                    }
                                />
                            )}
                        </div>
                    </div>
                </section>

                <section className="grid gap-3 sm:grid-cols-3">
                    {[
                        {
                            label: 'Roles activos',
                            value: stats.roles,
                            icon: ShieldCheck,
                        },
                        {
                            label: 'Permisos definidos',
                            value: stats.permissions,
                            icon: KeyRound,
                        },
                        {
                            label: 'Usuarios con rol',
                            value: stats.usersWithRoles,
                            icon: UsersRound,
                        },
                    ].map((item) => (
                        <Card key={item.label} className="py-0">
                            <CardContent className="flex items-center gap-4 p-5">
                                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <item.icon className="size-5" />
                                </span>
                                <div>
                                    <p className="text-2xl font-semibold tracking-tight">
                                        {item.value}
                                    </p>
                                    <p className="text-xs text-muted-foreground sm:text-sm">
                                        {item.label}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </section>

                <section>
                    <div className="mb-4">
                        <AccessControlTabs active={section} />
                    </div>

                    {section === 'roles' ? (
                        <div className="grid gap-4 lg:grid-cols-2">
                            {roles.map((role) => {
                                const protectedRole =
                                    role.name === 'super-admin';

                                return (
                                    <Card key={role.id} className="group py-0">
                                        <CardContent className="p-5">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex min-w-0 gap-3">
                                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                        <ShieldCheck className="size-5" />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h2 className="truncate font-semibold">
                                                                {role.name}
                                                            </h2>
                                                            {protectedRole && (
                                                                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                                                                    Sistema
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            {role.users_count}{' '}
                                                            {role.users_count === 1
                                                                ? 'usuario'
                                                                : 'usuarios'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {auth.can.updateRoles && (
                                                        <RoleDialog
                                                            role={role}
                                                            permissions={permissions}
                                                            trigger={
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon-sm"
                                                                >
                                                                    <Pencil />
                                                                    <span className="sr-only">
                                                                        Editar {role.name}
                                                                    </span>
                                                                </Button>
                                                            }
                                                        />
                                                    )}
                                                    {auth.can.deleteRoles &&
                                                        !protectedRole && (
                                                            <DeleteDialog
                                                                title="Eliminar rol"
                                                                description={`Se eliminará “${role.name}”. Los usuarios dejarán de tener este rol.`}
                                                                form={RoleController.destroy.form(
                                                                    role.id,
                                                                )}
                                                                errorKey="role"
                                                            />
                                                        )}
                                                </div>
                                            </div>

                                            <div className="mt-5 flex flex-wrap gap-2 border-t border-border/60 pt-4">
                                                {role.permissions.map((permission) => (
                                                    <span
                                                        key={permission.id}
                                                        className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                                                    >
                                                        {permission.label}
                                                    </span>
                                                ))}
                                                {role.permissions.length === 0 && (
                                                    <span className="text-xs text-muted-foreground">
                                                        Sin permisos asignados
                                                    </span>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <Card className="py-0">
                            <CardContent className="divide-y divide-border/60 p-0">
                                {permissions.map((permission) => (
                                    <div
                                        key={permission.id}
                                        className="flex items-center gap-3 px-4 py-4 sm:px-5"
                                    >
                                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <KeyRound className="size-4" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {permission.label}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Usado por {permission.roles_count}{' '}
                                                {permission.roles_count === 1
                                                    ? 'rol'
                                                    : 'roles'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {auth.can.updatePermissions && (
                                                <PermissionDialog
                                                    permission={permission}
                                                    trigger={
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                        >
                                                            <Pencil />
                                                            <span className="sr-only">
                                                                Editar {permission.name}
                                                            </span>
                                                        </Button>
                                                    }
                                                />
                                            )}
                                            {auth.can.deletePermissions && (
                                                <DeleteDialog
                                                    title="Eliminar permiso"
                                                    description={`Se eliminará “${permission.name}” de todos los roles que lo utilicen.`}
                                                    form={PermissionController.destroy.form(
                                                        permission.id,
                                                    )}
                                                    errorKey="permission"
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </section>
            </div>
        </>
    );
}

export default function AccessControl(props: AccessControlProps) {
    return <AccessControlView {...props} section="roles" />;
}

AccessControl.layout = { breadcrumbs };
