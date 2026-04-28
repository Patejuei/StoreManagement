import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    Package, Plus, Pencil, Trash2, History, Search, Download,
    Upload, X, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, FileSpreadsheet,
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
import type { Product, PaginatedData, ProductHistory } from '@/types';

interface Props {
    products: PaginatedData<Product>;
    categories: string[];
    filters: { search?: string; category?: string };
}

const formatCLP = (amount: number) => `$${amount.toLocaleString('es-CL')}`;

export default function Inventory({ products, categories, filters }: Props) {
    const { flash, current_tenant } = usePage<{ flash: { success?: string }, current_tenant?: string }>().props;
    const tenantPrefix = current_tenant ? `/${current_tenant}` : '/default';
    const [search, setSearch] = useState(filters.search || '');
    const [showForm, setShowForm] = useState(false);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [historyData, setHistoryData] = useState<ProductHistory[]>([]);
    const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
    const [showImport, setShowImport] = useState(false);
    const [showDelete, setShowDelete] = useState<Product | null>(null);
    const [flashMsg, setFlashMsg] = useState<string | null>(null);

    useEffect(() => {
        if (flash?.success) {
            setFlashMsg(flash.success);
            const t = setTimeout(() => setFlashMsg(null), 4000);
            return () => clearTimeout(t);
        }
    }, [flash?.success]);

    // Debounced search
    useEffect(() => {
        const t = setTimeout(() => {
            router.get(`${tenantPrefix}/inventory`, { search, category: filters.category }, {
                preserveState: true, replace: true, preserveScroll: true,
            });
        }, 400);
        return () => clearTimeout(t);
    }, [search]);

    const handleCategoryChange = (value: string) => {
        router.get(`${tenantPrefix}/inventory`, { search: filters.search, category: value === 'all' ? undefined : value }, {
            preserveState: true, replace: true,
        });
    };

    const openHistory = async (product: Product) => {
        setHistoryProduct(product);
        setShowHistory(true);
        try {
            const res = await fetch(`${tenantPrefix}/inventory/${product.id}/history`);
            setHistoryData(await res.json());
        } catch {
            setHistoryData([]);
        }
    };

    const handleDelete = () => {
        if (!showDelete) return;
        router.delete(`${tenantPrefix}/inventory/${showDelete.id}`, { onSuccess: () => setShowDelete(null) });
    };

    return (
        <>
            <Head title="Inventario" />

            {flashMsg && (
                <div className="fixed right-6 top-6 z-50 animate-slide-in rounded-xl border border-primary/30 bg-primary/10 px-5 py-3 text-sm font-medium text-primary shadow-lg backdrop-blur-md">
                    <CheckCircle className="mr-2 inline h-4 w-4" />{flashMsg}
                </div>
            )}

            <div className="flex flex-col gap-5 p-6">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold">Inventario</h1>
                        <p className="text-sm text-muted-foreground">{products.total} productos registrados</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <a href={`${tenantPrefix}/inventory/template/download`}>
                                <Download className="mr-1.5 h-4 w-4" />Plantilla Excel
                            </a>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
                            <Upload className="mr-1.5 h-4 w-4" />Carga Masiva
                        </Button>
                        <Button size="sm" onClick={() => { setEditProduct(null); setShowForm(true); }} className="glow-primary">
                            <Plus className="mr-1.5 h-4 w-4" />Nuevo Producto
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[250px] neo-focus rounded-lg border border-border/50 bg-background">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por nombre, SKU, marca..."
                            className="h-10 w-full rounded-lg bg-transparent pl-10 pr-4 text-sm outline-none"
                            id="inventory-search"
                        />
                    </div>
                    <Select onValueChange={handleCategoryChange} defaultValue={filters.category || 'all'}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Categoría" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las categorías</SelectItem>
                            {categories.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/50 bg-muted/50">
                                    <th className="px-4 py-3 text-left font-semibold">SKU</th>
                                    <th className="px-4 py-3 text-left font-semibold">Producto</th>
                                    <th className="px-4 py-3 text-left font-semibold">Marca</th>
                                    <th className="px-4 py-3 text-left font-semibold">Categoría</th>
                                    <th className="px-4 py-3 text-right font-semibold">Precio</th>
                                    <th className="px-4 py-3 text-center font-semibold">Stock</th>
                                    <th className="px-4 py-3 text-center font-semibold">Estado</th>
                                    <th className="px-4 py-3 text-center font-semibold">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-16 text-center text-muted-foreground">
                                            <Package className="mx-auto mb-3 h-12 w-12 opacity-30" />
                                            <p>No se encontraron productos</p>
                                        </td>
                                    </tr>
                                ) : (
                                    products.data.map((product) => (
                                        <tr key={product.id} className="border-b border-border/30 transition-colors hover:bg-muted/30">
                                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{product.sku || '—'}</td>
                                            <td className="px-4 py-3 font-medium">{product.name}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{product.brand || '—'}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{product.category || '—'}</td>
                                            <td className="px-4 py-3 text-right font-bold text-primary">{formatCLP(product.price)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={cn(
                                                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold',
                                                    product.stock <= product.critical_stock
                                                        ? 'bg-red-500/10 text-red-500'
                                                        : product.stock <= product.critical_stock * 3
                                                          ? 'bg-amber-500/10 text-amber-500'
                                                          : 'bg-green-500/10 text-green-500',
                                                )}>
                                                    {product.stock}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant={product.is_active ? 'default' : 'secondary'} className="text-[10px]">
                                                    {product.is_active ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => openHistory(product)}
                                                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                        title="Historial"
                                                    >
                                                        <History className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => { setEditProduct(product); setShowForm(true); }}
                                                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                                                        title="Editar"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setShowDelete(product)}
                                                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {products.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
                            <p className="text-xs text-muted-foreground">
                                Mostrando {products.from}–{products.to} de {products.total}
                            </p>
                            <div className="flex gap-1">
                                {products.links.map((link, i) => (
                                    <button
                                        key={i}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        disabled={!link.url}
                                        className={cn(
                                            'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                                            link.active
                                                ? 'bg-primary text-primary-foreground'
                                                : link.url
                                                  ? 'hover:bg-muted'
                                                  : 'opacity-40',
                                        )}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════ PRODUCT FORM DIALOG ═══════ */}
            <ProductFormDialog
                open={showForm}
                onClose={() => { setShowForm(false); setEditProduct(null); }}
                product={editProduct}
                tenantPrefix={tenantPrefix}
            />

            {/* ═══════ HISTORY DIALOG ═══════ */}
            <Dialog open={showHistory} onOpenChange={() => setShowHistory(false)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <History className="h-5 w-5 text-primary" />
                            Historial — {historyProduct?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[50vh] overflow-y-auto">
                        {historyData.length === 0 ? (
                            <p className="py-8 text-center text-muted-foreground">Sin movimientos registrados</p>
                        ) : (
                            <div className="space-y-2">
                                {historyData.map((h) => (
                                    <div key={h.id} className="flex items-start gap-3 rounded-lg bg-muted/40 p-3">
                                        <div className={cn(
                                            'mt-0.5 rounded-full p-1.5',
                                            h.movement_type === 'sale' ? 'bg-red-500/10 text-red-500' :
                                            h.movement_type === 'purchase' ? 'bg-green-500/10 text-green-500' :
                                            'bg-blue-500/10 text-blue-500',
                                        )}>
                                            <Package className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{h.details}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Stock: {h.stock} · {formatCLP(h.price)} · {new Date(h.created_at).toLocaleString('es-CL')}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] capitalize">{h.movement_type}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* ═══════ IMPORT DIALOG ═══════ */}
            <ImportDialog open={showImport} onClose={() => setShowImport(false)} tenantPrefix={tenantPrefix} />

            {/* ═══════ DELETE DIALOG ═══════ */}
            <Dialog open={!!showDelete} onOpenChange={() => setShowDelete(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            Eliminar Producto
                        </DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de eliminar <span className="font-bold">{showDelete?.name}</span>? Esta acción no se puede deshacer.
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
   PRODUCT FORM DIALOG
   ═══════════════════════════════════════════════════════════ */
function ProductFormDialog({ open, onClose, product, tenantPrefix }: { open: boolean; onClose: () => void; product: Product | null; tenantPrefix: string }) {
    const [form, setForm] = useState({
        name: '', brand: '', model: '', category: '', description: '',
        price: 0, stock: 0, critical_stock: 1, sku: '', is_active: true,
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (product) {
            setForm({
                name: product.name,
                brand: product.brand || '',
                model: product.model || '',
                category: product.category || '',
                description: product.description || '',
                price: product.price,
                stock: product.stock,
                critical_stock: product.critical_stock,
                sku: product.sku || '',
                is_active: product.is_active,
            });
        } else {
            setForm({ name: '', brand: '', model: '', category: '', description: '', price: 0, stock: 0, critical_stock: 1, sku: '', is_active: true });
        }
        setErrors({});
    }, [product, open]);

    const handleSubmit = () => {
        setProcessing(true);
        const method = product ? 'put' : 'post';
        const url = product ? `${tenantPrefix}/inventory/${product.id}` : `${tenantPrefix}/inventory`;

        router[method](url, form, {
            onSuccess: () => { onClose(); setProcessing(false); },
            onError: (errs) => { setErrors(errs as Record<string, string>); setProcessing(false); },
            onFinish: () => setProcessing(false),
        });
    };

    const update = (field: string, value: unknown) => setForm((prev) => ({ ...prev, [field]: value }));

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        {product ? 'Editar Producto' : 'Nuevo Producto'}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 max-h-[60vh] overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <Label>Nombre *</Label>
                            <Input value={form.name} onChange={(e) => update('name', e.target.value)} className="mt-1" />
                            {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                        </div>
                        <div>
                            <Label>Marca</Label>
                            <Input value={form.brand} onChange={(e) => update('brand', e.target.value)} className="mt-1" />
                        </div>
                        <div>
                            <Label>Modelo</Label>
                            <Input value={form.model} onChange={(e) => update('model', e.target.value)} className="mt-1" />
                        </div>
                        <div>
                            <Label>Categoría</Label>
                            <Input value={form.category} onChange={(e) => update('category', e.target.value)} className="mt-1" />
                        </div>
                        <div>
                            <Label>SKU (Código de Barras)</Label>
                            <Input value={form.sku} onChange={(e) => update('sku', e.target.value)} className="mt-1" />
                            {errors.sku && <p className="mt-1 text-xs text-destructive">{errors.sku}</p>}
                        </div>
                        <div>
                            <Label>Precio (CLP) *</Label>
                            <Input type="number" value={form.price || ''} onChange={(e) => update('price', parseInt(e.target.value) || 0)} className="mt-1" />
                            {errors.price && <p className="mt-1 text-xs text-destructive">{errors.price}</p>}
                        </div>
                        <div>
                            <Label>Stock *</Label>
                            <Input type="number" value={form.stock || ''} onChange={(e) => update('stock', parseInt(e.target.value) || 0)} className="mt-1" />
                        </div>
                        <div>
                            <Label>Stock Crítico</Label>
                            <Input type="number" value={form.critical_stock || ''} onChange={(e) => update('critical_stock', parseInt(e.target.value) || 1)} className="mt-1" />
                        </div>
                        <div className="flex items-center gap-2 pt-4">
                            <Checkbox checked={form.is_active} onCheckedChange={(v) => update('is_active', !!v)} id="is-active" />
                            <Label htmlFor="is-active">Producto activo</Label>
                        </div>
                    </div>
                    <div>
                        <Label>Descripción</Label>
                        <textarea
                            value={form.description}
                            onChange={(e) => update('description', e.target.value)}
                            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={processing} className="glow-primary">
                        {product ? 'Actualizar' : 'Crear Producto'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ═══════════════════════════════════════════════════════════
   IMPORT DIALOG
   ═══════════════════════════════════════════════════════════ */
function ImportDialog({ open, onClose, tenantPrefix }: { open: boolean; onClose: () => void; tenantPrefix: string }) {
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleImport = () => {
        if (!file) return;
        setProcessing(true);
        const formData = new FormData();
        formData.append('file', file);

        router.post(`${tenantPrefix}/inventory/import`, formData, {
            forceFormData: true,
            onSuccess: () => { onClose(); setFile(null); },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                        Carga Masiva de Productos
                    </DialogTitle>
                    <DialogDescription>
                        Sube un archivo Excel con el formato de la plantilla para importar productos.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <Button variant="outline" size="sm" asChild className="w-full">
                        <a href={`${tenantPrefix}/inventory/template/download`}>
                            <Download className="mr-2 h-4 w-4" />
                            Descargar Plantilla
                        </a>
                    </Button>

                    <div className="rounded-xl border-2 border-dashed border-border/60 p-6 text-center">
                        <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                        <Label
                            htmlFor="import-file"
                            className="cursor-pointer text-sm text-primary hover:underline"
                        >
                            Seleccionar archivo
                        </Label>
                        <input
                            id="import-file"
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            className="hidden"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        {file && (
                            <p className="mt-2 text-sm font-medium">{file.name}</p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleImport} disabled={!file || processing} className="glow-primary">
                        Importar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

Inventory.layout = {
    breadcrumbs: [
        { title: 'Inventario', href: '/inventory' },
    ],
};
