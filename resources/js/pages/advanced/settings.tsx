import { Head, router, useForm } from '@inertiajs/react';
import { useConnectionStatus } from '@laravel/echo-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { Save, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import { update } from '@/actions/App/Http/Controllers/Web/Advanced/ApplicationSettingsController';
import { update as updateIntegrations } from '@/actions/App/Http/Controllers/Web/Advanced/IntegrationSettingsController';

type Settings = { app_name: string; support_email: string; timezone: string };
type Features = { reverb_enabled: boolean; sanctum_enabled: boolean };

function ReverbConnectionStatus() {
    const status = useConnectionStatus();

    return (
        <p className="text-xs text-muted-foreground">
            Servidor:{' '}
            {status === 'connected'
                ? 'conectado'
                : status === 'connecting' || status === 'reconnecting'
                  ? 'conectando…'
                  : 'sin conexión'}
        </p>
    );
}

export default function ApplicationSettings({
    settings,
    features,
}: {
    settings: Settings;
    features: Features;
}) {
    const form = useForm(settings);
    const [savingIntegration, setSavingIntegration] = useState<
        keyof Features | null
    >(null);
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.put(update().url);
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
                        title: `${key === 'reverb_enabled' ? 'Laravel Reverb' : 'Laravel Sanctum'}: ${enabled ? 'acceso permitido' : 'acceso bloqueado'}`,
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
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Configuración general
                    </h1>
                    <p className="text-muted-foreground">
                        Identidad y preferencias principales de la aplicación.
                    </p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings />
                            Preferencias
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={submit}
                            className="grid max-w-2xl gap-5"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="app_name">
                                    Nombre de la aplicación
                                </Label>
                                <Input
                                    id="app_name"
                                    value={form.data.app_name}
                                    onChange={(event) =>
                                        form.setData(
                                            'app_name',
                                            event.target.value,
                                        )
                                    }
                                />
                                {form.errors.app_name && (
                                    <p className="text-sm text-destructive">
                                        {form.errors.app_name}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="support_email">
                                    Correo de soporte
                                </Label>
                                <Input
                                    id="support_email"
                                    type="email"
                                    value={form.data.support_email}
                                    onChange={(event) =>
                                        form.setData(
                                            'support_email',
                                            event.target.value,
                                        )
                                    }
                                />
                                {form.errors.support_email && (
                                    <p className="text-sm text-destructive">
                                        {form.errors.support_email}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="timezone">Zona horaria</Label>
                                <Input
                                    id="timezone"
                                    value={form.data.timezone}
                                    onChange={(event) =>
                                        form.setData(
                                            'timezone',
                                            event.target.value,
                                        )
                                    }
                                />
                                {form.errors.timezone && (
                                    <p className="text-sm text-destructive">
                                        {form.errors.timezone}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                >
                                    <Save />
                                    Guardar cambios
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Integraciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid max-w-2xl gap-5">
                            <div className="flex items-center justify-between gap-6 rounded-lg border p-4">
                                <div className="grid gap-1">
                                    <Label htmlFor="reverb_enabled">
                                        Laravel Reverb
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Notificaciones en tiempo real y canales
                                        privados.
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {savingIntegration === 'reverb_enabled'
                                            ? 'Guardando…'
                                            : features.reverb_enabled
                                              ? 'Acceso permitido'
                                              : 'Acceso bloqueado'}
                                    </p>
                                    {features.reverb_enabled && (
                                        <ReverbConnectionStatus />
                                    )}
                                </div>
                                <Switch
                                    id="reverb_enabled"
                                    checked={features.reverb_enabled}
                                    onCheckedChange={(checked) =>
                                        updateIntegration(
                                            'reverb_enabled',
                                            checked,
                                        )
                                    }
                                    disabled={savingIntegration !== null}
                                />
                            </div>
                            <div className="flex items-center justify-between gap-6 rounded-lg border p-4">
                                <div className="grid gap-1">
                                    <Label htmlFor="sanctum_enabled">
                                        Laravel Sanctum
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Acceso a la API móvil y emisión de
                                        tokens.
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {savingIntegration === 'sanctum_enabled'
                                            ? 'Guardando…'
                                            : features.sanctum_enabled
                                              ? 'Acceso permitido'
                                              : 'Acceso bloqueado'}
                                    </p>
                                </div>
                                <Switch
                                    id="sanctum_enabled"
                                    checked={features.sanctum_enabled}
                                    onCheckedChange={(checked) =>
                                        updateIntegration(
                                            'sanctum_enabled',
                                            checked,
                                        )
                                    }
                                    disabled={savingIntegration !== null}
                                />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Al desactivar Sanctum, los tokens existentes
                                dejan de acceder a la API hasta que se reactive.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Reverb necesita un servidor activo; este
                                interruptor controla su uso dentro de la
                                aplicación.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
