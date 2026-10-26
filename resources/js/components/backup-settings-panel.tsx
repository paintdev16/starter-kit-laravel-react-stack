import { router, useForm } from '@inertiajs/react';
import {
    ArchiveRestore,
    Cloud,
    HardDrive,
    LoaderCircle,
    LockKeyhole,
    ShieldCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
    update,
    updatePassword,
    restore,
} from '@/actions/App/Http/Controllers/Web/Advanced/BackupSettingsController';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';

export type BackupSettings = {
    enabled: boolean;
    disk: string;
    available: boolean;
    password_type: 'app_key' | 'dedicated';
    backups: { name: string; created_at: string; size_bytes: number }[];
    restores: {
        id: string;
        automatic: boolean;
        archive: string;
        status: string;
        error: string | null;
        created_at: string;
        finished_at: string | null;
        path: string | null;
    }[];
};

export function BackupSettingsPanel({
    settings,
}: {
    settings: BackupSettings;
}) {
    const [saving, setSaving] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const activeRestore = settings.restores.some((run) =>
        ['pending', 'running'].includes(run.status),
    );

    useEffect(() => {
        if (!activeRestore) return;
        const timer = window.setInterval(
            () => router.reload({ only: ['backup_settings'] }),
            5000,
        );
        return () => window.clearInterval(timer);
    }, [activeRestore]);

    const toggle = (enabled: boolean) => {
        setSaving(true);
        router.put(
            update().url,
            { enabled },
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.add({
                        type: 'success',
                        title: enabled
                            ? 'Respaldos automáticos activados'
                            : 'Respaldos automáticos desactivados',
                    }),
                onError: () =>
                    toast.add({
                        type: 'error',
                        title: 'No se pudo cambiar la programación',
                    }),
                onFinish: () => setSaving(false),
            },
        );
    };

    const submitRestore = () => {
        if (!selected || !confirmed || restoring) return;
        setRestoring(true);
        router.post(
            restore().url,
            { archive: selected, password, confirmation: true },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.add({
                        type: 'success',
                        title: 'Restauración enviada a la cola',
                    });
                    setSelected(null);
                    setPassword('');
                    setConfirmed(false);
                },
                onError: (errors) =>
                    toast.add({
                        type: 'error',
                        title:
                            errors.archive ??
                            'No se pudo iniciar la restauración',
                    }),
                onFinish: () => setRestoring(false),
            },
        );
    };

    const savePassword = (event: FormEvent) => {
        event.preventDefault();
        passwordForm.put(updatePassword().url, {
            preserveScroll: true,
            onSuccess: () => {
                passwordForm.reset();
                toast.add({
                    type: 'success',
                    title: 'Contraseña de respaldos actualizada',
                });
            },
            onError: () =>
                toast.add({
                    type: 'error',
                    title: 'Revisa los datos de la contraseña',
                }),
        });
    };

    return (
        <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
                <div className="flex flex-col gap-4 border-b border-border/70 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Cloud className="size-6" aria-hidden="true" />
                        </span>
                        <div>
                            <h2 className="text-xl font-semibold">
                                Respaldos automáticos
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                Controla la creación, limpieza y supervisión
                                programadas. Cada siete días se comprueba la
                                restauración del ZIP más reciente. Los ZIP
                                existentes se conservan.
                            </p>
                        </div>
                    </div>
                    <Switch
                        checked={settings.enabled}
                        onCheckedChange={toggle}
                        disabled={saving}
                        aria-label="Activar respaldos automáticos"
                    />
                </div>
                <div className="grid gap-3 p-6 sm:grid-cols-3">
                    <div className="rounded-xl bg-muted/50 p-4">
                        <p className="text-xs text-muted-foreground">
                            Programación
                        </p>
                        <p className="mt-1 font-semibold">
                            {settings.enabled ? 'Activa' : 'Pausada'}
                        </p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-4">
                        <p className="text-xs text-muted-foreground">Disco</p>
                        <p className="mt-1 flex items-center gap-2 font-semibold">
                            <HardDrive className="size-4" />
                            {settings.disk}
                        </p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-4">
                        <p className="text-xs text-muted-foreground">
                            Contraseña
                        </p>
                        <p className="mt-1 flex items-center gap-2 font-semibold">
                            <LockKeyhole className="size-4" />
                            {settings.password_type === 'dedicated'
                                ? 'Independiente'
                                : 'APP_KEY'}
                        </p>
                    </div>
                </div>
                <p className="px-6 pb-6 text-xs leading-5 text-muted-foreground">
                    Configura una clave independiente en el formulario siguiente
                    o con <code>php artisan backup:password</code>. El
                    interruptor controla las tareas programadas; un comando
                    manual puede seguir creando respaldos.
                </p>
            </section>

            <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                <div className="mb-5 flex items-start gap-3">
                    <LockKeyhole
                        className="mt-0.5 size-5 text-primary"
                        aria-hidden="true"
                    />
                    <div>
                        <h2 className="text-lg font-semibold">
                            Contraseña de los próximos ZIP
                        </h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            La clave se guarda cifrada. Anótala en tu gestor de
                            contraseñas: no se puede volver a mostrar y
                            cambiarla no modifica los ZIP anteriores.
                        </p>
                    </div>
                </div>
                <form
                    onSubmit={savePassword}
                    className="grid gap-4 sm:grid-cols-2"
                >
                    <div className="grid gap-2 sm:col-span-2">
                        <Label htmlFor="backup-current-password">
                            Contraseña actual de tu cuenta
                        </Label>
                        <Input
                            id="backup-current-password"
                            type="password"
                            autoComplete="current-password"
                            value={passwordForm.data.current_password}
                            onChange={(event) =>
                                passwordForm.setData(
                                    'current_password',
                                    event.target.value,
                                )
                            }
                            required
                        />
                        {passwordForm.errors.current_password && (
                            <p className="text-sm text-destructive">
                                {passwordForm.errors.current_password}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="backup-new-password">
                            Nueva contraseña del ZIP
                        </Label>
                        <Input
                            id="backup-new-password"
                            type="password"
                            autoComplete="new-password"
                            minLength={16}
                            value={passwordForm.data.password}
                            onChange={(event) =>
                                passwordForm.setData(
                                    'password',
                                    event.target.value,
                                )
                            }
                            required
                        />
                        {passwordForm.errors.password && (
                            <p className="text-sm text-destructive">
                                {passwordForm.errors.password}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="backup-confirm-password">
                            Confirmar contraseña del ZIP
                        </Label>
                        <Input
                            id="backup-confirm-password"
                            type="password"
                            autoComplete="new-password"
                            minLength={16}
                            value={passwordForm.data.password_confirmation}
                            onChange={(event) =>
                                passwordForm.setData(
                                    'password_confirmation',
                                    event.target.value,
                                )
                            }
                            required
                        />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
                        <p className="text-xs text-muted-foreground">
                            Mínimo 16 caracteres. Conserva también las claves de
                            ZIP anteriores.
                        </p>
                        <Button
                            type="submit"
                            disabled={
                                passwordForm.processing ||
                                !passwordForm.data.current_password ||
                                !passwordForm.data.password ||
                                !passwordForm.data.password_confirmation
                            }
                        >
                            {passwordForm.processing && (
                                <LoaderCircle className="size-4 animate-spin" />
                            )}
                            Guardar contraseña
                        </Button>
                    </div>
                </form>
            </section>

            <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                <div className="mb-5 flex items-start gap-3">
                    <ArchiveRestore className="mt-0.5 size-5 text-primary" />
                    <div>
                        <h2 className="text-lg font-semibold">
                            Restaurar una copia aislada
                        </h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            La recuperación se prepara en el servidor y no
                            reemplaza la base ni los archivos en uso.
                        </p>
                    </div>
                </div>
                {!settings.available ? (
                    <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                        No se puede acceder al disco de respaldos.
                    </p>
                ) : settings.backups.length === 0 ? (
                    <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
                        Todavía no hay respaldos disponibles.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {settings.backups.map((backup) => (
                            <button
                                key={backup.name}
                                type="button"
                                disabled={activeRestore || restoring}
                                onClick={() => {
                                    setSelected(backup.name);
                                    setConfirmed(false);
                                    setPassword('');
                                }}
                                className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/70 p-4 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50"
                            >
                                <span className="min-w-0">
                                    <span className="block truncate font-medium">
                                        {backup.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(
                                            backup.created_at,
                                        ).toLocaleString('es-PE')}{' '}
                                        ·{' '}
                                        {(
                                            backup.size_bytes /
                                            1024 /
                                            1024
                                        ).toFixed(2)}{' '}
                                        MB
                                    </span>
                                </span>
                                <span className="shrink-0 text-sm font-medium text-primary">
                                    Seleccionar
                                </span>
                            </button>
                        ))}
                    </div>
                )}
                {selected && (
                    <div className="mt-5 space-y-4 rounded-xl border border-primary/25 bg-primary/5 p-5">
                        <h3 className="font-semibold">Restaurar {selected}</h3>
                        <p className="text-sm leading-6 text-muted-foreground">
                            Se usará la contraseña configurada. Si este ZIP
                            tiene otra contraseña, introdúcela aquí; se
                            transmite cifrada a la cola y no se guarda en el
                            historial.
                        </p>
                        <Input
                            type="password"
                            autoComplete="off"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            placeholder="Contraseña anterior (opcional)"
                            aria-label="Contraseña de este ZIP"
                        />
                        <label className="flex items-start gap-3 text-sm">
                            <input
                                type="checkbox"
                                checked={confirmed}
                                onChange={(event) =>
                                    setConfirmed(event.target.checked)
                                }
                                className="mt-1 accent-primary"
                            />
                            <span>
                                Entiendo que se preparará una copia aislada y
                                que deberé revisarla antes de ponerla en
                                servicio.
                            </span>
                        </label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                disabled={!confirmed || restoring}
                                onClick={submitRestore}
                            >
                                {restoring && (
                                    <LoaderCircle className="size-4 animate-spin" />
                                )}
                                Preparar restauración
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSelected(null)}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                )}
            </section>

            <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">
                    Restauraciones y simulacros recientes
                </h2>
                {settings.restores.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Aún no se ha preparado ninguna restauración ni simulacro.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {settings.restores.map((run) => (
                            <div
                                key={run.id}
                                className="rounded-xl border border-border/70 p-4"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="font-medium">
                                        {run.automatic ? 'Simulacro · ' : ''}
                                        {run.archive}
                                    </p>
                                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">
                                        {{
                                            pending: 'En cola',
                                            running: 'En proceso',
                                            completed: 'Completada',
                                            failed: 'Fallida',
                                        }[run.status] ?? run.status}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {new Date(run.created_at).toLocaleString(
                                        'es-PE',
                                    )}
                                </p>
                                {run.path && (
                                    <p className="mt-3 rounded-lg bg-muted/50 p-3 text-xs break-all">
                                        <ShieldCheck className="mr-1 inline size-3.5 text-emerald-600" />
                                        Copia aislada: {run.path}
                                    </p>
                                )}
                                {run.error && (
                                    <p className="mt-3 text-sm text-destructive">
                                        {run.error}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
