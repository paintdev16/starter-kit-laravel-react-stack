import { Form, Head } from '@inertiajs/react';
import SocialLoginController from '@/actions/App/Http/Controllers/Web/Auth/SocialLoginController';
import { GoogleIcon } from '@/components/icons/google';
import GitHubIcon from '@/components/icons/github';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
    socialProviders?: Array<'github' | 'google'>;
};

export default function Register({ passwordRules, socialProviders = [] }: Props) {
    return (
        <>
            <Head title="Registrarse" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Nombre completo"
                                />
                                <InputError
                                    message={errors.name}
                                    className="mt-2"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Correo electrónico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="correo@ejemplo.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Contraseña</Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Contraseña"
                                    passwordrules={passwordRules}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Confirmar contraseña
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirmar contraseña"
                                    passwordrules={passwordRules}
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={5}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                Crear cuenta
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            ¿Ya tienes una cuenta?{' '}
                            <TextLink href={login()} tabIndex={6}>
                                Iniciar sesión
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>

            {socialProviders.length > 0 && (
                <div className="mt-6 grid gap-3">
                    <div className="relative flex items-center justify-center">
                        <span className="h-px flex-1 bg-border" />
                        <span className="px-3 text-xs text-muted-foreground">O regístrate con</span>
                        <span className="h-px flex-1 bg-border" />
                    </div>
                    <div className="flex justify-center gap-3">
                        {socialProviders.map((provider) => {
                            const isGitHub = provider === 'github';
                            const label = isGitHub ? 'GitHub' : 'Google';

                            return (
                                <a
                                    key={provider}
                                    href={SocialLoginController.redirect(provider).url}
                                    aria-label={`Registrarse con ${label}`}
                                    title={`Registrarse con ${label}`}
                                    className="inline-flex size-11 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    {isGitHub ? <GitHubIcon /> : <GoogleIcon />}
                                    <span className="sr-only">Registrarse con {label}</span>
                                </a>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
}

Register.layout = {
    title: 'Crear una cuenta',
    description: 'Ingresa tus datos a continuación para registrarte',
};
