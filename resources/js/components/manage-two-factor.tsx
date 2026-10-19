import { Form } from '@inertiajs/react';
import { ShieldCheck, Smartphone } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import { disable, enable } from '@/routes/two-factor';

export type Props = {
    canManageTwoFactor?: boolean;
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
};

export default function ManageTwoFactor(props: Props) {
    const requiresConfirmation = props.requiresConfirmation ?? false;
    const twoFactorEnabled = props.twoFactorEnabled ?? false;

    const {
        qrCodeSvg,
        hasSetupData,
        manualSetupKey,
        clearSetupData,
        clearTwoFactorAuthData,
        fetchSetupData,
        recoveryCodesList,
        fetchRecoveryCodes,
        errors,
    } = useTwoFactorAuth();
    const [showSetupModal, setShowSetupModal] = useState(false);
    const prevTwoFactorEnabled = useRef(twoFactorEnabled);

    useEffect(() => {
        if (prevTwoFactorEnabled.current && !twoFactorEnabled) {
            clearTwoFactorAuthData();
        }

        prevTwoFactorEnabled.current = twoFactorEnabled;
    }, [twoFactorEnabled, clearTwoFactorAuthData]);

    if (!(props.canManageTwoFactor ?? false)) {
        return null;
    }

    return (
        <Card className="border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/70">
                <span className="mb-2 flex size-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
                    <Smartphone className="size-5" />
                </span>
                <CardTitle>Autenticación en dos pasos</CardTitle>
                <CardDescription>
                    Añade un código de verificación después de tu contraseña al
                    iniciar sesión.
                </CardDescription>
                <CardAction>
                    <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${twoFactorEnabled ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}
                    >
                        {twoFactorEnabled ? 'Activada' : 'Desactivada'}
                    </span>
                </CardAction>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-5">
                <div className="rounded-xl border border-border/70 bg-muted/35 p-4">
                    <p className="text-xs leading-5 text-muted-foreground">
                        Usa una aplicación de autenticación para generar códigos
                        temporales y proteger tu cuenta si alguien obtiene tu
                        contraseña.
                    </p>
                </div>

                {twoFactorEnabled ? (
                    <div className="flex flex-col items-start gap-4">
                        <Form {...disable.form()}>
                            {({ processing }) => (
                                <Button
                                    variant="destructive"
                                    type="submit"
                                    disabled={processing}
                                >
                                    Desactivar 2FA
                                </Button>
                            )}
                        </Form>

                        <TwoFactorRecoveryCodes
                            recoveryCodesList={recoveryCodesList}
                            fetchRecoveryCodes={fetchRecoveryCodes}
                            errors={errors}
                        />
                    </div>
                ) : hasSetupData ? (
                    <Button
                        className="w-fit"
                        onClick={() => setShowSetupModal(true)}
                    >
                        <ShieldCheck />
                        Continuar configuración
                    </Button>
                ) : (
                    <Form
                        {...enable.form()}
                        onSuccess={() => setShowSetupModal(true)}
                    >
                        {({ processing }) => (
                            <Button type="submit" disabled={processing}>
                                <ShieldCheck />
                                Activar 2FA
                            </Button>
                        )}
                    </Form>
                )}
            </CardContent>

            <TwoFactorSetupModal
                isOpen={showSetupModal}
                onClose={() => setShowSetupModal(false)}
                requiresConfirmation={requiresConfirmation}
                twoFactorEnabled={twoFactorEnabled}
                qrCodeSvg={qrCodeSvg}
                manualSetupKey={manualSetupKey}
                clearSetupData={clearSetupData}
                fetchSetupData={fetchSetupData}
                errors={errors}
            />
        </Card>
    );
}
