import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Store: Hexágono minimalista */}
            <path
                d="M16 4L26 10V22L16 28L6 22V10L16 4Z"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Flow: Línea fluida y audaz */}
            <path
                d="M10 16C12 14 16 18 22 16"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="text-primary"
            />
        </svg>
    );
}



