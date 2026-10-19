import { Head } from '@inertiajs/react';
import { ClipboardList } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { Pagination, type PaginationLink } from '@/components/pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Entry = {
    id: number;
    actor: string;
    event: string;
    model: string;
    label: string | null;
    changes: Record<string, unknown> | null;
    ip_address: string | null;
    created_at: string;
};
export default function Audit({
    entries,
}: {
    entries: { data: Entry[]; links: PaginationLink[] };
}) {
    const columns: DataTableColumn<Entry>[] = [
        { key: 'actor', header: 'Actor', cell: (row) => row.actor },
        { key: 'event', header: 'Acción', cell: (row) => row.event },
        {
            key: 'subject',
            header: 'Registro',
            cell: (row) => (
                <span>
                    {row.model} · {row.label ?? '—'}
                </span>
            ),
        },
        {
            key: 'changes',
            header: 'Cambios',
            cell: (row) => (
                <code className="block max-w-sm truncate text-xs">
                    {row.changes ? JSON.stringify(row.changes) : '—'}
                </code>
            ),
        },
        {
            key: 'source',
            header: 'IP / Fecha',
            cell: (row) => (
                <span>
                    {row.ip_address ?? '—'}
                    <br />
                    {new Date(row.created_at).toLocaleString()}
                </span>
            ),
        },
    ];
    return (
        <>
            <Head title="Auditoría" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold">Auditoría</h1>
                    <p className="text-muted-foreground">
                        Historial de cambios de usuarios, roles y permisos.
                    </p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardList />
                            Actividad reciente
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable columns={columns} rows={entries.data} />
                        <div className="mt-4">
                            <Pagination links={entries.links} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
