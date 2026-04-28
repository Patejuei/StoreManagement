<?php

use App\Models\User;

test('it can check if a user is a super admin', function () {
    $user = User::factory()->make(['is_super_admin' => true]);
    expect($user->is_super_admin)->toBeTrue();
    expect($user->isSuperAdmin())->toBeTrue();
});

test('it returns false if a user is not a super admin', function () {
    $user = User::factory()->make(['is_super_admin' => false]);
    expect($user->is_super_admin)->toBeFalse();
    expect($user->isSuperAdmin())->toBeFalse();
});
