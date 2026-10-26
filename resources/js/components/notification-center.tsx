import { router, usePage } from '@inertiajs/react';
import { configureEcho, echo } from '@laravel/echo-react';
import { Bell, CheckCheck, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { toast } from '@/components/ui/toast';
import { login } from '@/routes';
import { feed, readAll, runtime, show } from '@/routes/notifications';

type NotificationItem = {
    id: string;
    data: { title?: string };
    read_at: string | null;
};

type NotificationFeed = {
    data: NotificationItem[];
    current_page: number;
    next_page_url: string | null;
};

type IncomingNotification = {
    id: string;
    type: string;
    title?: string;
    message?: string;
    enabled?: boolean;
    revision?: number;
};

type RuntimeFeed = {
    reverbEnabled: boolean;
    reverbRevision: number;
    cursor: number;
    notifications: IncomingNotification[];
};

const REVERB_STATUS_NOTIFICATION =
    'App\\Notifications\\ReverbStatusChangedNotification';

const shownToastIds = new Set<string>();

function showNotificationToast(
    userId: number,
    notification: IncomingNotification,
) {
    const seenKey = `${userId}:${notification.id}`;
    if (shownToastIds.has(seenKey)) return;
    shownToastIds.add(seenKey);

    if (notification.type === 'App\\Notifications\\UserLoggedInNotification') {
        const storageKey = `login-alert-toasts-${userId}`;
        let storedIds: string[] = [];

        try {
            const stored = JSON.parse(
                sessionStorage.getItem(storageKey) ?? '[]',
            );
            storedIds = Array.isArray(stored) ? stored : [];
        } catch {
            storedIds = [];
        }

        if (storedIds.includes(notification.id)) return;

        try {
            sessionStorage.setItem(
                storageKey,
                JSON.stringify([...storedIds.slice(-49), notification.id]),
            );
        } catch {
            // The in-memory set still prevents duplicate toasts in this tab.
        }
    }

    toast.add({
        title: notification.title ?? 'Nueva notificación',
        description: notification.message,
    });
}

export function NotificationCenter() {
    const { auth, runtimeFeatures } = usePage<{
        auth: { user: { id: number }; unreadNotifications: number };
        runtimeFeatures: { reverbEnabled: boolean; reverbRevision: number };
    }>().props;
    const { unreadNotifications } = auth;
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [nextPage, setNextPage] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [realtimeRevision, setRealtimeRevision] = useState(0);
    const [reverbEnabled, setReverbEnabled] = useState(
        runtimeFeatures.reverbEnabled,
    );
    const statusCursor = useRef(runtimeFeatures.reverbRevision);
    const stateRevision = useRef(runtimeFeatures.reverbRevision);
    const requestSequence = useRef(0);

    const applyRuntimeState = useCallback(
        (enabled: boolean, revision: number) => {
            if (revision < stateRevision.current) return;
            stateRevision.current = revision;
            setReverbEnabled(enabled);
        },
        [],
    );

    useEffect(() => {
        applyRuntimeState(
            runtimeFeatures.reverbEnabled,
            runtimeFeatures.reverbRevision,
        );
    }, [
        applyRuntimeState,
        runtimeFeatures.reverbEnabled,
        runtimeFeatures.reverbRevision,
    ]);

    useEffect(() => {
        const controller = new AbortController();
        let checking = false;

        const syncRuntime = async () => {
            if (checking || document.visibilityState === 'hidden') return;
            checking = true;

            try {
                const response = await fetch(
                    runtime({ query: { after: statusCursor.current } }).url,
                    {
                        credentials: 'same-origin',
                        headers: { Accept: 'application/json' },
                        signal: controller.signal,
                    },
                );
                if (response.status === 401) {
                    router.visit(login().url, { replace: true });
                    return;
                }
                if (!response.ok) return;

                const result = (await response.json()) as RuntimeFeed;
                if (controller.signal.aborted) return;

                applyRuntimeState(result.reverbEnabled, result.reverbRevision);
                result.notifications.forEach((notification) => {
                    showNotificationToast(auth.user.id, notification);
                });
                statusCursor.current = Math.max(
                    statusCursor.current,
                    result.cursor,
                );

                if (result.notifications.length > 0) {
                    setRealtimeRevision((current) => current + 1);
                    router.reload({ only: ['auth', 'runtimeFeatures'] });
                }
            } catch {
                // Retry on the next interval or when the tab regains focus.
            } finally {
                checking = false;
            }
        };

        const refresh = () => {
            void syncRuntime();
        };
        refresh();
        const interval = window.setInterval(refresh, 10_000);
        window.addEventListener('focus', refresh);
        document.addEventListener('visibilitychange', refresh);

        return () => {
            controller.abort();
            window.clearInterval(interval);
            window.removeEventListener('focus', refresh);
            document.removeEventListener('visibilitychange', refresh);
        };
    }, [auth.user.id, applyRuntimeState]);

    const loadNotifications = useCallback(async (page: number) => {
        const sequence = ++requestSequence.current;
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(feed({ query: { page } }).url, {
                credentials: 'same-origin',
                headers: { Accept: 'application/json' },
            });

            if (!response.ok) {
                throw new Error('No se pudieron cargar las notificaciones.');
            }

            const result = (await response.json()) as NotificationFeed;
            if (sequence !== requestSequence.current) return;

            setNotifications((current) =>
                page === 1
                    ? result.data
                    : [
                          ...current,
                          ...result.data.filter(
                              (item) =>
                                  !current.some(
                                      (loaded) => loaded.id === item.id,
                                  ),
                          ),
                      ],
            );
            setNextPage(result.next_page_url ? result.current_page + 1 : null);
        } catch {
            if (sequence === requestSequence.current) {
                setError('No se pudieron cargar las notificaciones.');
            }
        } finally {
            if (sequence === requestSequence.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open) {
            void loadNotifications(1);
        } else {
            requestSequence.current += 1;
        }
    }, [open, loadNotifications, realtimeRevision]);

    useEffect(() => {
        if (!reverbEnabled) return;

        const connection = echo();
        const channelName = `App.Models.User.${auth.user.id}`;

        connection
            .private(channelName)
            .notification((notification: IncomingNotification) => {
                if (!notification.id) return;

                if (
                    notification.type === REVERB_STATUS_NOTIFICATION &&
                    typeof notification.enabled === 'boolean' &&
                    typeof notification.revision === 'number'
                ) {
                    applyRuntimeState(
                        notification.enabled,
                        notification.revision,
                    );
                }

                showNotificationToast(auth.user.id, notification);
                setRealtimeRevision((current) => current + 1);
                router.reload({ only: ['auth', 'runtimeFeatures'] });
            });

        return () => {
            connection.leave(channelName);
            connection.disconnect();
            configureEcho({ broadcaster: 'reverb' });
        };
    }, [auth.user.id, reverbEnabled, applyRuntimeState]);

    const openDetail = (item: NotificationItem) => {
        setOpen(false);
        router.get(show(item.id).url);
    };

    const markAllRead = () => {
        router.patch(
            readAll().url,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    const readAt = new Date().toISOString();
                    setNotifications((current) =>
                        current.map((item) => ({
                            ...item,
                            read_at: item.read_at ?? readAt,
                        })),
                    );
                },
            },
        );
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
                render={
                    <button
                        type="button"
                        aria-label={`Notificaciones${unreadNotifications ? `, ${unreadNotifications} sin leer` : ''}`}
                        className="relative flex size-9 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    />
                }
            >
                <Bell className="size-4" />
                {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                        {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                )}
            </SheetTrigger>
            <SheetContent className="w-full! max-w-none! gap-0 p-0 sm:max-w-md!">
                <SheetHeader className="shrink-0 border-b px-4 py-4 pr-12">
                    <SheetTitle>Notificaciones</SheetTitle>
                    <SheetDescription>
                        Avisos de tu cuenta y actividad.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void loadNotifications(1)}
                        disabled={loading}
                    >
                        <RefreshCw />
                        Actualizar
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllRead}
                        disabled={unreadNotifications === 0}
                    >
                        <CheckCheck />
                        Marcar todas
                    </Button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-3">
                    {error && (
                        <p
                            role="alert"
                            className="p-3 text-sm text-destructive"
                        >
                            {error}
                        </p>
                    )}
                    {!loading && notifications.length === 0 && !error && (
                        <p className="p-4 text-center text-sm text-muted-foreground">
                            No tienes notificaciones.
                        </p>
                    )}
                    <div className="grid gap-2">
                        {notifications.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => openDetail(item)}
                                className="w-full rounded-xl border border-border px-4 py-3.5 text-left transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            >
                                <span className="flex items-center justify-between gap-3">
                                    <span className="text-sm font-medium">
                                        {item.data.title ?? 'Notificación'}
                                    </span>
                                    {!item.read_at && (
                                        <span className="size-2 shrink-0 rounded-full bg-primary">
                                            <span className="sr-only">
                                                Sin leer
                                            </span>
                                        </span>
                                    )}
                                </span>
                            </button>
                        ))}
                    </div>
                    {loading && (
                        <p className="p-4 text-center text-sm text-muted-foreground">
                            Cargando notificaciones…
                        </p>
                    )}
                    {nextPage && !loading && (
                        <Button
                            variant="outline"
                            className="mt-3 w-full"
                            onClick={() => void loadNotifications(nextPage)}
                        >
                            Cargar más
                        </Button>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
