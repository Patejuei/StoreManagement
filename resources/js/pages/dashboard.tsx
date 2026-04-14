import { Head, router } from '@inertiajs/react';
import { useMemo } from 'react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
    DollarSign, ShoppingCart, Package,
    AlertTriangle, ArrowUpDown, ChevronLeft, ChevronRight, BarChart3,
    Trophy, ThumbsDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';

/* ═══════ TYPES ═══════ */
interface DailySale {
    date: string;
    total: number;
    count: number;
}

interface SaleByMethod {
    method: 'cash' | 'card' | 'transfer';
    total: number;
    count: number;
}

interface ProductRanking {
    product_id: number;
    name: string;
    sku: string | null;
    total_quantity: number;
    total_revenue: number;
}

interface CriticalStockProduct {
    id: number;
    name: string;
    sku: string | null;
    stock: number;
    critical_stock: number;
    price: number;
}

interface MovementSummary {
    type: string;
    count: number;
    total_units: number;
}

interface DailyMovement {
    date: string;
    [key: string]: string | number;
}

interface Props {
    currentMonth: string;
    dailySales: DailySale[];
    salesByMethod: SaleByMethod[];
    totalSales: number;
    totalSalesCount: number;
    totalPurchases: number;
    topProducts: ProductRanking[];
    bottomProducts: ProductRanking[];
    criticalStock: CriticalStockProduct[];
    movements: MovementSummary[];
    dailyMovements: DailyMovement[];
}

/* ═══════ HELPERS ═══════ */
const formatCLP = (amount: number) => `$${amount.toLocaleString('es-CL')}`;

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const METHOD_LABELS: Record<string, string> = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia',
};

const PIE_COLORS = [
    '#D4930D',   // gold
    '#2A9D8F',   // teal
    '#6C63FF',   // indigo
];

const MOVEMENT_COLORS: Record<string, string> = {
    'entrada': '#2A9D8F',
    'salida': '#E76F51',
    'ajuste': '#6C63FF',
    'venta': '#D4930D',
    'compra': '#2A9D8F',
};

const CHART_GOLD = '#D4930D';
const CHART_GRID = 'rgba(128,128,128,0.12)';
const CHART_TICK = '#888888';

const getMovementColor = (type: string) =>
    MOVEMENT_COLORS[type.toLowerCase()] ?? '#888888';

/* ═══════ MAIN COMPONENT ═══════ */
export default function Dashboard({
    currentMonth,
    dailySales,
    salesByMethod,
    totalSales,
    totalSalesCount,
    totalPurchases,
    topProducts,
    bottomProducts,
    criticalStock,
    movements,
    dailyMovements,
}: Props) {
    const [year, month] = currentMonth.split('-').map(Number);
    const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

    const navigateMonth = (direction: -1 | 1) => {
        const date = new Date(year, month - 1 + direction, 1);
        const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        router.get('/dashboard', { month: newMonth }, { preserveState: true, preserveScroll: true });
    };

    // Average daily sales
    const avgDailySales = dailySales.length > 0
        ? Math.round(totalSales / dailySales.length)
        : 0;

    // Prepare chart data with formatted day labels
    const chartSalesData = useMemo(() =>
        dailySales.map((d) => ({
            ...d,
            day: new Date(d.date + 'T12:00:00').getDate().toString(),
        })),
    [dailySales]);

    // Prepare pie chart data
    const pieData = useMemo(() =>
        salesByMethod.map((s) => ({
            name: METHOD_LABELS[s.method] ?? s.method,
            value: s.total,
            count: s.count,
        })),
    [salesByMethod]);

    // Get all movement types for the stacked bar chart
    const movementTypes = useMemo(() => {
        const types = new Set<string>();
        dailyMovements.forEach((d) => {
            Object.keys(d).forEach((k) => { if (k !== 'date') types.add(k); });
        });
        return Array.from(types);
    }, [dailyMovements]);

    const chartMovementsData = useMemo(() =>
        dailyMovements.map((d) => ({
            ...d,
            day: new Date(d.date + 'T12:00:00').getDate().toString(),
        })),
    [dailyMovements]);

    // Total movements count
    const totalMovements = movements.reduce((sum, m) => sum + m.count, 0);

    /* ═══════ CUSTOM TOOLTIP ═══════ */
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="rounded-xl border border-border/60 bg-card/95 px-4 py-3 shadow-xl backdrop-blur-md">
                <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Día {label}</p>
                {payload.map((entry: any, i: number) => (
                    <p key={i} className="text-sm font-bold" style={{ color: entry.color }}>
                        {entry.name}: {typeof entry.value === 'number' && entry.name !== 'Transacciones'
                            ? formatCLP(entry.value)
                            : entry.value}
                    </p>
                ))}
            </div>
        );
    };

    const MovementTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="rounded-xl border border-border/60 bg-card/95 px-4 py-3 shadow-xl backdrop-blur-md">
                <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Día {label}</p>
                {payload.map((entry: any, i: number) => (
                    <p key={i} className="text-sm font-bold capitalize" style={{ color: entry.color }}>
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        );
    };

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-5 p-5">
                {/* ═══════ MONTH NAVIGATOR ═══════ */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
                        <p className="text-sm text-muted-foreground">Resumen general del negocio</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-2 py-1.5 shadow-sm">
                        <button
                            onClick={() => navigateMonth(-1)}
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            id="dashboard-prev-month"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="min-w-[10rem] text-center text-sm font-bold">{monthLabel}</span>
                        <button
                            onClick={() => navigateMonth(1)}
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            id="dashboard-next-month"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* ═══════ KPI CARDS ═══════ */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <KPICard
                        icon={DollarSign}
                        title="Ventas del Mes"
                        value={formatCLP(totalSales)}
                        subtitle={`${totalSalesCount} transacciones`}
                        accentClass="text-primary bg-primary/10"
                    />
                    <KPICard
                        icon={ShoppingCart}
                        title="Promedio Diario"
                        value={formatCLP(avgDailySales)}
                        subtitle={`en ${dailySales.length} días con ventas`}
                        accentClass="text-emerald-500 bg-emerald-500/10"
                    />
                    <KPICard
                        icon={Package}
                        title="Compras del Mes"
                        value={formatCLP(totalPurchases)}
                        subtitle="total invertido"
                        accentClass="text-blue-500 bg-blue-500/10"
                    />
                    <KPICard
                        icon={ArrowUpDown}
                        title="Movimientos"
                        value={totalMovements.toString()}
                        subtitle="movimientos de inventario"
                        accentClass="text-violet-500 bg-violet-500/10"
                    />
                </div>

                {/* ═══════ ROW 1: Sales Chart + Payment Methods ═══════ */}
                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Sales Area Chart */}
                    <div className="lg:col-span-2 rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            <h2 className="font-bold">Ventas Diarias</h2>
                        </div>
                        {chartSalesData.length === 0 ? (
                            <EmptyState text="No hay ventas registradas este mes" />
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={chartSalesData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={CHART_GOLD} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={CHART_GOLD} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                                    <XAxis
                                        dataKey="day"
                                        tick={{ fontSize: 11, fill: CHART_TICK }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: CHART_TICK }}
                                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="total"
                                        name="Ventas"
                                        stroke={CHART_GOLD}
                                        strokeWidth={2.5}
                                        fill="url(#salesGradient)"
                                        dot={{ fill: CHART_GOLD, strokeWidth: 0, r: 3 }}
                                        activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Payment Method Pie Chart */}
                    <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-primary" />
                            <h2 className="font-bold">Métodos de Pago</h2>
                        </div>
                        {pieData.length === 0 ? (
                            <EmptyState text="Sin datos de pago" />
                        ) : (
                            <div className="flex flex-col items-center">
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={80}
                                            paddingAngle={4}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {pieData.map((_, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) => formatCLP(value)}
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: '1px solid rgba(128,128,128,0.15)',
                                                backdropFilter: 'blur(12px)',
                                                fontSize: '13px',
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="mt-2 flex flex-col gap-2 w-full">
                                    {pieData.map((entry, i) => (
                                        <div key={entry.name} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="h-3 w-3 rounded-full"
                                                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                                                />
                                                <span className="text-sm font-medium">{entry.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-bold">{formatCLP(entry.value)}</span>
                                                <span className="ml-2 text-xs text-muted-foreground">({entry.count})</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══════ ROW 2: Movements Chart + Critical Stock ═══════ */}
                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Movements Stacked Bar Chart */}
                    <div className="lg:col-span-2 rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-2">
                            <ArrowUpDown className="h-5 w-5 text-violet-500" />
                            <h2 className="font-bold">Movimientos de Inventario</h2>
                        </div>
                        {chartMovementsData.length === 0 ? (
                            <EmptyState text="No hay movimientos registrados este mes" />
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={chartMovementsData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                                    <XAxis
                                        dataKey="day"
                                        tick={{ fontSize: 11, fill: CHART_TICK }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: CHART_TICK }}
                                        axisLine={false}
                                        tickLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip content={<MovementTooltip />} />
                                    <Legend
                                        wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                                        formatter={(value: string) => <span className="capitalize">{value}</span>}
                                    />
                                    {movementTypes.map((type) => (
                                        <Bar
                                            key={type}
                                            dataKey={type}
                                            name={type}
                                            stackId="movements"
                                            fill={getMovementColor(type)}
                                            radius={[3, 3, 0, 0]}
                                        />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Critical Stock */}
                    <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            <h2 className="font-bold">Stock Crítico</h2>
                            {criticalStock.length > 0 && (
                                <span className="ml-auto rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-bold text-destructive">
                                    {criticalStock.length}
                                </span>
                            )}
                        </div>
                        {criticalStock.length === 0 ? (
                            <div className="flex h-[250px] flex-col items-center justify-center text-muted-foreground">
                                <Package className="mb-2 h-10 w-10 opacity-20" />
                                <p className="text-sm font-medium">Sin productos en stock crítico</p>
                                <p className="text-xs">¡Todo en orden! 🎉</p>
                            </div>
                        ) : (
                            <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                                {criticalStock.map((product) => {
                                    const pct = product.critical_stock > 0
                                        ? Math.min((product.stock / product.critical_stock) * 100, 100)
                                        : 0;
                                    return (
                                        <div
                                            key={product.id}
                                            className="rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 transition-all hover:border-destructive/40"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 pr-2">
                                                    <p className="text-sm font-semibold leading-tight">{product.name}</p>
                                                    {product.sku && (
                                                        <p className="font-mono text-xs text-muted-foreground">{product.sku}</p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-extrabold text-destructive">
                                                        {product.stock}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        / {product.critical_stock}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Bar indicator */}
                                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-destructive/10">
                                                <div
                                                    className="h-full rounded-full bg-destructive transition-all"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══════ ROW 3: Top Products + Bottom Products ═══════ */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Top Products */}
                    <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-amber-500" />
                            <h2 className="font-bold">Productos Más Vendidos</h2>
                        </div>
                        {topProducts.length === 0 ? (
                            <EmptyState text="Sin datos de ventas este mes" />
                        ) : (
                            <div className="space-y-2">
                                {topProducts.map((product, index) => {
                                    const maxQty = topProducts[0]?.total_quantity || 1;
                                    const pct = (product.total_quantity / maxQty) * 100;
                                    return (
                                        <div key={product.product_id} className="group">
                                            <div className="flex items-center gap-3 rounded-xl bg-muted/30 px-3.5 py-3 transition-all hover:bg-muted/50">
                                                <span className={cn(
                                                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold',
                                                    index === 0 ? 'bg-amber-500/15 text-amber-600' :
                                                    index === 1 ? 'bg-zinc-400/15 text-zinc-500' :
                                                    index === 2 ? 'bg-orange-400/15 text-orange-500' :
                                                    'bg-muted text-muted-foreground',
                                                )}>
                                                    {index + 1}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="truncate text-sm font-semibold">{product.name}</p>
                                                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
                                                        <div
                                                            className="h-full rounded-full bg-primary/60 transition-all"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-sm font-bold text-primary">{product.total_quantity}</p>
                                                    <p className="text-xs text-muted-foreground">{formatCLP(product.total_revenue)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Bottom Products */}
                    <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-2">
                            <ThumbsDown className="h-5 w-5 text-orange-500" />
                            <h2 className="font-bold">Productos Menos Vendidos</h2>
                        </div>
                        {bottomProducts.length === 0 ? (
                            <EmptyState text="Sin datos de ventas este mes" />
                        ) : (
                            <div className="space-y-2">
                                {bottomProducts.map((product, index) => {
                                    const maxQty = bottomProducts[bottomProducts.length - 1]?.total_quantity || 1;
                                    const pct = maxQty > 0 ? (product.total_quantity / maxQty) * 100 : 0;
                                    return (
                                        <div key={product.product_id} className="group">
                                            <div className="flex items-center gap-3 rounded-xl bg-muted/30 px-3.5 py-3 transition-all hover:bg-muted/50">
                                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-xs font-extrabold text-orange-500">
                                                    {index + 1}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="truncate text-sm font-semibold">{product.name}</p>
                                                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-orange-500/10">
                                                        <div
                                                            className="h-full rounded-full bg-orange-500/50 transition-all"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-sm font-bold text-orange-500">{product.total_quantity}</p>
                                                    <p className="text-xs text-muted-foreground">{formatCLP(product.total_revenue)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══════ ROW 4: Movement Summary Cards ═══════ */}
                {movements.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {movements.map((m) => (
                            <div
                                key={m.type}
                                className="rounded-2xl border border-border/50 bg-card px-4 py-4 shadow-sm transition-all hover:shadow-md"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div
                                        className="h-2.5 w-2.5 rounded-full"
                                        style={{ background: getMovementColor(m.type) }}
                                    />
                                    <span className="text-sm font-semibold capitalize">{m.type}</span>
                                </div>
                                <p className="text-2xl font-extrabold">{m.count}</p>
                                <p className="text-xs text-muted-foreground">{m.total_units} unidades totales</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

/* ═══════ SUBCOMPONENTS ═══════ */
function KPICard({
    icon: Icon,
    title,
    value,
    subtitle,
    accentClass,
}: {
    icon: any;
    title: string;
    value: string;
    subtitle: string;
    accentClass: string;
}) {
    return (
        <div className="card-hover rounded-2xl border border-border/50 bg-card p-5 shadow-sm" id={`kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            <div className="flex items-center gap-3">
                <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', accentClass)}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-xs font-medium text-muted-foreground">{title}</p>
                    <p className="text-xl font-extrabold leading-tight">{value}</p>
                </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{subtitle}</p>
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="flex h-[200px] flex-col items-center justify-center text-muted-foreground">
            <BarChart3 className="mb-2 h-10 w-10 opacity-15" />
            <p className="text-sm">{text}</p>
        </div>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
