import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { BreadcrumbItem, SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    const { current_tenant } = usePage<SharedData & { current_tenant?: string }>().props;
    const tenantPrefix = current_tenant ? `/${current_tenant}` : '';

    const tenantBreadcrumbs = breadcrumbs.map((item) => {
        const isGlobal = ['/settings', '/admin', '/login', '/register'].some(route => item.href.startsWith(route));
        const shouldPrefix = item.href.startsWith('/') && 
                           !item.href.startsWith('http') && 
                           current_tenant && 
                           !item.href.startsWith(`/${current_tenant}`) &&
                           !isGlobal;

        return {
            ...item,
            href: shouldPrefix ? `${tenantPrefix}${item.href}` : item.href,
        };
    });

    return (
        <AppLayoutTemplate breadcrumbs={tenantBreadcrumbs}>
            {children}
        </AppLayoutTemplate>
    );
}
