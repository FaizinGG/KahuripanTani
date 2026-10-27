<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ManagementModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_view_management_dashboard_stats(): void
    {
        $role = Role::firstOrCreate(['name' => 'owner'], ['display_name' => 'Owner']);
        $user = User::factory()->create();
        $user->assignRole($role);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/management/stats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'stats',
                'users',
            ]);
    }

    public function test_non_admin_cannot_access_management_stats(): void
    {
        $role = Role::firstOrCreate(['name' => 'employee'], ['display_name' => 'Employee']);
        $user = User::factory()->create();
        $user->assignRole($role);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/management/stats');

        $response->assertStatus(403);
    }
}
