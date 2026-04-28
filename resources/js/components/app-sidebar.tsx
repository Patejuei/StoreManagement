import { Link, usePage } from '@inertiajs/react';
import {
    LayoutGrid,
    ShoppingCart,
    Package,
    Truck,
    FileBarChart,
    Tags,
    House,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem, SharedData } from '@/types';

const footerNavItems: NavItem[] = [
    {
        title: 'Volver a Fluxotec',
        href: 'http://fluxotec.cl',
        icon: House,
    },
];

export function AppSidebar() {
    // Obtenemos el tenant actual desde Inertia props
    const { current_tenant } = usePage<
        SharedData & { current_tenant?: string }
    >().props;
    const tenantPrefix = current_tenant ? `/${current_tenant}` : '/default';

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: `${tenantPrefix}/dashboard`,
            icon: LayoutGrid,
        },
        {
            title: 'Punto de Venta',
            href: `${tenantPrefix}/pos`,
            icon: ShoppingCart,
        },
        {
            title: 'Inventario',
            href: `${tenantPrefix}/inventory`,
            icon: Package,
        },
        {
            title: 'Compras',
            href: `${tenantPrefix}/purchases`,
            icon: Truck,
        },
        {
            title: 'Reportes',
            href: `${tenantPrefix}/reports`,
            icon: FileBarChart,
        },
        {
            title: 'Ofertas',
            href: `${tenantPrefix}/offers`,
            icon: Tags,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={`${tenantPrefix}/dashboard`} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
