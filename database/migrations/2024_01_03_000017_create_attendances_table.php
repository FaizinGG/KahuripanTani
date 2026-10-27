<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            
            $table->date('attendance_date');
            $table->time('check_in_time')->nullable();
            $table->time('check_out_time')->nullable();
            
            $table->enum('status', ['present', 'absent', 'late', 'early_leave', 'sick', 'permit'])->default('present');
            
            $table->integer('work_hours')->default(0); // Jam kerja dalam menit
            $table->text('notes')->nullable();
            
            $table->timestamps();

            $table->index('user_id');
            $table->index('attendance_date');
            $table->unique(['user_id', 'attendance_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
