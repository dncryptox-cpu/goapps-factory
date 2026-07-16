# Build brief cho Antigravity — SP-001: Quản lý phòng & khách thuê

> Copy toàn bộ nội dung file này làm prompt đầu tiên khi mở Antigravity với repo `goapps-factory`. Đây là bản build mẫu — code sinh ra ở đây sẽ được tách thành Backend Core Library + Frontend UI Kit dùng cho 19 sản phẩm còn lại, nên độ rõ ràng ở bước này quan trọng hơn tốc độ.

## Nhiệm vụ

Build hoàn chỉnh sản phẩm SP-001 trong thư mục `products/SP-001-quanlyphong/`, dựa trên:
- Spec đầy đủ: `docs/PRODUCT_SPECS/SP-001_QuanLyPhong_KhachThue.md`
- Schema đầy đủ: `docs/DATA_SCHEMA_STANDARD_CLU-01.md` (chỉ dùng bảng `Phong` và `KhachThue`)
- Khung code đã có sẵn: `products/SP-001-quanlyphong/Code.gs` và `index.html` — đây là bộ khung hàm rỗng, hãy điền logic vào, không đổi tên hàm đã định nghĩa

## Stack bắt buộc

Google Apps Script (server) + Google Sheets (database) + HTML Service (client: HTML/CSS/JS thuần, không React/Vue). Không thêm database hay backend ngoài.

## Quy tắc kỹ thuật bắt buộc — không thương lượng

1. Toàn bộ logic nghiệp vụ, tính toán, validate nằm trong file `.gs` (server). Client-side JS chỉ gọi `google.script.run` và render — không tự tính toán hay tự validate nghiệp vụ ở client.
2. Deploy Web App với `executeAs: USER_DEPLOYING` (đã cấu hình sẵn trong `appsscript.json`) — giữ nguyên, không đổi sang `USER_ACCESSING`.
3. Tên bảng, tên cột, format ID phải khớp **chính xác từng ký tự** với `docs/DATA_SCHEMA_STANDARD_CLU-01.md`. Không tự đổi tên cột cho "gọn" hơn.
4. **Mọi hàm mới viết ra** (server lẫn client) phải có comment mở đầu `// SHARED` (dùng lại được cho sản phẩm khác trong cụm hoặc cụm khác) hoặc `// PRODUCT-SPECIFIC` (chỉ SP-001 dùng). Đây là input trực tiếp cho bước tách Module 3/4 sau — làm sai bước này thì bước sau phải làm lại từ đầu.
5. Không tạo file/thư mục ngoài `products/SP-001-quanlyphong/` trừ khi được yêu cầu.

## Business logic bắt buộc (tóm tắt từ spec, mục 7)

- Thêm khách thuê vào phòng → tự động đổi `Phong.TrangThai = "Đã thuê"`
- Trả phòng → đổi `KhachThue.TrangThai = "Đã trả phòng"` và `Phong.TrangThai = "Trống"`, **không xóa dòng**
- Dropdown chọn phòng khi thêm khách chỉ hiện phòng có `TrangThai = "Trống"`
- SĐT phải đúng định dạng số Việt Nam (10 số, bắt đầu bằng 0)
- ID sinh tự động tăng dần đúng format `PH-000X` / `KH-000X`

## Definition of Done (spec mục 11 — dùng để tự kiểm tra trước khi báo hoàn thành)

- [ ] Thêm/sửa/xóa phòng ghi đúng vào bảng `Phong`
- [ ] Gán khách vào phòng tự động đổi đúng `TrangThai` của phòng
- [ ] Trả phòng cập nhật đúng cả 2 bảng, không xóa dữ liệu lịch sử
- [ ] Dropdown chọn phòng chỉ hiện phòng đang trống
- [ ] Không có lỗi console trên Chrome mobile và desktop
- [ ] Dashboard hiển thị đúng số liệu tổng hợp

## Sau khi build xong — đừng dừng ở đây

Báo cáo lại danh sách các hàm đã đánh dấu `// SHARED` — đây sẽ là input cho bước tiếp theo: tách chúng ra `shared-backend-lib/` và `shared-frontend-kit/` để 19 sản phẩm còn lại dùng chung, không viết lại từ đầu.
