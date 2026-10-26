import { Form, Head } from '@inertiajs/react';
import { MailCheck } from 'lucide-react';
import InvitationAcceptanceController from '@/actions/App/Http/Controllers/Web/Auth/InvitationAcceptanceController';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    invitation: { id: number; name: string; email: string; expiresAt: string };
    token: string;
    passwordRules: string;
};

export default function AcceptInvitation({
    invitation,
    token,
    passwordRules,
}: Props) {
    return (
        <>
            <Head title="Aceptar invitación" />

            <Form
                {...InvitationAcceptanceController.store.form({
                    invitation: invitation.id,
                    token,
                })}
                resetOnSuccess={['password', 'password_confirmation']}
            >
                {({ processing, errors }) => (
                    <div className="grid gap-5">
                        <div className="flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/5 p-4">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <MailCheck className="size-5" />
                            </span>
                            <div className="min-w-0">
                                <p className="font-medium">
                                    Invitación confirmada
                                </p>
                                <p className="truncate text-sm text-muted-foreground">
                                    Crea tu cuenta para {invitation.email}.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="name">Nombre completo</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={invitation.name}
                                autoComplete="name"
                                autoFocus
                                required
                                aria-invalid={Boolean(errors.name)}
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Correo electrónico</Label>
                            <Input
                                id="email"
                                value={invitation.email}
                                readOnly
                                aria-invalid={Boolean(errors.email)}
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                autoComplete="new-password"
                                required
                                passwordrules={passwordRules}
                                aria-invalid={Boolean(errors.password)}
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">
                                Confirmar contraseña
                            </Label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                autoComplete="new-password"
                                required
                                passwordrules={passwordRules}
                                aria-invalid={Boolean(
                                    errors.password_confirmation,
                                )}
                            />
                            <InputError
                                message={errors.password_confirmation}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={processing}
                        >
                            {processing ? <Spinner /> : null}
                            {processing
                                ? 'Creando cuenta…'
                                : 'Aceptar invitación'}
                        </Button>
                    </div>
                )}
            </Form>
        </>
    );
}

AcceptInvitation.layout = {
    title: 'Únete al equipo',
    description: 'Completa tus datos para activar tu cuenta.',
};
