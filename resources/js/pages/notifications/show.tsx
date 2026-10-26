import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, BellRing, CalendarDays, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import { show } from '@/routes/notifications';

type NotificationItem = {
    id: string;
    data: { title?: string; message?: string };
    read_at: string | null;
    created_at: string;
};

export default function NotificationDetail({
    notification,
}: {
    notification: NotificationItem;
}) {
    const title = notification.data.title ?? 'Notificación';

    return (
        <>
            <Head title={title} />
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:gap-8 md:p-8">
                <Button
                    nativeButton={false}
                    variant="ghost"
                    render={<Link href={dashboard().url} />}
                    className="w-fit"
                >
                    <ArrowLeft />
                    Volver al panel
                </Button>

                <article className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
                    <div className="border-b border-border/70 bg-linear-to-br from-primary/15 via-primary/5 to-card p-6 md:p-10">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-primary/25">
                                <BellRing
                                    className="size-6"
                                    aria-hidden="true"
                                />
                            </span>
                            <div className="min-w-0 space-y-3">
                                <p className="text-xs font-semibold tracking-widest text-primary uppercase">
                                    Detalle de notificación
                                </p>
                                <h1 className="text-2xl leading-tight font-semibold tracking-tight text-balance md:text-3xl">
                                    {title}
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Aviso recibido en tu cuenta
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 p-6 md:p-10">
                        <h2 className="text-sm font-semibold text-muted-foreground">
                            Mensaje
                        </h2>
                        <p className="max-w-2xl text-base leading-8 whitespace-pre-wrap text-foreground">
                            {notification.data.message ??
                                'Sin información adicional.'}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border/70 bg-muted/30 px-6 py-4 text-sm text-muted-foreground md:px-10">
                        <time
                            dateTime={notification.created_at}
                            className="inline-flex items-center gap-2"
                        >
                            <CalendarDays
                                className="size-4"
                                aria-hidden="true"
                            />
                            {new Date(notification.created_at).toLocaleString(
                                'es-PE',
                                { dateStyle: 'long', timeStyle: 'short' },
                            )}
                        </time>
                        <span className="inline-flex items-center gap-2">
                            <Check className="size-4" aria-hidden="true" />
                            {notification.read_at ? 'Leída' : 'Sin leer'}
                        </span>
                    </div>
                </article>
            </div>
        </>
    );
}

NotificationDetail.layout = ({
    notification,
}: {
    notification: NotificationItem;
}) => ({
    breadcrumbs: [
        {
            title: notification.data.title ?? 'Notificación',
            href: show(notification.id),
        },
    ],
});
