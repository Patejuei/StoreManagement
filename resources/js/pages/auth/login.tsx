import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { Mail, Lock, LogIn } from 'lucide-react';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({
    status,
    canResetPassword,
}: Props) {
    return (
        <>
            <Head title="Iniciar Sesión" />

            <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-1 shadow-xl">
                {/* Background accent */}
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

                <div className="relative p-6">
                    <Form
                        {...store.form()}
                        resetOnSuccess={['password']}
                        className="flex flex-col gap-6"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-5">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email" className="text-sm font-semibold tracking-tight">
                                            Correo Electrónico
                                        </Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                                            <Input
                                                id="email"
                                                type="email"
                                                name="email"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                autoComplete="email"
                                                placeholder="tu@email.com"
                                                className="pl-10 h-11 bg-muted/30 focus:bg-background transition-colors"
                                            />
                                        </div>
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="grid gap-2">
                                        <div className="flex items-center">
                                            <Label htmlFor="password" className="text-sm font-semibold tracking-tight">
                                                Contraseña
                                            </Label>
                                            {canResetPassword && (
                                                <TextLink
                                                    href={request()}
                                                    className="ml-auto text-xs font-medium text-primary hover:underline"
                                                    tabIndex={5}
                                                >
                                                    ¿Olvidaste tu contraseña?
                                                </TextLink>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                                            <PasswordInput
                                                id="password"
                                                name="password"
                                                required
                                                tabIndex={2}
                                                autoComplete="current-password"
                                                placeholder="••••••••"
                                                className="pl-10 h-11 bg-muted/30 focus:bg-background transition-colors"
                                            />
                                        </div>
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="flex items-center space-x-3 py-1">
                                        <Checkbox
                                            id="remember"
                                            name="remember"
                                            tabIndex={3}
                                            className="rounded-md border-border/50 data-[state=checked]:bg-primary"
                                        />
                                        <Label htmlFor="remember" className="text-sm font-medium text-muted-foreground cursor-pointer select-none">
                                            Recordarme en este equipo
                                        </Label>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="h-11 w-full bg-primary font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all glow-primary"
                                        tabIndex={4}
                                        disabled={processing}
                                        data-test="login-button"
                                    >
                                        {processing ? <Spinner className="mr-2" /> : <LogIn className="mr-2 h-4 w-4" />}
                                        Iniciar Sesión
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            </div>

            {status && (
                <div className="mt-6 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-center text-sm font-medium text-green-600 dark:text-green-400">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: '¡Bienvenido de nuevo!',
    description: 'Ingresá tus credenciales para acceder a tu cuenta',
};
