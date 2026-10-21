<!doctype html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#101014">
    <title>Quản lý bài hát — Melody</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ asset('css/styles.css') }}">
    <link rel="stylesheet" href="{{ asset('css/auth.css') }}">
    <link rel="stylesheet" href="{{ asset('css/admin.css') }}">
</head>
<body class="admin-body">
    <main class="admin-shell">
        <header class="admin-header">
            <a class="brand" href="{{ route('home') }}">
                <span class="brand-mark"><span></span><span></span><span></span><span></span></span>
                <span>melody<span class="brand-dot">.</span></span>
            </a>
            <div class="admin-header-actions">
                <a class="outline-button" href="{{ route('home') }}">← Trang nghe nhạc</a>
                <form method="POST" action="{{ route('logout') }}">
                    @csrf
                    <button class="cancel-button" type="submit">Đăng xuất</button>
                </form>
            </div>
        </header>

        <div class="admin-page-heading">
            <div>
                <div class="eyebrow">KHU VỰC QUẢN TRỊ</div>
                <h1>Quản lý bài hát</h1>
                <p>Thêm, chỉnh sửa hoặc gỡ bài hát khỏi thư viện Melody.</p>
            </div>
            <a class="primary-button" href="{{ route('admin.songs.create') }}">＋ Thêm bài hát</a>
        </div>

        @if (session('status'))
            <div class="auth-status" role="status">{{ session('status') }}</div>
        @endif

        @if ($songs->isEmpty())
            <div class="empty-state">
                <div class="empty-icon">♫</div>
                <h3>Chưa có bài hát nào</h3>
                <p>Thêm bài hát đầu tiên vào thư viện.</p>
                <a class="primary-button" href="{{ route('admin.songs.create') }}">＋ Thêm bài hát</a>
            </div>
        @else
            <div class="admin-song-list">
                @foreach ($songs as $song)
                    <article class="admin-song-row">
                        <div class="admin-song-cover">
                            @if ($song->coverSource())
                                <img src="{{ $song->coverSource() }}" alt="" loading="lazy">
                            @else
                                <span>♫</span>
                            @endif
                        </div>
                        <div class="admin-song-info">
                            <strong>{{ $song->title }}</strong>
                            <span>{{ $song->artist }} · {{ $song->mood }}</span>
                        </div>
                        <a class="outline-button" href="{{ route('admin.songs.edit', $song) }}">Chỉnh sửa</a>
                        <form method="POST" action="{{ route('admin.songs.destroy', $song) }}" onsubmit="return confirm('Bạn có chắc muốn xóa bài hát này?');">
                            @csrf
                            @method('DELETE')
                            <button class="delete-account-button" type="submit">Xóa</button>
                        </form>
                    </article>
                @endforeach
            </div>
            <div class="admin-pagination">{{ $songs->links() }}</div>
        @endif
    </main>
</body>
</html>
