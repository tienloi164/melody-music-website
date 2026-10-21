# Melody — Website nghe nhạc

Melody là website nghe nhạc xây dựng bằng Laravel. Người dùng có thể đăng ký, đăng nhập, nghe nhạc, quản lý tài khoản và lưu bài hát yêu thích. Quản trị viên quản lý thư viện, tải tệp nhạc/ảnh bìa và nhập lời karaoke đồng bộ.

## Công nghệ

- PHP 8.3 trở lên, Laravel 13
- MySQL
- HTML, CSS và JavaScript
- Laragon được dùng làm môi trường phát triển trong hướng dẫn Windows

## Cài đặt và chạy trên máy khác (Windows + Laragon)

### 1. Chuẩn bị

Cài Git, Laragon có PHP 8.3 trở lên, Composer và MySQL. Mở Laragon, bấm **Start All** để khởi động các dịch vụ.

### 2. Tải mã nguồn

Mở Terminal của Laragon hoặc CMD. Chọn thư mục muốn lưu dự án (ví dụ Desktop), rồi chạy:

```cmd
cd /d "%USERPROFILE%\Desktop"
git clone https://github.com/tienloi164/melody-music-website.git
cd melody-music-website\laravel-app
```

Nếu đã tải mã nguồn về máy, chỉ cần mở Terminal và chuyển vào thư mục `laravel-app` bên trong vị trí bạn đã lưu dự án. Ví dụ:

```cmd
cd /d "D:\duong-dan-cua-ban\melody-music-website\laravel-app"
```

Thay đường dẫn mẫu bằng vị trí thực tế trên máy; không cần dùng đường dẫn máy của người phát triển.

### 3. Cài Laravel và cấu hình database

Trong Terminal đang ở thư mục `laravel-app`, chạy từng lệnh:

```cmd
composer install
```

```cmd
copy .env.example .env
```

```cmd
php artisan key:generate
```

Trong Laragon, mở HeidiSQL và tạo database tên `melody` (kiểu mã hóa mặc định `utf8mb4`). Mở file `laravel-app\.env` bằng trình soạn thảo và kiểm tra cấu hình database phù hợp với MySQL của máy:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=melody
DB_USERNAME=root
DB_PASSWORD=
```

Nếu MySQL của bạn có mật khẩu hoặc username khác, sửa các giá trị tương ứng trong `.env`. Không tải file `.env` lên GitHub.

### 4. Tạo bảng và liên kết lưu tệp

Quay lại Terminal, đảm bảo đang ở thư mục `laravel-app`, rồi chạy:

```cmd
php artisan migrate
```

```cmd
php artisan db:seed
```

```cmd
php artisan storage:link
```

Seeder thêm bài demo YouTube “Bông Hoa Đẹp Nhất” nếu chưa có. YouTube phát bằng trình nhúng chính thức và tùy thuộc vào việc chủ video có cho phép nhúng hay không.

### 5. Khởi động website

```cmd
php artisan serve --host=127.0.0.1 --port=8000
```

Mở `http://127.0.0.1:8000` trong trình duyệt. Giữ cửa sổ Terminal mở khi sử dụng website; đóng Terminal sẽ dừng máy chủ. Khi chạy lại sau này, mở Laragon, vào thư mục `laravel-app` và chạy lại lệnh `php artisan serve`.

## Tài khoản và quyền quản trị

- Đăng ký tại `/register`, đăng nhập tại `/login`; trang quản lý hồ sơ ở `/account`.
- Tài khoản mới mặc định là người dùng thường, có thể nghe nhạc và lưu yêu thích.
- Để cấp quyền admin, đăng ký tài khoản trước. Trong Terminal thứ hai tại thư mục `laravel-app`, chạy:

  ```cmd
  php artisan melody:make-admin email-cua-ban@example.com
  ```

  Thay email mẫu bằng email đã đăng ký và xác nhận `yes`. Sau đó đăng xuất rồi đăng nhập lại. Trang quản trị bài hát nằm tại `/admin/songs`.

## Quản lý bài hát và karaoke

- Admin chọn tệp nhạc MP3, WAV, OGG, M4A hoặc AAC (tối đa 50 MB); ảnh bìa JPG, PNG hoặc WEBP (tối đa 5 MB) là tùy chọn.
- Khi sửa bài hát, nếu không chọn tệp mới thì tệp đã có được giữ nguyên.
- Nhập lời karaoke theo từng dòng `[phút:giây]Lời bài hát`, ví dụ `[00:12]Một câu hát`. Mốc thời gian cần xếp theo thứ tự tăng dần.
- Chỉ nhập lời mà bạn có quyền sử dụng; website không tự lấy lời bài hát từ YouTube.

## Kiểm thử

Tại thư mục `laravel-app`, chạy:

```cmd
php artisan test
```

## Cấu trúc thư mục

- `laravel-app/` — ứng dụng Laravel chính.
- `index.html`, `styles.css`, `app.js` — giao diện HTML tĩnh ban đầu.
