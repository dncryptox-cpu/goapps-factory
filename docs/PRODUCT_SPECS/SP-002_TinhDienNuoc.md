# Product Spec: Tính điện nước theo phòng

> Sinh từ khuôn Product Spec Standard (xem `PRODUCT_SPEC_QuanLyPhong_KhachThue.md`). Sản phẩm phụ thuộc dữ liệu vào SP-001 qua khóa ngoại `PhongID`.

## 0. Metadata

| Trường | Giá trị |
|---|---|
| Mã sản phẩm | SP-002 |
| Cụm thị trường | CLU-01 — Nhà trọ / phòng cho thuê |
| Tên sản phẩm | Tính điện nước theo phòng |
| Vai trò trong cụm | Sản phẩm phụ thuộc — dùng `Phong.ID` làm khóa ngoại, không sở hữu dữ liệu gốc |
| Phiên bản spec | v1.0 |
| Ngày tạo | 16/07/2026 |

## 1. Tổng quan sản phẩm

**Vấn đề giải quyết:** Chủ nhà mỗi tháng phải tự cầm máy tính bấm tay tiền điện nước từng phòng từ chỉ số công tơ — mất thời gian và dễ tính sai, đặc biệt khi có 10+ phòng.

**Giá trị cốt lõi:** Chỉ cần nhập chỉ số công tơ mới, hệ thống tự tính số tiêu thụ và số tiền phải thu — không cần bấm máy tính tay.

**Vị trí trong Factory OS:** Đầu ra của sản phẩm này (số tiền điện nước) là input cho SP-003 (Nhắc thu tiền phòng).

## 2. Đối tượng người dùng & use case

**Khách hàng mục tiêu:** Cùng đối tượng SP-001 — chủ nhà trọ quản lý 5–50 phòng.

**Use case chính:**
- Đầu tháng, đi ghi chỉ số công tơ từng phòng rồi nhập vào hệ thống
- Cần biết ngay phòng nào tiêu thụ điện nước bất thường (nghi ngờ rò rỉ, dùng chung không kiểm soát)
- Cần xem lại lịch sử tiêu thụ của 1 phòng qua các tháng

## 3. Data model

Dùng bảng `ChiSoDienNuoc` của Data Schema Standard cụm CLU-01, cộng thêm 1 bảng cấu hình nhỏ (bổ sung so với schema gốc, cần thiết riêng cho sản phẩm này):

**Bảng `ChiSoDienNuoc`**
| Cột | Kiểu | Ghi chú |
|---|---|---|
| ID | text | Format `DN-0001` |
| PhongID | text | Khóa ngoại → `Phong.ID` (từ SP-001) |
| Thang | text | vd `07/2026` |
| ChiSoDienCu / ChiSoDienMoi | number | Nhập tay, tự lấy `ChiSoDienCu` = `ChiSoDienMoi` của tháng trước |
| SoDienTieuThu | number (công thức) | `= ChiSoDienMoi - ChiSoDienCu` |
| ChiSoNuocCu / ChiSoNuocMoi | number | Tương tự điện |
| SoNuocTieuThu | number (công thức) | `= ChiSoNuocMoi - ChiSoNuocCu` |
| TienDien / TienNuoc | number (công thức) | `= SoTieuThu × DonGia` (lấy từ `CauHinhGia`) |
| NgayTao, NgayCapNhat | date | Cột hệ thống |

**Bảng `CauHinhGia`** *(bảng bổ sung riêng của sản phẩm này)*
| Cột | Kiểu | Ghi chú |
|---|---|---|
| ID | text | Cố định `CH-0001` (1 dòng cấu hình duy nhất ở MVP) |
| DonGiaDien | number | VNĐ/số điện |
| DonGiaNuoc | number | VNĐ/số nước |
| NgayCapNhat | date | |

## 4. Danh sách tính năng

1. Nhập chỉ số điện, nước theo phòng theo tháng (dạng bảng nhập nhanh cho toàn bộ phòng cùng lúc)
2. Tự động tính số điện/nước tiêu thụ
3. Tự động tính tiền điện, tiền nước theo đơn giá đang cấu hình
4. Cấu hình/đổi đơn giá điện, nước
5. Xem lịch sử chỉ số & tiền điện nước theo phòng qua các tháng
6. Tự động điền `ChiSoCu` = `ChiSoMoi` của tháng liền trước (giảm nhập liệu, tránh sai số)

## 5. User flow chính

**Flow "Nhập chỉ số đầu tháng":**
1. Chủ nhà mở màn hình Nhập chỉ số, chọn tháng hiện tại
2. Với mỗi phòng, `ChiSoDienCu`/`ChiSoNuocCu` đã tự điền sẵn từ tháng trước
3. Chủ nhà chỉ cần nhập `ChiSoDienMoi`/`ChiSoNuocMoi` cho từng phòng
4. Hệ thống tự tính tiêu thụ và tiền, hiển thị ngay để kiểm tra trước khi lưu

## 6. Danh sách màn hình

| Màn hình | Mục đích | Trường hiển thị | Hành động chính |
|---|---|---|---|
| Nhập chỉ số theo tháng | Nhập nhanh cho tất cả phòng | Tên phòng, chỉ số cũ (khóa), chỉ số mới (nhập), tiêu thụ & tiền (tự tính) | Lưu toàn bộ |
| Lịch sử theo phòng | Tra cứu 1 phòng qua các tháng | Thang, tiêu thụ, tiền điện nước từng tháng | — |
| Cấu hình đơn giá | Đổi đơn giá điện/nước | DonGiaDien, DonGiaNuoc | Lưu |

## 7. Business logic & validation

- `ChiSoMoi` phải ≥ `ChiSoCu` — chặn nhập nếu nhỏ hơn (báo lỗi rõ ràng, tránh nhầm số)
- `ChiSoCu` của tháng hiện tại tự động lấy từ `ChiSoMoi` của bản ghi `ChiSoDienNuoc` gần nhất cùng `PhongID`
- Không cho nhập trùng `PhongID` + `Thang` (mỗi phòng chỉ có 1 dòng chỉ số/tháng)
- Đơn giá áp dụng là đơn giá đang cấu hình tại thời điểm nhập (không hồi tố khi đổi giá sau này)

## 8. Phân quyền

Giống SP-001 — chỉ một vai trò Chủ nhà, toàn quyền đọc/ghi.

## 9. Out of scope

- Không tự động thu tiền hay nhắc thanh toán (thuộc SP-003)
- Không cảnh báo tiêu thụ bất thường bằng AI/thống kê (có thể là tính năng v2)
- Không hỗ trợ nhiều đồng hồ điện/nước phụ trong 1 phòng

## 10. Non-functional requirements

Giống SP-001 (Google Sheets làm database duy nhất, Apps Script Web App, mobile-first, dùng lại Backend Core Library).

## 11. Tiêu chí hoàn thành (Definition of Done)

- [ ] Không cho lưu nếu `ChiSoMoi < ChiSoCu`
- [ ] `ChiSoCu` tự động điền đúng từ tháng trước
- [ ] Tính đúng `SoDienTieuThu`, `SoNuocTieuThu`, `TienDien`, `TienNuoc` theo công thức
- [ ] Đổi đơn giá trong Cấu hình áp dụng đúng cho lần nhập tiếp theo, không ảnh hưởng dữ liệu tháng cũ

## 12. Đặt tên & triển khai

| Hạng mục | Giá trị |
|---|---|
| Tên Google Sheet | `[GoApps] CLU-01 - Nha Tro` (dùng chung với SP-001) |
| Tên Apps Script project | `goapps-sp002-tinhdiennuoc` |
| Tên Web App deployment | `goapps-nhatro-diennuoc-v1` |
| Mã đăng ký Product Registry | SP-002 |
