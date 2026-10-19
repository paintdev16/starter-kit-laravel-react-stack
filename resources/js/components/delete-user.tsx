import { Form } from '@inertiajs/react';
import { Trash2, TriangleAlert } from 'lucide-react';
import { useRef } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Web/Settings/ProfileController';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

export default function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);

    return (
        <section className="space-y-4">
            <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-destructive uppercase">
                    Zona de riesgo
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">
                    Eliminar cuenta
                </h2>
            </div>

            <Card className="border-destructive/20 bg-destructive/3 shadow-sm">
                <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                            <TriangleAlert className="size-5" />
                        </span>
                        <div className="space-y-1">
                            <p className="font-medium">
                                Eliminar esta cuenta permanentemente
                            </p>
                            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                                Se borrarán todos los datos y recursos asociados.
                                Esta acción no se puede deshacer.
                            </p>
                        </div>
                    </div>

                    <Dialog>
                        <DialogTrigger
                            render={
                                <Button
                                    variant="destructive"
                                    className="shrink-0"
                                    data-test="delete-user-button"
                                />
                            }
                        >
                            <Trash2 />
                            Eliminar cuenta
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <span className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                                    <TriangleAlert className="size-5" />
                                </span>
                                <DialogTitle>
                                    ¿Eliminar tu cuenta definitivamente?
                                </DialogTitle>
                                <DialogDescription>
                                    Todos tus datos se eliminarán de forma
                                    permanente. Ingresa tu contraseña para
                                    confirmar esta acción.
                                </DialogDescription>
                            </DialogHeader>

                            <Form
                                {...ProfileController.destroy.form()}
                                options={{ preserveScroll: true }}
                                onError={() => passwordInput.current?.focus()}
                                resetOnSuccess
                                className="space-y-5"
                            >
                                {({ resetAndClearErrors, processing, errors }) => (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="delete-password">
                                                Contraseña actual
                                            </Label>
                                            <PasswordInput
                                                id="delete-password"
                                                name="password"
                                                ref={passwordInput}
                                                placeholder="Ingresa tu contraseña"
                                                autoComplete="current-password"
                                                className="h-10"
                                            />
                                            <InputError
                                                message={errors.password}
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
                                                variant="destructive"
                                                disabled={processing}
                                                type="submit"
                                                data-test="confirm-delete-user-button"
                                            >
                                                {processing
                                                    ? 'Eliminando…'
                                                    : 'Eliminar definitivamente'}
                                            </Button>
                                        </DialogFooter>
                                    </>
                                )}
                            </Form>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>
        </section>
    );
}
