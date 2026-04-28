<?php

use App\Models\User;
use Illuminate\Support\Facades\Route;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;

beforeEach(function () {
    Route::get('/test-admin', function () {
        return 'success';
    })->middleware(['auth', 'super-admin']);
});

test('it allows super admin to access protected routes', function () {
    $admin = User::factory()->create(['is_super_admin' => true]);

    actingAs($admin)
        ->get('/test-admin')
        ->assertStatus(200)
        ->assertSee('success');
});

test('it denies access to non-admin users', function () {
    $user = User::factory()->create(['is_super_admin' => false]);

    actingAs($user)
        ->get('/test-admin')
        ->assertStatus(403);
});

test('it denies access to unauthenticated users', function () {
    get('/test-admin')
        ->assertRedirect('/login');
});
