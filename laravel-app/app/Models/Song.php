<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\Storage;

#[Fillable(['title', 'artist', 'audio_url', 'cover_url', 'mood', 'lyrics'])]
class Song extends Model
{
    protected function casts(): array
    {
        return [
            'lyrics' => 'array',
        ];
    }

    public static function isYouTubeUrl(string $url): bool
    {
        $host = strtolower((string) parse_url($url, PHP_URL_HOST));

        return in_array($host, ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be', 'www.youtu.be'], true);
    }

    public static function youtubeVideoId(string $url): ?string
    {
        $host = strtolower((string) parse_url($url, PHP_URL_HOST));
        $path = trim((string) parse_url($url, PHP_URL_PATH), '/');
        $videoId = null;

        if (in_array($host, ['youtu.be', 'www.youtu.be'], true)) {
            $videoId = explode('/', $path)[0] ?? null;
        } elseif (in_array($host, ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'], true)) {
            parse_str((string) parse_url($url, PHP_URL_QUERY), $query);

            if (($query['v'] ?? null) !== null) {
                $videoId = $query['v'];
            } elseif (preg_match('~^(?:embed|shorts|live)/([^/]+)$~', $path, $matches) === 1) {
                $videoId = $matches[1];
            }
        }

        return is_string($videoId) && preg_match('/^[A-Za-z0-9_-]{11}$/', $videoId) === 1
            ? $videoId
            : null;
    }

    public function favoritedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'favorites')->withTimestamps();
    }

    public function lyricsForEditor(): string
    {
        return collect($this->lyrics ?? [])
            ->map(fn (array $line): string => sprintf(
                '[%02d:%05.2f]%s',
                intdiv((int) floor($line['time']), 60),
                fmod($line['time'], 60),
                $line['text'],
            ))
            ->implode("\n");
    }

    public function audioSource(): string
    {
        return str_starts_with($this->audio_url, 'songs/')
            ? Storage::disk('public')->url($this->audio_url)
            : $this->audio_url;
    }

    public function coverSource(): ?string
    {
        if ($this->cover_url === null) {
            return null;
        }

        return str_starts_with($this->cover_url, 'covers/')
            ? Storage::disk('public')->url($this->cover_url)
            : $this->cover_url;
    }
}
