import { usePasskeyRegister } from '@laravel/passkeys/react';
import { Fingerprint, Plus } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
    onSuccess: () => void;
};

function defaultPasskeyName() {
    if (typeof navigator === 'undefined') {
        return '';
    }

    const ua = navigator.userAgent;
    const browser = [
        { pattern: /Edg|Edge/, name: 'Edge' },
        { pattern: /OPR|Opera|OPiOS/, name: 'Opera' },
        { pattern: /Firefox|FxiOS/, name: 'Firefox' },
        { pattern: /Chrome|CriOS/, name: 'Chrome' },
        { pattern: /Safari/, name: 'Safari' },
    ].find(({ pattern }) => pattern.test(ua))?.name;
    const os = [
        { pattern: /iPhone/, name: 'iPhone' },
        { pattern: /iPad|Macintosh(?=.*Mobile)/, name: 'iPad' },
        { pattern: /Android/, name: 'Android' },
        { pattern: /Mac/, name: 'Mac' },
        { pattern: /Windows/, name: 'Windows' },
    ].find(({ pattern }) => pattern.test(ua))?.name;

    return [browser, os].filter(Boolean).join(' en ');
}

export default function PasskeyRegistration({ onSuccess }: Props) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(defaultPasskeyName);
    const { register, isLoading, error, isSupported } = usePasskeyRegister({
        onSuccess: () => {
            setOpen(false);
            setName(defaultPasskeyName());
            onSuccess();
        },
    });

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (name.trim()) {
            await register(name.trim());
        }
    };

    if (!isSupported) {
        return (
            <p className="text-xs text-muted-foreground">
                Este navegador no admite llaves de acceso.
            </p>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button variant="outline" />}>
                <Plus />
                Añadir llave
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <span className="flex size-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-300">
                        <Fingerprint className="size-5" />
                    </span>
                    <DialogTitle>Añadir una llave de acceso</DialogTitle>
                    <DialogDescription>
                        Asigna un nombre reconocible al dispositivo. El
                        navegador te pedirá confirmar con biometría o con el
                        bloqueo del equipo.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="passkey-name">
                            Nombre de la llave
                        </Label>
                        <Input
                            id="passkey-name"
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Ej. Laptop del trabajo"
                            className="h-10"
                            autoFocus
                        />
                        <p className="text-xs leading-5 text-muted-foreground">
                            Este nombre te ayudará a reconocer el dispositivo
                            más adelante.
                        </p>
                    </div>

                    {error && <InputError message={error} />}

                    <DialogFooter className="mt-6">
                        <DialogClose
                            render={
                                <Button type="button" variant="outline" />
                            }
                        >
                            Cancelar
                        </DialogClose>
                        <Button
                            type="submit"
                            disabled={isLoading || !name.trim()}
                        >
                            {isLoading ? 'Registrando…' : 'Registrar llave'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
