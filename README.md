# GoApps Factory — Repo nguồn

Repo private duy nhất cho toàn bộ 20 sản phẩm của GoApps Factory. Đồng bộ với Google Apps Script qua [`clasp`](https://github.com/google/clasp).

## Cấu trúc

```
docs/                       Tài liệu chuẩn — schema, spec, nghiên cứu thị trường
  DATA_SCHEMA_STANDARD_CLU-01.md
  PRODUCT_SPECS/            Product Spec chi tiết từng sản phẩm
shared-backend-lib/         Thư viện Apps Script dùng chung (Module 3 — CHƯA tách, xem trạng thái bên dưới)
shared-frontend-kit/        Khung UI dùng chung (Module 4 — CHƯA tách)
products/                   Mỗi thư mục con = 1 sản phẩm = 1 Apps Script project riêng
  SP-001-quanlyphong/
```

## Trạng thái Factory OS (6 module)

| Module | Trạng thái |
|---|---|
| 1. Product Spec Standard | Xong — 4 spec cụm CLU-01 trong `docs/PRODUCT_SPECS/` |
| 2. Data Schema Standard | Xong cho CLU-01, xem `docs/DATA_SCHEMA_STANDARD_CLU-01.md` |
| 3. Backend Core Library | **Đang chờ** — sẽ tách từ code SP-001 sau khi build xong (xem `ANTIGRAVITY_BUILD_BRIEF_SP-001.md`) |
| 4. Frontend UI Kit | **Đang chờ** — tách cùng lúc với module 3 |
| 5. QA Checklist | Có trong từng Product Spec, mục 11 |
| 6. Product Registry | Chưa tạo — sẽ tạo sau khi có sản phẩm đầu tiên deploy thành công |

## Quy tắc bắt buộc khi build bất kỳ sản phẩm nào

1. Apps Script Web App deploy với `executeAs: USER_DEPLOYING` (Execute as: Me) — **không bao giờ** dùng "Execute as: User accessing"
2. Khách hàng **không** được cấp quyền Editor/Viewer trực tiếp trên Google Sheet — chỉ nhận URL Web App
3. Toàn bộ logic nghiệp vụ (tính toán, validate, quy tắc) nằm trong file `.gs` (server-side) — không viết trong JS phía client
4. Tên bảng, tên cột, format ID phải khớp chính xác với Data Schema Standard của cụm tương ứng
5. Mỗi hàm trong `.gs` gắn comment `// SHARED:` hoặc `// PRODUCT-SPECIFIC:` để việc tách Module 3/4 sau này không phải đọc lại toàn bộ code

## Cách deploy (dùng clasp)

```bash
npm install -g @google/clasp
clasp login
cd products/SP-001-quanlyphong
clasp create --type webapp --title "goapps-sp001-quanlyphong"
# copy scriptId vừa tạo vào .clasp.json (xem .clasp.json.example)
clasp push
clasp deploy
```
