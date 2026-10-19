import { Head, router, useForm } from '@inertiajs/react';
import { FileText, FileUp, FolderOpen, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { Pagination, type PaginationLink } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    destroy,
    download,
    preview,
    store,
} from '@/actions/App/Http/Controllers/Web/Advanced/ManagedFileController';
import type { FormEvent } from 'react';
import { useRef } from 'react';

type FileRow = {
    id: number;
    name: string;
    mime_type: string;
    size: number;
    owner: string;
    created_at: string;
};
export default function Files({
    files,
    maxUploadKilobytes,
}: {
    files: { data: FileRow[]; links: PaginationLink[] };
    maxUploadKilobytes: number;
}) {
    const form = useForm<{ file: File | null }>({ file: null });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewFile, setPreviewFile] = useState<FileRow | null>(null);
    const maxUploadMegabytes = (maxUploadKilobytes / 1024).toFixed(0);
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(store().url, {
            forceFormData: true,
            onSuccess: () => {
                form.reset();
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            },
        });
    };
    const columns: DataTableColumn<FileRow>[] = [
        {
            key: 'name',
            header: 'Archivo',
            cell: (row) => <span className="font-medium">{row.name}</span>,
        },
        {
            key: 'type',
            header: 'Tipo',
            cell: (row) => row.name.split('.').pop()?.toUpperCase() ?? '—',
        },
        {
            key: 'attachment',
            header: 'Adjunto',
            className: 'min-w-64',
            cell: (row) => {
                const previewUrl = preview(row.id).url;

                return (
                    <button
                        type="button"
                        onClick={() => setPreviewFile(row)}
                        className="flex w-full max-w-sm items-center overflow-hidden rounded-xl border border-border bg-background transition-colors hover:border-primary/50 hover:bg-muted/30"
                    >
                        <span className="flex min-w-0 flex-1 flex-col gap-1 px-4 py-3">
                            <span className="truncate font-medium underline decoration-muted-foreground/50 underline-offset-4">
                                {row.name}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {row.name.split('.').pop()?.toUpperCase() ??
                                    'Archivo'}
                            </span>
                        </span>
                        <span className="flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden border-l border-border bg-muted/40 text-muted-foreground">
                            {row.mime_type.startsWith('image/') ? (
                                <img
                                    src={previewUrl}
                                    alt={`Vista previa de ${row.name}`}
                                    className="size-full object-cover"
                                    aria-hidden="true"
                                />
                            ) : row.mime_type === 'application/pdf' ? (
                                <iframe
                                    src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                                    title={`Vista previa de ${row.name}`}
                                    className="pointer-events-none size-full border-0"
                                />
                            ) : (
                                <FileText className="size-8" />
                            )}
                        </span>
                    </button>
                );
            },
        },
        {
            key: 'size',
            header: 'Tamaño',
            cell: (row) => `${(row.size / 1024).toFixed(1)} KB`,
        },
        { key: 'owner', header: 'Subido por', cell: (row) => row.owner },
        {
            key: 'actions',
            header: '',
            cell: (row) => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        nativeButton={false}
                        render={<a href={download(row.id).url} />}
                    >
                        Descargar
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Eliminar archivo"
                        onClick={() => router.delete(destroy(row.id).url)}
                    >
                        <Trash2 />
                    </Button>
                </div>
            ),
        },
    ];
    return (
        <>
            <Head title="Archivos" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold">Archivos</h1>
                    <p className="text-muted-foreground">
                        Biblioteca privada de documentos.
                    </p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileUp />
                            Cargar archivo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={submit}
                            className="flex flex-col gap-3 sm:flex-row"
                        >
                            <Input
                                ref={fileInputRef}
                                type="file"
                                required
                                onChange={(event) => {
                                    const file =
                                        event.target.files?.[0] ?? null;

                                    if (
                                        file &&
                                        file.size > maxUploadKilobytes * 1024
                                    ) {
                                        form.setData('file', null);
                                        form.setError(
                                            'file',
                                            `El archivo supera el límite de ${maxUploadMegabytes} MB permitido por el servidor.`,
                                        );

                                        return;
                                    }

                                    form.clearErrors('file');
                                    form.setData('file', file);
                                }}
                                accept=".pdf,.csv,.txt,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
                            />
                            <p className="text-sm text-muted-foreground">
                                Tamaño máximo: {maxUploadMegabytes} MB.
                            </p>
                            <Button type="submit" disabled={form.processing}>
                                <FileUp />
                                Subir
                            </Button>
                            {form.errors.file && (
                                <p className="text-sm text-destructive">
                                    {form.errors.file}
                                </p>
                            )}
                        </form>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FolderOpen />
                            Archivos guardados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable columns={columns} rows={files.data} />
                        <div className="mt-4">
                            <Pagination links={files.links} />
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Dialog
                open={previewFile !== null}
                onOpenChange={(open) => {
                    if (!open) setPreviewFile(null);
                }}
            >
                <DialogContent className="flex h-[95dvh] w-[95vw] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
                    {previewFile && (
                        <>
                            <DialogHeader className="shrink-0 border-b px-6 py-4 pr-14">
                                <DialogTitle className="truncate">
                                    {previewFile.name}
                                </DialogTitle>
                                <DialogDescription>
                                    Vista previa del documento
                                </DialogDescription>
                            </DialogHeader>
                            <div className="min-h-0 flex-1 bg-muted/30 p-2 sm:p-4">
                                {previewFile.mime_type.startsWith('image/') ? (
                                    <img
                                        src={preview(previewFile.id).url}
                                        alt={`Vista previa de ${previewFile.name}`}
                                        className="size-full object-contain"
                                    />
                                ) : previewFile.mime_type ===
                                  'application/pdf' ? (
                                    <iframe
                                        src={preview(previewFile.id).url}
                                        title={`Vista previa de ${previewFile.name}`}
                                        className="size-full rounded-lg border-0 bg-background"
                                    />
                                ) : (
                                    <div className="flex size-full flex-col items-center justify-center gap-4 text-center">
                                        <FileText className="size-16 text-muted-foreground" />
                                        <p className="text-muted-foreground">
                                            Este formato no permite vista previa
                                            en el navegador.
                                        </p>
                                        <Button
                                            nativeButton={false}
                                            render={
                                                <a
                                                    href={
                                                        download(previewFile.id)
                                                            .url
                                                    }
                                                />
                                            }
                                        >
                                            Descargar documento
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
