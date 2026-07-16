# Product Spec: Quản lý hợp đồng thuê

> Sinh từ khuôn Product Spec Standard (xem `PRODUCT_SPEC_QuanLyPhong_KhachThue.md`). Sản phẩm phụ thuộc dữ liệu vào SP-001 qua `PhongID`/`KhachThueID`.

## 0. Metadata

| Trường | Giá trị |
|---|---|
| Mã sản phẩm | SP-004 |
| Cụm thị trường | CLU-01 — Nhà trọ / phòng cho thuê |
| Tên sản phẩm | Quản lý hợp đồng thuê |
| Vai trò trong cụm | Sản phẩm phụ thuộc — dùng `PhongID`, `KhachThueID` làm khóa ngoại |
| Phiên bản spec | v1.0 |
| Ngày tạo | 16/07/2026 |

## 1. Tổng quan sản phẩm

**Vấn đề giải quyết:** Hợp đồng giấy dễ thất lạc, chủ nhà thường quên ngày hết hạn hợp đồng và quên hoàn tiền cọc đúng hạn khi khách trả phòng.

**Giá trị cốt lõi:** Lưu tập trung ngày bắt đầu/kết thúc và tiền cọc của từng hợp đồng, chủ động cảnh báo trước khi hết hạn thay vì để chủ nhà tự nhớ.

**Vị trí trong Factory OS:** Liên kết chặt với luồng "trả phòng" của SP-001 — khi SP-001 ghi nhận trả phòng, hợp đồng tương ứng nên được cập nhật đồng bộ (xem mục 7).

## 2. Đối tượng người dùng & use case

**Khách hàng mục tiêu:** Cùng đối tượng SP-001.

**Use case chính:**
- Khi khách vào ở, tạo hợp đồng ghi rõ thời hạn và tiền cọc
- Cần biết trước hợp đồng nào sắp hết hạn để chủ động liên hệ gia hạn hoặc tìm khách mới
- Khi khách trả phòng, cần nhớ hoàn cọc đúng số tiền đã ghi nhận ban đầu

## 3. Data model

Dùng bảng `HopDong` của Data Schema Standard cụm CLU-01:

| Cột | Kiểu | Ghi chú |
|---|---|---|
| ID | text | Format `HD-0001` |
| KhachThueID | text | Khóa ngoại → `KhachThue.ID` |
| PhongID | text | Khóa ngoại → `Phong.ID` |
| NgayBatDau | date | |
| NgayKetThuc | date | |
| TienCoc | number | |
| TrangThai | text | `Hiệu lực` \| `Sắp hết hạn` \| `Đã thanh lý` |
| NgayTao, NgayCapNhat | date | Cột hệ thống |

## 4. Danh sách tính năng

1. Tạo hợp đồng mới, liên kết đúng phòng và khách đang thuê
2. Ghi nhận tiền cọc
3. Tự động cảnh báo hợp đồng còn ≤ 30 ngày là hết hạn
4. Đánh dấu hợp đồng đã thanh lý khi khách trả phòng, ghi nhận đã hoàn cọc
5. Xem lịch sử hợp đồng theo phòng (các khách đã từng thuê phòng đó)

## 5. User flow chính

**Flow "Tạo hợp đồng khi khách vào ở":**
1. Sau khi thêm khách thuê ở SP-001, chủ nhà mở SP-004, tạo hợp đồng mới
2. Chọn khách + phòng (đã có sẵn từ SP-001), nhập ngày bắt đầu, ngày kết thúc, tiền cọc
3. Hệ thống lưu, `TrangThai = Hiệu lực`

**Flow "Cảnh báo sắp hết hạn":**
1. Hệ thống tự quét hàng ngày, nếu `NgayKetThuc − hôm nay ≤ 30 ngày` → `TrangThai = Sắp hết hạn`
2. Chủ nhà thấy danh sách này ngay khi mở Dashboard, chủ động liên hệ khách

**Flow "Thanh lý hợp đồng":**
1. Khi khách trả phòng (thực hiện ở SP-001), chủ nhà mở hợp đồng tương ứng
2. Bấm "Thanh lý hợp đồng" → `TrangThai = Đã thanh lý`, ghi chú ngày hoàn cọc

## 6. Danh sách màn hình

| Màn hình | Mục đích | Trường hiển thị | Hành động chính |
|---|---|---|---|
| Danh sách hợp đồng | Xem toàn bộ, lọc theo trạng thái | Phòng, khách, ngày bắt đầu/kết thúc, tiền cọc, trạng thái | Tạo mới, Thanh lý |
| Sắp hết hạn (lọc nhanh) | Ưu tiên xử lý | Cùng trường trên, chỉ lọc `Sắp hết hạn` | Gia hạn / Thanh lý |
| Chi tiết hợp đồng | Xem đầy đủ 1 hợp đồng | Toàn bộ trường + lịch sử phòng đó | Sửa, Thanh lý |

## 7. Business logic & validation

- `NgayKetThuc` phải sau `NgayBatDau` — chặn nhập nếu sai
- `TrangThai` tự động chuyển `Sắp hết hạn` khi còn ≤ 30 ngày, không cần chủ nhà tự sửa tay
- Khi SP-001 ghi nhận "trả phòng" cho một khách, hợp đồng đang `Hiệu lực`/`Sắp hết hạn` của khách đó tại phòng đó nên được nhắc chuyển `Đã thanh lý` — đây là điểm nối dữ liệu chéo giữa 2 sản phẩm, xử lý ở tầng Backend Core Library dùng chung
- Không cho tạo hợp đồng mới cho phòng đã có hợp đồng `Hiệu lực` (một phòng chỉ có 1 hợp đồng hiệu lực tại một thời điểm)

## 8. Phân quyền

Giống SP-001 — chỉ một vai trò Chủ nhà.

## 9. Out of scope

- Không lưu file scan hợp đồng PDF (cần tích hợp Google Drive, ngoài phạm vi thuần Sheets của bản MVP)
- Không tự sinh hợp đồng mẫu để in
- Không quản lý phụ lục/điều khoản chi tiết của hợp đồng — chỉ các trường số hóa cốt lõi (ngày, tiền cọc)

## 10. Non-functional requirements

Giống SP-001.

## 11. Tiêu chí hoàn thành (Definition of Done)

- [ ] Tạo hợp đồng đúng liên kết Phòng + Khách, không cho trùng hợp đồng hiệu lực trên cùng 1 phòng
- [ ] Tự động chuyển `Sắp hết hạn` đúng ngưỡng 30 ngày
- [ ] Thanh lý hợp đồng cập nhật đúng trạng thái, không xóa dữ liệu lịch sử
- [ ] Validation `NgayKetThuc > NgayBatDau` hoạt động đúng

## 12. Đặt tên & triển khai

| Hạng mục | Giá trị |
|---|---|
| Tên Google Sheet | `[GoApps] CLU-01 - Nha Tro` (dùng chung với SP-001) |
| Tên Apps Script project | `goapps-sp004-quanlyhopdong` |
| Tên Web App deployment | `goapps-nhatro-hopdong-v1` |
| Mã đăng ký Product Registry | SP-004 |
