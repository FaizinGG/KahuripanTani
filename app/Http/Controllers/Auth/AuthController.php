<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\Attendance;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    /**
     * Login user
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(
                ['message' => 'Invalid credentials'],
                401
            );
        }

        // Delete existing tokens
        $user->tokens()->delete();

        DB::transaction(function () use ($user, $request) {
            try {
                Attendance::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'attendance_date' => now()->toDateString(),
                    ],
                    [
                        'check_in_time' => now()->format('H:i:s'),
                        'status' => 'present',
                        'notes' => 'Login otomatis',
                    ]
                );
            } catch (QueryException $exception) {
                $attendance = Attendance::where('user_id', $user->id)
                    ->whereDate('attendance_date', now()->toDateString())
                    ->first();

                if ($attendance) {
                    $attendance->update([
                        'check_in_time' => now()->format('H:i:s'),
                        'status' => 'present',
                        'notes' => trim(($attendance->notes ?? '') . ' | Login otomatis'),
                    ]);
                } else {
                    throw $exception;
                }
            }

            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'login',
                'description' => 'Login berhasil',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        });

        // Create new token
        $token = $user->createToken('auth_token', ['*'], now()->addHours(8))->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'user' => new UserResource($user),
        ]);
    }

    /**
     * Get current user
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => new UserResource($request->user()),
        ]);
    }

    /**
     * Logout user
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->currentAccessToken()->delete();

        DB::transaction(function () use ($user, $request) {
            $attendance = Attendance::where('user_id', $user->id)
                ->whereDate('attendance_date', now()->toDateString())
                ->first();

            if ($attendance) {
                $attendance->check_out_time = now()->format('H:i:s');
                if ($attendance->check_in_time) {
                    $start = strtotime($attendance->check_in_time);
                    $end = strtotime($attendance->check_out_time);
                    $attendance->work_hours = max(0, (int) round(($end - $start) / 60));
                }
                $attendance->notes = trim(($attendance->notes ?? '') . ' | Logout otomatis');
                $attendance->save();
            }

            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'logout',
                'description' => 'Logout berhasil',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        });

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Refresh token
     */
    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->tokens()->delete();

        $token = $user->createToken('auth_token', ['*'], now()->addHours(8))->plainTextToken;

        return response()->json([
            'message' => 'Token refreshed',
            'token' => $token,
        ]);
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'username' => 'nullable|string|max:255',
            'position' => 'nullable|string|max:255',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => new UserResource($user),
        ]);
    }

    /**
     * Update user password
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json(
                ['message' => 'Current password is incorrect'],
                422
            );
        }

        $user->update([
            'password' => Hash::make($validated['new_password']),
        ]);

        return response()->json([
            'message' => 'Password updated successfully',
        ]);
    }
}
