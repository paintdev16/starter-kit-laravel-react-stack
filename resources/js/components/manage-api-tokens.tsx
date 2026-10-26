import { router, useHttp, usePage } from '@inertiajs/react';
import {
    Check,
    Clock3,
    Copy,
    KeyRound,
    Plus,
    RefreshCw,
    ShieldCheck,
    Trash2,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import ConfirmIdentityDialog from '@/components/confirm-identity-dialog';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { destroy, destroyAll, store } from '@/routes/profile/tokens';

type ApiToken = {
    id: number;
    name: string;
    abilities: string[];
    created_at: string;
    last_used_at: string | null;
    expires_at: string | null;
    is_expired: boolean;
};

type CreatedToken = {
    id: number;
    name: string;
    token: string;
    expires_at: string;
    abilities: string[];
};

export type ApiTokensProps = {
    apiTokens?: ApiToken[];
    sanctumEnabled?: boolean;
};

function dateLabel(date: string) {
    return new Date(date).toLocaleString('es', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

function CreateTokenDialog({
    canConfirmWithPasskey,
    onClose,
    onCreated,
}: {
    canConfirmWithPasskey: boolean;
    onClose: () => void;
    onCreated: (token: CreatedToken) => void;
}) {
    const form = useHttp<
        { name: string; abilities: string[]; expires_in: number },
        CreatedToken
    >({ name: '', abilities: ['api:read'], expires_in: 30 });
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toggleAbility = (ability: string, checked: boolean) => {
        form.setData(
            'abilities',
            checked
                ? [...form.data.abilities, ability]
                : form.data.abilities.filter((item) => item !== ability),
        );
    };

    const create = () => {
        if (form.processing) return;
        setError(null);
        let handledValidation = false;
        void form
            .post(store().url, {
                onSuccess: onCreated,
                onError: (errors) => {
                    handledValidation = true;
                    if (errors.confirmation) {
                        setError(errors.confirmation);
                    } else {
                        setConfirming(false);
                        setError(errors.integration ?? null);
                    }
                },
            })
            .catch(() => {
                if (!handledValidation) {
                    setError(
                        'No se pudo crear el token. Actualiza la lista antes de volver a intentarlo para comprobar si se creó.',
                    );
                    setConfirming(false);
                }
            });
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (form.data.abilities.length === 0) {
            form.setError('abilities', 'Selecciona al menos un permiso.');
            return;
        }
        form.clearErrors();
        setError(null);
        setConfirming(true);
    };

    if (confirming) {
        return (
            <ConfirmIdentityDialog
                title="Autorizar nuevo token"
                description={`Confirma tu identidad para crear «${form.data.name}». El token completo se mostrará una sola vez.`}
                confirmLabel="Confirmar y crear token"
                processing={form.processing}
                canConfirmWithPasskey={canConfirmWithPasskey}
                error={error}
                onConfirmed={create}
                onClose={onClose}
            />
        );
    }

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open && !form.processing) onClose();
            }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Crear token API</DialogTitle>
                    <DialogDescription>
                        Da acceso a una aplicación o integración. Se aplicarán
                        también los permisos de tu cuenta.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="api-token-name">Nombre</Label>
                        <Input
                            id="api-token-name"
                            autoFocus
                            required
                            maxLength={100}
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            placeholder="Mi aplicación móvil"
                            className="h-10"
                            aria-invalid={Boolean(form.errors.name)}
                            aria-describedby="api-token-name-error"
                        />
                        <InputError
                            id="api-token-name-error"
                            message={form.errors.name}
                        />
                    </div>
                    <fieldset className="grid gap-3">
                        <legend className="mb-3 text-sm font-medium">
                            Permisos
                        </legend>
                        {[
                            {
                                ability: 'api:read',
                                label: 'Lectura',
                                description:
                                    'Consultar los recursos disponibles para tu cuenta.',
                            },
                            {
                                ability: 'api:write',
                                label: 'Escritura',
                                description:
                                    'Realizar las modificaciones permitidas para tu cuenta.',
                            },
                        ].map(({ ability, label, description }) => (
                            <div
                                key={ability}
                                className="flex items-start gap-3 rounded-xl border p-3"
                            >
                                <Checkbox
                                    id={ability}
                                    checked={form.data.abilities.includes(
                                        ability,
                                    )}
                                    onCheckedChange={(checked) =>
                                        toggleAbility(ability, checked === true)
                                    }
                                />
                                <div className="grid gap-1">
                                    <Label htmlFor={ability}>{label}</Label>
                                    <p className="text-xs leading-5 text-muted-foreground">
                                        {description}
                                    </p>
                                </div>
                            </div>
                        ))}
                        <InputError message={form.errors.abilities} />
                    </fieldset>
                    <div className="grid gap-2">
                        <Label htmlFor="api-token-expiration">
                            Vencimiento
                        </Label>
                        <select
                            id="api-token-expiration"
                            value={form.data.expires_in}
                            onChange={(event) =>
                                form.setData(
                                    'expires_in',
                                    Number(event.target.value),
                                )
                            }
                            className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                            aria-invalid={Boolean(form.errors.expires_in)}
                        >
                            <option value={1}>En 24 horas</option>
                            <option value={7}>En 7 días</option>
                            <option value={30}>En 30 días</option>
                            <option value={90}>En 90 días</option>
                        </select>
                        <p className="text-xs text-muted-foreground">
                            El límite general de la aplicación puede reducir
                            este plazo.
                        </p>
                        <InputError message={form.errors.expires_in} />
                    </div>
                    {error && (
                        <p role="alert" className="text-sm text-destructive">
                            {error}
                        </p>
                    )}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit">
                            <ShieldCheck />
                            Continuar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function RevealTokenDialog({
    token,
    onClose,
}: {
    token: CreatedToken;
    onClose: () => void;
}) {
    const [copied, setCopied] = useState(false);
    const [copyError, setCopyError] = useState<string | null>(null);

    const copy = async () => {
        try {
            if (!navigator.clipboard) throw new Error('Clipboard unavailable');
            await navigator.clipboard.writeText(token.token);
            setCopied(true);
            setCopyError(null);
        } catch {
            setCopyError(
                'Selecciona el token y cópialo manualmente. El portapapeles no está disponible.',
            );
        }
    };

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                        <Check className="size-5" />
                    </span>
                    <DialogTitle>Token creado</DialogTitle>
                    <DialogDescription>
                        Copia y guarda el token de «{token.name}». Al cerrar
                        esta ventana, ya no podrás volver a consultar su valor.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3">
                    <Label htmlFor="new-api-token">Tu token de acceso</Label>
                    <textarea
                        id="new-api-token"
                        readOnly
                        autoComplete="off"
                        spellCheck={false}
                        rows={3}
                        value={token.token}
                        onFocus={(event) => event.target.select()}
                        className="w-full resize-none rounded-xl border bg-muted/30 p-3 font-mono text-sm break-all outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => void copy()}
                    >
                        {copied ? <Check /> : <Copy />}
                        {copied ? 'Copiado' : 'Copiar token'}
                    </Button>
                    {copyError && (
                        <p role="alert" className="text-sm text-destructive">
                            {copyError}
                        </p>
                    )}
                    <p className="text-xs leading-5 text-muted-foreground">
                        Guárdalo en un lugar seguro. Vence el{' '}
                        {dateLabel(token.expires_at)}.
                    </p>
                </div>
                <DialogFooter>
                    <Button type="button" onClick={onClose}>
                        Ya lo guardé
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function RevokeTokenDialog({
    target,
    canConfirmWithPasskey,
    onClose,
}: {
    target: ApiToken | 'all';
    canConfirmWithPasskey: boolean;
    onClose: () => void;
}) {
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const revoke = () => {
        if (processing) return;
        setProcessing(true);
        setError(null);
        router.delete(
            target === 'all' ? destroyAll().url : destroy(target.id).url,
            {
                preserveScroll: true,
                onSuccess: onClose,
                onError: (errors) =>
                    setError(
                        errors.confirmation ??
                            'No se pudo revocar el token. Actualiza la lista e inténtalo de nuevo.',
                    ),
                onFinish: () => setProcessing(false),
            },
        );
    };
    return (
        <ConfirmIdentityDialog
            title={
                target === 'all' ? 'Revocar todos los tokens' : 'Revocar token'
            }
            description={
                target === 'all'
                    ? 'Todas las aplicaciones e integraciones que utilicen tus tokens perderán el acceso a la API. Tu sesión web seguirá abierta.'
                    : `«${target.name}» dejará de permitir el acceso a la API. Esta acción es definitiva.`
            }
            confirmLabel="Confirmar y revocar"
            processing={processing}
            canConfirmWithPasskey={canConfirmWithPasskey}
            error={error}
            onConfirmed={revoke}
            onClose={onClose}
        />
    );
}

export default function ManageApiTokens({
    apiTokens = [],
    sanctumEnabled = false,
    canConfirmWithPasskey = false,
}: ApiTokensProps & { canConfirmWithPasskey?: boolean }) {
    const { auth } = usePage<{
        auth: { user: { email_verified_at: string | null } };
    }>().props;
    const [creating, setCreating] = useState(false);
    const [created, setCreated] = useState<CreatedToken | null>(null);
    const [target, setTarget] = useState<ApiToken | 'all' | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const emailVerified = Boolean(auth.user.email_verified_at);
    const refresh = () => {
        setRefreshing(true);
        router.reload({
            only: ['apiTokens', 'sanctumEnabled'],
            onFinish: () => setRefreshing(false),
        });
    };

    return (
        <Card className="border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/70">
                <span className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <KeyRound className="size-5" />
                </span>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1.5">
                        <CardTitle>Tokens API</CardTitle>
                        <CardDescription>
                            Administra el acceso de tus aplicaciones e
                            integraciones.
                        </CardDescription>
                    </div>
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
                </div>
            </CardHeader>
            <CardContent className="space-y-5">
                {!sanctumEnabled && (
                    <p className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm text-muted-foreground">
                        La API está desactivada. Puedes consultar y revocar tus
                        tokens existentes; la creación estará disponible cuando
                        se active.
                    </p>
                )}
                {sanctumEnabled && !emailVerified && (
                    <p className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                        Verifica tu correo electrónico para crear tokens API.
                    </p>
                )}
                {apiTokens.length === 0 ? (
                    <div className="rounded-xl border border-dashed bg-muted/25 p-7 text-center">
                        <KeyRound className="mx-auto size-7 text-muted-foreground" />
                        <p className="mt-3 text-sm font-medium">
                            Aún no tienes tokens API
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Crea uno cuando necesites conectar una aplicación a
                            tu cuenta.
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y overflow-hidden rounded-xl border border-border/70">
                        {apiTokens.map((token) => {
                            const expired =
                                token.is_expired ||
                                Boolean(
                                    token.expires_at &&
                                    new Date(token.expires_at).getTime() <=
                                        Date.now(),
                                );
                            return (
                                <li
                                    key={token.id}
                                    className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between"
                                >
                                    <div className="min-w-0 space-y-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-medium break-all">
                                                {token.name}
                                            </p>
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${expired ? 'bg-muted text-muted-foreground' : sanctumEnabled ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'}`}
                                            >
                                                {expired
                                                    ? 'Vencido'
                                                    : sanctumEnabled
                                                      ? 'Activo'
                                                      : 'Bloqueado'}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {token.abilities.map((ability) => (
                                                <span
                                                    key={ability}
                                                    className="rounded-md border bg-muted/30 px-2 py-0.5 text-xs text-muted-foreground"
                                                >
                                                    {ability === 'api:read'
                                                        ? 'Lectura'
                                                        : ability ===
                                                            'api:write'
                                                          ? 'Escritura'
                                                          : ability === '*'
                                                            ? 'Todos los permisos'
                                                            : ability}
                                                </span>
                                            ))}
                                        </div>
                                        <dl className="grid gap-1 text-xs text-muted-foreground">
                                            <div className="flex flex-wrap gap-x-1">
                                                <dt>Creado:</dt>
                                                <dd>
                                                    {dateLabel(
                                                        token.created_at,
                                                    )}
                                                </dd>
                                            </div>
                                            <div className="flex flex-wrap gap-x-1">
                                                <dt>Último uso:</dt>
                                                <dd>
                                                    {token.last_used_at
                                                        ? dateLabel(
                                                              token.last_used_at,
                                                          )
                                                        : 'Sin uso registrado'}
                                                </dd>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-1">
                                                <Clock3 className="size-3" />
                                                <dt>Vence:</dt>
                                                <dd>
                                                    {token.expires_at
                                                        ? dateLabel(
                                                              token.expires_at,
                                                          )
                                                        : 'Sin vencimiento'}
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setTarget(token)}
                                        className="self-start sm:shrink-0"
                                        aria-label={`Revocar token ${token.name}`}
                                    >
                                        <Trash2 />
                                        Revocar
                                    </Button>
                                </li>
                            );
                        })}
                    </ul>
                )}
                <div className="flex flex-wrap justify-between gap-3">
                    <Button
                        type="button"
                        disabled={
                            !sanctumEnabled || !emailVerified || refreshing
                        }
                        onClick={() => setCreating(true)}
                    >
                        <Plus />
                        Crear token
                    </Button>
                    {apiTokens.length > 0 && (
                        <Button
                            type="button"
                            variant="outline"
                            disabled={refreshing}
                            onClick={() => setTarget('all')}
                        >
                            <Trash2 />
                            Revocar todos
                        </Button>
                    )}
                </div>
            </CardContent>
            {creating && (
                <CreateTokenDialog
                    canConfirmWithPasskey={canConfirmWithPasskey}
                    onClose={() => setCreating(false)}
                    onCreated={(token) => {
                        setCreating(false);
                        setCreated(token);
                        router.reload({
                            only: ['apiTokens', 'sanctumEnabled'],
                        });
                    }}
                />
            )}
            {created && (
                <RevealTokenDialog
                    token={created}
                    onClose={() => setCreated(null)}
                />
            )}
            {target && (
                <RevokeTokenDialog
                    target={target}
                    canConfirmWithPasskey={canConfirmWithPasskey}
                    onClose={() => setTarget(null)}
                />
            )}
        </Card>
    );
}
