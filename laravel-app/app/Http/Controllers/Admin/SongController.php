<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Song;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;

class SongController extends Controller
{
    public function index(): View
    {
        return view('admin.songs.index', ['songs' => Song::query()->latest()->paginate(15)]);
    }

    public function create(): View
    {
        return view('admin.songs.form', ['song' => new Song, 'isEditing' => false]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatedSong($request);
        $validated['audio_url'] = $this->storeUpload($request, 'audio_file', 'songs');
        $validated['cover_url'] = $request->hasFile('cover_file')
            ? $this->storeUpload($request, 'cover_file', 'covers')
            : null;

        Song::create($validated);

        return redirect()->route('admin.songs.index')->with('status', 'Đã thêm bài hát.');
    }

    public function edit(Song $song): View
    {
        return view('admin.songs.form', ['song' => $song, 'isEditing' => true]);
    }

    public function update(Request $request, Song $song): RedirectResponse
    {
        $validated = $this->validatedSong($request, $song);
        $oldAudio = $song->audio_url;
        $oldCover = $song->cover_url;

        if ($request->hasFile('audio_file')) {
            $validated['audio_url'] = $this->storeUpload($request, 'audio_file', 'songs');
        } else {
            unset($validated['audio_url']);
        }

        if ($request->hasFile('cover_file')) {
            $validated['cover_url'] = $this->storeUpload($request, 'cover_file', 'covers');
        } else {
            unset($validated['cover_url']);
        }

        $song->update($validated);

        if ($request->hasFile('audio_file')) {
            $this->deleteStoredUpload($oldAudio, 'songs');
        }

        if ($request->hasFile('cover_file')) {
            $this->deleteStoredUpload($oldCover, 'covers');
        }

        return redirect()->route('admin.songs.index')->with('status', 'Đã cập nhật bài hát.');
    }

    public function destroy(Song $song): RedirectResponse
    {
        $audioPath = $song->audio_url;
        $coverPath = $song->cover_url;
        $song->delete();
        $this->deleteStoredUpload($audioPath, 'songs');
        $this->deleteStoredUpload($coverPath, 'covers');

        return redirect()->route('admin.songs.index')->with('status', 'Đã xóa bài hát.');
    }

    /**
     * @return array{title: string, artist: string, mood: string, lyrics: ?array}
     */
    private function validatedSong(Request $request, ?Song $song = null): array
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:100'],
            'artist' => ['required', 'string', 'max:100'],
            'audio_file' => [$song === null ? 'required' : 'nullable', 'file', 'mimes:mp3,wav,ogg,m4a,aac', 'max:51200'],
            'cover_file' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'mood' => ['required', 'in:Chill,Tập trung,Năng lượng,Đêm'],
            'lyrics' => ['nullable', 'string', 'max:20000'],
        ], [
            'title.required' => 'Vui lòng nhập tên bài hát.',
            'artist.required' => 'Vui lòng nhập tên nghệ sĩ.',
            'audio_file.required' => 'Vui lòng chọn tệp nhạc.',
            'audio_file.mimes' => 'Tệp nhạc phải có định dạng MP3, WAV, OGG, M4A hoặc AAC.',
            'audio_file.max' => 'Tệp nhạc không được lớn hơn 50 MB.',
            'cover_file.image' => 'Tệp ảnh bìa không hợp lệ.',
            'cover_file.mimes' => 'Ảnh bìa phải có định dạng JPG, PNG hoặc WEBP.',
            'cover_file.max' => 'Ảnh bìa không được lớn hơn 5 MB.',
        ]);

        unset($validated['audio_file'], $validated['cover_file']);
        $validated['lyrics'] = $this->parseLyrics($validated['lyrics'] ?? '');

        return $validated;
    }

    private function storeUpload(Request $request, string $field, string $directory): string
    {
        $path = $request->file($field)?->store($directory, 'public');

        if ($path === false || $path === null) {
            throw new \RuntimeException('Không thể lưu tệp đã tải lên.');
        }

        return $path;
    }

    private function deleteStoredUpload(?string $path, string $directory): void
    {
        if ($path !== null && str_starts_with($path, $directory.'/')) {
            Storage::disk('public')->delete($path);
        }
    }

    /**
     * @return array<int, array{time: float, text: string}>|null
     */
    private function parseLyrics(string $lyrics): ?array
    {
        if (trim($lyrics) === '') {
            return null;
        }

        $lines = preg_split('/\r\n|\r|\n/', trim($lyrics));
        $parsed = [];
        $previousTime = -1.0;

        foreach ($lines as $index => $line) {
            if (trim($line) === '') {
                continue;
            }

            if (preg_match('/^\[(\d{1,3}):([0-5]\d)(?:\.(\d{1,2}))?\]\s*(\S.*)$/u', trim($line), $matches) !== 1) {
                throw ValidationException::withMessages([
                    'lyrics' => 'Dòng '.($index + 1).' chưa đúng định dạng. Dùng [mm:ss]Lời bài hát, ví dụ [00:12]Một câu hát.',
                ]);
            }

            $fraction = isset($matches[3]) ? (float) ('0.'.$matches[3]) : 0.0;
            $time = ((int) $matches[1] * 60) + (int) $matches[2] + $fraction;

            if ($time < $previousTime) {
                throw ValidationException::withMessages([
                    'lyrics' => 'Mốc thời gian lời bài hát cần được sắp xếp từ sớm đến muộn.',
                ]);
            }

            $parsed[] = [
                'time' => round($time, 2),
                'text' => trim($matches[4]),
            ];
            $previousTime = $time;
        }

        return $parsed;
    }
}
