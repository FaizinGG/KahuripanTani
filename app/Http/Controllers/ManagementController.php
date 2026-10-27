<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class ManagementController extends Controller
{
    private function ensureManager(User $user): void
    {
        if (!$user->isOwner() && !$user->isAdmin()) {
            abort(403, 'Forbidden');
        }
    }

    public function stats(Request $request): JsonResponse
    {
        $this->ensureManager($request->user());

        $users = User::query()->with('roles');
        $ownerCount = (clone $users)->whereHas('roles', fn ($q) => $q->where('name', 'owner'))->count();
        $adminCount = (clone $users)->whereHas('roles', fn ($q) => $q->where('name', 'admin'))->count();
        $kasirCount = (clone $users)->whereHas('roles', fn ($q) => $q->where('name', 'kasir'))->count();
        $gudangCount = (clone $users)->whereHas('roles', fn ($q) => $q->where('name', 'gudang'))->count();

        $activeCount = (clone $users)->where('status', 'active')->count();
        $inactiveCount = (clone $users)->where('status', 'inactive')->count();

        $today = now()->toDateString();
        $presentCount = Attendance::whereDate('attendance_date', $today)->where('status', 'present')->count();
        $lateCount = Attendance::whereDate('attendance_date', $today)->where('status', 'late')->count();
        $sickCount = Attendance::whereDate('attendance_date', $today)->where('status', 'sick')->count();
        $permitCount = Attendance::whereDate('attendance_date', $today)->where('status', 'permit')->count();
        $absentCount = Attendance::whereDate('attendance_date', $today)->where('status', 'absent')->count();

        return response()->json([
            'stats' => [
                'total_users' => User::count(),
                'owner' => $ownerCount,
                'admin' => $adminCount,
                'kasir' => $kasirCount,
                'gudang' => $gudangCount,
                'active' => $activeCount,
                'inactive' => $inactiveCount,
                'present_today' => $presentCount,
                'late_today' => $lateCount,
                'sick_today' => $sickCount,
                'permit_today' => $permitCount,
                'absent_today' => $absentCount,
            ],
            'users' => User::query()->with('roles')->latest()->take(8)->get()->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'status' => $user->status,
                'role' => $user->getRoleNames()->first() ?: 'employee',
                'position' => $user->position,
            ]),
        ]);
    }

    public function users(Request $request): JsonResponse
    {
        $this->ensureManager($request->user());

        $query = User::query()->with('roles')->orderByDesc('created_at');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('position', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->whereHas('roles', fn ($q) => $q->where('name', $request->role));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('position')) {
            $query->where('position', 'like', "%{$request->position}%")
                ->orWhere('position', $request->position);
        }

        if ($request->filled('joined_from')) {
            $query->whereDate('joined_at', '>=', $request->joined_from);
        }

        if ($request->filled('joined_to')) {
            $query->whereDate('joined_at', '<=', $request->joined_to);
        }

        $perPage = (int) ($request->input('per_page', 15));

        return response()->json($query->paginate($perPage));
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureManager($request->user());

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['nullable', 'string', 'max:100', 'unique:users,username'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:100'],
            'role' => ['nullable', 'string', 'in:owner,admin,kasir,gudang'],
            'status' => ['nullable', 'string', 'in:active,inactive'],
            'joined_at' => ['nullable', 'date'],
            'profile_photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $user = new User();
        $user->name = $validated['name'];
        $user->username = $validated['username'] ?? Str::slug($validated['name']);
        $user->email = $validated['email'];
        $user->password = Hash::make($validated['password']);
        $user->phone = $validated['phone'] ?? null;
        $user->address = $validated['address'] ?? null;
        $user->position = $validated['position'] ?? null;
        $user->status = $validated['status'] ?? 'active';
        $user->joined_at = $validated['joined_at'] ?? now()->toDateString();

        if ($request->hasFile('profile_photo')) {
            $path = $request->file('profile_photo')->store('profile-photos', 'public');
            $user->profile_photo = $path;
        }

        $user->save();

        $selectedRole = $validated['role'] ?? 'kasir';
        $roleNames = ['owner', 'admin', 'kasir', 'gudang'];
        $role = Role::firstOrCreate(['name' => $selectedRole], ['display_name' => ucfirst($selectedRole)]);
        $user->syncRoles([$role->name]);

        if ($selectedRole === 'kasir' || $selectedRole === 'gudang') {
            $employeeRole = Role::firstOrCreate(['name' => 'employee'], ['display_name' => 'Karyawan']);
            $user->assignRole($employeeRole);
        }

        return response()->json(['message' => 'User created successfully', 'user' => $user->fresh()->load('roles')], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->ensureManager($request->user());

        if ($request->user()->isAdmin() && $user->isOwner()) {
            abort(403, 'Forbidden');
        }

        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'username' => ['nullable', 'string', 'max:100', 'unique:users,username,' . $user->id],
            'email' => ['nullable', 'email', 'unique:users,email,' . $user->id],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:100'],
            'role' => ['nullable', 'string', 'in:owner,admin,kasir,gudang'],
            'status' => ['nullable', 'string', 'in:active,inactive'],
            'joined_at' => ['nullable', 'date'],
            'profile_photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        if (isset($validated['name'])) {
            $user->name = $validated['name'];
        }
        if (isset($validated['username'])) {
            $user->username = $validated['username'];
        }
        if (isset($validated['email'])) {
            $user->email = $validated['email'];
        }
        if (array_key_exists('phone', $validated)) {
            $user->phone = $validated['phone'];
        }
        if (array_key_exists('address', $validated)) {
            $user->address = $validated['address'];
        }
        if (array_key_exists('position', $validated)) {
            $user->position = $validated['position'];
        }
        if (array_key_exists('status', $validated)) {
            $user->status = $validated['status'];
        }
        if (array_key_exists('joined_at', $validated)) {
            $user->joined_at = $validated['joined_at'];
        }
        if ($request->hasFile('profile_photo')) {
            $path = $request->file('profile_photo')->store('profile-photos', 'public');
            $user->profile_photo = $path;
        }

        $user->save();

        if ($request->has('role')) {
            $roleName = $request->role;
            $selectedRole = Role::firstOrCreate(['name' => $roleName], ['display_name' => ucfirst($roleName)]);
            $user->syncRoles([$selectedRole->name]);
            if ($roleName === 'kasir' || $roleName === 'gudang') {
                $employeeRole = Role::firstOrCreate(['name' => 'employee'], ['display_name' => 'Karyawan']);
                $user->assignRole($employeeRole);
            }
        }

        return response()->json(['message' => 'User updated successfully', 'user' => $user->fresh()->load('roles')]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->ensureManager($request->user());

        if ($request->user()->isAdmin() && $user->isOwner()) {
            abort(403, 'Forbidden');
        }

        if ($request->user()->isOwner()) {
            if ($user->isOwner() && $request->user()->id !== $user->id) {
                abort(403, 'Owner cannot delete another owner');
            }
            $user->delete();
            return response()->json(['message' => 'User deleted successfully']);
        }

        $user->status = 'inactive';
        $user->save();

        return response()->json(['message' => 'User deactivated successfully']);
    }

    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $this->ensureManager($request->user());

        $request->validate(['password' => ['required', 'string', 'min:8', 'confirmed']]);
        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json(['message' => 'Password reset successfully']);
    }

    public function attendance(Request $request): JsonResponse
    {
        $this->ensureManager($request->user());

        $query = Attendance::query()->with('user.roles')->orderByDesc('attendance_date');

        if ($request->filled('search')) {
            $query->whereHas('user', fn ($q) => $q->where('name', 'like', "%{$request->search}%"));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date')) {
            $query->whereDate('attendance_date', $request->date);
        }

        return response()->json($query->paginate((int) ($request->input('per_page', 15))));
    }

    public function updateAttendance(Request $request, Attendance $attendance): JsonResponse
    {
        $this->ensureManager($request->user());

        $validated = $request->validate([
            'check_in_time' => ['nullable', 'date_format:H:i'],
            'check_out_time' => ['nullable', 'date_format:H:i'],
            'status' => ['nullable', 'string', 'in:present,late,permit,sick,absent'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        if (array_key_exists('check_in_time', $validated)) {
            $attendance->check_in_time = $validated['check_in_time'];
        }
        if (array_key_exists('check_out_time', $validated)) {
            $attendance->check_out_time = $validated['check_out_time'];
        }
        if (array_key_exists('status', $validated)) {
            $attendance->status = $validated['status'];
        }
        if (array_key_exists('notes', $validated)) {
            $attendance->notes = $validated['notes'];
        }

        if ($attendance->check_in_time && $attendance->check_out_time) {
            $start = strtotime($attendance->check_in_time);
            $end = strtotime($attendance->check_out_time);
            $attendance->work_hours = max(0, (int) round(($end - $start) / 60));
        }

        $attendance->save();

        return response()->json(['message' => 'Attendance updated successfully', 'attendance' => $attendance->fresh()->load('user')]);
    }

    public function loginHistory(Request $request): JsonResponse
    {
        $this->ensureManager($request->user());

        $query = AuditLog::query()->with('user.roles')->whereIn('action', ['login', 'logout'])->orderByDesc('created_at');

        if ($request->filled('search')) {
            $query->whereHas('user', fn ($q) => $q->where('name', 'like', "%{$request->search}%"));
        }

        if ($request->filled('status')) {
            $query->where('description', 'like', "%{$request->status}%");
        }

        return response()->json($query->paginate((int) ($request->input('per_page', 15))));
    }
}
