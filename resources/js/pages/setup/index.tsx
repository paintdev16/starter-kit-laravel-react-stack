import { Form, Head } from '@inertiajs/react';
import {
    ArrowRight,
    Check,
    KeyRound,
    Rocket,
    Settings2,
    ShieldCheck,
    Terminal,
    UserRound,
} from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/setup';

type Props = {
    available: boolean;
    pending: boolean;
    defaults: { app_name: string; timezone: string };
    timezones: string[];
};

export default function Installation({
    available,
    pending,
    defaults,
    timezones,
}: Props) {
    return (
        <>
            <Head title="Instalación inicial">
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <main className="min-h-svh bg-background px-5 py-10 text-foreground sm:px-8 lg:py-16">
                <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
                    <aside className="space-y-8 lg:sticky lg:top-16 lg:self-start">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                            <Rocket className="size-7" />
                        </div>
                        <div className="space-y-4">
                            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
                                Tu punto de partida
                            </p>
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                Dale identidad a tu aplicación.
                            </h1>
                            <p className="max-w-md leading-relaxed text-muted-foreground">
                                Configura los datos básicos y crea la cuenta que
                                administrará tu aplicación desde el primer día.
                            </p>
                        </div>
                        <ol className="grid gap-5">
                            {[
                                {
                                    icon: KeyRound,
                                    title: 'Confirma el acceso',
                                    description:
                                        'Usa el código privado generado en el servidor.',
                                },
                                {
                                    icon: Settings2,
                                    title: 'Personaliza tu espacio',
                                    description:
                                        'Elige el nombre, correo de soporte y zona horaria.',
                                },
                                {
                                    icon: UserRound,
                                    title: 'Crea tu administrador',
                                    description:
                                        'Tu primera cuenta tendrá el rol super-admin.',
                                },
                            ].map(
                                ({ icon: Icon, title, description }, index) => (
                                    <li key={title} className="flex gap-4">
                                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-muted/50 text-primary">
                                            <Icon className="size-4" />
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium">
                                                <span className="mr-2 text-muted-foreground">
                                                    0{index + 1}
                                                </span>
                                                {title}
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {description}
                                            </p>
                                        </div>
                                    </li>
                                ),
                            )}
                        </ol>
                        <div className="flex gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm">
                            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
                            <p className="leading-relaxed text-muted-foreground">
                                Esta configuración se realiza una sola vez. Al
                                terminar, el asistente se bloqueará
                                automáticamente.
                            </p>
                        </div>
                    </aside>

                    <section
                        className="overflow-hidden rounded-3xl border bg-card shadow-sm"
                        aria-label="Configuración inicial"
                    >
                        <header className="flex items-start justify-between gap-4 border-b bg-muted/30 px-6 py-6 sm:px-8">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Instalación inicial
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Prepara tu espacio de trabajo.
                                </p>
                            </div>
                            <span className="shrink-0 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                                Primer acceso
                            </span>
                        </header>

                        {!available ? (
                            <div className="space-y-5 p-6 sm:p-8">
                                <span className="flex size-12 items-center justify-center rounded-2xl bg-muted">
                                    <Terminal className="size-6 text-primary" />
                                </span>
                                <div className="space-y-2" role="status">
                                    <h3 className="font-semibold">
                                        {pending
                                            ? 'El código de instalación venció'
                                            : 'Habilita la instalación'}
                                    </h3>
                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                        Ejecuta este comando en la carpeta del
                                        proyecto, en el servidor, para obtener
                                        un código privado válido durante 60
                                        minutos.
                                    </p>
                                </div>
                                <pre className="overflow-x-auto rounded-xl border bg-muted/50 p-4 text-sm">
                                    <code>php artisan app:install</code>
                                </pre>
                                <p className="text-sm text-muted-foreground">
                                    Después, recarga esta página. Si repites el
                                    comando, el código anterior dejará de
                                    funcionar.
                                </p>
                            </div>
                        ) : (
                            <Form
                                {...store.form()}
                                resetOnError={[
                                    'password',
                                    'password_confirmation',
                                    'setup_token',
                                ]}
                                resetOnSuccess
                                className="p-6 sm:p-8"
                            >
                                {({ processing, errors }) => (
                                    <fieldset
                                        disabled={processing}
                                        className="grid min-w-0 gap-8"
                                    >
                                        <legend className="sr-only">
                                            Datos de instalación y cuenta
                                            administradora
                                        </legend>
                                        <div className="grid gap-2">
                                            <Label htmlFor="setup_token">
                                                Código de instalación
                                            </Label>
                                            <Input
                                                id="setup_token"
                                                name="setup_token"
                                                type="password"
                                                autoComplete="off"
                                                autoFocus
                                                required
                                                minLength={64}
                                                maxLength={64}
                                                className="h-11 font-mono"
                                                aria-invalid={Boolean(
                                                    errors.setup_token,
                                                )}
                                                aria-describedby="setup_token-help setup_token-error"
                                            />
                                            <p
                                                id="setup_token-help"
                                                className="text-xs text-muted-foreground"
                                            >
                                                Pega el código de 64 caracteres
                                                que aparece en la terminal.
                                            </p>
                                            <InputError
                                                id="setup_token-error"
                                                message={errors.setup_token}
                                            />
                                        </div>

                                        <section
                                            className="grid gap-5"
                                            aria-labelledby="application-heading"
                                        >
                                            <h3
                                                id="application-heading"
                                                className="flex items-center gap-2 font-semibold"
                                            >
                                                <Settings2 className="size-4 text-primary" />
                                                Tu aplicación
                                            </h3>
                                            <div className="grid gap-2">
                                                <Label htmlFor="app_name">
                                                    Nombre de la aplicación
                                                </Label>
                                                <Input
                                                    id="app_name"
                                                    name="app_name"
                                                    defaultValue={
                                                        defaults.app_name
                                                    }
                                                    required
                                                    maxLength={100}
                                                    autoComplete="organization"
                                                    className="h-11"
                                                    aria-invalid={Boolean(
                                                        errors.app_name,
                                                    )}
                                                    aria-describedby="app_name-error"
                                                />
                                                <InputError
                                                    id="app_name-error"
                                                    message={errors.app_name}
                                                />
                                            </div>
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="grid content-start gap-2">
                                                    <Label htmlFor="support_email">
                                                        Correo de soporte{' '}
                                                        <span className="text-xs font-normal text-muted-foreground">
                                                            Opcional
                                                        </span>
                                                    </Label>
                                                    <Input
                                                        id="support_email"
                                                        name="support_email"
                                                        type="email"
                                                        maxLength={255}
                                                        placeholder="soporte@tuempresa.com"
                                                        className="h-11"
                                                        aria-invalid={Boolean(
                                                            errors.support_email,
                                                        )}
                                                        aria-describedby="support_email-error"
                                                    />
                                                    <InputError
                                                        id="support_email-error"
                                                        message={
                                                            errors.support_email
                                                        }
                                                    />
                                                </div>
                                                <div className="grid content-start gap-2">
                                                    <Label htmlFor="timezone">
                                                        Zona horaria
                                                    </Label>
                                                    <select
                                                        id="timezone"
                                                        name="timezone"
                                                        defaultValue={
                                                            defaults.timezone
                                                        }
                                                        required
                                                        className="h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                                        aria-invalid={Boolean(
                                                            errors.timezone,
                                                        )}
                                                        aria-describedby="timezone-error"
                                                    >
                                                        {timezones.map(
                                                            (zone) => (
                                                                <option
                                                                    key={zone}
                                                                    value={zone}
                                                                >
                                                                    {zone.replaceAll(
                                                                        '_',
                                                                        ' ',
                                                                    )}
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                    <InputError
                                                        id="timezone-error"
                                                        message={
                                                            errors.timezone
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </section>

                                        <section
                                            className="grid gap-5 border-t pt-6"
                                            aria-labelledby="admin-heading"
                                        >
                                            <div className="space-y-1">
                                                <h3
                                                    id="admin-heading"
                                                    className="flex items-center gap-2 font-semibold"
                                                >
                                                    <ShieldCheck className="size-4 text-primary" />
                                                    Cuenta superadministradora
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Tendrá acceso completo a
                                                    usuarios, permisos y
                                                    configuración.
                                                </p>
                                            </div>
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="grid content-start gap-2">
                                                    <Label htmlFor="name">
                                                        Nombre completo
                                                    </Label>
                                                    <Input
                                                        id="name"
                                                        name="name"
                                                        required
                                                        maxLength={255}
                                                        autoComplete="name"
                                                        className="h-11"
                                                        aria-invalid={Boolean(
                                                            errors.name,
                                                        )}
                                                        aria-describedby="name-error"
                                                    />
                                                    <InputError
                                                        id="name-error"
                                                        message={errors.name}
                                                    />
                                                </div>
                                                <div className="grid content-start gap-2">
                                                    <Label htmlFor="email">
                                                        Correo electrónico
                                                    </Label>
                                                    <Input
                                                        id="email"
                                                        name="email"
                                                        type="email"
                                                        required
                                                        maxLength={255}
                                                        autoComplete="username"
                                                        className="h-11"
                                                        aria-invalid={Boolean(
                                                            errors.email,
                                                        )}
                                                        aria-describedby="email-error"
                                                    />
                                                    <InputError
                                                        id="email-error"
                                                        message={errors.email}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="grid content-start gap-2">
                                                    <Label htmlFor="password">
                                                        Contraseña
                                                    </Label>
                                                    <PasswordInput
                                                        id="password"
                                                        name="password"
                                                        required
                                                        minLength={12}
                                                        maxLength={255}
                                                        autoComplete="new-password"
                                                        className="h-11"
                                                        aria-invalid={Boolean(
                                                            errors.password,
                                                        )}
                                                        aria-describedby="password-help password-error"
                                                    />
                                                    <InputError
                                                        id="password-error"
                                                        message={
                                                            errors.password
                                                        }
                                                    />
                                                </div>
                                                <div className="grid content-start gap-2">
                                                    <Label htmlFor="password_confirmation">
                                                        Confirmar contraseña
                                                    </Label>
                                                    <PasswordInput
                                                        id="password_confirmation"
                                                        name="password_confirmation"
                                                        required
                                                        minLength={12}
                                                        maxLength={255}
                                                        autoComplete="new-password"
                                                        className="h-11"
                                                        aria-invalid={Boolean(
                                                            errors.password_confirmation,
                                                        )}
                                                        aria-describedby="password_confirmation-error"
                                                    />
                                                    <InputError
                                                        id="password_confirmation-error"
                                                        message={
                                                            errors.password_confirmation
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            <p
                                                id="password-help"
                                                className="text-xs leading-relaxed text-muted-foreground"
                                            >
                                                Usa al menos 12 caracteres con
                                                mayúsculas, minúsculas, números
                                                y símbolos.
                                            </p>
                                        </section>

                                        <div className="grid gap-4 border-t pt-6">
                                            <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                                                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                                                Se crearán los roles y permisos
                                                iniciales, sin cuentas de
                                                demostración.
                                            </p>
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                className="h-11 w-full gap-2"
                                            >
                                                {processing ? (
                                                    <Spinner />
                                                ) : (
                                                    <ArrowRight className="size-4" />
                                                )}
                                                {processing
                                                    ? 'Preparando tu aplicación…'
                                                    : 'Completar instalación'}
                                            </Button>
                                        </div>
                                    </fieldset>
                                )}
                            </Form>
                        )}
                    </section>
                </div>
            </main>
        </>
    );
}
