import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Store, Plus, Search, CheckCircle, Pencil } from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import type { Tenant } from '@/types';

interface Props {
    tenants: Tenant[];
}

export default function TenantIndex({ tenants }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
    
    const filteredTenants = tenants.filter(t => 
        t.name.toLowerCase().includes(search.toLowerCase()) || 
        t.slug.toLowerCase().includes(search.toLowerCase())
    );

    const openEdit = (tenant: Tenant) => {
        setEditingTenant(tenant);
        setShowForm(true);
    };

    return (
        <AdminLayout breadcrumbs={[{ title: 'Tiendas', href: '/admin/tenants' }]}>
            <Head title="Administración de Tiendas" />

            {flash?.success && (
                <div className="fixed right-6 top-6 z-50 animate-slide-in rounded-xl border border-primary/30 bg-primary/10 px-5 py-3 text-sm font-medium text-primary shadow-lg backdrop-blur-md">
                    <CheckCircle className="mr-2 inline h-4 w-4" />{flash.success}
                </div>
            )}

            <div className="flex flex-col gap-6 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold">Administración de Tiendas</h1>
                        <p className="text-sm text-muted-foreground">{tenants.length} tiendas en el sistema</p>
                    </div>
                    <Button onClick={() => { setEditingTenant(null); setShowForm(true); }} className="glow-primary">
                        <Plus className="mr-1.5 h-4 w-4" />Nueva Tienda
                    </Button>
                </div>

                <div className="relative flex-1 neo-focus rounded-lg border border-border/50 bg-background">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre o slug..."
                        className="h-10 w-full rounded-lg bg-transparent pl-10 pr-4 text-sm outline-none"
                    />
                </div>

                <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-border/50 bg-muted/50">
                                    <th className="px-6 py-3 font-semibold">ID</th>
                                    <th className="px-6 py-3 font-semibold">Nombre</th>
                                    <th className="px-6 py-3 font-semibold">Slug</th>
                                    <th className="px-6 py-3 font-semibold text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTenants.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-16 text-center text-muted-foreground">
                                            <Store className="mx-auto mb-3 h-12 w-12 opacity-30" />
                                            <p>No se encontraron tiendas</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTenants.map((tenant) => (
                                        <tr key={tenant.id} className="border-b border-border/30 transition-colors hover:bg-muted/30">
                                            <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{tenant.id}</td>
                                            <td className="px-6 py-4 font-medium">{tenant.name}</td>
                                            <td className="px-6 py-4">
                                                <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                                                    {tenant.slug}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => openEdit(tenant)} className="text-primary hover:bg-primary/10">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="outline" size="sm" asChild>
                                                        <a href={`/${tenant.slug}/dashboard`}>Ver Panel</a>
                                                    </Button>
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

            <TenantFormDialog 
                open={showForm} 
                onClose={() => { setShowForm(false); setEditingTenant(null); }} 
                tenant={editingTenant}
            />
        </AdminLayout>
    );
}

function TenantFormDialog({ open, onClose, tenant }: { open: boolean; onClose: () => void; tenant: Tenant | null }) {
    const [form, setForm] = useState({ name: '', slug: '' });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (tenant) {
            setForm({ name: tenant.name, slug: tenant.slug });
        } else {
            setForm({ name: '', slug: '' });
        }
        setErrors({});
    }, [tenant, open]);

    const handleSubmit = () => {
        setProcessing(true);
        const method = tenant ? 'put' : 'post';
        const url = tenant ? `/admin/tenants/${tenant.id}` : '/admin/tenants';
        
        router[method](url, form, {
            onSuccess: () => { onClose(); setProcessing(false); },
            onError: (errs) => { setErrors(errs as Record<string, string>); setProcessing(false); },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Store className="h-5 w-5 text-primary" />
                        {tenant ? 'Editar Tienda' : 'Nueva Tienda'}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Nombre de la Tienda</Label>
                        <Input 
                            value={form.name} 
                            onChange={(e) => {
                                const name = e.target.value;
                                setForm(prev => ({ 
                                    ...prev, 
                                    name,
                                    slug: prev.slug === '' || prev.slug === name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') 
                                        ? name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') 
                                        : prev.slug
                                }));
                            }} 
                        />
                        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label>Slug (URL)</Label>
                        <Input 
                            value={form.slug} 
                            onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))} 
                        />
                        {errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={processing} className="glow-primary">
                        Crear Tienda
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
