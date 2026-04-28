import { Link } from '@inertiajs/react';
import { LayoutGrid, Store, Users } from 'lucide-react';
import AppLogo from '@/components/app-logo';
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
import type { NavItem } from '@/types';

export function AdminSidebar() {
    const mainNavItems: NavItem[] = [
        {
            title: 'Panel de Control',
            href: '/admin/tenants', // Por ahora lo mandamos a tenants
            icon: LayoutGrid,
        },
        {
            title: 'Tiendas (Tenants)',
            href: '/admin/tenants',
            icon: Store,
        },
        {
            title: 'Usuarios Globales',
            href: '/admin/users',
            icon: Users,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/admin/tenants" prefetch>
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
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
