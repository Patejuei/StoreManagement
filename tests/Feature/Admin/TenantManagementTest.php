<?php

use App\Models\User;
use App\Models\Tenant;
use function Pest\Laravel\actingAs;

test('super admin can list all tenants', function () {
    Tenant::factory()->count(3)->create();
    $admin = User::factory()->create(['is_super_admin' => true]);

    actingAs($admin)
        ->get(route('admin.tenants.index'))
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('admin/tenants/index')
            ->has('tenants', 3)
        );
});

test('super admin can create a tenant', function () {
    $admin = User::factory()->create(['is_super_admin' => true]);

    actingAs($admin)
        ->post(route('admin.tenants.store'), [
            'name' => 'New Store',
            'slug' => 'new-store',
        ])
        ->assertRedirect(route('admin.tenants.index'));

    expect(Tenant::where('slug', 'new-store')->exists())->toBeTrue();
});

test('super admin can update a tenant', function () {
    $tenant = Tenant::factory()->create(['name' => 'Old Name', 'slug' => 'old-slug']);
    $admin = User::factory()->create(['is_super_admin' => true]);

    actingAs($admin)
        ->put(route('admin.tenants.update', $tenant), [
            'name' => 'Updated Name',
            'slug' => 'updated-slug',
        ])
        ->assertRedirect(route('admin.tenants.index'));

    expect($tenant->fresh()->name)->toBe('Updated Name');
});
