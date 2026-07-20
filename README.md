# StockInsight

Hệ thống quản lý kho hàng - Đồ án thực tập (Giai đoạn 1 - 7)

## Các giai đoạn đã hoàn thành

- **Phase 1 & 2**: Khởi tạo dự án, thiết lập CSDL (Prisma + PostgreSQL), JWT Authentication, CRUD cơ bản.
- **Phase 3**: Quản lý Nhập kho (Import) & Xuất kho (Export) với phương pháp FEFO (First Expired First Out).
- **Phase 4**: Cải thiện giao diện với bố cục Dashboard chuẩn (Sidebar, Tabs), chia nhỏ component, tăng trải nghiệm người dùng (UX/UI).
- **Phase 5**: Bản địa hóa (Localization) toàn bộ ứng dụng sang Tiếng Việt.
- **Phase 6**: Tồn kho, cảnh báo và Dashboard trực quan (Chart.js).
- **Phase 7**: Kiểm thử, Tối ưu và Deploy (Hoàn thiện toàn bộ).
  - Viết tài liệu Kịch bản kiểm thử (Test Cases).
  - Hoàn thiện dữ liệu Demo phong phú (6 tháng giao dịch).
  - Cấu hình file triển khai tự động (Render, Vercel).

## Hướng dẫn Triển khai (Deploy lên Production)

Dự án được cấu hình sẵn để triển khai dễ dàng lên **Fly.io** (cho cả Backend và Frontend) hoặc kết hợp **Fly.io (Backend) + Vercel (Frontend)**.

### 1. Triển khai Frontend lên Fly.io (Docker Nginx Container)
Dự án đã tích hợp sẵn `Dockerfile` multi-stage, `nginx.conf` (hỗ trợ React Router SPA, nén Gzip) và `fly.toml` giúp chạy trực tiếp trên Fly.io:
1. Mở terminal tại `stockinsight-frontend` và gõ:
   ```bash
   fly launch --no-deploy
   ```
2. Triển khai và truyền URL API của Backend đã deploy trên Fly.io vào build-arg:
   ```bash
   fly deploy --build-arg VITE_API_BASE_URL="https://stockinsight-backend.fly.dev/api"
   ```

### 2. Triển khai Frontend lên Vercel.com (Khuyên dùng cho Frontend tĩnh)
1. Đăng ký tài khoản tại [Vercel](https://vercel.com).
2. Chọn **Add New Project**, liên kết với Repository Github `stockinsight-frontend`.
3. Vercel tự động nhận diện preset **Vite**.
4. Mở phần **Environment Variables**, thêm biến:
   - `VITE_API_BASE_URL`: Điền URL của Backend đã deploy trên Fly.io (ví dụ: `https://stockinsight-backend.fly.dev/api`).
5. Bấm **Deploy**. Vercel tự động đọc file `vercel.json` để xử lý React Router SPA rewrite.

---

## Cài đặt và Chạy ứng dụng (Local)

### Yêu cầu
- Node.js
- PostgreSQL
- WSL (Dành cho Windows)

### 1. Cài đặt Backend
```bash
cd stockinsight-backend
npm install
# Tạo file .env và cấu hình DATABASE_URL (Ví dụ: postgresql://user:pass@localhost:5432/stockinsight)
npx prisma migrate dev
npm run prisma:seed # Nạp dữ liệu mẫu
npm run dev
```

### 2. Cài đặt Frontend
```bash
cd stockinsight-frontend
npm install
# Tạo file .env và thiết lập VITE_API_URL=http://localhost:3001/api
npm run dev
```

### 3. Tài khoản Demo
- **Admin**: `admin@stockinsight.local` / `admin123`
- **Manager**: `manager@stockinsight.local` / `admin123`
- **Employee**: `employee@stockinsight.local` / `admin123`
