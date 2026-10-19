import { Form, Head, usePage } from '@inertiajs/react';
import { ArrowRight, Check, CircleHelp, MailCheck } from 'lucide-react';
import { logout } from '@/routes';
import { send } from '@/routes/verification';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    status?: string;
};

export default function VerifyEmail({ status }: Props) {
    const { auth } = usePage().props;
    const email = auth.user?.email;
    const linkSent = status === 'verification-link-sent';

    return (
        <>
            <Head title="Verifica tu correo" />

            <div className="space-y-5">
                <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm shadow-foreground/5 sm:p-6">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-16 -right-12 size-40 rounded-full bg-primary/10 blur-3xl"
                    />

                    <div className="relative flex flex-col items-center text-center">
                        <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                            {linkSent ? (
                                <Check className="size-7" strokeWidth={2.5} />
                            ) : (
                                <MailCheck className="size-7" strokeWidth={1.8} />
                            )}
                        </div>

                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                            <span className="size-1.5 rounded-full bg-primary" />
                            {linkSent ? 'ENLACE ENVIADO' : 'VERIFICACIÓN PENDIENTE'}
                        </div>

                        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                            {linkSent
                                ? 'Enviamos un nuevo enlace de verificación. Revisa tu bandeja de entrada para continuar.'
                                : 'Te enviamos un enlace para confirmar que esta dirección de correo te pertenece.'}
                        </p>

                        {email && (
                            <div className="mt-4 max-w-full truncate rounded-lg border border-border bg-muted/50 px-3.5 py-2 text-sm font-medium text-foreground">
                                {email}
                            </div>
                        )}
                    </div>

                    <div className="relative mt-6 grid gap-3 rounded-xl border border-border/70 bg-background/70 p-4 text-left sm:grid-cols-2">
                        <div className="flex items-start gap-3">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                1
                            </span>
                            <span className="text-sm leading-5 text-muted-foreground">
                                Abre el correo que te enviamos.
                            </span>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                2
                            </span>
                            <span className="text-sm leading-5 text-muted-foreground">
                                Pulsa el botón de verificación para activar tu cuenta.
                            </span>
                        </div>
                    </div>
                </section>

                <Form {...send.form()}>
                    {({ processing }) => (
                        <Button
                            type="submit"
                            className="h-11 w-full rounded-xl"
                            disabled={processing}
                        >
                            {processing ? <Spinner /> : null}
                            {processing ? 'Enviando enlace…' : 'Reenviar enlace de verificación'}
                            {!processing && <ArrowRight data-icon="inline-end" />}
                        </Button>
                    )}
                </Form>

                <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/30 p-3.5 text-sm text-muted-foreground">
                    <CircleHelp className="mt-0.5 size-4 shrink-0 text-muted-foreground/80" />
                    <p className="leading-5">
                        ¿No encuentras el mensaje? Revisa la carpeta de spam y asegúrate de que el correo sea correcto.
                    </p>
                </div>

                <Form {...logout.form()} className="text-center">
                    <Button
                        type="submit"
                        variant="ghost"
                        className="h-9 text-muted-foreground hover:text-foreground"
                    >
                        Cerrar sesión
                    </Button>
                </Form>
            </div>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Confirma tu correo',
    description: 'Un último paso para proteger tu cuenta y empezar a usar Paint.',
};
