export interface Product {
    id: number;
    name: string;
    brand: string | null;
    model: string | null;
    category: string | null;
    description: string | null;
    price: number;
    stock: number;
    critical_stock: number;
    sku: string | null;
    image: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface SaleSession {
    id: number;
    user_id: number;
    start_date: string;
    end_date: string | null;
    start_cash: number;
    end_cash: number | null;
    total_cash_sales: number;
    total_card_sales: number;
    total_transfer_sales: number;
    total_sales: number;
    created_at: string;
    updated_at: string;
    user?: import('./auth').User;
    sales?: Sale[];
}

export interface Sale {
    id: number;
    product_id: number;
    session_id: number;
    quantity: number;
    price: number;
    payment_method: 'cash' | 'card' | 'transfer';
    total: number;
    sale_date: string;
    created_at: string;
    updated_at: string;
    product?: Product;
    session?: SaleSession;
}

export interface ProductHistory {
    id: number;
    product_id: number;
    stock: number;
    movement_type: string;
    price: number;
    details: string;
    created_at: string;
    updated_at: string;
    product?: Product;
}

export interface ProductSale {
    id: number;
    name: string;
    start_date: string;
    end_date: string | null;
    priority: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    rules?: ProductSaleRule[];
}

export interface ProductSaleRule {
    id: number;
    product_on_sale_id: number;
    product_id: number;
    offer_type: 'percentage' | 'fixed';
    minimal_quantity: number;
    discount_value: number;
    created_at: string;
    updated_at: string;
    product?: Product;
    sale?: ProductSale;
}

export interface Supplier {
    id: number;
    name: string;
    rut: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    contact_person: string | null;
    created_at: string;
    updated_at: string;
    products?: Product[];
    purchases?: Purchase[];
}

export interface Purchase {
    id: number;
    supplier_id: number | null;
    user_id: number;
    invoice_number: string | null;
    total: number;
    purchase_date: string;
    type: 'frequent' | 'external';
    notes: string | null;
    created_at: string;
    updated_at: string;
    supplier?: Supplier;
    user?: import('./auth').User;
    items?: PurchaseItem[];
}

export interface PurchaseItem {
    id: number;
    purchase_id: number;
    product_id: number;
    quantity: number;
    unit_cost: number;
    subtotal: number;
    created_at: string;
    updated_at: string;
    product?: Product;
}

export interface CartItem {
    product: Product;
    quantity: number;
    unitPrice: number;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}
