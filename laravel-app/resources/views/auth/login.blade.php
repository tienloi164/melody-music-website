@extends('layouts.auth')

@section('title', 'Đăng nhập')

@section('content')
    <div class="eyebrow">RẤT VUI ĐƯỢC GẶP LẠI BẠN</div>
    <h1>Đăng nhập</h1>
    <p class="auth-description">Đăng nhập để tiếp tục hành trình cùng những giai điệu yêu thích.</p>

    @if (session('status'))
        <div class="auth-status" role="status">{{ session('status') }}</div>
    @endif

    <form method="POST" action="{{ route('login') }}" class="auth-form">
        @csrf
        <label for="email">Địa chỉ email</label>
        <input id="email" name="email" type="email" value="{{ old('email') }}" autocomplete="email" required maxlength="255" autofocus>
        @error('email') <p class="field-error">{{ $message }}</p> @enderror

        <label for="password">Mật khẩu</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required>
        @error('password') <p class="field-error">{{ $message }}</p> @enderror

        <label class="remember-field" for="remember">
            <input id="remember" name="remember" type="checkbox" value="1">
            <span>Ghi nhớ đăng nhập trên thiết bị này</span>
        </label>

        <button class="primary-button auth-submit" type="submit">Đăng nhập <span>→</span></button>
    </form>

    <p class="auth-switch">Chưa có tài khoản? <a href="{{ route('register') }}">Đăng ký miễn phí</a></p>
@endsection
