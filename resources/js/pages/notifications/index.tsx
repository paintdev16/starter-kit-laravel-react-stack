import { Head, Link, router } from '@inertiajs/react';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { Pagination } from '@/components/pagination';
import { read, readAll } from '@/routes/notifications';

type NotificationRow = {
    id: string;
    data: { title?: string; message?: string; url?: string };
    read_at: string | null;
    created_at: string;
};
type Props = {
    notifications: {
        data: NotificationRow[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
};

export default function Notifications({ notifications }: Props) {
    const columns: DataTableColumn<NotificationRow>[] = [
        {
            key: 'title',
            header: 'Notificación',
            cell: (item) => (
                <div>
                    <p className="font-medium">
                        {item.data.title ?? 'Notificación'}
                    </p>
                    <p className="text-muted-foreground">{item.data.message}</p>
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Estado',
            cell: (item) =>
                item.read_at ? (
                    'Leída'
                ) : (
                    <span className="font-medium text-primary">Nueva</span>
                ),
        },
        {
            key: 'date',
            header: 'Fecha',
            cell: (item) => new Date(item.created_at).toLocaleString(),
        },
        {
            key: 'actions',
            header: '',
            cell: (item) => (
                <div className="flex gap-2">
                    {item.data.url && (
                        <Button
                            variant="outline"
                            size="sm"
                            render={<Link href={item.data.url} />}
                        >
                            Abrir
                        </Button>
                    )}
                    {!item.read_at && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.patch(read(item.id).url)}
                        >
                            Marcar leída
                        </Button>
                    )}
                </div>
            ),
        },
    ];
    return (
        <>
            <Head title="Notificaciones" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Notificaciones
                        </h1>
                        <p className="text-muted-foreground">
                            Avisos de tu cuenta y actividad.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => router.patch(readAll().url)}
                    >
                        <CheckCheck />
                        Marcar todas como leídas
                    </Button>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell />
                            Bandeja
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={columns}
                            rows={notifications.data}
                        />
                        <div className="mt-4">
                            <Pagination links={notifications.links} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
