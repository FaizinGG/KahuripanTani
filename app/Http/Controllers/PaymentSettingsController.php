<?php

namespace App\Http\Controllers;

use App\Services\QrisSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentSettingsController extends Controller
{
    public function showQris(QrisSettings $qris): JsonResponse
    {
        $url = $qris->imageUrl();

        return response()->json([
            'success' => true,
            'data' => [
                'configured' => $url !== null,
                'image_url' => $url,
            ],
        ]);
    }

    public function uploadQris(Request $request, QrisSettings $qris): JsonResponse
    {
        $this->ensureManager($request);
        $validated = $request->validate([
            'qris_image' => 'required|image|mimes:jpg,jpeg,png,webp|extensions:jpg,jpeg,png,webp|max:5120',
        ], [
            'qris_image.required' => 'Pilih gambar QRIS yang akan di-upload.',
            'qris_image.image' => 'File QRIS harus berupa gambar yang valid.',
            'qris_image.mimes' => 'Format gambar QRIS harus JPG, JPEG, PNG, atau WEBP.',
            'qris_image.extensions' => 'Ekstensi file QRIS harus JPG, JPEG, PNG, atau WEBP.',
            'qris_image.max' => 'Ukuran gambar QRIS maksimal 5 MB.',
        ]);

        $qris->store($validated['qris_image']);

        return response()->json([
            'success' => true,
            'message' => 'Gambar QRIS berhasil disimpan.',
            'data' => [
                'configured' => true,
                'image_url' => $qris->imageUrl(),
            ],
        ]);
    }

    public function deleteQris(Request $request, QrisSettings $qris): JsonResponse
    {
        $this->ensureManager($request);
        $qris->delete();

        return response()->json([
            'success' => true,
            'message' => 'Gambar QRIS berhasil dihapus.',
            'data' => [
                'configured' => false,
                'image_url' => null,
            ],
        ]);
    }

    private function ensureManager(Request $request): void
    {
        $user = $request->user();
        if (!$user?->isOwner() && !$user?->isAdmin()) {
            abort(403, 'Pengaturan QRIS hanya dapat diakses Owner atau Admin.');
        }
    }
}