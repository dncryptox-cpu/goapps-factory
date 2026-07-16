# Data Schema Standard — CLU-01: Nhà trọ / phòng cho thuê

## Quy ước chung (áp dụng mọi cụm thị trường)

- Mỗi bảng (tab Sheet) đặt tên bằng danh từ số ít, không dấu, viết liền: `Phong`, `KhachThue`, `GiaoDich`...
- Mọi ID theo format `{2-3 ký tự viết tắt entity}-{số thứ tự 4 chữ số}`, ví dụ `PH-0001`, `KH-0001`
- Mọi bảng có 3 cột hệ thống bắt buộc ở cuối: `NgayTao`, `NgayCapNhat`, `TrangThai`
- Cột khóa ngoại (tham chiếu bảng khác) luôn đặt tên `{TenEntity}ID`, ví dụ `PhongID`, `KhachHangID`

## Bảng dữ liệu cụm CLU-01

### `Phong` — sở hữu bởi SP-001

| Cột | Kiểu | Ghi chú |
|---|---|---|
| ID | text | `PH-0001` |
| TenPhong | text | |
| GiaThue | number | VNĐ/tháng |
| TrangThai | text | `Trống` \| `Đã thuê` |
| NgayTao, NgayCapNhat | date | |

### `KhachThue` — sở hữu bởi SP-001

| Cột | Kiểu | Ghi chú |
|---|---|---|
| ID | text | `KH-0001` |
| HoTen | text | |
| SDT | text | |
| PhongID | text | FK → `Phong.ID` |
| NgayVaoO | date | |
| TrangThai | text | `Đang thuê` \| `Đã trả phòng` |
| NgayTao, NgayCapNhat | date | |

### `HopDong` — sở hữu bởi SP-004

| Cột | Kiểu | Ghi chú |
|---|---|---|
| ID | text | `HD-0001` |
| KhachThueID | text | FK → `KhachThue.ID` |
| PhongID | text | FK → `Phong.ID` |
| NgayBatDau, NgayKetThuc | date | |
| TienCoc | number | |
| TrangThai | text | `Hiệu lực` \| `Sắp hết hạn` \| `Đã thanh lý` |
| NgayTao, NgayCapNhat | date | |

### `ChiSoDienNuoc` — sở hữu bởi SP-002

| Cột | Kiểu | Ghi chú |
|---|---|---|
| ID | text | `DN-0001` |
| PhongID | text | FK → `Phong.ID` |
| Thang | text | `07/2026` |
| ChiSoDienCu, ChiSoDienMoi | number | |
| SoDienTieuThu | number (công thức) | `= ChiSoDienMoi - ChiSoDienCu` |
| ChiSoNuocCu, ChiSoNuocMoi | number | |
| SoNuocTieuThu | number (công thức) | `= ChiSoNuocMoi - ChiSoNuocCu` |
| TienDien, TienNuoc | number (công thức) | `= tiêu thụ × đơn giá` (đọc từ `CauHinhGia`) |
| NgayTao, NgayCapNhat | date | |

### `CauHinhGia` — bảng cấu hình phụ, dùng bởi SP-002

| Cột | Kiểu | Ghi chú |
|---|---|---|
| ID | text | Cố định `CH-0001` |
| DonGiaDien, DonGiaNuoc | number | VNĐ/số |
| NgayCapNhat | date | |

### `ThanhToan` — sở hữu bởi SP-003

| Cột | Kiểu | Ghi chú |
|---|---|---|
| ID | text | `TT-0001` |
| PhongID | text | FK → `Phong.ID` |
| KhachThueID | text | FK → `KhachThue.ID` |
| Thang | text | |
| SoTienPhaiDong, SoTienDaDong | number | |
| ConLai | number (công thức) | `= SoTienPhaiDong - SoTienDaDong` |
| NgayDong | date | |
| TrangThai | text | `Chưa tới hạn` \| `Trễ hạn` \| `Đã đóng` |
| NgayTao, NgayCapNhat | date | |

## Sản phẩm gốc vs phụ thuộc trong cụm

`Phong` + `KhachThue` là dữ liệu gốc (sở hữu bởi SP-001). 3 sản phẩm còn lại (SP-002, SP-003, SP-004) chỉ đọc/ghi thêm bảng riêng của mình, tham chiếu `PhongID`/`KhachThueID` — không được tạo lại 2 bảng gốc này.
