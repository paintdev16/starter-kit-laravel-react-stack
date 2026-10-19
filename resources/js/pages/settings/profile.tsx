import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    BadgeCheck,
    CalendarDays,
    Camera,
    Check,
    CircleUserRound,
    Crown,
    IdCard,
    KeyRound,
    LockKeyhole,
    LoaderCircle,
    Mail,
    Pencil,
    ShieldCheck,
} from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Web/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import SecuritySettings, {
    type SecuritySettingsProps,
} from '@/components/security-settings';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { useInitials } from '@/hooks/use-initials';
import { humanizeAccessName } from '@/lib/access-control';
import { index as accessControl } from '@/routes/access-control';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

type ProfileProps = SecuritySettingsProps & {
    mustVerifyEmail: boolean;
    status?: string;
};

const roleLabels: Record<string, string> = {
    'super-admin': 'Superadministrador',
    administrador: 'Administrador',
    usuario: 'Usuario',
};

export default function Profile(props: ProfileProps) {
    const { mustVerifyEmail, status } = props;
    const { auth } = usePage<PageProps>().props;
    const [profileOpen, setProfileOpen] = useState(false);
    const [avatarProcessing, setAvatarProcessing] = useState(false);
    const [avatarError, setAvatarError] = useState<string | null>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const user = auth.user;
    const getInitials = useInitials();
    const emailVerified = user.email_verified_at !== null;
    const memberSince = new Intl.DateTimeFormat('es-PE', {
        month: 'long',
        year: 'numeric',
    }).format(new Date(user.created_at));

    function updateAvatar(event: ChangeEvent<HTMLInputElement>) {
        const file = event.currentTarget.files?.[0];

        if (!file) return;

        setAvatarError(null);
        setAvatarProcessing(true);
        router.patch(
            ProfileController.updateAvatar.url(),
            { avatar: file },
            {
                forceFormData: true,
                preserveScroll: true,
                onError: (errors) => setAvatarError(errors.avatar ?? null),
                onFinish: () => setAvatarProcessing(false),
            },
        );
        event.currentTarget.value = '';
    }

    return (
        <>
            <Head title="Perfil" />

            <div className="space-y-10">
                <Card className="relative isolate overflow-hidden border-border/70 py-0 shadow-lg shadow-primary/5">
                    <div className="absolute inset-0 -z-20 bg-card" />
                    <div className="absolute inset-x-0 top-0 -z-10 h-44 bg-linear-to-br from-primary/20 via-primary/7 to-transparent" />
                    <div className="absolute -top-24 -right-20 -z-10 size-64 rounded-full bg-primary/10 blur-3xl" />

                    <CardContent className="px-5 py-6 sm:px-7 sm:py-8">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex min-w-0 flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
                                <div className="flex shrink-0 flex-col items-center gap-2">
                                    <div className="group/avatar relative rounded-full bg-background/90 p-1.5 shadow-xl ring-1 ring-border/70">
                                        <Avatar className="size-24 text-2xl">
                                            <AvatarImage
                                                src={user.avatar ?? undefined}
                                                alt={user.name}
                                            />
                                            <AvatarFallback className="bg-primary/12 font-semibold text-primary">
                                                {getInitials(user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <button
                                            type="button"
                                            className="absolute inset-[6px] z-10 flex items-center justify-center rounded-full text-white transition-colors hover:bg-black/45 focus-visible:bg-black/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                            aria-label="Cambiar foto de perfil"
                                            disabled={avatarProcessing}
                                            onClick={() =>
                                                avatarInputRef.current?.click()
                                            }
                                        >
                                            <span className="flex flex-col items-center gap-1 opacity-0 transition-opacity group-hover/avatar:opacity-100 group-focus-within/avatar:opacity-100">
                                                {avatarProcessing ? (
                                                    <LoaderCircle className="size-5 animate-spin" />
                                                ) : (
                                                    <Camera className="size-5" />
                                                )}
                                                <span className="text-[10px] font-medium">
                                                    Cambiar
                                                </span>
                                            </span>
                                        </button>
                                        <input
                                            ref={avatarInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="sr-only"
                                            tabIndex={-1}
                                            aria-label="Seleccionar nueva foto de perfil"
                                            onChange={updateAvatar}
                                        />
                                        <span className="pointer-events-none absolute right-1 bottom-1 z-20 flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-4 ring-background">
                                            <Check className="size-3.5" />
                                        </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {avatarProcessing
                                            ? 'Subiendo foto…'
                                            : 'Haz clic para cambiar la foto'}
                                    </span>
                                    <InputError
                                        message={avatarError ?? undefined}
                                        className="max-w-44 text-center"
                                    />
                                </div>

                                <div className="min-w-0 space-y-3">
                                    <div>
                                        <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                                            Mi cuenta
                                        </p>
                                        <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                                            {user.name}
                                        </h1>
                                        <p className="mt-1 truncate text-sm text-muted-foreground sm:text-base">
                                            {user.email}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${emailVerified ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'}`}
                                        >
                                            {emailVerified ? (
                                                <BadgeCheck className="size-3.5" />
                                            ) : (
                                                <Mail className="size-3.5" />
                                            )}
                                            {emailVerified
                                                ? 'Correo verificado'
                                                : 'Correo sin verificar'}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-background/75 px-2.5 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/70">
                                            <CalendarDays className="size-3.5" />
                                            Desde {memberSince}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
                                <Dialog
                                    open={profileOpen}
                                    onOpenChange={setProfileOpen}
                                >
                                    <DialogTrigger
                                        render={<Button size="lg" />}
                                    >
                                        <Pencil />
                                        Editar perfil
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-lg">
                                        <DialogHeader>
                                            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                <CircleUserRound className="size-5" />
                                            </span>
                                            <DialogTitle>
                                                Editar información personal
                                            </DialogTitle>
                                            <DialogDescription>
                                                Actualiza el nombre y el correo
                                                vinculados a tu cuenta.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <Form
                                            {...ProfileController.update.form()}
                                            options={{
                                                preserveScroll: true,
                                            }}
                                            setDefaultsOnSuccess
                                            onSuccess={() =>
                                                setProfileOpen(false)
                                            }
                                            className="space-y-5"
                                        >
                                            {({ errors, processing }) => (
                                                <>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="name">
                                                            Nombre completo
                                                        </Label>
                                                        <div className="relative">
                                                            <CircleUserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                                            <Input
                                                                id="name"
                                                                className="h-10 pl-9"
                                                                defaultValue={
                                                                    user.name
                                                                }
                                                                name="name"
                                                                required
                                                                autoComplete="name"
                                                                placeholder="Tu nombre completo"
                                                                aria-invalid={Boolean(
                                                                    errors.name,
                                                                )}
                                                            />
                                                        </div>
                                                        <InputError
                                                            message={errors.name}
                                                        />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label htmlFor="email">
                                                            Correo electrónico
                                                        </Label>
                                                        <div className="relative">
                                                            <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                                            <Input
                                                                id="email"
                                                                type="email"
                                                                className="h-10 pl-9"
                                                                defaultValue={
                                                                    user.email
                                                                }
                                                                name="email"
                                                                required
                                                                autoComplete="username"
                                                                placeholder="tu@correo.com"
                                                                aria-invalid={Boolean(
                                                                    errors.email,
                                                                )}
                                                            />
                                                        </div>
                                                        <InputError
                                                            message={
                                                                errors.email
                                                            }
                                                        />
                                                    </div>

                                                    <DialogFooter className="mt-6">
                                                        <DialogClose
                                                            render={
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                />
                                                            }
                                                        >
                                                            Cancelar
                                                        </DialogClose>
                                                        <Button
                                                            type="submit"
                                                            disabled={processing}
                                                            data-test="update-profile-button"
                                                        >
                                                            {processing
                                                                ? 'Guardando…'
                                                                : 'Guardar cambios'}
                                                        </Button>
                                                    </DialogFooter>
                                                </>
                                            )}
                                        </Form>
                                    </DialogContent>
                                </Dialog>

                                <div className="flex items-center justify-center gap-2 rounded-lg bg-background/65 px-3 py-2 text-xs text-muted-foreground ring-1 ring-border/70 backdrop-blur-sm">
                                    <ShieldCheck className="size-4 text-primary" />
                                    ID de cuenta #{user.id}
                                </div>
                            </div>
                        </div>

                        {mustVerifyEmail && !emailVerified && (
                            <div className="mt-6 flex flex-col gap-3 rounded-xl border border-amber-500/20 bg-amber-500/8 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-start gap-3">
                                    <Mail className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-300" />
                                    <div>
                                        <p className="text-sm font-medium">
                                            Verifica tu correo electrónico
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                            Confirma tu dirección para reforzar
                                            la seguridad de la cuenta.
                                        </p>
                                        {status ===
                                            'verification-link-sent' && (
                                            <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                Enviamos un nuevo enlace de
                                                verificación.
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <Link
                                    href={send()}
                                    as="button"
                                    className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-muted"
                                >
                                    Reenviar correo
                                    <ArrowUpRight className="size-3.5" />
                                </Link>
                            </div>
                        )}

                        <div className="mt-6 grid gap-3 border-t border-border/60 pt-5 sm:grid-cols-3">
                            <div className="flex items-center gap-3 rounded-xl bg-background/55 p-3 ring-1 ring-border/60">
                                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <CircleUserRound className="size-4" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground">
                                        Nombre
                                    </p>
                                    <p className="truncate text-sm font-medium">
                                        {user.name}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-xl bg-background/55 p-3 ring-1 ring-border/60">
                                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Mail className="size-4" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground">
                                        Correo
                                    </p>
                                    <p className="truncate text-sm font-medium">
                                        {user.email}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-xl bg-background/55 p-3 ring-1 ring-border/60">
                                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <IdCard className="size-4" />
                                </span>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Estado
                                    </p>
                                    <p className="text-sm font-medium">
                                        Cuenta activa
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-border/70 py-0 shadow-sm">
                    <div className="pointer-events-none absolute -top-28 -left-24 size-64 rounded-full bg-primary/8 blur-3xl" />
                    <CardContent className="relative p-5 sm:p-7">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex gap-3">
                                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                                    <LockKeyhole className="size-5" />
                                </span>
                                <div>
                                    <h2 className="text-lg font-semibold tracking-tight">
                                        Acceso de la cuenta
                                    </h2>
                                    <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                                        Roles asignados y acciones permitidas para
                                        tu usuario.
                                    </p>
                                </div>
                            </div>

                            {auth.can.viewAccessControl && (
                                <Button
                                    variant="outline"
                                    nativeButton={false}
                                    render={<Link href={accessControl()} />}
                                >
                                    Administrar acceso
                                    <ArrowUpRight />
                                </Button>
                            )}
                        </div>

                        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.5fr)]">
                            <section className="rounded-2xl border border-border/70 bg-background/60 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Crown className="size-4 text-primary" />
                                        <h3 className="text-sm font-semibold">
                                            Roles
                                        </h3>
                                    </div>
                                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                        {auth.roles.length}
                                    </span>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {auth.roles.map((role) => (
                                        <span
                                            key={role}
                                            className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary ring-1 ring-primary/15"
                                        >
                                            <ShieldCheck className="size-4" />
                                            {roleLabels[role] ??
                                                humanizeAccessName(role)}
                                        </span>
                                    ))}
                                    {auth.roles.length === 0 && (
                                        <div className="w-full rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                                            No tienes roles asignados.
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section className="rounded-2xl border border-border/70 bg-background/60 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <KeyRound className="size-4 text-primary" />
                                        <h3 className="text-sm font-semibold">
                                            Permisos efectivos
                                        </h3>
                                    </div>
                                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                        {auth.permissions.length}
                                    </span>
                                </div>

                                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                    {auth.permissions.map((permission) => (
                                        <div
                                            key={permission.name}
                                            className="flex min-w-0 items-center gap-2.5 rounded-xl border border-border/60 bg-card px-3 py-2.5"
                                        >
                                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                                                <Check className="size-3.5" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">
                                                    {permission.label}
                                                </p>
                                                <p className="truncate text-[11px] text-muted-foreground">
                                                    {permission.name}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {auth.permissions.length === 0 && (
                                        <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground sm:col-span-2">
                                            No tienes permisos efectivos asignados.
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </CardContent>
                </Card>

                <SecuritySettings {...props} />

                <DeleteUser />
            </div>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Perfil',
            href: edit(),
        },
    ],
};
