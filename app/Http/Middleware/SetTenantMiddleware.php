<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\Response;

class SetTenantMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->route()->hasParameter('tenant')) {
            $slug = $request->route()->parameter('tenant');
            $tenant = \App\Models\Tenant::where('slug', $slug)->first();

            if (!$tenant) {
                abort(404, 'Tienda no encontrada');
            }
            
            // Establecer el parámetro por defecto para la generación de URLs
            URL::defaults(['tenant' => $tenant->slug]);
            
            // Remover el parámetro de la ruta
            $request->route()->forgetParameter('tenant');
            
            // Compartir el tenant actual
            app()->instance('tenant', $tenant);
            
            if (class_exists(\Inertia\Inertia::class)) {
                \Inertia\Inertia::share('current_tenant', $tenant->slug);
            }
        }

        return $next($request);
    }
}
