<!doctype html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#101014">
    <title>@yield('title', 'Tài khoản') — Melody</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ asset('css/styles.css') }}">
    <link rel="stylesheet" href="{{ asset('css/auth.css') }}">
</head>
<body class="auth-body">
    <main class="auth-shell">
        <a class="brand auth-brand" href="{{ route('home') }}" aria-label="Melody trang chủ">
            <span class="brand-mark"><span></span><span></span><span></span><span></span></span>
            <span>melody<span class="brand-dot">.</span></span>
        </a>
        <section class="auth-card">
            @yield('content')
        </section>
        <a class="auth-home-link" href="{{ route('home') }}">← Quay lại trang chủ</a>
    </main>
</body>
</html>
