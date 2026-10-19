import { Form, Head, router } from '@inertiajs/react';
import { Chrome, CircleAlert, Github, LoaderCircle, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { ReactElement } from 'react';
import SocialLoginSettingsController from '@/actions/App/Http/Controllers/Web/AccessControl/SocialLoginSettingsController';
import InputError from '@/components/input-error';
import { AccessControlTabs } from '@/components/access-control-tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { index as socialLoginIndex } from '@/routes/access-control/social-login';
import type { BreadcrumbItem } from '@/types';

type ProviderName = 'github' | 'google';

type Provider = {
    provider: ProviderName;
    label: string;
    enabled: boolean;
    configured: boolean;
    has_saved_credentials: boolean;
    client_id: string | null;
    callback_url: string;
    client_id_env: string;
    client_secret_env: string;
};

type Props = {
    providers: Provider[];
    available_providers: Partial<Record<ProviderName, string>>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Usuarios', href: usersIndex() },
    { title: 'Inicio social', href: socialLoginIndex() },
];

function ProviderDialog({
    provider,
    availableProviders,
    trigger,
}: {
    provider?: Provider;
    availableProviders: Partial<Record<ProviderName, string>>;
    trigger: ReactElement;
}) {
    const [open, setOpen] = useState(false);
    const editing = Boolean(provider);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={trigger} />
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        {editing ? <Pencil className="size-5" /> : <Plus className="size-5" />}
                    </span>
                    <DialogTitle>{editing ? `Configurar ${provider?.label}` : 'Agregar proveedor'}</DialogTitle>
                    <DialogDescription>
                        Registra las credenciales OAuth para que este proveedor pueda iniciar sesión.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...(provider
                        ? SocialLoginSettingsController.update.form(provider.provider)
                        : SocialLoginSettingsController.store.form())}
                    options={{ preserveScroll: true }}
                    onSuccess={() => setOpen(false)}
                    className="space-y-5"
                >
                    {({ errors, processing }) => (
                        <>
                            {!editing && (
                                <div className="grid gap-2">
                                    <Label htmlFor="social-provider">Proveedor</Label>
                                    <select
                                        id="social-provider"
                                        name="provider"
                                        required
                                        defaultValue=""
                                        className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <option value="" disabled>Selecciona un proveedor</option>
                                        {Object.entries(availableProviders).map(([name, label]) => (
                                            <option key={name} value={name}>{label}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.provider} />
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor={`client-id-${provider?.provider ?? 'new'}`}>Client ID</Label>
                                <Input
                                    id={`client-id-${provider?.provider ?? 'new'}`}
                                    name="client_id"
                                    defaultValue={provider?.client_id ?? ''}
                                    autoComplete="off"
                                    required
                                    maxLength={255}
                                    placeholder="ID de la aplicación OAuth"
                                    aria-invalid={Boolean(errors.client_id)}
                                />
                                <InputError message={errors.client_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor={`client-secret-${provider?.provider ?? 'new'}`}>Client Secret</Label>
                                <Input
                                    id={`client-secret-${provider?.provider ?? 'new'}`}
                                    name="client_secret"
                                    type="password"
                                    autoComplete="new-password"
                                    required={!editing}
                                    maxLength={4096}
                                    placeholder={editing ? 'Vacío para conservar el secreto actual' : 'Se guardará cifrado'}
                                    aria-invalid={Boolean(errors.client_secret)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {editing
                                        ? 'El valor actual nunca se muestra. Escribe uno nuevo solo si quieres reemplazarlo.'
                                        : 'El secreto se cifra antes de guardarse en la base de datos.'}
                                </p>
                                <InputError message={errors.client_secret} />
                            </div>

                            <InputError message={errors.provider} />
                            <DialogFooter>
                                <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
                                <Button type="submit" disabled={processing || (!editing && Object.keys(availableProviders).length === 0)}>
                                    {processing ? 'Guardando…' : editing ? 'Guardar cambios' : 'Agregar proveedor'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function DeleteProviderDialog({ provider, trigger }: { provider: Provider; trigger: ReactElement }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={trigger} />
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <span className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                        <Trash2 className="size-5" />
                    </span>
                    <DialogTitle>Eliminar {provider.label}</DialogTitle>
                    <DialogDescription>
                        Se quitará de la lista y dejará de aparecer en el inicio de sesión. Puedes volver a agregarlo después.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    {...SocialLoginSettingsController.destroy.form(provider.provider)}
                    options={{ preserveScroll: true }}
                    onSuccess={() => setOpen(false)}
                >
                    {({ processing }) => (
                        <DialogFooter>
                            <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
                            <Button type="submit" variant="destructive" disabled={processing}>
                                {processing ? 'Eliminando…' : 'Eliminar proveedor'}
                            </Button>
                        </DialogFooter>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function SocialLoginSettings({ providers, available_providers: availableProviders }: Props) {
    const [processingProvider, setProcessingProvider] = useState<ProviderName | null>(null);
    const enabledCount = providers.filter((provider) => provider.enabled).length;

    function toggle(provider: Provider) {
        if (processingProvider || (!provider.configured && !provider.enabled)) return;

        router.patch(
            SocialLoginSettingsController.update(provider.provider).url,
            { enabled: !provider.enabled },
            {
                preserveScroll: true,
                onStart: () => setProcessingProvider(provider.provider),
                onFinish: () => setProcessingProvider(null),
            },
        );
    }

    return (
        <>
            <Head title="Inicio de sesión social" />

            <div className="space-y-6">
                <div className="space-y-4">
                    <AccessControlTabs active="social-login" />

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-sm font-medium text-primary">Control de acceso</p>
                            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Inicio de sesión social</h1>
                            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                                Agrega y administra proveedores OAuth disponibles para iniciar sesión.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs text-muted-foreground">
                                <span className="size-2 rounded-full bg-emerald-500" />
                                {enabledCount} de {providers.length} activos
                            </span>
                            <ProviderDialog
                                availableProviders={availableProviders}
                                trigger={
                                    <Button disabled={Object.keys(availableProviders).length === 0}>
                                        <Plus /> Agregar proveedor
                                    </Button>
                                }
                            />
                        </div>
                    </div>
                </div>

                {providers.length > 0 ? (
                    <div className="grid gap-4 xl:grid-cols-2">
                        {providers.map((provider) => {
                            const Icon = provider.provider === 'github' ? Github : Chrome;
                            const isProcessing = processingProvider === provider.provider;

                            return (
                                <Card key={provider.provider} className="overflow-hidden border-border/70 py-0 shadow-sm">
                                    <CardHeader className="flex flex-row items-start justify-between gap-4 px-5 pt-5 pb-4">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground ring-1 ring-border/70">
                                                <Icon className="size-5" />
                                            </span>
                                            <div className="min-w-0">
                                                <CardTitle>{provider.label}</CardTitle>
                                                <CardDescription className="mt-1">Acceso mediante una cuenta de {provider.label}.</CardDescription>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={provider.enabled}
                                            aria-label={`${provider.enabled ? 'Desactivar' : 'Activar'} inicio con ${provider.label}`}
                                            disabled={isProcessing || (!provider.configured && !provider.enabled)}
                                            onClick={() => toggle(provider)}
                                            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${provider.enabled ? 'border-primary bg-primary' : 'border-border bg-muted'}`}
                                        >
                                            <span className={`flex size-5 items-center justify-center rounded-full bg-background shadow-sm transition-transform ${provider.enabled ? 'translate-x-6' : 'translate-x-0.5'}`}>
                                                {isProcessing && <LoaderCircle className="size-3 animate-spin text-primary" />}
                                            </span>
                                        </button>
                                    </CardHeader>

                                    <CardContent className="grid gap-4 border-t border-border/60 bg-muted/10 px-5 py-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${provider.enabled ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
                                                <span className={`size-1.5 rounded-full ${provider.enabled ? 'bg-emerald-500' : 'bg-muted-foreground/50'}`} />
                                                {provider.enabled ? 'Activo' : 'Desactivado'}
                                            </span>
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${provider.configured ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'}`}>
                                                {provider.configured ? <ShieldCheck className="size-3.5" /> : <CircleAlert className="size-3.5" />}
                                                {provider.configured ? 'Credenciales listas' : 'Faltan credenciales'}
                                            </span>
                                        </div>

                                        {!provider.configured && (
                                            <p className="text-xs leading-5 text-muted-foreground">
                                                Agrega las credenciales desde la configuración de este proveedor para poder activarlo.
                                            </p>
                                        )}

                                        <div className="grid gap-1.5">
                                            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">URI de retorno autorizada</p>
                                            <code className="block overflow-x-auto rounded-lg border border-border/70 bg-background px-3 py-2 text-xs text-foreground">{provider.callback_url}</code>
                                        </div>

                                        <div className="flex justify-end gap-2 border-t border-border/60 pt-3">
                                            <ProviderDialog
                                                provider={provider}
                                                availableProviders={availableProviders}
                                                trigger={<Button type="button" variant="outline" size="sm"><Pencil /> Configurar</Button>}
                                            />
                                            <DeleteProviderDialog
                                                provider={provider}
                                                trigger={<Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 /> Eliminar</Button>}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card className="border-dashed border-border/80 bg-muted/10 py-0">
                        <CardContent className="flex flex-col items-center px-6 py-12 text-center">
                            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck className="size-6" /></span>
                            <h2 className="mt-4 font-semibold">Aún no hay proveedores</h2>
                            <p className="mt-1 max-w-md text-sm text-muted-foreground">Agrega GitHub o Google con sus credenciales OAuth para habilitar el acceso social.</p>
                            <ProviderDialog
                                availableProviders={availableProviders}
                                trigger={<Button className="mt-5" disabled={Object.keys(availableProviders).length === 0}><Plus /> Agregar proveedor</Button>}
                            />
                        </CardContent>
                    </Card>
                )}

                <Card className="border-primary/15 bg-primary/5 py-0">
                    <CardContent className="flex gap-3 p-4">
                        <CircleAlert className="mt-0.5 size-4 shrink-0 text-primary" />
                        <p className="text-xs leading-5 text-muted-foreground">
                            Crea una aplicación OAuth en el proveedor y registra la URI de retorno mostrada en su tarjeta. Los secretos se guardan cifrados. Las cuentas nuevas reciben el rol Usuario; las existentes se vinculan usando un correo verificado. El segundo factor continúa activo para esas cuentas.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

SocialLoginSettings.layout = { breadcrumbs };
