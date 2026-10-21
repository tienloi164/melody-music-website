# Melody trên Laravel và Laragon

Ứng dụng Laravel nằm trong thư mục `laravel-app`. Website HTML tĩnh ở thư mục gốc vẫn được giữ nguyên; hãy chạy ứng dụng trong `laravel-app` để dùng cơ sở dữ liệu, đăng nhập và phân quyền.

## Chạy website sau khi mở hoặc khởi động lại máy

1. Mở Laragon, bấm **Chạy** (hoặc **Start All**) và đợi MySQL khởi động.
2. Mở **Terminal** trong Laragon. Trong cửa sổ CMD, nhập lệnh sau và nhấn Enter:

   ```cmd
   cd /d "C:\Users\letie\OneDrive\Desktop\doan\laravel-app"
   ```

3. Khởi động Laravel:

   ```cmd
   php artisan serve --host=127.0.0.1 --port=8000
   ```

4. Khi CMD hiện `Server running on [http://127.0.0.1:8000]`, mở `http://127.0.0.1:8000` trong trình duyệt. Giữ cửa sổ CMD này mở trong lúc dùng website; đóng cửa sổ sẽ dừng máy chủ.

Mỗi lần mở lại website chỉ cần khởi động Laragon và chạy lệnh `php artisan serve`. Không cần chạy migration hoặc seeder lại.

Khi nhận bản cập nhật có migration mới, chạy một lần `php artisan migrate` trong Terminal tại `laravel-app`, sau đó khởi động lại máy chủ.

## Cài đặt database lần đầu

File `.env` đã cấu hình MySQL theo mặc định Laragon: `127.0.0.1:3306`, user `root`, mật khẩu trống. Nếu cấu hình MySQL của bạn khác, sửa các biến `DB_*` trong `laravel-app/.env`.

1. Mở **Cơ sở dữ liệu** trong Laragon để vào HeidiSQL. Chọn session `Laragon.MySQL` và bấm **Open**. Nếu HeidiSQL báo database `melody` đã tồn tại, bấm **OK** — database đã được tạo, không cần tạo lại.
2. Trong Terminal CMD của Laragon, chạy từng lệnh:

   ```cmd
   cd /d "C:\Users\letie\OneDrive\Desktop\doan\laravel-app"
   ```

   ```cmd
   php artisan migrate
   ```

3. Để thêm bài mẫu “Bông Hoa Đẹp Nhất” của Quân A.P, chạy:

   ```cmd
   php artisan db:seed
   ```

Seeder có thể chạy lại mà không tạo bản sao bài hát. Khi hoàn tất, làm theo mục “Chạy website” ở trên.

## Tài khoản và phân quyền

- Đăng ký tài khoản tại `http://127.0.0.1:8000/register`, đăng nhập tại `/login`, và quản lý hồ sơ tại `/account`.
- Tài khoản mới mặc định là `user`: được nghe nhạc và lưu yêu thích. Danh sách yêu thích được lưu riêng trong MySQL cho từng tài khoản.
- Để cấp quyền admin, hãy đăng ký tài khoản trước. Mở **Terminal mới** trong Laragon (giữ cửa sổ đang chạy website mở), rồi chạy:

   ```cmd
   cd /d "C:\Users\letie\OneDrive\Desktop\doan\laravel-app"
   php artisan melody:make-admin email-cua-ban@example.com
   ```

  Thay email mẫu bằng email tài khoản đã đăng ký; nhập `yes` để xác nhận. Sau đó đăng xuất và đăng nhập lại.
- Admin quản lý bài hát tại mục **Quản lý nhạc** hoặc đường dẫn `/admin/songs`. Backend kiểm tra quyền admin cho các thao tác thêm, sửa, xóa.
- Khi thêm bài hát, admin chọn tệp nhạc trên máy (MP3, WAV, OGG, M4A hoặc AAC, tối đa 50 MB); ảnh bìa JPG, PNG hoặc WEBP (tối đa 5 MB) là tùy chọn. Nếu sửa bài hát mà không chọn tệp mới, tệp hiện tại được giữ nguyên.
- Sau khi cập nhật website lần đầu, tạo liên kết để trình duyệt đọc được tệp đã tải lên bằng lệnh `php artisan storage:link` tại thư mục `laravel-app`. Tệp được lưu trong `laravel-app/storage/app/public`.
- Bài YouTube demo đã có trong thư viện vẫn phát qua trình nhúng chính thức; video chỉ phát được nếu chủ video cho phép nhúng.
- Lời bài hát karaoke do admin nhập trong form bài hát theo định dạng mỗi dòng `[phút:giây]Lời bài hát`, ví dụ `[00:12]Một câu hát`. Melody lưu các mốc thời gian và làm sáng lời đồng bộ khi nhạc chạy. Website không tự lấy lời từ YouTube; chỉ nhập lời bạn có quyền sử dụng.

## Kiểm thử

Trong Terminal tại `laravel-app`, chạy:

```cmd
php artisan test
```
