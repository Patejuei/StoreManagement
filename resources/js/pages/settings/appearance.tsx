import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import Heading from '@/components/heading';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    return (
        <>
            <Head title="Ajustes de Apariencia" />

            <h1 className="sr-only">Ajustes de Apariencia</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Ajustes de apariencia"
                    description="Personalizá cómo se ve tu cuenta"
                />
                <AppearanceTabs />
            </div>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Ajustes de Apariencia',
            href: editAppearance(),
        },
    ],
};
