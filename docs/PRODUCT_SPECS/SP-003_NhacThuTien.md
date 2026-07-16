# Product Spec: Nhắc thu tiền phòng

> Sinh từ khuôn Product Spec Standard (xem `PRODUCT_SPEC_QuanLyPhong_KhachThue.md`). Sản phẩm phụ thuộc dữ liệu vào SP-001 qua `PhongID`/`KhachThueID`, và có thể liên kết với đầu ra của SP-002.

## 0. Metadata

| Trường | Giá trị |
|---|---|
| Mã sản phẩm | SP-003 |
| Cụm thị trường | CLU-01 — Nhà trọ / phòng cho thuê |
| Tên sản phẩm | Nhắc thu tiền phòng |
| Vai trò trong cụm | Sản phẩm phụ thuộc — dùng `PhongID`, `KhachThueID` làm khóa ngoại |
| Phiên bản spec | v1.0 |
| Ngày tạo | 16/07/2026 |

## 1. Tổng quan sản phẩm

**Vấn đề giải quyết:** Chủ nhà không nhớ chính xác phòng nào đã đóng tiền tháng này, phòng nào chưa — dẫn đến quên thu, thất thoát tiền hoặc nhắc nhầm khách đã đóng rồi.

**Giá trị cốt lõi:** Một danh sách rõ ràng mỗi tháng: phòng nào đã đóng đủ, phòng nào còn thiếu, thiếu bao nhiêu — không cần nhớ hay dò lại tin nhắn Zalo.

**Vị trí trong Factory OS:** Đọc `Phong.GiaThue` (SP-001) để tự khởi tạo số tiền phải thu hàng tháng; có thể cộng thêm tiền điện nước từ SP-002 nếu chủ nhà dùng cả hai sản phẩm.

## 2. Đối tượng người dùng & use case

**Khách hàng mục tiêu:** Cùng đối tượng SP-001.

**Use case chính:**
- Đầu tháng cần biết ngay danh sách phòng cần thu tiền
- Khách chuyển khoản/đưa tiền mặt → chủ nhà đánh dấu đã đóng
- Cuối tháng cần biết còn phòng nào chưa đóng đủ để nhắc

## 3. Data model

Dùng bảng `ThanhToan` của Data Schema Standard cụm CLU-01:

| Cột | Kiểu | Ghi chú |
|---|---|---|
| ID | text | Format `TT-0001` |
| PhongID | text | Khóa ngoại → `Phong.ID` |
| KhachThueID | text | Khóa ngoại → `KhachThue.ID` |
| Thang | text | vd `07/2026` |
| SoTienPhaiDong | number | Mặc định = `Phong.GiaThue`, chủ nhà có thể sửa tay (vd cộng thêm tiền điện nước) |
| SoTienDaDong | number | Nhập khi ghi nhận thanh toán |
| ConLai | number (công thức) | `= SoTienPhaiDong - SoTienDaDong` |
| NgayDong | date | Ngày khách thanh toán (có thể để trống nếu chưa đóng) |
| TrangThai | text | `Chưa tới hạn` \| `Trễ hạn` \| `Đã đóng` |
| NgayTao, NgayCapNhat | date | Cột hệ thống |

## 4. Danh sách tính năng

1. Tự động tạo dòng thu tiền đầu mỗi tháng cho tất cả phòng đang có khách (`Phong.TrangThai = Đã thuê`)
2. Ghi nhận số tiền khách đã đóng (có thể đóng nhiều lần/1 tháng, cộng dồn)
3. Tự động tính số tiền còn thiếu
4. Lọc nhanh danh sách phòng chưa đóng đủ tháng hiện tại
5. Xem lịch sử thanh toán theo phòng hoặc theo khách

## 5. User flow chính

**Flow "Đầu tháng":**
1. Vào ngày 1 hàng tháng, hệ thống tự tạo dòng `ThanhToan` mới cho mỗi phòng đang thuê, `SoTienPhaiDong` mặc định lấy từ `Phong.GiaThue`
2. Chủ nhà có thể sửa tay `SoTienPhaiDong` nếu muốn cộng thêm điện nước tháng đó

**Flow "Ghi nhận thanh toán":**
1. Khách đóng tiền (chuyển khoản hoặc tiền mặt)
2. Chủ nhà mở danh sách thu tiền tháng hiện tại, tìm đúng phòng
3. Nhập số tiền vừa nhận vào `SoTienDaDong`
4. Hệ thống tự tính `ConLai`, cập nhật `TrangThai = Đã đóng` nếu `ConLai = 0`

## 6. Danh sách màn hình

| Màn hình | Mục đích | Trường hiển thị | Hành động chính |
|---|---|---|---|
| Danh sách thu tiền tháng hiện tại | Xem toàn bộ trạng thái thu tiền | Tên phòng, khách, SoTienPhaiDong, SoTienDaDong, ConLai, TrangThai | Ghi nhận thanh toán |
| Ghi nhận thanh toán | Nhập số tiền vừa nhận | SoTienDaDong, NgayDong | Lưu |
| Lịch sử theo phòng/khách | Tra cứu quá khứ | Danh sách các tháng đã thu | — |

## 7. Business logic & validation

- `ConLai = SoTienPhaiDong − SoTienDaDong`
- `TrangThai = Đã đóng` khi `ConLai ≤ 0`; `Trễ hạn` khi còn thiếu và đã qua ngày mùng 5; ngược lại `Chưa tới hạn`
- Không tạo trùng dòng `ThanhToan` cho cùng `PhongID` + `Thang`
- Chỉ tự tạo dòng thu tiền cho phòng có `Phong.TrangThai = Đã thuê` tại thời điểm đầu tháng

## 8. Phân quyền

Giống SP-001 — chỉ một vai trò Chủ nhà.

## 9. Out of scope

- Không tích hợp cổng thanh toán online (khách vẫn chuyển khoản/tiền mặt ngoài hệ thống, chủ nhà chỉ ghi nhận lại)
- Không tự động gửi tin nhắn nhắc nợ qua Zalo/SMS ở bản MVP (chỉ hiển thị danh sách để chủ nhà tự nhắn) — điểm mở rộng cho v2
- Không xử lý thanh toán một phần phức tạp (trả góp nhiều đợt trong tháng) ở bản đầu

## 10. Non-functional requirements

Giống SP-001.

## 11. Tiêu chí hoàn thành (Definition of Done)

- [ ] Đầu tháng tự tạo đủ dòng thu tiền cho đúng các phòng đang thuê, không thiếu không thừa
- [ ] Tính đúng `ConLai` và `TrangThai` tương ứng
- [ ] Lọc đúng danh sách "chưa đóng đủ" của tháng hiện tại
- [ ] Không tạo trùng dòng cho cùng phòng + tháng

## 12. Đặt tên & triển khai

| Hạng mục | Giá trị |
|---|---|
| Tên Google Sheet | `[GoApps] CLU-01 - Nha Tro` (dùng chung với SP-001) |
| Tên Apps Script project | `goapps-sp003-nhacthutien` |
| Tên Web App deployment | `goapps-nhatro-thutien-v1` |
| Mã đăng ký Product Registry | SP-003 |
