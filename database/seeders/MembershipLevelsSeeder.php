<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MembershipLevel;

class MembershipLevelsSeeder extends Seeder
{
    public function run(): void
    {
        $levels = [
            ['name' => 'silver', 'discount_percentage' => 0, 'is_active' => true],
            ['name' => 'gold', 'discount_percentage' => 5, 'is_active' => true],
            ['name' => 'platinum', 'discount_percentage' => 10, 'is_active' => true],
        ];

        foreach ($levels as $lvl) {
            MembershipLevel::firstOrCreate(['name' => $lvl['name']], $lvl);
        }
    }
}
