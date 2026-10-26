import { Form } from '@inertiajs/react';
import { KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useRef, useState } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Web/Settings/SecurityController';
import InputError from '@/components/input-error';
import ManageApiTokens, {
    type ApiTokensProps,
} from '@/components/manage-api-tokens';
import ManageBrowserSessions, {
    type BrowserSessionsProps,
} from '@/components/manage-browser-sessions';
import ManagePasskeys, {
    type Props as ManagePasskeysProps,
} from '@/components/manage-passkeys';
import ManageTwoFactor, {
    type Props as ManageTwoFactorProps,
} from '@/components/manage-two-factor';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export type SecuritySettingsProps = {
    passwordRules: string;
} & ManagePasskeysProps &
    BrowserSessionsProps &
    ApiTokensProps &
    ManageTwoFactorProps;

export default function SecuritySettings(props: SecuritySettingsProps) {
    const [passwordOpen, setPasswordOpen] = useState(false);
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    const passwordInput = useRef<HTMLInputElement>(null);

    return (
        <section id="security" className="scroll-mt-24 space-y-5">
            <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                        <ShieldCheck className="size-4" />
                        Seguridad
                    </div>
                    <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                        Protege tu cuenta
                    </h2>
                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                        Administra tu contraseña, la autenticación en dos pasos,
                        los métodos de acceso sin contraseña y tus sesiones
                        activas.
                    </p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Centro de seguridad activo
                </span>
            </header>

            <div className="grid gap-5 lg:grid-cols-2">
                <Card className="border-border/70 shadow-sm">
                    <CardHeader className="border-b border-border/70">
                        <span className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <LockKeyhole className="size-5" />
                        </span>
                        <CardTitle>Contraseña</CardTitle>
                        <CardDescription>
                            Usa una contraseña única que no repitas en otros
                            servicios.
                        </CardDescription>
                        <CardAction>
                            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                Configurada
                            </span>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col justify-between gap-5">
                        <div className="rounded-xl border border-border/70 bg-muted/35 p-4">
                            <div className="flex gap-3">
                                <KeyRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">
                                        Mantenla privada
                                    </p>
                                    <p className="text-xs leading-5 text-muted-foreground">
                                        Las próximas sesiones utilizarán la
                                        nueva contraseña que configures.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Dialog
                            open={passwordOpen}
                            onOpenChange={setPasswordOpen}
                        >
                            <DialogTrigger
                                render={<Button className="w-fit" />}
                            >
                                <LockKeyhole />
                                Cambiar contraseña
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>
                                        Cambiar contraseña
                                    </DialogTitle>
                                    <DialogDescription>
                                        Confirma tu contraseña actual y elige
                                        una nueva que sea segura.
                                    </DialogDescription>
                                </DialogHeader>

                                <Form
                                    {...SecurityController.update.form()}
                                    options={{ preserveScroll: true }}
                                    resetOnError={[
                                        'password',
                                        'password_confirmation',
                                        'current_password',
                                    ]}
                                    resetOnSuccess
                                    onSuccess={() => setPasswordOpen(false)}
                                    onError={(errors) => {
                                        if (errors.password) {
                                            passwordInput.current?.focus();
                                            return;
                                        }

                                        if (errors.current_password) {
                                            currentPasswordInput.current?.focus();
                                        }
                                    }}
                                    className="space-y-4"
                                >
                                    {({
                                        errors,
                                        processing,
                                        resetAndClearErrors,
                                    }) => (
                                        <>
                                            <div className="grid gap-2">
                                                <Label htmlFor="current_password">
                                                    Contraseña actual
                                                </Label>
                                                <PasswordInput
                                                    id="current_password"
                                                    ref={currentPasswordInput}
                                                    name="current_password"
                                                    className="h-10"
                                                    autoComplete="current-password"
                                                    placeholder="Ingresa tu contraseña actual"
                                                />
                                                <InputError
                                                    message={
                                                        errors.current_password
                                                    }
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="password">
                                                    Nueva contraseña
                                                </Label>
                                                <PasswordInput
                                                    id="password"
                                                    ref={passwordInput}
                                                    name="password"
                                                    className="h-10"
                                                    autoComplete="new-password"
                                                    placeholder="Crea una contraseña nueva"
                                                    passwordrules={
                                                        props.passwordRules
                                                    }
                                                />
                                                <InputError
                                                    message={errors.password}
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="password_confirmation">
                                                    Confirmar contraseña
                                                </Label>
                                                <PasswordInput
                                                    id="password_confirmation"
                                                    name="password_confirmation"
                                                    className="h-10"
                                                    autoComplete="new-password"
                                                    placeholder="Repite la contraseña nueva"
                                                    passwordrules={
                                                        props.passwordRules
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        errors.password_confirmation
                                                    }
                                                />
                                            </div>

                                            <DialogFooter className="mt-6">
                                                <DialogClose
                                                    render={
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() =>
                                                                resetAndClearErrors()
                                                            }
                                                        />
                                                    }
                                                >
                                                    Cancelar
                                                </DialogClose>
                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                    data-test="update-password-button"
                                                >
                                                    {processing
                                                        ? 'Actualizando…'
                                                        : 'Actualizar contraseña'}
                                                </Button>
                                            </DialogFooter>
                                        </>
                                    )}
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>

                <ManageTwoFactor
                    canManageTwoFactor={props.canManageTwoFactor}
                    requiresConfirmation={props.requiresConfirmation}
                    twoFactorEnabled={props.twoFactorEnabled}
                />

                <div className="lg:col-span-2">
                    <ManagePasskeys
                        canManagePasskeys={props.canManagePasskeys}
                        passkeys={props.passkeys}
                    />
                </div>
                <div className="lg:col-span-2">
                    <ManageBrowserSessions
                        canManageSessions={props.canManageSessions}
                        browserSessions={props.browserSessions}
                        canConfirmWithPasskey={Boolean(
                            props.canManagePasskeys && props.passkeys?.length,
                        )}
                    />
                </div>
                <div className="lg:col-span-2">
                    <ManageApiTokens
                        apiTokens={props.apiTokens}
                        sanctumEnabled={props.sanctumEnabled}
                        canConfirmWithPasskey={Boolean(
                            props.canManagePasskeys && props.passkeys?.length,
                        )}
                    />
                </div>
            </div>
        </section>
    );
}
