# Product Spec: Quản lý phòng & khách thuê

> Đây là bản spec đầu tiên trong 20 sản phẩm của GoApps Factory — đồng thời là **khuôn mẫu Product Spec Standard**. Cấu trúc 12 mục dưới đây giữ nguyên cho mọi sản phẩm; chỉ nội dung bên trong thay đổi. Ghi chú "*[khuôn]*" đánh dấu phần mang tính cấu trúc, không đổi giữa các sản phẩm.

---

## 0. Metadata *[khuôn]*

| Trường | Giá trị |
|---|---|
| Mã sản phẩm | SP-001 |
| Cụm thị trường | CLU-01 — Nhà trọ / phòng cho thuê |
| Tên sản phẩm | Quản lý phòng & khách thuê |
| Vai trò trong cụm | Sản phẩm gốc — sở hữu bảng dữ liệu `Phong`, `KhachThue` mà 3 sản phẩm còn lại trong cụm phụ thuộc vào |
| Phiên bản spec | v1.0 |
| Ngày tạo | 16/07/2026 |

## 1. Tổng quan sản phẩm

**Vấn đề giải quyết:** Chủ nhà trọ quản lý 5–50 phòng bằng sổ tay hoặc Excel rời rạc, không biết ngay phòng nào trống, khách nào đang ở phòng nào, dễ nhầm lẫn khi có khách mới hoặc khách trả phòng.

**Giá trị cốt lõi:** Một nơi duy nhất trả lời được ngay hai câu hỏi: "phòng nào còn trống?" và "ai đang ở phòng nào?" — thay thế sổ tay/Excel rời rạc.

**Vị trí trong Factory OS:** Đây là sản phẩm nền của cụm Nhà trọ. 3 sản phẩm còn lại (Tính điện nước, Nhắc thu tiền, Quản lý hợp đồng) đều đọc dữ liệu `PhongID` và `KhachThueID` được tạo ra từ sản phẩm này.

## 2. Đối tượng người dùng & use case

**Khách hàng mục tiêu:** Chủ nhà trọ/chung cư mini quản lý 5–50 phòng, tự vận hành, không có nhân sự IT.

**Use case chính:**
- Khách mới đến thuê → thêm khách thuê, gán vào phòng trống
- Khách trả phòng → cập nhật trạng thái, phòng trở lại trạng thái trống
- Đầu tháng cần biết còn bao nhiêu phòng trống để đăng tin cho thuê
- Cần tra cứu nhanh "khách ở phòng 203 là ai, SĐT bao nhiêu"

**Ngoài phạm vi người dùng:** Không phục vụ khách thuê (khách thuê không có tài khoản đăng nhập ở bản MVP này).

## 3. Data model

Dùng chung Data Schema Standard của cụm CLU-01, chỉ khai thác 2 bảng:

**Bảng `Phong`**
| Cột | Kiểu | Ghi chú |
|---|---|---|
| ID | text | Format `PH-0001` |
| TenPhong | text | vd "Phòng 101" |
| GiaThue | number | VNĐ/tháng |
| TrangThai | text | `Trống` \| `Đã thuê` |
| NgayTao, NgayCapNhat | date | Cột hệ thống |

**Bảng `KhachThue`**
| Cột | Kiểu | Ghi chú |
|---|---|---|
| ID | text | Format `KH-0001` |
| HoTen | text | |
| SDT | text | |
| PhongID | text | Khóa ngoại → `Phong.ID` |
| NgayVaoO | date | |
| TrangThai | text | `Đang thuê` \| `Đã trả phòng` (soft-delete, không xóa dòng) |
| NgayTao, NgayCapNhat | date | Cột hệ thống |

## 4. Danh sách tính năng

1. Thêm / sửa / xóa phòng
2. Xem danh sách phòng, lọc theo trạng thái (trống / đã thuê)
3. Thêm khách thuê mới, gán vào một phòng đang trống
4. Sửa thông tin khách thuê (tên, SĐT)
5. Trả phòng (chuyển khách sang "Đã trả phòng", phòng về "Trống")
6. Tìm kiếm khách theo tên hoặc SĐT
7. Dashboard tổng quan: tổng số phòng, số phòng trống, số phòng đã thuê

## 5. User flow chính

**Flow "Thêm khách mới vào phòng":**
1. Chủ nhà mở màn hình Danh sách phòng, thấy phòng còn trống
2. Bấm "Thêm khách" trên dòng phòng đó
3. Nhập họ tên, SĐT, ngày vào ở → Lưu
4. Hệ thống tự tạo dòng mới trong `KhachThue`, gán `PhongID`, đồng thời tự cập nhật `Phong.TrangThai = Đã thuê`

**Flow "Trả phòng":**
1. Vào Chi tiết phòng → thấy khách đang ở
2. Bấm "Trả phòng"
3. Hệ thống cập nhật `KhachThue.TrangThai = Đã trả phòng`, `Phong.TrangThai = Trống`
4. Dòng khách cũ được giữ lại (không xóa) để tra lịch sử

## 6. Danh sách màn hình

| Màn hình | Mục đích | Trường hiển thị | Hành động chính |
|---|---|---|---|
| Dashboard | Tổng quan nhanh | Tổng phòng, số trống, số đã thuê | — |
| Danh sách phòng | Xem & quản lý toàn bộ phòng | TenPhong, GiaThue, TrangThai, Khách hiện tại | Thêm phòng, Sửa, Thêm khách |
| Chi tiết phòng | Xem sâu 1 phòng | Thông tin phòng + khách hiện tại + lịch sử khách cũ | Trả phòng, Sửa khách |
| Danh sách khách thuê | Tra cứu toàn bộ khách | HoTen, SDT, Phòng đang ở, TrangThai | Tìm kiếm, Sửa |
| Thêm/sửa khách | Nhập liệu khách mới | HoTen, SDT, PhongID (dropdown chỉ hiện phòng trống), NgayVaoO | Lưu |

## 7. Business logic & validation

- Không cho gán khách vào phòng có `TrangThai = Đã thuê` (dropdown chỉ liệt kê phòng trống)
- Khi thêm khách thành công → tự động đổi `Phong.TrangThai` tương ứng, không cần chủ nhà tự sửa tay
- Khi trả phòng → không xóa dòng `KhachThue`, chỉ đổi `TrangThai`, để giữ lịch sử thuê phòng
- SĐT bắt buộc đúng định dạng số điện thoại VN (10 số, bắt đầu bằng 0)
- ID sinh tự động tăng dần theo đúng format chuẩn của Data Schema Standard

## 8. Phân quyền

MVP chỉ có một vai trò duy nhất: **Chủ nhà** (toàn quyền đọc/ghi). Không phân quyền nhiều cấp ở bản đầu — nếu về sau chủ nhà thuê thêm người quản lý, đây sẽ là điểm mở rộng cho bản v2, không phải việc của bản MVP.

## 9. Out of scope (không làm ở bản MVP này)

- Không tính điện nước (thuộc sản phẩm riêng: Tính điện nước theo phòng)
- Không nhắc/thu tiền thuê hàng tháng (thuộc sản phẩm riêng: Nhắc thu tiền phòng)
- Không lưu file hợp đồng PDF (thuộc sản phẩm riêng: Quản lý hợp đồng)
- Không hỗ trợ nhiều nhà trọ/chi nhánh trong cùng 1 tài khoản
- Không có ứng dụng di động riêng — chỉ web responsive

## 10. Non-functional requirements *[khuôn — áp dụng mọi sản phẩm dùng Sheets]*

- Google Sheets là database duy nhất, không dùng thêm DB ngoài
- Backend triển khai qua Apps Script Web App (`doGet`/`doPost` trả JSON), dùng lại Backend Core Library của Factory OS
- Không cần xử lý concurrent-write phức tạp — đối tượng dùng chỉ 1–2 người thao tác cùng lúc
- Giao diện ưu tiên mobile-first vì chủ nhà trọ thường thao tác trên điện thoại
- Tốc độ tải trang chấp nhận được với dữ liệu tối đa ~200 phòng / ~500 khách (đủ cho quy mô SME)

## 11. Tiêu chí hoàn thành (Definition of Done) *[khuôn — đối chiếu QA checklist Module 5]*

- [ ] Thêm/sửa/xóa phòng ghi đúng vào bảng `Phong`
- [ ] Gán khách vào phòng tự động đổi đúng `TrangThai` của phòng
- [ ] Trả phòng cập nhật đúng cả 2 bảng, không xóa dữ liệu lịch sử
- [ ] Dropdown chọn phòng chỉ hiện phòng đang trống
- [ ] Không có lỗi console khi thao tác trên Chrome mobile và desktop
- [ ] Dashboard hiển thị đúng số liệu tổng hợp theo thời gian thực

## 12. Đặt tên & triển khai *[khuôn — theo Naming Convention Module 6]*

| Hạng mục | Giá trị |
|---|---|
| Tên Google Sheet | `[GoApps] CLU-01 - Nha Tro` |
| Tên Apps Script project | `goapps-sp001-quanlyphong` |
| Tên Web App deployment | `goapps-nhatro-phong-v1` |
| Mã đăng ký Product Registry | SP-001 |

---

## Cách dùng file này làm khuôn cho 19 sản phẩm còn lại

Khi cần viết spec cho sản phẩm tiếp theo, đưa AI 3 thông tin sau, AI sẽ điền lại đúng 12 mục trên:

1. Tên sản phẩm + mã cụm thị trường (vd: SP-002, CLU-01, "Tính điện nước theo phòng")
2. Bảng dữ liệu liên quan trong Data Schema Standard của cụm đó (vd: `ChiSoDienNuoc`, có tham chiếu `PhongID`)
3. Sản phẩm này có phải "sản phẩm gốc" của cụm hay không — nếu không, mục 2 (Data model) chỉ cần liệt kê bảng nó dùng, không cần định nghĩa lại bảng gốc

Mọi mục còn lại (0, 10, 11, 12) gần như giữ nguyên cấu trúc, chỉ thay giá trị cụ thể.
