import { Form, Head, Link } from '@inertiajs/react';
import SocialLoginController from '@/actions/App/Http/Controllers/Web/Auth/SocialLoginController';
import { GoogleIcon } from '@/components/icons/google';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import PasskeyVerify from '@/components/passkey-verify';
import GitHubIcon from '@/components/icons/github';

type Props = {
    status?: string;
    canResetPassword: boolean;
    socialProviders?: Array<'github' | 'google'>;
};

export default function Login({ status, canResetPassword, socialProviders = [] }: Props) {
    return (
        <>
            <Head title="Iniciar sesión" />

            <PasskeyVerify />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <InputError message={errors.social} />
                            <div className="grid gap-2">
                                <Label htmlFor="email">Correo electrónico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="correo@ejemplo.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Contraseña</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm"
                                            tabIndex={5}
                                        >
                                            ¿Olvidaste tu contraseña?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Contraseña"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label htmlFor="remember">Recordarme</Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-4 w-full"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Iniciar sesión
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            ¿No tienes una cuenta?{' '}
                            <TextLink href={register()} tabIndex={5}>
                                Regístrate
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>

            {socialProviders.length > 0 && (
                <div className="mt-6 grid gap-3">
                    <div className="relative flex items-center justify-center">
                        <span className="h-px flex-1 bg-border" />
                        <span className="px-3 text-xs text-muted-foreground">O continúa con</span>
                        <span className="h-px flex-1 bg-border" />
                    </div>
                    <div className="flex justify-center gap-3">
                        {socialProviders.map((provider) => {
                            const isGitHub = provider === 'github';
                            const label = provider === 'github' ? 'GitHub' : 'Google';

                            return (
                                <a
                                    key={provider}
                                    href={SocialLoginController.redirect(provider).url}
                                    aria-label={`Continuar con ${label}`}
                                    title={`Continuar con ${label}`}
                                    className="inline-flex size-11 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    {isGitHub ? (
                                        <GitHubIcon />
                                    ) : (
                                        <GoogleIcon />
                                    )}
                                    <span className="sr-only">Continuar con {label}</span>
                                </a>
                            );
                        })}
                    </div>
                </div>
            )}

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Inicia sesión en tu cuenta',
    description: 'Ingresa tu correo electrónico y contraseña para acceder',
};
