<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/users/index', [
            'users' => User::withoutGlobalScopes()->with('tenant')->get(),
            'tenants' => Tenant::all(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'tenant_id' => 'nullable|exists:tenants,id',
            'is_super_admin' => 'boolean',
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'tenant_id' => $request->tenant_id,
            'is_super_admin' => $request->is_super_admin ?? false,
        ]);

        return redirect()->route('admin.users.index')->with('success', 'Usuario creado con éxito');
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:users,email,' . $user->id,
            'tenant_id' => 'nullable|exists:tenants,id',
            'is_super_admin' => 'boolean',
        ]);

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
            'tenant_id' => $request->tenant_id,
            'is_super_admin' => $request->is_super_admin ?? false,
        ]);

        return redirect()->route('admin.users.index')->with('success', 'Usuario actualizado con éxito');
    }

    public function promote(User $user)
    {
        $user->update(['is_super_admin' => true]);

        return redirect()->route('admin.users.index')->with('success', 'Usuario promovido a Super Admin');
    }

    public function demote(User $user)
    {
        $user->update(['is_super_admin' => false]);

        return redirect()->route('admin.users.index')->with('success', 'Usuario degradado de Super Admin');
    }
}
