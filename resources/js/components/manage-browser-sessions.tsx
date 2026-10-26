import { router } from '@inertiajs/react';
import {
    Globe,
    LogOut,
    Monitor,
    RefreshCw,
    Smartphone,
    Tablet,
} from 'lucide-react';
import { useState } from 'react';
import ConfirmIdentityDialog from '@/components/confirm-identity-dialog';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { destroy, destroyOthers } from '@/routes/profile/sessions';

export type BrowserSession = {
    id: string;
    browser: string;
    platform: string;
    device: 'desktop' | 'mobile' | 'tablet';
    ip_address: string | null;
    last_active_at: string;
    is_current: boolean;
};

export type BrowserSessionsProps = {
    canManageSessions?: boolean;
    browserSessions?: BrowserSession[];
};

function RevokeSessionDialog({
    target,
    canConfirmWithPasskey,
    onClose,
}: {
    target: BrowserSession | 'others';
    canConfirmWithPasskey: boolean;
    onClose: () => void;
}) {
    const [revoking, setRevoking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const revoke = () => {
        if (revoking) return;
        setError(null);
        setRevoking(true);
        const route =
            target === 'others' ? destroyOthers() : destroy(target.id);
        router.delete(route.url, {
            preserveScroll: true,
            onSuccess: () => onClose(),
            onError: (errors) =>
                setError(
                    errors.confirmation ??
                        'No se pudo cerrar la sesión. Actualiza la lista e inténtalo de nuevo.',
                ),
            onFinish: () => setRevoking(false),
        });
    };

    return (
        <ConfirmIdentityDialog
            title={
                target === 'others'
                    ? 'Cerrar las demás sesiones'
                    : 'Cerrar esta sesión'
            }
            description={
                target === 'others'
                    ? 'Los demás dispositivos tendrán que iniciar sesión de nuevo. Este dispositivo seguirá conectado.'
                    : `${target.browser} en ${target.platform} tendrá que iniciar sesión de nuevo. Este dispositivo seguirá conectado.`
            }
            confirmLabel="Confirmar y cerrar"
            processing={revoking}
            canConfirmWithPasskey={canConfirmWithPasskey}
            error={error}
            onConfirmed={revoke}
            onClose={onClose}
        >
            <p className="rounded-lg border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
                Por seguridad, los accesos anteriores guardados con «Recordarme»
                también deberán autenticarse cuando termine su sesión.
            </p>
        </ConfirmIdentityDialog>
    );
}
export default function ManageBrowserSessions({
    canManageSessions = false,
    browserSessions = [],
    canConfirmWithPasskey = false,
}: BrowserSessionsProps & { canConfirmWithPasskey?: boolean }) {
    const [target, setTarget] = useState<BrowserSession | 'others' | null>(
        null,
    );
    const [refreshing, setRefreshing] = useState(false);
    const otherSessions = browserSessions.filter(
        (session) => !session.is_current,
    );
    const refresh = () => {
        setRefreshing(true);
        router.reload({
            only: ['browserSessions', 'canManageSessions'],
            onFinish: () => setRefreshing(false),
        });
    };

    return (
        <Card className="border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/70">
                <span className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Monitor className="size-5" />
                </span>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1.5">
                        <CardTitle>Sesiones y dispositivos</CardTitle>
                        <CardDescription>
                            Revisa dónde está abierta tu cuenta y cierra los
                            accesos que no reconozcas.
                        </CardDescription>
                    </div>
                    {canManageSessions && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={refreshing}
                            onClick={refresh}
                        >
                            <RefreshCw
                                className={refreshing ? 'animate-spin' : ''}
                            />
                            Actualizar
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-5">
                {!canManageSessions ? (
                    <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
                        La administración de sesiones no está disponible.
                        Contacta con el administrador.
                    </p>
                ) : (
                    <>
                        <ul className="divide-y overflow-hidden rounded-xl border border-border/70">
                            {browserSessions.map((session) => {
                                const Icon =
                                    session.device === 'mobile'
                                        ? Smartphone
                                        : session.device === 'tablet'
                                          ? Tablet
                                          : Monitor;
                                return (
                                    <li
                                        key={session.id}
                                        className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="flex min-w-0 gap-3">
                                            <span
                                                className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${session.is_current ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}
                                            >
                                                <Icon className="size-5" />
                                            </span>
                                            <div className="min-w-0 space-y-1.5">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-sm font-medium">
                                                        {session.browser}{' '}
                                                        <span className="font-normal text-muted-foreground">
                                                            en{' '}
                                                            {session.platform}
                                                        </span>
                                                    </p>
                                                    {session.is_current && (
                                                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                                                            Este dispositivo
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Globe className="size-3.5 shrink-0" />
                                                    {session.ip_address ??
                                                        'IP no disponible'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {session.is_current ? (
                                                        'Activa ahora'
                                                    ) : (
                                                        <>
                                                            Última actividad:{' '}
                                                            <time
                                                                dateTime={
                                                                    session.last_active_at
                                                                }
                                                            >
                                                                {new Date(
                                                                    session.last_active_at,
                                                                ).toLocaleString(
                                                                    'es',
                                                                    {
                                                                        dateStyle:
                                                                            'medium',
                                                                        timeStyle:
                                                                            'short',
                                                                    },
                                                                )}
                                                            </time>
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        {!session.is_current && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="self-start sm:shrink-0 sm:self-center"
                                                onClick={() =>
                                                    setTarget(session)
                                                }
                                                aria-label={`Cerrar sesión de ${session.browser} en ${session.platform}, ${session.ip_address ?? 'IP desconocida'}`}
                                            >
                                                <LogOut />
                                                Cerrar sesión
                                            </Button>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                            <p className="text-xs text-muted-foreground">
                                {otherSessions.length === 0
                                    ? 'Tu cuenta solo está abierta en este dispositivo.'
                                    : `${otherSessions.length} ${otherSessions.length === 1 ? 'sesión adicional activa' : 'sesiones adicionales activas'}.`}
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={
                                    otherSessions.length === 0 || refreshing
                                }
                                onClick={() => setTarget('others')}
                                className="w-fit"
                            >
                                <LogOut />
                                Cerrar las demás sesiones
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
            {target && (
                <RevokeSessionDialog
                    target={target}
                    canConfirmWithPasskey={canConfirmWithPasskey}
                    onClose={() => setTarget(null)}
                />
            )}
        </Card>
    );
}
