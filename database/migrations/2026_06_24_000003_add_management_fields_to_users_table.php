<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'username')) {
                $table->string('username')->nullable()->after('name');
            }
            if (!Schema::hasColumn('users', 'position')) {
                $table->string('position')->nullable()->after('address');
            }
            if (!Schema::hasColumn('users', 'status')) {
                $table->string('status')->default('active')->after('position');
            }
            if (!Schema::hasColumn('users', 'joined_at')) {
                $table->date('joined_at')->nullable()->after('status');
            }
            if (!Schema::hasColumn('users', 'profile_photo')) {
                $table->string('profile_photo')->nullable()->after('joined_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['username', 'position', 'status', 'joined_at', 'profile_photo']);
        });
    }
};
