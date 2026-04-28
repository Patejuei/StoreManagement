import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Users, Search, CheckCircle, Shield, ShieldAlert, Store, Plus, Pencil } from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { User, Tenant } from '@/types';

interface UserWithTenant extends User {
    tenant?: Tenant;
}

interface Props {
    users: UserWithTenant[];
    tenants: Tenant[];
}

export default function UserIndex({ users, tenants }: Props) {
    const { flash, auth } = usePage<{ flash: { success?: string }, auth: { user: User } }>().props;
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<UserWithTenant | null>(null);
    
    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(search.toLowerCase()) || 
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    const handleToggleAdmin = (user: UserWithTenant) => {
        const action = user.is_super_admin ? 'demote' : 'promote';
        router.patch(`/admin/users/${user.id}/${action}`, {}, {
            preserveScroll: true,
        });
    };

    const openEdit = (user: UserWithTenant) => {
        setEditingUser(user);
        setShowForm(true);
    };

    return (
        <AdminLayout breadcrumbs={[{ title: 'Usuarios', href: '/admin/users' }]}>
            <Head title="Administración de Usuarios" />

            {flash?.success && (
                <div className="fixed right-6 top-6 z-50 animate-slide-in rounded-xl border border-primary/30 bg-primary/10 px-5 py-3 text-sm font-medium text-primary shadow-lg backdrop-blur-md">
                    <CheckCircle className="mr-2 inline h-4 w-4" />{flash.success}
                </div>
            )}

            <div className="flex flex-col gap-6 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold">Administración de Usuarios</h1>
                        <p className="text-sm text-muted-foreground">{users.length} usuarios registrados en total</p>
                    </div>
                    <Button onClick={() => { setEditingUser(null); setShowForm(true); }} className="glow-primary">
                        <Plus className="mr-1.5 h-4 w-4" />Nuevo Usuario
                    </Button>
                </div>

                <div className="relative flex-1 neo-focus rounded-lg border border-border/50 bg-background">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre o email..."
                        className="h-10 w-full rounded-lg bg-transparent pl-10 pr-4 text-sm outline-none"
                    />
                </div>

                <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-border/50 bg-muted/50">
                                    <th className="px-6 py-3 font-semibold">Usuario</th>
                                    <th className="px-6 py-3 font-semibold">Tienda (Tenant)</th>
                                    <th className="px-6 py-3 font-semibold text-center">Estado Admin</th>
                                    <th className="px-6 py-3 font-semibold text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-16 text-center text-muted-foreground">
                                            <Users className="mx-auto mb-3 h-12 w-12 opacity-30" />
                                            <p>No se encontraron usuarios</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="border-b border-border/30 transition-colors hover:bg-muted/30">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{user.name}</span>
                                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.tenant ? (
                                                    <div className="flex items-center gap-2">
                                                        <Store className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span className="text-sm">{user.tenant.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">Sin tienda asignada</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {user.is_super_admin ? (
                                                    <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-primary/30">
                                                        <Shield className="mr-1 h-3 w-3" /> Super Admin
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-muted-foreground">
                                                        Usuario
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button variant="ghost" size="sm" onClick={() => openEdit(user)} className="text-primary hover:bg-primary/10">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    {auth.user.id !== user.id ? (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => handleToggleAdmin(user)}
                                                            className={user.is_super_admin ? 'text-destructive hover:bg-destructive/10' : 'text-primary hover:bg-primary/10'}
                                                            title={user.is_super_admin ? 'Quitar Admin' : 'Hacer Admin'}
                                                        >
                                                            {user.is_super_admin ? <ShieldAlert className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                                                        </Button>
                                                    ) : (
                                                        <span className="text-[10px] text-muted-foreground italic px-2">(Tú)</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <UserFormDialog 
                open={showForm} 
                onClose={() => { setShowForm(false); setEditingUser(null); }} 
                user={editingUser}
                tenants={tenants}
            />
        </AdminLayout>
    );
}

function UserFormDialog({ open, onClose, user, tenants }: { open: boolean; onClose: () => void; user: UserWithTenant | null; tenants: Tenant[] }) {
    const [form, setForm] = useState({ 
        name: '', 
        email: '', 
        password: '', 
        password_confirmation: '', 
        tenant_id: 'none', 
        is_super_admin: false 
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (user) {
            setForm({ 
                name: user.name, 
                email: user.email, 
                password: '', 
                password_confirmation: '', 
                tenant_id: user.tenant_id?.toString() || 'none', 
                is_super_admin: user.is_super_admin 
            });
        } else {
            setForm({ 
                name: '', 
                email: '', 
                password: '', 
                password_confirmation: '', 
                tenant_id: 'none', 
                is_super_admin: false 
            });
        }
        setErrors({});
    }, [user, open]);

    const handleSubmit = () => {
        setProcessing(true);
        const method = user ? 'put' : 'post';
        const url = user ? `/admin/users/${user.id}` : '/admin/users';
        
        const data = {
            ...form,
            tenant_id: form.tenant_id === 'none' ? null : parseInt(form.tenant_id)
        };

        router[method](url, data, {
            onSuccess: () => { onClose(); setProcessing(false); },
            onError: (errs) => { setErrors(errs as Record<string, string>); setProcessing(false); },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        {user ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Nombre</Label>
                        <Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} />
                        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label>Email</Label>
                        <Input type="email" value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} />
                        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </div>
                    
                    {!user && (
                        <>
                            <div className="grid gap-2">
                                <Label>Contraseña</Label>
                                <Input type="password" value={form.password} onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))} />
                                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label>Confirmar Contraseña</Label>
                                <Input type="password" value={form.password_confirmation} onChange={(e) => setForm(prev => ({ ...prev, password_confirmation: e.target.value }))} />
                            </div>
                        </>
                    )}

                    <div className="grid gap-2">
                        <Label>Tienda (Tenant)</Label>
                        <Select value={form.tenant_id} onValueChange={(v) => setForm(prev => ({ ...prev, tenant_id: v }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tienda" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Sin tienda (Global)</SelectItem>
                                {tenants.map((t) => (
                                    <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.tenant_id && <p className="text-xs text-destructive">{errors.tenant_id}</p>}
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <Checkbox 
                            id="is_super_admin" 
                            checked={form.is_super_admin} 
                            onCheckedChange={(v) => setForm(prev => ({ ...prev, is_super_admin: !!v }))} 
                        />
                        <Label htmlFor="is_super_admin" className="cursor-pointer">Es Super Admin</Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={processing} className="glow-primary">
                        {user ? 'Actualizar' : 'Crear Usuario'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
