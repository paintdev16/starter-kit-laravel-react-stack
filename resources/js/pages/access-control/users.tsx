import { Form, Head, usePage } from '@inertiajs/react';
import {
    Check,
    FileImage,
    ImagePlus,
    KeyRound,
    LockKeyhole,
    Pencil,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
    UserRound,
    UsersRound,
    Upload,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent, ReactElement } from 'react';
import UserController from '@/actions/App/Http/Controllers/Web/AccessControl/UserController';
import InputError from '@/components/input-error';
import { AccessControlTabs } from '@/components/access-control-tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { index as usersIndex } from '@/routes/access-control';
import type { Auth, BreadcrumbItem } from '@/types';

type Permission = { id: number; name: string; label: string };
type Role = {
    id: number;
    name: string;
    users_count: number;
    permissions: Permission[];
};
type AssignedRole = Pick<Role, 'id' | 'name' | 'permissions'>;
type ManagedUser = {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
    email_verified_at: string | null;
    created_at: string;
    roles: AssignedRole[];
    roles_count: number;
};
type Props = {
    users: ManagedUser[];
    roles: Role[];
    stats: { users: number; withRoles: number; superAdmins: number };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Usuarios', href: usersIndex() },
];

function initials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join('')
        .toUpperCase();
}

function RoleSelector({
    roles,
    selected,
    onChange,
}: {
    roles: Role[];
    selected: number[];
    onChange: (roleId: number, checked: boolean) => void;
}) {
    const permissionsByRole = useMemo(() => {
        const selectedRoles = roles.filter((role) => selected.includes(role.id));
        const permissions = new Map<number, Permission & { roles: string[] }>();

        selectedRoles.forEach((role) => {
            role.permissions.forEach((permission) => {
                const existing = permissions.get(permission.id);

                if (existing) {
                    existing.roles.push(role.name);
                } else {
                    permissions.set(permission.id, {
                        ...permission,
                        roles: [role.name],
                    });
                }
            });
        });

        return Array.from(permissions.values()).sort((a, b) =>
            a.label.localeCompare(b.label),
        );
    }, [roles, selected]);

    return (
        <section className="space-y-3">
            <div>
                <h3 className="text-sm font-medium">Roles</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                    Selecciona uno o varios roles para ver los permisos que hereda la cuenta.
                </p>
            </div>
            <div className="grid max-h-40 gap-1.5 overflow-y-auto rounded-xl border border-border/70 bg-muted/20 p-2 sm:grid-cols-2">
                {roles.map((role) => (
                    <Label
                        key={role.id}
                        className="flex cursor-pointer items-start gap-2.5 rounded-lg p-2 transition-colors hover:bg-background"
                    >
                        <Checkbox
                            name="roles[]"
                            value={String(role.id)}
                            checked={selected.includes(role.id)}
                            onCheckedChange={(checked) => onChange(role.id, checked)}
                            className="mt-0.5"
                        />
                        <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">
                                {role.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                                {role.permissions.length}{' '}
                                {role.permissions.length === 1 ? 'permiso' : 'permisos'}
                            </span>
                        </span>
                    </Label>
                ))}
                {roles.length === 0 && (
                    <p className="col-span-full px-2 py-4 text-center text-xs text-muted-foreground">
                        Primero crea un rol para poder asignarlo.
                    </p>
                )}
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/15 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-muted-foreground">
                        Permisos heredados
                    </p>
                    {permissionsByRole.length > 0 && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            {permissionsByRole.length}
                        </span>
                    )}
                </div>
                {permissionsByRole.length > 0 ? (
                    <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                        {permissionsByRole.map((permission) => (
                            <span
                                key={permission.id}
                                title={`${permission.name} · ${permission.roles.join(', ')}`}
                                className="rounded-lg border border-border/70 bg-background px-2.5 py-1.5 text-xs"
                            >
                                <span className="font-medium">{permission.label}</span>
                                <span className="ml-1.5 text-muted-foreground">
                                    · {permission.roles.join(', ')}
                                </span>
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="py-1 text-xs text-muted-foreground">
                        {selected.length === 0
                            ? 'Selecciona un rol para consultar sus permisos.'
                            : 'Los roles seleccionados no tienen permisos asignados.'}
                    </p>
                )}
            </div>
        </section>
    );
}

function AvatarUpload({
    user,
    avatarError,
}: {
    user?: ManagedUser;
    avatarError?: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const previews = useMemo(
        () =>
            selectedFiles.map((file) => ({
                file,
                url: URL.createObjectURL(file),
            })),
        [selectedFiles],
    );

    useEffect(
        () => () => previews.forEach(({ url }) => URL.revokeObjectURL(url)),
        [previews],
    );

    function syncFiles(files: File[]) {
        const nextFiles = [...selectedFiles, ...files].slice(0, 10);
        setSelectedFiles(nextFiles);

        if (inputRef.current) {
            const transfer = new DataTransfer();
            nextFiles.forEach((file) => transfer.items.add(file));
            inputRef.current.files = transfer.files;
        }
    }

    function removeFile(index: number) {
        const nextFiles = selectedFiles.filter((_, fileIndex) => fileIndex !== index);
        setSelectedFiles(nextFiles);

        if (inputRef.current) {
            const transfer = new DataTransfer();
            nextFiles.forEach((file) => transfer.items.add(file));
            inputRef.current.files = transfer.files;
        }
    }

    function handleDrop(event: DragEvent<HTMLButtonElement>) {
        event.preventDefault();
        setIsDragging(false);
        syncFiles(Array.from(event.dataTransfer.files).filter((file) => file.type.startsWith('image/')));
    }

    return (
        <section className="grid gap-3 sm:col-span-2">
            <div>
                <h3 className="text-sm font-medium">Foto de perfil</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                    Personaliza cómo aparece este usuario en la aplicación.
                </p>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-linear-to-br from-card via-card to-primary/5 p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 items-center gap-3 sm:w-52 sm:shrink-0">
                    <Avatar className="size-14 ring-2 ring-background shadow-sm">
                        <AvatarImage src={user?.avatar_url ?? undefined} alt={user?.name ?? 'Usuario'} />
                        <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                            {user ? initials(user.name) : <UserRound className="size-5" />}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">Foto actual</p>
                        <p className="truncate text-sm font-semibold">{user?.name ?? 'Nuevo usuario'}</p>
                        <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                            <Check className="size-3" />
                            {user?.avatar_url ? 'Perfil personalizado' : 'Iniciales por defecto'}
                        </span>
                    </div>
                </div>

                <div className="min-w-0 flex-1">
                    <input
                        ref={inputRef}
                        id={`user-avatars-${user?.id ?? 'new'}`}
                        name="avatars[]"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="sr-only"
                        aria-label="Seleccionar imágenes de perfil"
                        onChange={(event) => {
                            const files = Array.from(event.currentTarget.files ?? []);
                            event.currentTarget.value = '';
                            syncFiles(files);
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        onDragEnter={(event) => {
                            event.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragOver={(event) => event.preventDefault()}
                        onDragLeave={(event) => {
                            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                                setIsDragging(false);
                            }
                        }}
                        onDrop={handleDrop}
                        className={`group flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-4 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isDragging ? 'border-primary bg-primary/10 shadow-inner' : 'border-primary/25 bg-background/70 hover:border-primary/50 hover:bg-primary/5'}`}
                    >
                        <span className={`flex size-9 items-center justify-center rounded-xl transition-colors ${isDragging ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary group-hover:bg-primary/15'}`}>
                            {selectedFiles.length > 0 ? <ImagePlus className="size-4" /> : <Upload className="size-4" />}
                        </span>
                        <span className="text-sm font-medium">
                            {isDragging ? 'Suelta las imágenes aquí' : 'Haz clic o arrastra imágenes aquí'}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                            JPG, PNG o WebP · Máximo 5 MB por imagen · Hasta 10 imágenes
                        </span>
                    </button>
                    <InputError message={avatarError} className="mt-2" />
                </div>
            </div>

            {previews.length > 0 && (
                <div className="flex flex-wrap gap-3 rounded-xl border border-border/60 bg-muted/15 p-3">
                    {previews.map(({ file, url }, index) => (
                        <div key={`${file.name}-${file.lastModified}-${index}`} className="group/file relative size-[4.5rem] overflow-hidden rounded-xl border border-border bg-background shadow-sm">
                            <img src={url} alt={`Vista previa ${index + 1}`} className="size-full object-cover" />
                            <button
                                type="button"
                                className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-background/95 text-foreground opacity-0 shadow transition-opacity hover:bg-destructive hover:text-destructive-foreground focus-visible:opacity-100 group-hover/file:opacity-100"
                                aria-label={`Quitar ${file.name}`}
                                onClick={() => removeFile(index)}
                            >
                                <X className="size-3" />
                            </button>
                            <span className="absolute inset-x-0 bottom-0 flex items-center gap-1 truncate bg-background/90 px-1 py-0.5 text-[9px] text-muted-foreground">
                                <FileImage className="size-2.5 shrink-0" />
                                {file.name}
                            </span>
                        </div>
                    ))}
                    <div className="flex min-h-[4.5rem] min-w-24 flex-col justify-center px-1">
                        <p className="text-xs font-semibold">{previews.length} seleccionada{previews.length === 1 ? '' : 's'}</p>
                        <p className="text-[10px] text-muted-foreground">La última será la principal</p>
                    </div>
                </div>
            )}
        </section>
    );
}

function UserDialog({
    user,
    roles,
    trigger,
}: {
    user?: ManagedUser;
    roles: Role[];
    trigger: ReactElement;
}) {
    const [open, setOpen] = useState(false);
    const initialRoleIds = user?.roles.map((role) => role.id) ?? [];
    const roleIdsKey = initialRoleIds.join(',');
    const [selectedRoleIds, setSelectedRoleIds] = useState(initialRoleIds);

    useEffect(() => {
        if (open) {
            setSelectedRoleIds(roleIdsKey ? roleIdsKey.split(',').map(Number) : []);
        }
    }, [open, roleIdsKey]);

    function updateRole(roleId: number, checked: boolean) {
        setSelectedRoleIds((current) =>
            checked
                ? Array.from(new Set([...current, roleId]))
                : current.filter((id) => id !== roleId),
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={trigger} />
            <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        {user ? <Pencil className="size-5" /> : <UserRound className="size-5" />}
                    </span>
                    <DialogTitle>{user ? 'Editar usuario' : 'Crear usuario'}</DialogTitle>
                    <DialogDescription>
                        Administra los datos de acceso y los permisos heredados de sus roles.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...(user
                        ? UserController.update.form(user.id)
                        : UserController.store.form())}
                    options={{ preserveScroll: true }}
                    onSuccess={() => setOpen(false)}
                    className="space-y-5"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor={`user-name-${user?.id ?? 'new'}`}>
                                        Nombre
                                    </Label>
                                    <Input
                                        id={`user-name-${user?.id ?? 'new'}`}
                                        name="name"
                                        defaultValue={user?.name}
                                        placeholder="Nombre completo"
                                        autoComplete="name"
                                        required
                                        aria-invalid={Boolean(errors.name)}
                                    />
                                    <InputError message={errors.name} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor={`user-email-${user?.id ?? 'new'}`}>
                                        Correo electrónico
                                    </Label>
                                    <Input
                                        id={`user-email-${user?.id ?? 'new'}`}
                                        name="email"
                                        type="email"
                                        defaultValue={user?.email}
                                        placeholder="nombre@empresa.com"
                                        autoComplete="email"
                                        required
                                        aria-invalid={Boolean(errors.email)}
                                    />
                                    <InputError message={errors.email} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor={`user-password-${user?.id ?? 'new'}`}>
                                        {user ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                                    </Label>
                                    <Input
                                        id={`user-password-${user?.id ?? 'new'}`}
                                        name="password"
                                        type="password"
                                        autoComplete="new-password"
                                        required={!user}
                                        aria-invalid={Boolean(errors.password)}
                                    />
                                    <InputError message={errors.password} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor={`user-password-confirmation-${user?.id ?? 'new'}`}>
                                        Confirmar contraseña
                                    </Label>
                                    <Input
                                        id={`user-password-confirmation-${user?.id ?? 'new'}`}
                                        name="password_confirmation"
                                        type="password"
                                        autoComplete="new-password"
                                        required={!user}
                                    />
                                </div>
                            </div>

                            <AvatarUpload
                                key={`${user?.id ?? 'new'}-${open ? 'open' : 'closed'}`}
                                user={user}
                                avatarError={errors.avatars || errors['avatars.0']}
                            />

                            <div className="border-t border-border/70 pt-4">
                                <RoleSelector
                                    roles={roles}
                                    selected={selectedRoleIds}
                                    onChange={updateRole}
                                />
                            </div>
                            <InputError message={errors.roles} />
                            <InputError message={errors.user} />

                            <DialogFooter>
                                <DialogClose render={<Button type="button" variant="outline" />}>
                                    Cancelar
                                </DialogClose>
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? 'Guardando…'
                                        : user
                                          ? 'Guardar cambios'
                                          : 'Crear usuario'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function DeleteUserDialog({ user }: { user: ManagedUser }) {
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
                <span className="sr-only">Eliminar {user.name}</span>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <span className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                        <Trash2 className="size-5" />
                    </span>
                    <DialogTitle>Eliminar usuario</DialogTitle>
                    <DialogDescription>
                        Se eliminará la cuenta de {user.name}. Esta acción no se puede deshacer.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    {...UserController.destroy.form(user.id)}
                    options={{ preserveScroll: true }}
                    onSuccess={() => setOpen(false)}
                >
                    {({ errors, processing }) => (
                        <>
                            <InputError message={errors.user} />
                            <DialogFooter className="mt-5">
                                <DialogClose render={<Button type="button" variant="outline" />}>
                                    Cancelar
                                </DialogClose>
                                <Button type="submit" variant="destructive" disabled={processing}>
                                    {processing ? 'Eliminando…' : 'Eliminar usuario'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function Users({ users, roles, stats }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const [search, setSearch] = useState('');
    const filteredUsers = useMemo(() => {
        const term = search.trim().toLocaleLowerCase();

        if (!term) return users;

        return users.filter((user) =>
            [user.name, user.email, ...user.roles.map((role) => role.name)]
                .join(' ')
                .toLocaleLowerCase()
                .includes(term),
        );
    }, [search, users]);

    return (
        <>
            <Head title="Usuarios" />

            <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-lg shadow-primary/5 sm:p-8">
                    <div className="absolute -top-24 -right-20 size-64 rounded-full bg-primary/12 blur-3xl" />
                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <div className="max-w-2xl">
                            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                <LockKeyhole className="size-3.5" />
                                Control de acceso
                            </span>
                            <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                                Usuarios
                            </h1>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                                Administra las cuentas del equipo y sus niveles de acceso.
                            </p>
                        </div>
                        {auth.can.createUsers && (
                            <UserDialog
                                roles={roles}
                                trigger={
                                    <Button size="lg">
                                        <Plus />
                                        Nuevo usuario
                                    </Button>
                                }
                            />
                        )}
                    </div>
                </section>

                <section className="grid gap-3 sm:grid-cols-3">
                    {[
                        { label: 'Cuentas registradas', value: stats.users, icon: UsersRound },
                        { label: 'Con rol asignado', value: stats.withRoles, icon: ShieldCheck },
                        { label: 'Cuentas protegidas', value: stats.superAdmins, icon: LockKeyhole },
                    ].map((item) => (
                        <Card key={item.label} className="py-0">
                            <CardContent className="flex items-center gap-4 p-5">
                                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <item.icon className="size-5" />
                                </span>
                                <div>
                                    <p className="text-2xl font-semibold tracking-tight">{item.value}</p>
                                    <p className="text-xs text-muted-foreground sm:text-sm">{item.label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </section>

                <section className="space-y-4">
                    <AccessControlTabs active="users" />

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight">Directorio del equipo</h2>
                            <p className="text-sm text-muted-foreground">
                                {filteredUsers.length} {filteredUsers.length === 1 ? 'cuenta' : 'cuentas'}
                            </p>
                        </div>
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Buscar por nombre, correo o rol…"
                                className="pl-9"
                                aria-label="Buscar usuarios"
                            />
                        </div>
                    </div>

                    <Card className="py-0">
                        <CardContent className="divide-y divide-border/60 p-0">
                            {filteredUsers.map((user) => {
                                const protectedUser = user.roles.some((role) => role.name === 'super-admin');

                                return (
                                    <article
                                        key={user.id}
                                        className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:px-5"
                                    >
                                        <div className="flex min-w-0 flex-1 items-center gap-3">
                                            <Avatar className="size-11">
                                                <AvatarImage src={user.avatar_url ?? undefined} />
                                                <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                                                    {initials(user.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="truncate text-sm font-semibold">{user.name}</h3>
                                                    {protectedUser && (
                                                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                                                            Super-admin
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                                            {user.roles.map((role) => (
                                                <span key={role.id} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                                                    {role.name}
                                                </span>
                                            ))}
                                            {user.roles.length === 0 && (
                                                <span className="text-xs text-muted-foreground">Sin roles</span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span className="inline-flex items-center gap-1.5" title="Permisos heredados de roles">
                                                    <KeyRound className="size-3.5" />
                                                    {new Set(user.roles.flatMap((role) => role.permissions.map((permission) => permission.id))).size}
                                                </span>
                                                <span className="hidden sm:inline">
                                                    {user.email_verified_at ? 'Verificado' : 'Sin verificar'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {auth.can.updateUsers && !protectedUser && (
                                                    <UserDialog
                                                        key={`edit-user-${user.id}`}
                                                        user={user}
                                                        roles={roles}
                                                        trigger={
                                                            <Button variant="ghost" size="icon-sm">
                                                                <Pencil />
                                                                <span className="sr-only">Editar {user.name}</span>
                                                            </Button>
                                                        }
                                                    />
                                                )}
                                                {auth.can.deleteUsers && !protectedUser && user.id !== auth.user.id && (
                                                    <DeleteUserDialog user={user} />
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                            {filteredUsers.length === 0 && (
                                <div className="flex flex-col items-center px-6 py-14 text-center">
                                    <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                                        <UsersRound className="size-5" />
                                    </span>
                                    <h3 className="mt-4 font-medium">No se encontraron usuarios</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Prueba con otro término o crea una cuenta nueva.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </>
    );
}

Users.layout = { breadcrumbs };
