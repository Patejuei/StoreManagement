<?php

use App\Models\User;
use App\Models\Tenant;
use function Pest\Laravel\actingAs;

test('super admin can list all users from all tenants', function () {
    $tenant1 = Tenant::factory()->create();
    $tenant2 = Tenant::factory()->create();
    
    User::factory()->create(['tenant_id' => $tenant1->id]);
    User::factory()->create(['tenant_id' => $tenant2->id]);
    
    $admin = User::factory()->create(['is_super_admin' => true]);

    actingAs($admin)
        ->get(route('admin.users.index'))
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/index')
            ->has('users', 3) // 2 tenant users + 1 admin
        );
});

test('super admin can promote a user to admin', function () {
    $user = User::factory()->create(['is_super_admin' => false]);
    $admin = User::factory()->create(['is_super_admin' => true]);

    actingAs($admin)
        ->patch(route('admin.users.promote', $user))
        ->assertRedirect(route('admin.users.index'));

    expect($user->fresh()->is_super_admin)->toBeTrue();
});

test('super admin can create a user globally', function () {
    $tenant = Tenant::factory()->create();
    $admin = User::factory()->create(['is_super_admin' => true]);

    actingAs($admin)
        ->post(route('admin.users.store'), [
            'name' => 'New User',
            'email' => 'new@user.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'tenant_id' => $tenant->id,
            'is_super_admin' => false,
        ])
        ->assertRedirect(route('admin.users.index'));

    expect(User::where('email', 'new@user.com')->exists())->toBeTrue();
});

test('super admin can update a user globally', function () {
    $user = User::factory()->create(['name' => 'Old Name']);
    $tenant = Tenant::factory()->create();
    $admin = User::factory()->create(['is_super_admin' => true]);

    actingAs($admin)
        ->put(route('admin.users.update', $user), [
            'name' => 'Updated Name',
            'email' => $user->email,
            'tenant_id' => $tenant->id,
            'is_super_admin' => true,
        ])
        ->assertRedirect(route('admin.users.index'));

    expect($user->fresh()->name)->toBe('Updated Name');
    expect($user->fresh()->tenant_id)->toBe($tenant->id);
    expect($user->fresh()->is_super_admin)->toBeTrue();
});
