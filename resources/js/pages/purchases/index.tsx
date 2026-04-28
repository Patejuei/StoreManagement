import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    Truck, Plus, Trash2, Package, Search, CheckCircle,
    Building2, ChevronDown, FileText, ShoppingBag, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { Product, Supplier, Purchase, PaginatedData } from '@/types';

interface Props {
    purchases: PaginatedData<Purchase>;
    suppliers: Supplier[];
    products: Product[];
}

interface PurchaseLineItem {
    product_id: number;
    productName: string;
    quantity: number;
    unit_cost: number;
}

const formatCLP = (amount: number) => `$${amount.toLocaleString('es-CL')}`;

export default function Purchases({ purchases, suppliers, products }: Props) {
    const { flash, current_tenant } = usePage<{ flash: { success?: string }, current_tenant?: string }>().props;
    const tenantPrefix = current_tenant ? `/${current_tenant}` : '/default';
    const [showForm, setShowForm] = useState(false);
    const [purchaseType, setPurchaseType] = useState<'frequent' | 'external' | null>(null);
    const [showSupplierForm, setShowSupplierForm] = useState(false);
    const [showDetail, setShowDetail] = useState<Purchase | null>(null);
    const [flashMsg, setFlashMsg] = useState<string | null>(null);

    useEffect(() => {
        if (flash?.success) {
            setFlashMsg(flash.success);
            const t = setTimeout(() => setFlashMsg(null), 4000);
            return () => clearTimeout(t);
        }
    }, [flash?.success]);

    return (
        <>
            <Head title="Compras" />

            {flashMsg && (
                <div className="fixed right-6 top-6 z-50 animate-slide-in rounded-xl border border-primary/30 bg-primary/10 px-5 py-3 text-sm font-medium text-primary shadow-lg backdrop-blur-md">
                    <CheckCircle className="mr-2 inline h-4 w-4" />{flashMsg}
                </div>
            )}

            <div className="flex flex-col gap-5 p-6">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold">Compras de Abastecimiento</h1>
                        <p className="text-sm text-muted-foreground">Registro de compras y proveedores</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setPurchaseType('external'); setShowForm(true); }}>
                            <ShoppingBag className="mr-1.5 h-4 w-4" />Compra Externa
                        </Button>
                        <Button size="sm" onClick={() => { setPurchaseType('frequent'); setShowForm(true); }} className="glow-primary">
                            <Building2 className="mr-1.5 h-4 w-4" />Proveedor Frecuente
                        </Button>
                    </div>
                </div>

                {/* Purchases Table */}
                <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/50 bg-muted/50">
                                    <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                                    <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                                    <th className="px-4 py-3 text-left font-semibold">Proveedor</th>
                                    <th className="px-4 py-3 text-left font-semibold">N° Factura</th>
                                    <th className="px-4 py-3 text-center font-semibold">Items</th>
                                    <th className="px-4 py-3 text-right font-semibold">Total</th>
                                    <th className="px-4 py-3 text-center font-semibold">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchases.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-16 text-center text-muted-foreground">
                                            <Truck className="mx-auto mb-3 h-12 w-12 opacity-30" />
                                            <p>No hay compras registradas</p>
                                        </td>
                                    </tr>
                                ) : (
                                    purchases.data.map((purchase) => (
                                        <tr key={purchase.id} className="border-b border-border/30 transition-colors hover:bg-muted/30">
                                            <td className="px-4 py-3 text-muted-foreground">{new Date(purchase.purchase_date).toLocaleDateString('es-CL')}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant={purchase.type === 'frequent' ? 'default' : 'secondary'} className="text-[10px]">
                                                    {purchase.type === 'frequent' ? 'Frecuente' : 'Externa'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 font-medium">{purchase.supplier?.name || 'Compra Directa'}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{purchase.invoice_number || '—'}</td>
                                            <td className="px-4 py-3 text-center">{purchase.items?.length || 0}</td>
                                            <td className="px-4 py-3 text-right font-bold text-primary">{formatCLP(purchase.total)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <Button variant="ghost" size="sm" onClick={() => setShowDetail(purchase)}>
                                                    <FileText className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {purchases.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
                            <p className="text-xs text-muted-foreground">
                                Mostrando {purchases.from}–{purchases.to} de {purchases.total}
                            </p>
                            <div className="flex gap-1">
                                {purchases.links.map((link, i) => (
                                    <button
                                        key={i}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        disabled={!link.url}
                                        className={cn(
                                            'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                                            link.active ? 'bg-primary text-primary-foreground' : link.url ? 'hover:bg-muted' : 'opacity-40',
                                        )}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════ PURCHASE FORM DIALOG ═══════ */}
            <PurchaseFormDialog
                open={showForm}
                onClose={() => { setShowForm(false); setPurchaseType(null); }}
                type={purchaseType}
                suppliers={suppliers}
                products={products}
                onAddSupplier={() => setShowSupplierForm(true)}
                tenantPrefix={tenantPrefix}
            />

            {/* ═══════ SUPPLIER FORM DIALOG ═══════ */}
            <SupplierFormDialog
                open={showSupplierForm}
                onClose={() => setShowSupplierForm(false)}
                tenantPrefix={tenantPrefix}
            />

            {/* ═══════ DETAIL DIALOG ═══════ */}
            <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Detalle de Compra
                        </DialogTitle>
                    </DialogHeader>
                    {showDetail && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-4 text-sm">
                                <div>
                                    <p className="text-xs text-muted-foreground">Proveedor</p>
                                    <p className="font-bold">{showDetail.supplier?.name || 'Compra Directa'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">N° Factura</p>
                                    <p className="font-bold">{showDetail.invoice_number || 'S/N'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Fecha</p>
                                    <p className="font-bold">{new Date(showDetail.purchase_date).toLocaleDateString('es-CL')}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Total</p>
                                    <p className="font-bold text-primary">{formatCLP(showDetail.total)}</p>
                                </div>
                            </div>
                            {showDetail.notes && (
                                <div className="rounded-lg bg-muted/30 p-3 text-sm">
                                    <p className="text-xs text-muted-foreground mb-1">Notas</p>
                                    <p>{showDetail.notes}</p>
                                </div>
                            )}
                            <div>
                                <h3 className="mb-2 text-sm font-semibold">Productos</h3>
                                <div className="space-y-1.5">
                                    {showDetail.items?.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm">
                                            <span className="font-medium">{item.product?.name || 'Producto'}</span>
                                            <div className="flex items-center gap-4 text-muted-foreground">
                                                <span>{item.quantity} u.</span>
                                                <span>{formatCLP(item.unit_cost)} c/u</span>
                                                <span className="font-bold text-foreground">{formatCLP(item.subtotal)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

/* ═══════════════════════════════════════════════════════════
   PURCHASE FORM DIALOG
   ═══════════════════════════════════════════════════════════ */
function PurchaseFormDialog({
    open, onClose, type, suppliers, products, onAddSupplier, tenantPrefix,
}: {
    open: boolean;
    onClose: () => void;
    type: 'frequent' | 'external' | null;
    suppliers: Supplier[];
    products: Product[];
    onAddSupplier: () => void;
    tenantPrefix: string;
}) {
    const [supplierId, setSupplierId] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<PurchaseLineItem[]>([]);
    const [processing, setProcessing] = useState(false);

    // Reset form when opening
    useEffect(() => {
        if (open) {
            setSupplierId('');
            setInvoiceNumber('');
            setNotes('');
            setItems([]);
        }
    }, [open]);

    const addItem = () => {
        setItems([...items, { product_id: 0, productName: '', quantity: 1, unit_cost: 0 }]);
    };

    const updateItem = (index: number, field: keyof PurchaseLineItem, value: unknown) => {
        setItems((prev) => prev.map((item, i) => {
            if (i !== index) return item;
            const updated = { ...item, [field]: value };
            if (field === 'product_id') {
                const product = products.find((p) => p.id === Number(value));
                if (product) updated.productName = product.name;
            }
            return updated;
        }));
    };

    const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

    const total = items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);

    const selectedSupplier = suppliers.find((s) => s.id === Number(supplierId));

    const handleSubmit = () => {
        setProcessing(true);
        router.post(`${tenantPrefix}/purchases`, {
            type: type || 'external',
            supplier_id: type === 'frequent' ? Number(supplierId) : null,
            invoice_number: invoiceNumber || null,
            notes: notes || null,
            items: items.map((item) => ({
                product_id: item.product_id,
                quantity: item.quantity,
                unit_cost: item.unit_cost,
            })),
        }, {
            onSuccess: () => { onClose(); setProcessing(false); },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {type === 'frequent' ? <Building2 className="h-5 w-5 text-primary" /> : <ShoppingBag className="h-5 w-5 text-primary" />}
                        {type === 'frequent' ? 'Compra a Proveedor Frecuente' : 'Compra Externa'}
                    </DialogTitle>
                    <DialogDescription>
                        {type === 'frequent'
                            ? 'Selecciona un proveedor y registra los productos adquiridos.'
                            : 'Registra una compra directa sin proveedor asociado.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    {/* Supplier section (frequent only) */}
                    {type === 'frequent' && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="flex-1">
                                    <Label>Proveedor</Label>
                                    <Select onValueChange={setSupplierId} value={supplierId}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Seleccionar proveedor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {suppliers.map((s) => (
                                                <SelectItem key={s.id} value={String(s.id)}>
                                                    {s.name} {s.rut ? `(${s.rut})` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button variant="outline" size="sm" className="mt-6" onClick={onAddSupplier}>
                                    <Plus className="mr-1 h-3.5 w-3.5" />Nuevo
                                </Button>
                            </div>

                            {selectedSupplier && (
                                <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/40 p-3 text-sm">
                                    {selectedSupplier.rut && <div><span className="text-xs text-muted-foreground">RUT:</span> <span className="font-medium">{selectedSupplier.rut}</span></div>}
                                    {selectedSupplier.phone && <div><span className="text-xs text-muted-foreground">Teléfono:</span> <span className="font-medium">{selectedSupplier.phone}</span></div>}
                                    {selectedSupplier.email && <div><span className="text-xs text-muted-foreground">Email:</span> <span className="font-medium">{selectedSupplier.email}</span></div>}
                                    {selectedSupplier.contact_person && <div><span className="text-xs text-muted-foreground">Contacto:</span> <span className="font-medium">{selectedSupplier.contact_person}</span></div>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Invoice & Notes */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>N° Factura</Label>
                            <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="mt-1" placeholder="Ej: F-001234" />
                        </div>
                        <div>
                            <Label>Notas</Label>
                            <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" placeholder="Observaciones..." />
                        </div>
                    </div>

                    <Separator />

                    {/* Items */}
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold">Productos</h3>
                            <Button variant="outline" size="sm" onClick={addItem}>
                                <Plus className="mr-1 h-3.5 w-3.5" />Agregar Producto
                            </Button>
                        </div>

                        {items.length === 0 ? (
                            <div className="rounded-xl border-2 border-dashed border-border/50 py-8 text-center text-sm text-muted-foreground">
                                <Package className="mx-auto mb-2 h-8 w-8 opacity-30" />
                                Agrega productos para esta compra
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {items.map((item, index) => (
                                    <div key={index} className="flex gap-2 items-end rounded-lg bg-muted/30 p-3 animate-slide-in">
                                        <div className="flex-1">
                                            <Label className="text-xs">Producto</Label>
                                            <Select onValueChange={(v) => updateItem(index, 'product_id', Number(v))} value={item.product_id ? String(item.product_id) : ''}>
                                                <SelectTrigger className="mt-1 h-9">
                                                    <SelectValue placeholder="Seleccionar..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {products.map((p) => (
                                                        <SelectItem key={p.id} value={String(p.id)}>
                                                            {p.name} {p.sku ? `(${p.sku})` : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-24">
                                            <Label className="text-xs">Cantidad</Label>
                                            <Input type="number" min={1} value={item.quantity || ''} onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)} className="mt-1 h-9" />
                                        </div>
                                        <div className="w-32">
                                            <Label className="text-xs">Costo Unit. ($)</Label>
                                            <Input type="number" min={0} value={item.unit_cost || ''} onChange={(e) => updateItem(index, 'unit_cost', parseInt(e.target.value) || 0)} className="mt-1 h-9" />
                                        </div>
                                        <div className="w-28 text-right pb-1">
                                            <p className="text-xs text-muted-foreground">Subtotal</p>
                                            <p className="font-bold text-sm">{formatCLP(item.quantity * item.unit_cost)}</p>
                                        </div>
                                        <button onClick={() => removeItem(index)} className="pb-1 text-muted-foreground hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Total */}
                    {items.length > 0 && (
                        <>
                            <Separator />
                            <div className="flex justify-between text-xl font-bold">
                                <span>Total de Compra</span>
                                <span className="text-primary">{formatCLP(total)}</span>
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={processing || items.length === 0 || items.some((i) => !i.product_id) || (type === 'frequent' && !supplierId)}
                        className="glow-primary"
                    >
                        Registrar Compra
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ═══════════════════════════════════════════════════════════
   SUPPLIER FORM DIALOG
   ═══════════════════════════════════════════════════════════ */
function SupplierFormDialog({ open, onClose, tenantPrefix }: { open: boolean; onClose: () => void; tenantPrefix: string }) {
    const [form, setForm] = useState({ name: '', rut: '', phone: '', email: '', address: '', contact_person: '' });
    const [processing, setProcessing] = useState(false);

    const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = () => {
        setProcessing(true);
        router.post(`${tenantPrefix}/suppliers`, form, {
            onSuccess: () => { onClose(); setForm({ name: '', rut: '', phone: '', email: '', address: '', contact_person: '' }); },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        Nuevo Proveedor
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-3">
                    <div>
                        <Label>Nombre *</Label>
                        <Input value={form.name} onChange={(e) => update('name', e.target.value)} className="mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><Label>RUT</Label><Input value={form.rut} onChange={(e) => update('rut', e.target.value)} className="mt-1" placeholder="12.345.678-9" /></div>
                        <div><Label>Teléfono</Label><Input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="mt-1" placeholder="+56 9..." /></div>
                    </div>
                    <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="mt-1" /></div>
                    <div><Label>Dirección</Label><Input value={form.address} onChange={(e) => update('address', e.target.value)} className="mt-1" /></div>
                    <div><Label>Persona de Contacto</Label><Input value={form.contact_person} onChange={(e) => update('contact_person', e.target.value)} className="mt-1" /></div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={processing || !form.name} className="glow-primary">Crear Proveedor</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

Purchases.layout = {
    breadcrumbs: [
        { title: 'Compras', href: '/purchases' },
    ],
};
