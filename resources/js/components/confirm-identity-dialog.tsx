import { Link, useHttp } from '@inertiajs/react';
import { usePasskeyVerify } from '@laravel/passkeys/react';
import { Fingerprint, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import {
    index as confirmationOptions,
    store as confirmPasskey,
} from '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyConfirmationController';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { request as requestPassword } from '@/routes/password';
import { store as confirmPassword } from '@/routes/password/confirm';

type Props = {
    title: string;
    description: string;
    confirmLabel: string;
    processing: boolean;
    canConfirmWithPasskey: boolean;
    error?: string | null;
    children?: ReactNode;
    onConfirmed: () => void;
    onClose: () => void;
};

export default function ConfirmIdentityDialog({
    title,
    description,
    confirmLabel,
    processing,
    canConfirmWithPasskey,
    error,
    children,
    onConfirmed,
    onClose,
}: Props) {
    const password = useHttp({ password: '' });
    const [confirmationError, setConfirmationError] = useState<string | null>(
        null,
    );
    const passkey = usePasskeyVerify({
        routes: {
            options: confirmationOptions().url,
            submit: confirmPasskey().url,
        },
        onSuccess: onConfirmed,
    });
    const busy = password.processing || passkey.isLoading || processing;

    const confirmWithPassword = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (busy) return;
        setConfirmationError(null);
        void password
            .post(confirmPassword().url, {
                onSuccess: () => {
                    password.reset();
                    onConfirmed();
                },
                onError: () => password.reset(),
            })
            .catch(() =>
                setConfirmationError(
                    'No se pudo confirmar tu identidad. Revisa la contraseña o vuelve a intentarlo.',
                ),
            );
    };

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open && !busy) onClose();
            }}
        >
            <DialogContent className="sm:max-w-md" showCloseButton={!busy}>
                <DialogHeader>
                    <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <ShieldCheck className="size-5" />
                    </span>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                {children}
                {canConfirmWithPasskey && passkey.isSupported && (
                    <div className="grid gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 w-full"
                            disabled={busy}
                            onClick={() => {
                                setConfirmationError(null);
                                void passkey.verify();
                            }}
                        >
                            {passkey.isLoading ? <Spinner /> : <Fingerprint />}
                            Confirmar con llave de acceso
                        </Button>
                        {passkey.error && (
                            <InputError message={passkey.error} />
                        )}
                        <p className="text-center text-xs text-muted-foreground">
                            O confirma con tu contraseña
                        </p>
                    </div>
                )}
                <form onSubmit={confirmWithPassword} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="identity-password">
                            Contraseña actual
                        </Label>
                        <PasswordInput
                            id="identity-password"
                            autoFocus
                            name="password"
                            autoComplete="current-password"
                            required
                            value={password.data.password}
                            onChange={(event) =>
                                password.setData('password', event.target.value)
                            }
                            disabled={busy}
                            className="h-10"
                            aria-invalid={Boolean(password.errors.password)}
                            aria-describedby="identity-password-error"
                        />
                        <InputError
                            id="identity-password-error"
                            message={password.errors.password}
                        />
                        <Link
                            href={requestPassword()}
                            className="w-fit text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                        >
                            ¿No conoces tu contraseña?
                        </Link>
                    </div>
                    {(error || confirmationError) && (
                        <p role="alert" className="text-sm text-destructive">
                            {error || confirmationError}
                        </p>
                    )}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={busy}
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={busy}>
                            {busy && <Spinner />}
                            {processing ? 'Procesando…' : confirmLabel}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
