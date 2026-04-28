<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use App\Traits\BelongsToTenant;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

<<<<<<< HEAD
#[Fillable(['name', 'email', 'password', 'is_super_admin', 'tenant_id'])]
=======
#[Fillable(['name', 'email', 'password', 'company_id'])]
>>>>>>> c0f8ee709cc220bad47279e6246de9e1d21c21c0
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable, BelongsToTenant;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'is_super_admin' => 'boolean',
        ];
    }

<<<<<<< HEAD
    public function isSuperAdmin(): bool
    {
        return (bool) $this->is_super_admin;
=======
    public function company()
    {
        return $this->belongsTo(Company::class);
>>>>>>> c0f8ee709cc220bad47279e6246de9e1d21c21c0
    }
}
