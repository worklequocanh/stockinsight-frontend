# StockInsight Frontend

Frontend cho hệ thống quản lý hàng hóa và phân tích bán hàng StockInsight.

## Tech Stack
- React 19
- Vite
- React Router DOM
- Axios

## Cấu trúc chính
```text
public/          tài nguyên tĩnh
src/pages/       các trang giao diện
src/components/  component dùng chung
src/services/    API client và auth helper
src/context/     auth state
src/assets/      hình ảnh và icon
```

## Cài đặt môi trường
Tạo file `.env` trong thư mục frontend:
```ini
VITE_API_BASE_URL=http://localhost:3001/api
```

## Chạy project
```bash
npm install
npm run dev
```

Build production:
```bash
npm run build
```

Preview bản build:
```bash
npm run preview
```

## Phase 2 Pages
- `/`
  - landing page
- `/login`
  - form đăng nhập JWT
- `/dashboard`
  - trang protected để test auth và role

## Auth flow
- Frontend lưu access token trong `localStorage`
- Axios tự gắn `Authorization: Bearer <token>`
- Khi vào app, frontend gọi `GET /api/auth/me` để bootstrap user hiện tại

## Demo accounts
- `admin@stockinsight.local` / `admin123`
- `manager@stockinsight.local` / `admin123`
- `employee@stockinsight.local` / `admin123`
