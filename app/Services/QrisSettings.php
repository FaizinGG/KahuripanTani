<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class QrisSettings
{
    private const DIRECTORY = 'settings';
    private const FILE_NAME = 'qris';
    private const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

    public function imagePath(): ?string
    {
        $disk = Storage::disk('public');

        foreach (self::EXTENSIONS as $extension) {
            $path = self::DIRECTORY . '/' . self::FILE_NAME . '.' . $extension;
            if ($disk->exists($path)) {
                return $path;
            }
        }

        return null;
    }

    public function imageUrl(): ?string
    {
        $path = $this->imagePath();

        if (!$path) {
            return null;
        }

        $disk = Storage::disk('public');
        $baseUrl = rtrim((string) (config('filesystems.disks.public.url') ?: url('/storage')), '/');

        return $baseUrl . '/' . $path . '?v=' . $disk->lastModified($path);
    }

    public function store(UploadedFile $image): string
    {
        $disk = Storage::disk('public');
        $path = self::DIRECTORY . '/' . self::FILE_NAME . '.' . strtolower($image->extension());
        $storedPath = $disk->putFileAs(self::DIRECTORY, $image, basename($path));

        if (!$storedPath) {
            throw new \RuntimeException('Gagal menyimpan gambar QRIS.');
        }

        foreach (self::EXTENSIONS as $extension) {
            $oldPath = self::DIRECTORY . '/' . self::FILE_NAME . '.' . $extension;
            if ($oldPath !== $path && $disk->exists($oldPath)) {
                $disk->delete($oldPath);
            }
        }

        return $path;
    }

    public function delete(): void
    {
        $disk = Storage::disk('public');
        foreach (self::EXTENSIONS as $extension) {
            $path = self::DIRECTORY . '/' . self::FILE_NAME . '.' . $extension;
            if ($disk->exists($path)) {
                $disk->delete($path);
            }
        }
    }
}