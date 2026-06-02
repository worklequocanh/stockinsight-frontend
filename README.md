# StockInsight Frontend

Giao diện người dùng cho hệ thống quản lý hàng hóa và phân tích bán hàng StockInsight, được xây dựng bằng React và Vite.

## Công nghệ sử dụng
- **Bundler**: Vite
- **UI Library**: React (v19)
- **Routing**: React Router DOM (v7)
- **HTTP Client**: Axios

## Cấu trúc thư mục chính
```text
├── public/             # Tài nguyên tĩnh công cộng (icons, v.v.)
├── src/
│   ├── assets/         # Hình ảnh, stylesheets
│   ├── components/     # Các React component dùng chung
│   ├── pages/          # Các trang giao diện (Landing, Login, v.v.)
│   ├── services/       # Cấu hình API client kết nối Backend
│   ├── App.jsx         # Component gốc định tuyến
│   ├── main.jsx        # Entry point của ứng dụng React
│   └── index.css       # File CSS chính
```

## Yêu cầu môi trường
Tạo file `.env` ở thư mục gốc dự án dựa trên file `.env.example`:
```ini
VITE_API_BASE_URL=http://localhost:3001/api
```

## Cài đặt và Khởi chạy

1. **Cài đặt các gói phụ thuộc**:
   ```bash
   npm install
   ```

2. **Khởi chạy ứng dụng**:
   - Ở chế độ Development:
     ```bash
     npm run dev
     ```
   - Chạy thử bản Build (Preview):
     ```bash
     npm run preview
     ```

3. **Build cho Production**:
   ```bash
   npm run build
   ```
