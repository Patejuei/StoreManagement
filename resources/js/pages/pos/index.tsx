import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ShoppingCart, Search, Plus, Minus, Trash2, CreditCard, Banknote,
    ArrowRightLeft, Package, X, DollarSign, LogOut, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { Product, SaleSession, ProductSale } from '@/types';

interface Props {
    products: Product[];
    activeSession: SaleSession | null;
    activeOffers: ProductSale[];
}

interface CartItem {
    product: Product;
    quantity: number;
    unitPrice: number;
}

const formatCLP = (amount: number) => `$${amount.toLocaleString('es-CL')}`;

/* ═══════ DENOMINATIONS ═══════ */
const DENOMINATIONS = [
    { label: '$20.000', value: 20000, type: 'bill' },
    { label: '$10.000', value: 10000, type: 'bill' },
    { label: '$5.000', value: 5000, type: 'bill' },
    { label: '$2.000', value: 2000, type: 'bill' },
    { label: '$1.000', value: 1000, type: 'bill' },
    { label: '$500', value: 500, type: 'coin' },
    { label: '$100', value: 100, type: 'coin' },
    { label: '$50', value: 50, type: 'coin' },
    { label: '$10', value: 10, type: 'coin' },
] as const;

export default function POS({ products, activeSession, activeOffers }: Props) {
    const { flash, current_tenant } = usePage<{ flash: { success?: string; error?: string }, current_tenant?: string }>().props;
    const tenantPrefix = current_tenant ? `/${current_tenant}` : '/default';
    const [showStartSession, setShowStartSession] = useState(!activeSession);
    const [showEndSession, setShowEndSession] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [flashMsg, setFlashMsg] = useState<string | null>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    // Flash message handler
    useEffect(() => {
        if (flash?.success) {
            setFlashMsg(flash.success);
            setCart([]);
            const t = setTimeout(() => setFlashMsg(null), 4000);
            return () => clearTimeout(t);
        }
    }, [flash?.success]);

    // Filter products by search
    const filteredProducts = useMemo(() => {
        if (!search.trim()) return products;
        const q = search.toLowerCase().trim();
        return products.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                (p.sku && p.sku.toLowerCase().includes(q)) ||
                (p.brand && p.brand.toLowerCase().includes(q)),
        );
    }, [products, search]);

    // Auto-add to cart when only one result
    useEffect(() => {
        if (filteredProducts.length === 1 && search.trim().length > 0) {
            addToCart(filteredProducts[0]);
            setSearch('');
            setTimeout(() => searchRef.current?.focus(), 50);
        }
    }, [filteredProducts.length, search]);

    // Cart operations
    const addToCart = useCallback((product: Product) => {
        if (product.stock <= 0) return;
        setCart((prev) => {
            const existing = prev.find((item) => item.product.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock) return prev;
                return prev.map((item) =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item,
                );
            }
            return [...prev, { product, quantity: 1, unitPrice: product.price }];
        });
    }, []);

    const removeFromCart = useCallback((productId: number) => {
        setCart((prev) => prev.filter((item) => item.product.id !== productId));
    }, []);

    const updateQuantity = useCallback((productId: number, qty: number) => {
        if (qty <= 0) {
            removeFromCart(productId);
            return;
        }
        setCart((prev) =>
            prev.map((item) =>
                item.product.id === productId
                    ? { ...item, quantity: Math.min(qty, item.product.stock) }
                    : item,
            ),
        );
    }, [removeFromCart]);

    // Calculate discount for a cart item based on active offers
    const getItemDiscount = useCallback(
        (productId: number, quantity: number, unitPrice: number): number => {
            let bestDiscount = 0;
            for (const offer of activeOffers) {
                for (const rule of offer.rules || []) {
                    if (rule.product_id === productId && quantity >= rule.minimal_quantity) {
                        let discount = 0;
                        if (rule.offer_type === 'percentage') {
                            discount = Math.floor((unitPrice * quantity * rule.discount_value) / 100);
                        } else {
                            discount = Math.floor(rule.discount_value * quantity);
                        }
                        if (discount > bestDiscount) bestDiscount = discount;
                    }
                }
            }
            return bestDiscount;
        },
        [activeOffers],
    );

    // Totals
    const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const totalDiscount = cart.reduce(
        (sum, item) => sum + getItemDiscount(item.product.id, item.quantity, item.unitPrice),
        0,
    );
    const total = subtotal - totalDiscount;

    return (
        <>
            <Head title="Punto de Venta" />

            {/* Flash message toast */}
            {flashMsg && (
                <div className="fixed right-6 top-6 z-50 animate-slide-in rounded-xl border border-primary/30 bg-primary/10 px-5 py-3 text-sm font-medium text-primary shadow-lg backdrop-blur-md">
                    {flashMsg}
                </div>
            )}

            <div className="flex h-[calc(100vh-4rem)] gap-4 p-4">
                {/* ═══════ LEFT PANEL — Product Search & Grid ═══════ */}
                <div className="flex flex-1 flex-col gap-4 overflow-hidden rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
                    {/* Search Bar */}
                    <div className="relative neo-focus rounded-xl border border-border/50 bg-background">
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <input
                            ref={searchRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Escanear código de barras o buscar producto..."
                            className="h-14 w-full rounded-xl bg-transparent pl-12 pr-12 text-lg outline-none placeholder:text-muted-foreground/60"
                            autoFocus
                            id="pos-search-input"
                        />
                        {search && (
                            <button
                                onClick={() => { setSearch(''); searchRef.current?.focus(); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Product grid */}
                    <div className="flex-1 overflow-y-auto pr-1">
                        {filteredProducts.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                                <Package className="mb-3 h-16 w-16 opacity-30" />
                                <p className="text-lg font-medium">No se encontraron productos</p>
                                <p className="text-sm">Intenta con otro término de búsqueda</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                                {filteredProducts.map((product) => (
                                    <button
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        disabled={product.stock <= 0}
                                        className={cn(
                                            'card-hover group relative flex flex-col rounded-xl border border-border/40 bg-card p-3.5 text-left transition-all',
                                            product.stock <= 0
                                                ? 'cursor-not-allowed opacity-50'
                                                : 'hover:border-primary/40 hover:shadow-md',
                                        )}
                                        id={`product-card-${product.id}`}
                                    >
                                        {/* Product image or placeholder */}
                                        <div className="mb-2.5 flex aspect-square items-center justify-center rounded-lg bg-muted/50">
                                            <Package className="h-10 w-10 text-muted-foreground/40" />
                                        </div>

                                        <p className="line-clamp-2 text-sm font-semibold leading-tight">{product.name}</p>
                                        {product.sku && (
                                            <p className="mt-0.5 font-mono text-xs text-muted-foreground">{product.sku}</p>
                                        )}
                                        <div className="mt-auto flex items-end justify-between pt-2">
                                            <span className="text-lg font-bold text-primary">{formatCLP(product.price)}</span>
                                            <span
                                                className={cn(
                                                    'text-xs font-medium',
                                                    product.stock <= product.critical_stock
                                                        ? 'stock-critical'
                                                        : product.stock <= product.critical_stock * 3
                                                          ? 'stock-low'
                                                          : 'stock-ok',
                                                )}
                                            >
                                                Stock: {product.stock}
                                            </span>
                                        </div>

                                        {/* Offer badge */}
                                        {activeOffers.some((o) => o.rules?.some((r) => r.product_id === product.id)) && (
                                            <div className="absolute -right-1 -top-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-sm">
                                                OFERTA
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Session status bar */}
                    {activeSession && (
                        <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-2 text-sm">
                            <span className="text-muted-foreground">
                                Sesión activa desde{' '}
                                <span className="font-medium text-foreground">
                                    {new Date(activeSession.start_date).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </span>
                            <div className="flex items-center gap-3">
                                <span className="text-muted-foreground">
                                    Ventas: <span className="font-semibold text-primary">{formatCLP(activeSession.total_sales)}</span>
                                </span>
                                <Button variant="outline" size="sm" onClick={() => setShowEndSession(true)}>
                                    <LogOut className="mr-1.5 h-3.5 w-3.5" />
                                    Cerrar Caja
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ═══════ RIGHT PANEL — Cart ═══════ */}
                <div className="flex w-[340px] flex-col rounded-2xl border border-border/50 bg-card shadow-sm xl:w-[380px]">
                    {/* Cart header */}
                    <div className="flex items-center gap-2 border-b border-border/50 px-5 py-4">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-bold">Carrito</h2>
                        {cart.length > 0 && (
                            <Badge variant="secondary" className="ml-auto">
                                {cart.reduce((s, i) => s + i.quantity, 0)} items
                            </Badge>
                        )}
                    </div>

                    {/* Cart items */}
                    <div className="flex-1 overflow-y-auto px-4 py-3">
                        {cart.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                                <ShoppingCart className="mb-2 h-12 w-12 opacity-20" />
                                <p className="text-sm">Carrito vacío</p>
                                <p className="text-xs">Escanea o selecciona productos</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {cart.map((item) => {
                                    const discount = getItemDiscount(item.product.id, item.quantity, item.unitPrice);
                                    const itemTotal = item.unitPrice * item.quantity - discount;
                                    return (
                                        <div
                                            key={item.product.id}
                                            className="animate-slide-in rounded-xl bg-muted/40 p-3 transition-all"
                                        >
                                            <div className="mb-1.5 flex items-start justify-between">
                                                <div className="flex-1 pr-2">
                                                    <p className="text-sm font-semibold leading-tight">{item.product.name}</p>
                                                    <p className="text-xs text-muted-foreground">{formatCLP(item.unitPrice)} c/u</p>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.product.id)}
                                                    className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background">
                                                    <button
                                                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                        className="rounded-l-lg px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                    >
                                                        <Minus className="h-3.5 w-3.5" />
                                                    </button>
                                                    <span className="min-w-[2rem] text-center text-sm font-bold">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                        className="rounded-r-lg px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                                <div className="text-right">
                                                    {discount > 0 && (
                                                        <p className="text-xs font-medium text-green-500">-{formatCLP(discount)}</p>
                                                    )}
                                                    <p className="text-sm font-bold">{formatCLP(itemTotal)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Cart footer — Totals & Checkout */}
                    <div className="border-t border-border/50 px-5 py-4">
                        <div className="mb-2 flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>{formatCLP(subtotal)}</span>
                        </div>
                        {totalDiscount > 0 && (
                            <div className="mb-2 flex justify-between text-sm font-medium text-green-500">
                                <span>Descuentos</span>
                                <span>-{formatCLP(totalDiscount)}</span>
                            </div>
                        )}
                        <Separator className="my-2" />
                        <div className="mb-4 flex justify-between text-xl font-bold">
                            <span>Total</span>
                            <span className="text-primary">{formatCLP(total)}</span>
                        </div>
                        <Button
                            className="glow-primary w-full text-base font-bold"
                            size="lg"
                            disabled={cart.length === 0 || !activeSession}
                            onClick={() => setShowCheckout(true)}
                            id="pos-checkout-btn"
                        >
                            <CreditCard className="mr-2 h-5 w-5" />
                            Cobrar
                        </Button>
                        {!activeSession && (
                            <p className="mt-2 flex items-center justify-center gap-1 text-xs text-destructive">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Inicia una sesión de caja primero
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════ START SESSION DIALOG ═══════ */}
            <StartSessionDialog
                open={showStartSession && !activeSession}
                onClose={() => setShowStartSession(false)}
                tenantPrefix={tenantPrefix}
            />

            {/* ═══════ END SESSION DIALOG ═══════ */}
            <EndSessionDialog
                open={showEndSession}
                onClose={() => setShowEndSession(false)}
                session={activeSession}
                tenantPrefix={tenantPrefix}
            />

            {/* ═══════ CHECKOUT DIALOG ═══════ */}
            <CheckoutDialog
                open={showCheckout}
                onClose={() => setShowCheckout(false)}
                total={total}
                sessionId={activeSession?.id}
                cart={cart}
                getItemDiscount={getItemDiscount}
                tenantPrefix={tenantPrefix}
            />
        </>
    );
}

/* ═══════════════════════════════════════════════════════════
   START SESSION DIALOG
   ═══════════════════════════════════════════════════════════ */
function StartSessionDialog({ open, onClose, tenantPrefix }: { open: boolean; onClose: () => void; tenantPrefix: string }) {
    const [counts, setCounts] = useState<Record<number, number>>(
        Object.fromEntries(DENOMINATIONS.map((d) => [d.value, 0])),
    );
    const [processing, setProcessing] = useState(false);

    const total = DENOMINATIONS.reduce((sum, d) => sum + d.value * (counts[d.value] || 0), 0);

    const handleSubmit = () => {
        setProcessing(true);
        router.post(`${tenantPrefix}/pos/start-session`, { start_cash: total }, {
            onFinish: () => setProcessing(false),
        });
    };

    const updateCount = (value: number, count: number) => {
        setCounts((prev) => ({ ...prev, [value]: Math.max(0, count) }));
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <DollarSign className="h-6 w-6 text-primary" />
                        Iniciar Sesión de Caja
                    </DialogTitle>
                    <DialogDescription>
                        Ingresa la cantidad de billetes y monedas para abrir la caja.
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
                    <div>
                        <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Billetes</h3>
                        <div className="space-y-2">
                            {DENOMINATIONS.filter((d) => d.type === 'bill').map((d) => (
                                <div key={d.value} className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2">
                                    <span className="w-20 text-sm font-bold">{d.label}</span>
                                    <span className="text-muted-foreground">×</span>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={counts[d.value] || ''}
                                        onChange={(e) => updateCount(d.value, parseInt(e.target.value) || 0)}
                                        className="h-9 w-20 text-center"
                                    />
                                    <span className="ml-auto text-sm font-medium text-muted-foreground">
                                        = {formatCLP(d.value * (counts[d.value] || 0))}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Monedas</h3>
                        <div className="space-y-2">
                            {DENOMINATIONS.filter((d) => d.type === 'coin').map((d) => (
                                <div key={d.value} className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2">
                                    <span className="w-20 text-sm font-bold">{d.label}</span>
                                    <span className="text-muted-foreground">×</span>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={counts[d.value] || ''}
                                        onChange={(e) => updateCount(d.value, parseInt(e.target.value) || 0)}
                                        className="h-9 w-20 text-center"
                                    />
                                    <span className="ml-auto text-sm font-medium text-muted-foreground">
                                        = {formatCLP(d.value * (counts[d.value] || 0))}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between text-xl font-bold">
                    <span>Total Inicial:</span>
                    <span className="text-primary">{formatCLP(total)}</span>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={processing} className="glow-primary">
                        Iniciar Caja
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ═══════════════════════════════════════════════════════════
   END SESSION DIALOG
   ═══════════════════════════════════════════════════════════ */
function EndSessionDialog({ open, onClose, session, tenantPrefix }: { open: boolean; onClose: () => void; session: SaleSession | null; tenantPrefix: string }) {
    const [counts, setCounts] = useState<Record<number, number>>(
        Object.fromEntries(DENOMINATIONS.map((d) => [d.value, 0])),
    );
    const [processing, setProcessing] = useState(false);

    const total = DENOMINATIONS.reduce((sum, d) => sum + d.value * (counts[d.value] || 0), 0);
    const expected = (session?.start_cash ?? 0) + (session?.total_cash_sales ?? 0);
    const difference = total - expected;

    const handleSubmit = () => {
        if (!session) return;
        setProcessing(true);
        router.post(`${tenantPrefix}/pos/end-session`, { session_id: session.id, end_cash: total }, {
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <LogOut className="h-6 w-6 text-primary" />
                        Cerrar Sesión de Caja
                    </DialogTitle>
                    <DialogDescription>Cuenta el efectivo actual en la caja.</DialogDescription>
                </DialogHeader>

                {session && (
                    <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-4">
                        <div>
                            <p className="text-xs text-muted-foreground">Efectivo Inicial</p>
                            <p className="font-bold">{formatCLP(session.start_cash)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Ventas Efectivo</p>
                            <p className="font-bold text-primary">{formatCLP(session.total_cash_sales)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Ventas Tarjeta</p>
                            <p className="font-bold">{formatCLP(session.total_card_sales)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Ventas Transferencia</p>
                            <p className="font-bold">{formatCLP(session.total_transfer_sales)}</p>
                        </div>
                    </div>
                )}

                <div className="max-h-[40vh] space-y-3 overflow-y-auto pr-1">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Conteo de Efectivo</h3>
                    {DENOMINATIONS.map((d) => (
                        <div key={d.value} className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2">
                            <span className="w-20 text-sm font-bold">{d.label}</span>
                            <span className="text-muted-foreground">×</span>
                            <Input
                                type="number"
                                min={0}
                                value={counts[d.value] || ''}
                                onChange={(e) => setCounts({ ...counts, [d.value]: Math.max(0, parseInt(e.target.value) || 0) })}
                                className="h-9 w-20 text-center"
                            />
                            <span className="ml-auto text-sm text-muted-foreground">= {formatCLP(d.value * (counts[d.value] || 0))}</span>
                        </div>
                    ))}
                </div>

                <Separator />

                <div className="space-y-1">
                    <div className="flex justify-between font-bold text-lg">
                        <span>Efectivo Contado:</span>
                        <span className="text-primary">{formatCLP(total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Efectivo Esperado:</span>
                        <span>{formatCLP(expected)}</span>
                    </div>
                    <div className={cn('flex justify-between text-sm font-semibold', difference >= 0 ? 'text-green-500' : 'text-destructive')}>
                        <span>Diferencia:</span>
                        <span>{difference >= 0 ? '+' : ''}{formatCLP(difference)}</span>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={processing} variant="destructive">
                        Cerrar Caja
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ═══════════════════════════════════════════════════════════
   CHECKOUT DIALOG
   ═══════════════════════════════════════════════════════════ */
function CheckoutDialog({
    open, onClose, total, sessionId, cart, getItemDiscount, tenantPrefix,
}: {
    open: boolean;
    onClose: () => void;
    total: number;
    sessionId: number | undefined;
    cart: CartItem[];
    getItemDiscount: (productId: number, quantity: number, unitPrice: number) => number;
    tenantPrefix: string;
}) {
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
    const [cashReceived, setCashReceived] = useState(0);
    const [processing, setProcessing] = useState(false);

    const change = cashReceived - total;

    const handleCheckout = () => {
        if (!sessionId) return;
        setProcessing(true);
        router.post(
            `${tenantPrefix}/pos/checkout`,
            {
                session_id: sessionId,
                items: cart.map((item) => {
                    const discount = getItemDiscount(item.product.id, item.quantity, item.unitPrice);
                    return {
                        product_id: item.product.id,
                        quantity: item.quantity,
                        price: item.unitPrice,
                        discount,
                        total: item.unitPrice * item.quantity - discount,
                    };
                }),
                payment_method: paymentMethod,
                total,
            },
            {
                onSuccess: () => {
                    onClose();
                    setCashReceived(0);
                    setPaymentMethod('cash');
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    const methods = [
        { value: 'cash' as const, label: 'Efectivo', icon: Banknote },
        { value: 'card' as const, label: 'Tarjeta', icon: CreditCard },
        { value: 'transfer' as const, label: 'Transferencia', icon: ArrowRightLeft },
    ];

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-xl">Cobrar</DialogTitle>
                </DialogHeader>

                {/* Total display */}
                <div className="rounded-xl bg-muted/50 py-6 text-center">
                    <p className="text-sm text-muted-foreground">Total a cobrar</p>
                    <p className="text-4xl font-extrabold text-primary">{formatCLP(total)}</p>
                </div>

                {/* Payment method selector */}
                <div className="grid grid-cols-3 gap-2">
                    {methods.map((m) => (
                        <button
                            key={m.value}
                            onClick={() => setPaymentMethod(m.value)}
                            className={cn(
                                'flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all',
                                paymentMethod === m.value
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border/50 hover:border-primary/30',
                            )}
                        >
                            <m.icon className="h-6 w-6" />
                            <span className="text-xs font-semibold">{m.label}</span>
                        </button>
                    ))}
                </div>

                {/* Cash input */}
                {paymentMethod === 'cash' && (
                    <div className="space-y-3">
                        <div>
                            <Label className="text-sm text-muted-foreground">Efectivo Recibido</Label>
                            <Input
                                type="number"
                                value={cashReceived || ''}
                                onChange={(e) => setCashReceived(parseInt(e.target.value) || 0)}
                                className="mt-1 h-14 text-center text-2xl font-bold"
                                autoFocus
                            />
                        </div>
                        {cashReceived > 0 && (
                            <div
                                className={cn(
                                    'rounded-xl p-4 text-center transition-all',
                                    change >= 0 ? 'bg-green-500/10' : 'bg-destructive/10',
                                )}
                            >
                                <p className="text-xs text-muted-foreground">Vuelto</p>
                                <p className={cn('text-3xl font-extrabold', change >= 0 ? 'text-green-500' : 'text-destructive')}>
                                    {formatCLP(Math.max(change, 0))}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleCheckout}
                        disabled={processing || (paymentMethod === 'cash' && cashReceived < total)}
                        className="glow-primary flex-1 font-bold"
                    >
                        Confirmar Venta
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

POS.layout = {
    breadcrumbs: [
        { title: 'Punto de Venta', href: '/pos' },
    ],
};
