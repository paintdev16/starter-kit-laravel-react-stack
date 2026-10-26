import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useConnectionStatus } from '@laravel/echo-react';
import { Tabs } from '@base-ui/react/tabs';
import {
    BellRing,
    ArchiveRestore,
    Check,
    Clock3,
    Globe2,
    LoaderCircle,
    LogIn,
    Mail,
    Radio,
    Save,
    Settings2,
    ShieldCheck,
    Smartphone,
    Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useState } from 'react';
import { update } from '@/actions/App/Http/Controllers/Web/Advanced/ApplicationSettingsController';
import { update as updateIntegrations } from '@/actions/App/Http/Controllers/Web/Advanced/IntegrationSettingsController';
import { Button } from '@/components/ui/button';
import { BackupSettingsPanel } from '@/components/backup-settings-panel';
import type { BackupSettings } from '@/components/backup-settings-panel';
import { SocialLoginSettingsPanel } from '@/components/social-login-settings';
import type { SocialLoginSettingsProps } from '@/components/social-login-settings';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { index as settingsIndex } from '@/routes/advanced/settings';

type Settings = { app_name: string; support_email: string; timezone: string };
type Features = { reverb_enabled: boolean; sanctum_enabled: boolean };
type SettingsTab = 'preferences' | 'integrations' | 'social-login' | 'backups';

function ReverbConnectionStatus() {
    const status = useConnectionStatus();
    const connected = status === 'connected';
    const connecting = status === 'connecting' || status === 'reconnecting';

    return (
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <span
                className={cn(
                    'size-2 rounded-full',
                    connected
                        ? 'bg-emerald-500'
                        : connecting
                          ? 'bg-amber-500'
                          : 'bg-destructive',
                )}
                aria-hidden="true"
            />
            Servidor{' '}
            {connected
                ? 'conectado'
                : connecting
                  ? 'conectando…'
                  : 'sin conexión'}
        </span>
    );
}

function IntegrationCard({
    id,
    title,
    description,
    icon: Icon,
    iconClassName,
    enabled,
    saving,
    disabled,
    onToggle,
    children,
}: {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    iconClassName: string;
    enabled: boolean;
    saving: boolean;
    disabled: boolean;
    onToggle: (enabled: boolean) => void;
    children: ReactNode;
}) {
    return (
        <div
            className="overflow-hidden rounded-2xl border border-border/70 bg-background/50 transition-colors hover:border-primary/35"
            aria-busy={saving}
        >
            <div className="flex items-start justify-between gap-4 p-5">
                <div className="flex min-w-0 items-start gap-3">
                    <span
                        className={cn(
                            'flex size-10 shrink-0 items-center justify-center rounded-xl',
                            iconClassName,
                        )}
                    >
                        <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <Label
                                htmlFor={id}
                                className="text-base font-semibold"
                            >
                                {title}
                            </Label>
                            <span
                                className={cn(
                                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                                    enabled
                                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                        : 'bg-muted text-muted-foreground',
                                )}
                            >
                                <span
                                    className={cn(
                                        'size-1.5 rounded-full',
                                        enabled
                                            ? 'bg-emerald-500'
                                            : 'bg-muted-foreground/60',
                                    )}
                                    aria-hidden="true"
                                />
                                {enabled ? 'Activado' : 'Desactivado'}
                            </span>
                        </div>
                        <p className="text-sm leading-6 text-muted-foreground">
                            {description}
                        </p>
                    </div>
                </div>
                <Switch
                    id={id}
                    className="mt-1 shrink-0"
                    checked={enabled}
                    onCheckedChange={onToggle}
                    disabled={disabled}
                />
            </div>
            <div className="flex min-h-11 items-center border-t border-border/60 bg-card/70 px-5 py-2.5">
                {saving ? (
                    <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <LoaderCircle
                            className="size-3.5 animate-spin"
                            aria-hidden="true"
                        />
                        Guardando cambio…
                    </span>
                ) : (
                    children
                )}
            </div>
        </div>
    );
}

export default function ApplicationSettings({
    settings,
    features,
    social_login: socialLogin,
    backup_settings: backupSettings,
}: {
    settings: Settings;
    features: Features;
    social_login: SocialLoginSettingsProps | null;
    backup_settings: BackupSettings | null;
}) {
    const { url } = usePage();
    const form = useForm(settings);
    const [savingIntegration, setSavingIntegration] = useState<
        keyof Features | null
    >(null);
    const activeIntegrations =
        Number(features.reverb_enabled) + Number(features.sanctum_enabled);
    const requestedTab = new URL(url, 'http://inertia.local').searchParams.get(
        'tab',
    );
    const initialTab: SettingsTab =
        requestedTab === 'backups' && backupSettings
            ? 'backups'
            : socialLogin && requestedTab === 'social-login'
              ? 'social-login'
              : 'preferences';
    const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.put(update().url, {
            preserveScroll: true,
            onSuccess: () =>
                toast.add({ type: 'success', title: 'Preferencias guardadas' }),
        });
    };

    const updateIntegration = (key: keyof Features, enabled: boolean) => {
        if (savingIntegration !== null) return;

        setSavingIntegration(key);
        router.put(
            updateIntegrations().url,
            { [key]: enabled },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.add({
                        type: 'success',
                        title:
                            (key === 'reverb_enabled'
                                ? 'Laravel Reverb'
                                : 'Laravel Sanctum') +
                            (enabled
                                ? ': acceso permitido'
                                : ': acceso bloqueado'),
                    });
                },
                onError: () => {
                    toast.add({
                        type: 'error',
                        title: 'No se pudo guardar la integración',
                    });
                },
                onFinish: () => setSavingIntegration(null),
            },
        );
    };

    return (
        <>
            <Head title="Configuración general" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 pb-10 md:gap-8 md:p-8">
                <section className="relative isolate overflow-hidden rounded-3xl border border-primary/15 bg-linear-to-br from-primary/18 via-card to-card p-6 shadow-lg shadow-primary/5 sm:p-8 lg:p-10">
                    <div className="pointer-events-none absolute -top-24 -right-16 -z-10 size-80 rounded-full bg-primary/12 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-28 left-1/3 -z-10 size-72 rounded-full bg-sky-400/10 blur-3xl" />
                    <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl space-y-5">
                            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-primary uppercase">
                                <Sparkles
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                                Centro de configuración
                            </span>
                            <div className="space-y-3">
                                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                                    Configuración general
                                </h1>
                                <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                                    Personaliza la identidad de la aplicación y
                                    controla las integraciones disponibles para
                                    tu equipo.
                                </p>
                            </div>
                        </div>
                        <div className="flex w-full flex-col gap-3 rounded-2xl border border-border/70 bg-card/85 p-4 shadow-sm backdrop-blur-sm sm:w-auto sm:min-w-64">
                            <div className="flex items-center gap-3">
                                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <ShieldCheck
                                        className="size-5"
                                        aria-hidden="true"
                                    />
                                </span>
                                <span className="text-sm font-semibold">
                                    Integraciones activas
                                </span>
                                <span className="ml-auto text-2xl font-bold text-primary tabular-nums">
                                    {activeIntegrations}
                                    <span className="text-base font-medium text-muted-foreground">
                                        /2
                                    </span>
                                </span>
                            </div>
                            <div
                                className="flex gap-1.5"
                                aria-label={
                                    activeIntegrations +
                                    ' de 2 integraciones activas'
                                }
                            >
                                <span
                                    className={cn(
                                        'h-1.5 flex-1 rounded-full',
                                        activeIntegrations > 0
                                            ? 'bg-primary'
                                            : 'bg-muted',
                                    )}
                                />
                                <span
                                    className={cn(
                                        'h-1.5 flex-1 rounded-full',
                                        activeIntegrations > 1
                                            ? 'bg-primary'
                                            : 'bg-muted',
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <Tabs.Root
                    value={activeTab}
                    onValueChange={(value) =>
                        setActiveTab(value as SettingsTab)
                    }
                    className="flex flex-col gap-5"
                >
                    <Tabs.List
                        className={cn(
                            'grid w-full max-w-3xl gap-1 rounded-2xl border border-border/70 bg-muted/50 p-1.5 shadow-sm',
                            backupSettings && socialLogin
                                ? 'grid-cols-2 sm:grid-cols-4'
                                : backupSettings || socialLogin
                                  ? 'grid-cols-3'
                                  : 'grid-cols-2',
                        )}
                    >
                        <Tabs.Tab
                            value="preferences"
                            className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-background/70 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[active]:bg-background data-[active]:text-foreground data-[active]:shadow-sm sm:gap-2.5 sm:px-5"
                        >
                            <Settings2
                                className="size-4 text-primary"
                                aria-hidden="true"
                            />
                            <span>Preferencias</span>
                        </Tabs.Tab>
                        <Tabs.Tab
                            value="integrations"
                            className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-background/70 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[active]:bg-background data-[active]:text-foreground data-[active]:shadow-sm sm:gap-2.5 sm:px-5"
                        >
                            <Radio
                                className="size-4 text-sky-600 dark:text-sky-300"
                                aria-hidden="true"
                            />
                            <span>Integraciones</span>
                            <span className="hidden rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary md:inline-flex">
                                {activeIntegrations}/2
                            </span>
                        </Tabs.Tab>
                        {socialLogin && (
                            <Tabs.Tab
                                value="social-login"
                                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-background/70 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[active]:bg-background data-[active]:text-foreground data-[active]:shadow-sm sm:gap-2.5 sm:px-5"
                            >
                                <LogIn
                                    className="size-4 text-violet-600 dark:text-violet-300"
                                    aria-hidden="true"
                                />
                                <span>Inicio social</span>
                            </Tabs.Tab>
                        )}
                        {backupSettings && (
                            <Tabs.Tab
                                value="backups"
                                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-background/70 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[active]:bg-background data-[active]:text-foreground data-[active]:shadow-sm sm:gap-2.5 sm:px-5"
                            >
                                <ArchiveRestore
                                    className="size-4 text-emerald-600"
                                    aria-hidden="true"
                                />
                                <span>Respaldos</span>
                            </Tabs.Tab>
                        )}
                    </Tabs.List>

                    <Tabs.Panel
                        value="preferences"
                        className="max-w-5xl focus-visible:outline-none"
                    >
                        <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
                            <div className="flex items-start gap-4 border-b border-border/70 p-6 sm:p-7">
                                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <Settings2
                                        className="size-6"
                                        aria-hidden="true"
                                    />
                                </span>
                                <div className="space-y-1">
                                    <h2 className="text-xl font-semibold tracking-tight">
                                        Preferencias
                                    </h2>
                                    <p className="text-sm leading-6 text-muted-foreground">
                                        Datos visibles y ajustes básicos de la
                                        aplicación.
                                    </p>
                                </div>
                            </div>
                            <form onSubmit={submit} className="p-6 sm:p-7">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="grid gap-2 md:col-span-2">
                                        <Label
                                            htmlFor="app_name"
                                            className="text-sm font-semibold"
                                        >
                                            Nombre de la aplicación
                                        </Label>
                                        <div className="relative">
                                            <Globe2
                                                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                                                aria-hidden="true"
                                            />
                                            <Input
                                                id="app_name"
                                                className="h-11 pl-10"
                                                value={form.data.app_name}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'app_name',
                                                        event.target.value,
                                                    )
                                                }
                                                aria-invalid={Boolean(
                                                    form.errors.app_name,
                                                )}
                                            />
                                        </div>
                                        {form.errors.app_name && (
                                            <p className="text-sm text-destructive">
                                                {form.errors.app_name}
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor="support_email"
                                            className="text-sm font-semibold"
                                        >
                                            Correo de soporte
                                        </Label>
                                        <div className="relative">
                                            <Mail
                                                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                                                aria-hidden="true"
                                            />
                                            <Input
                                                id="support_email"
                                                type="email"
                                                className="h-11 pl-10"
                                                placeholder="soporte@empresa.com"
                                                value={form.data.support_email}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'support_email',
                                                        event.target.value,
                                                    )
                                                }
                                                aria-invalid={Boolean(
                                                    form.errors.support_email,
                                                )}
                                            />
                                        </div>
                                        {form.errors.support_email && (
                                            <p className="text-sm text-destructive">
                                                {form.errors.support_email}
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor="timezone"
                                            className="text-sm font-semibold"
                                        >
                                            Zona horaria
                                        </Label>
                                        <div className="relative">
                                            <Clock3
                                                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                                                aria-hidden="true"
                                            />
                                            <Input
                                                id="timezone"
                                                className="h-11 pl-10"
                                                placeholder="America/Lima"
                                                value={form.data.timezone}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'timezone',
                                                        event.target.value,
                                                    )
                                                }
                                                aria-invalid={Boolean(
                                                    form.errors.timezone,
                                                )}
                                            />
                                        </div>
                                        {form.errors.timezone && (
                                            <p className="text-sm text-destructive">
                                                {form.errors.timezone}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-7 flex flex-col gap-3 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
                                    <p
                                        className="text-sm text-muted-foreground"
                                        aria-live="polite"
                                    >
                                        {form.processing
                                            ? 'Guardando preferencias…'
                                            : form.isDirty
                                              ? 'Tienes cambios sin guardar'
                                              : 'Todos los cambios están guardados'}
                                    </p>
                                    <Button
                                        type="submit"
                                        disabled={
                                            form.processing || !form.isDirty
                                        }
                                        className="h-10 gap-2 sm:min-w-44"
                                    >
                                        {form.processing ? (
                                            <LoaderCircle className="size-4 animate-spin" />
                                        ) : (
                                            <Save className="size-4" />
                                        )}
                                        {form.processing
                                            ? 'Guardando…'
                                            : 'Guardar cambios'}
                                    </Button>
                                </div>
                            </form>
                        </section>
                    </Tabs.Panel>

                    <Tabs.Panel
                        value="integrations"
                        className="max-w-5xl focus-visible:outline-none"
                    >
                        <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
                            <div className="flex items-start gap-4 border-b border-border/70 p-6 sm:p-7">
                                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-300">
                                    <Radio
                                        className="size-6"
                                        aria-hidden="true"
                                    />
                                </span>
                                <div className="space-y-1">
                                    <h2 className="text-xl font-semibold tracking-tight">
                                        Integraciones
                                    </h2>
                                    <p className="text-sm leading-6 text-muted-foreground">
                                        Activa los servicios que necesita tu
                                        aplicación.
                                    </p>
                                </div>
                            </div>
                            <div className="grid gap-4 p-6 sm:p-7">
                                <IntegrationCard
                                    id="reverb_enabled"
                                    title="Laravel Reverb"
                                    description="Notificaciones en tiempo real y canales privados."
                                    icon={BellRing}
                                    iconClassName="bg-primary/10 text-primary"
                                    enabled={features.reverb_enabled}
                                    saving={
                                        savingIntegration === 'reverb_enabled'
                                    }
                                    disabled={savingIntegration !== null}
                                    onToggle={(checked) =>
                                        updateIntegration(
                                            'reverb_enabled',
                                            checked,
                                        )
                                    }
                                >
                                    {features.reverb_enabled ? (
                                        <ReverbConnectionStatus />
                                    ) : (
                                        <span className="text-xs text-muted-foreground">
                                            Actívalo para permitir avisos en
                                            tiempo real.
                                        </span>
                                    )}
                                </IntegrationCard>
                                <IntegrationCard
                                    id="sanctum_enabled"
                                    title="Laravel Sanctum"
                                    description="Acceso a la API móvil y emisión de tokens."
                                    icon={Smartphone}
                                    iconClassName="bg-violet-500/10 text-violet-700 dark:text-violet-300"
                                    enabled={features.sanctum_enabled}
                                    saving={
                                        savingIntegration === 'sanctum_enabled'
                                    }
                                    disabled={savingIntegration !== null}
                                    onToggle={(checked) =>
                                        updateIntegration(
                                            'sanctum_enabled',
                                            checked,
                                        )
                                    }
                                >
                                    {features.sanctum_enabled ? (
                                        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                                            <Check className="size-3.5 text-emerald-600" />{' '}
                                            La API móvil permite tokens.
                                        </span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">
                                            Los tokens quedan bloqueados hasta
                                            reactivarlo.
                                        </span>
                                    )}
                                </IntegrationCard>
                                <p className="rounded-xl border border-primary/15 bg-primary/5 p-4 text-xs leading-5 text-muted-foreground">
                                    Reverb requiere un servidor activo. Este
                                    interruptor controla su uso dentro de la
                                    aplicación.
                                </p>
                            </div>
                        </section>
                    </Tabs.Panel>
                    {socialLogin && (
                        <Tabs.Panel
                            value="social-login"
                            className="max-w-5xl focus-visible:outline-none"
                        >
                            <SocialLoginSettingsPanel {...socialLogin} />
                        </Tabs.Panel>
                    )}
                    {backupSettings && (
                        <Tabs.Panel
                            value="backups"
                            className="max-w-5xl focus-visible:outline-none"
                        >
                            <BackupSettingsPanel settings={backupSettings} />
                        </Tabs.Panel>
                    )}
                </Tabs.Root>
            </div>
        </>
    );
}

ApplicationSettings.layout = {
    breadcrumbs: [{ title: 'Configuración general', href: settingsIndex() }],
};
