import { router } from '@inertiajs/react';
import { Fingerprint, KeyRound } from 'lucide-react';
import { destroy } from '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyRegistrationController';
import PasskeyItem from '@/components/passkey-item';
import PasskeyRegistration from '@/components/passkey-register';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { Passkey } from '@/types/auth';

export type Props = {
    canManagePasskeys?: boolean;
    passkeys?: Passkey[];
};

function EmptyState() {
    return (
        <div className="rounded-xl border border-dashed border-border bg-muted/25 p-8 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-background text-muted-foreground shadow-sm ring-1 ring-border/70">
                <KeyRound className="size-5" />
            </div>
            <p className="mt-4 text-sm font-medium">
                Aún no tienes llaves de acceso
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                Añade una llave para ingresar con tu huella, rostro o bloqueo
                del dispositivo sin escribir la contraseña.
            </p>
        </div>
    );
}

export default function ManagePasskeys(props: Props) {
    const passkeys = props.passkeys ?? [];

    const handleDelete = (id: number, onError: () => void) => {
        router.delete(destroy.url(id), {
            preserveScroll: true,
            onError,
        });
    };

    const handleRegisterSuccess = () => {
        router.reload();
    };

    if (!(props.canManagePasskeys ?? false)) {
        return null;
    }

    return (
        <Card className="border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/70">
                <span className="mb-2 flex size-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-300">
                    <Fingerprint className="size-5" />
                </span>
                <CardTitle>Llaves de acceso</CardTitle>
                <CardDescription>
                    Ingresa de forma segura con biometría o el bloqueo de tu
                    dispositivo.
                </CardDescription>
                <CardAction>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        {passkeys.length}{' '}
                        {passkeys.length === 1 ? 'llave' : 'llaves'}
                    </span>
                </CardAction>
            </CardHeader>

            <CardContent className="space-y-5">
                {passkeys.length > 0 ? (
                    <div className="overflow-hidden rounded-xl border border-border/70">
                        {passkeys.map((passkey) => (
                            <PasskeyItem
                                key={passkey.id}
                                passkey={passkey}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState />
                )}

                <PasskeyRegistration onSuccess={handleRegisterSuccess} />
            </CardContent>
        </Card>
    );
}
