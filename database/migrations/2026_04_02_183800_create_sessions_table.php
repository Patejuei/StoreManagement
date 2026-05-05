<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sale_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->dateTime('start_date')->useCurrent();
            $table->dateTime('end_date')->nullable();
            $table->integer('start_cash')->default(0);
            $table->integer('end_cash')->nullable();
            $table->integer('total_cash_sales')->default(0);
            $table->integer('total_card_sales')->default(0);
            $table->integer('total_transfer_sales')->default(0);
            $table->integer('total_sales')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_sessions');
    }
};
