import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    Tags, Plus, Pencil, Trash2, Power, AlertCircle, CheckCircle,
    Package, Clock, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { Product, ProductSale, ProductSaleRule } from '@/types';

interface Props {
    offers: ProductSale[];
    products: Product[];
}

interface RuleForm {
    product_id: number;
    offer_type: 'percentage' | 'fixed';
    minimal_quantity: number;
    discount_value: number;
    [key: string]: string | number;
}

const formatCLP = (amount: number) => `$${amount.toLocaleString('es-CL')}`;

export default function Offers({ offers, products }: Props) {
    const { flash, current_tenant } = usePage<{ flash: { success?: string }, current_tenant?: string }>().props;
    const tenantPrefix = current_tenant ? `/${current_tenant}` : '/default';
    const [showForm, setShowForm] = useState(false);
    const [editOffer, setEditOffer] = useState<ProductSale | null>(null);
    const [showDelete, setShowDelete] = useState<ProductSale | null>(null);
    const [flashMsg, setFlashMsg] = useState<string | null>(null);

    useEffect(() => {
        if (flash?.success) {
            setFlashMsg(flash.success);
            const t = setTimeout(() => setFlashMsg(null), 4000);
            return () => clearTimeout(t);
        }
    }, [flash?.success]);

    const getOfferStatus = (offer: ProductSale) => {
        if (!offer.is_active) return { label: 'Inactiva', variant: 'secondary' as const, color: 'text-muted-foreground' };
        const now = new Date();
        const start = new Date(offer.start_date);
        const end = offer.end_date ? new Date(offer.end_date) : null;
        if (start > now) return { label: 'Programada', variant: 'outline' as const, color: 'text-blue-500' };
        if (end && end < now) return { label: 'Expirada', variant: 'secondary' as const, color: 'text-muted-foreground' };
        return { label: 'Activa', variant: 'default' as const, color: 'text-green-500' };
    };

    const toggleOffer = (id: number) => {
        router.patch(`${tenantPrefix}/offers/${id}/toggle`, {}, { preserveState: true });
    };

    const handleDelete = () => {
        if (!showDelete) return;
        router.delete(`${tenantPrefix}/offers/${showDelete.id}`, { onSuccess: () => setShowDelete(null) });
    };

    return (
        <>
            <Head title="Ofertas" />

            {flashMsg && (
                <div className="fixed right-6 top-6 z-50 animate-slide-in rounded-xl border border-primary/30 bg-primary/10 px-5 py-3 text-sm font-medium text-primary shadow-lg backdrop-blur-md">
                    <CheckCircle className="mr-2 inline h-4 w-4" />{flashMsg}
                </div>
            )}

            <div className="flex flex-col gap-5 p-6">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold">Administración de Ofertas</h1>
                        <p className="text-sm text-muted-foreground">Gestiona ofertas y promociones para tus productos</p>
                    </div>
                    <Button size="sm" onClick={() => { setEditOffer(null); setShowForm(true); }} className="glow-primary">
                        <Plus className="mr-1.5 h-4 w-4" />Nueva Oferta
                    </Button>
                </div>

                {/* Offers list */}
                {offers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-card py-20 shadow-sm">
                        <Tags className="mb-3 h-16 w-16 text-muted-foreground opacity-30" />
                        <p className="text-lg font-medium text-muted-foreground">No hay ofertas registradas</p>
                        <p className="text-sm text-muted-foreground">Crea tu primera oferta para atraer clientes</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {offers.map((offer) => {
                            const status = getOfferStatus(offer);
                            return (
                                <div
                                    key={offer.id}
                                    className={cn(
                                        'card-hover rounded-xl border bg-card p-5 shadow-sm transition-all',
                                        offer.is_active ? 'border-primary/20' : 'border-border/40 opacity-60',
                                    )}
                                >
                                    <div className="mb-3 flex items-start justify-between">
                                        <div>
                                            <h3 className="font-bold text-lg">{offer.name}</h3>
                                            <div className="mt-1 flex items-center gap-2">
                                                <Badge variant={status.variant} className="text-[10px]">{status.label}</Badge>
                                                <span className="text-xs text-muted-foreground">Prioridad: {offer.priority}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => toggleOffer(offer.id)}
                                                className={cn(
                                                    'rounded-md p-1.5 transition-colors',
                                                    offer.is_active
                                                        ? 'text-green-500 hover:bg-green-500/10'
                                                        : 'text-muted-foreground hover:bg-muted',
                                                )}
                                                title={offer.is_active ? 'Desactivar' : 'Activar'}
                                            >
                                                <Power className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => { setEditOffer(offer); setShowForm(true); }}
                                                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setShowDelete(offer)}
                                                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>{new Date(offer.start_date).toLocaleDateString('es-CL')}</span>
                                        <span>—</span>
                                        <span>{offer.end_date ? new Date(offer.end_date).toLocaleDateString('es-CL') : 'Sin fin'}</span>
                                    </div>

                                    {/* Rules */}
                                    <div className="space-y-1.5">
                                        {(offer.rules || []).map((rule) => (
                                            <div key={rule.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <Package className="h-3.5 w-3.5 text-primary" />
                                                    <span className="font-medium">{rule.product?.name || 'Producto'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground">Min: {rule.minimal_quantity}</span>
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {rule.offer_type === 'percentage'
                                                            ? `${rule.discount_value}%`
                                                            : formatCLP(rule.discount_value)}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                        {(!offer.rules || offer.rules.length === 0) && (
                                            <p className="text-xs text-muted-foreground italic">Sin reglas configuradas</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ═══════ OFFER FORM DIALOG ═══════ */}
            <OfferFormDialog
                open={showForm}
                onClose={() => { setShowForm(false); setEditOffer(null); }}
                offer={editOffer}
                products={products}
                tenantPrefix={tenantPrefix}
            />

            {/* ═══════ DELETE DIALOG ═══════ */}
            <Dialog open={!!showDelete} onOpenChange={() => setShowDelete(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            Eliminar Oferta
                        </DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de eliminar la oferta <span className="font-bold">{showDelete?.name}</span>? Esta acción eliminará también todas sus reglas.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDelete(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

/* ═══════════════════════════════════════════════════════════
   OFFER FORM DIALOG
   ═══════════════════════════════════════════════════════════ */
function OfferFormDialog({
    open, onClose, offer, products, tenantPrefix,
}: {
    open: boolean;
    onClose: () => void;
    offer: ProductSale | null;
    products: Product[];
    tenantPrefix: string;
}) {
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [priority, setPriority] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const [rules, setRules] = useState<RuleForm[]>([]);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (offer) {
            setName(offer.name);
            setStartDate(offer.start_date?.split('T')[0] || '');
            setEndDate(offer.end_date?.split('T')[0] || '');
            setPriority(offer.priority);
            setIsActive(offer.is_active);
            setRules((offer.rules || []).map((r) => ({
                product_id: r.product_id,
                offer_type: r.offer_type,
                minimal_quantity: r.minimal_quantity,
                discount_value: r.discount_value,
            })));
        } else {
            setName('');
            setStartDate(new Date().toISOString().split('T')[0]);
            setEndDate('');
            setPriority(0);
            setIsActive(true);
            setRules([]);
        }
    }, [offer, open]);

    const addRule = () => {
        setRules([...rules, { product_id: 0, offer_type: 'percentage', minimal_quantity: 1, discount_value: 0 }]);
    };

    const updateRule = (index: number, field: keyof RuleForm, value: string | number) => {
        setRules((prev) => prev.map((r, i) => {
            if (i !== index) return r;
            return { ...r, [field]: value } as RuleForm;
        }));
    };

    const removeRule = (index: number) => setRules((prev) => prev.filter((_, i) => i !== index));

    const handleSubmit = () => {
        setProcessing(true);
        const data = { name, start_date: startDate, end_date: endDate || null, priority, is_active: isActive, rules };

        if (offer) {
            router.put(`${tenantPrefix}/offers/${offer.id}`, data, {
                onSuccess: () => onClose(),
                onFinish: () => setProcessing(false),
            });
        } else {
            router.post(`${tenantPrefix}/offers`, data, {
                onSuccess: () => onClose(),
                onFinish: () => setProcessing(false),
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Tags className="h-5 w-5 text-primary" />
                        {offer ? 'Editar Oferta' : 'Nueva Oferta'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-5">
                    {/* Basic info */}
                    <div className="grid gap-3">
                        <div>
                            <Label>Nombre de la Oferta *</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" placeholder="Ej: Promo Verano 2026" />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <Label>Fecha Inicio *</Label>
                                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" />
                            </div>
                            <div>
                                <Label>Fecha Fin</Label>
                                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1" />
                            </div>
                            <div>
                                <Label>Prioridad</Label>
                                <Input type="number" min={0} value={priority} onChange={(e) => setPriority(parseInt(e.target.value) || 0)} className="mt-1" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                            <Checkbox checked={isActive} onCheckedChange={(v) => setIsActive(!!v)} id="offer-active" />
                            <Label htmlFor="offer-active">Oferta activa</Label>
                        </div>
                    </div>

                    <Separator />

                    {/* Rules */}
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="flex items-center gap-2 font-semibold">
                                <Zap className="h-4 w-4 text-primary" />
                                Reglas de Descuento
                            </h3>
                            <Button variant="outline" size="sm" onClick={addRule}>
                                <Plus className="mr-1 h-3.5 w-3.5" />Agregar Regla
                            </Button>
                        </div>

                        {rules.length === 0 ? (
                            <div className="rounded-xl border-2 border-dashed border-border/50 py-8 text-center text-sm text-muted-foreground">
                                <Tags className="mx-auto mb-2 h-8 w-8 opacity-30" />
                                Agrega reglas de descuento para esta oferta
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {rules.map((rule, index) => (
                                    <div key={index} className="animate-slide-in rounded-xl border border-border/40 bg-muted/20 p-4">
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="text-xs font-semibold text-muted-foreground">Regla #{index + 1}</span>
                                            <button onClick={() => removeRule(index)} className="text-muted-foreground hover:text-destructive">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="col-span-2">
                                                <Label className="text-xs">Producto</Label>
                                                <Select
                                                    onValueChange={(v) => updateRule(index, 'product_id', Number(v))}
                                                    value={rule.product_id ? String(rule.product_id) : ''}
                                                >
                                                    <SelectTrigger className="mt-1 h-9">
                                                        <SelectValue placeholder="Seleccionar producto..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {products.map((p) => (
                                                            <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label className="text-xs">Tipo de Descuento</Label>
                                                <Select
                                                    onValueChange={(v) => updateRule(index, 'offer_type', v)}
                                                    value={rule.offer_type}
                                                >
                                                    <SelectTrigger className="mt-1 h-9">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                                                        <SelectItem value="fixed">Monto Fijo ($)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label className="text-xs">Cantidad Mínima</Label>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={rule.minimal_quantity}
                                                    onChange={(e) => updateRule(index, 'minimal_quantity', parseInt(e.target.value) || 1)}
                                                    className="mt-1 h-9"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Label className="text-xs">
                                                    Valor del Descuento {rule.offer_type === 'percentage' ? '(%)' : '($)'}
                                                </Label>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    step={rule.offer_type === 'percentage' ? 1 : 100}
                                                    value={rule.discount_value}
                                                    onChange={(e) => updateRule(index, 'discount_value', parseFloat(e.target.value) || 0)}
                                                    className="mt-1 h-9"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={processing || !name || !startDate || rules.length === 0 || rules.some((r) => !r.product_id)}
                        className="glow-primary"
                    >
                        {offer ? 'Actualizar Oferta' : 'Crear Oferta'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

Offers.layout = {
    breadcrumbs: [
        { title: 'Ofertas', href: '/offers' },
    ],
};
