# Kế hoạch phát triển các tính năng nâng cao cho StockInsight (WMS)

Dự án sẽ được triển khai theo 3 giai đoạn (tương ứng với 3 mức độ). Mỗi giai đoạn sẽ bao gồm cả Backend, Frontend và khâu Testing. Chúng ta sẽ hoàn thiện dứt điểm từng mức độ trước khi chuyển sang mức độ tiếp theo.

## Giai đoạn 1: Mức độ 1 - Các tính năng thiết yếu (Dashboard, Alerts, Export)

### 1. Dashboard Thống kê & Báo cáo (Analytics)
- **Backend (`stockinsight-backend`)**:
  - `[NEW]` Tạo `src/controllers/reportController.js` với các API:
    - `GET /api/reports/overview`: Thống kê tổng quan (tổng sp, tổng lô hàng, tổng giá trị kho).
    - `GET /api/reports/recent-activities`: Lấy các giao dịch nhập/xuất gần nhất.
    - `GET /api/reports/low-stock`: Lấy danh sách sản phẩm sắp hết hàng.
  - `[MODIFY]` `src/routes/index.js`: Thêm route `/api/reports`.
- **Frontend (`stockinsight-frontend`)**:
  - `[NEW]` Cài đặt thư viện `recharts` hoặc `chart.js`.
  - `[MODIFY]` `src/pages/DashboardPage.jsx`: Gọi API và vẽ biểu đồ trực quan, hiển thị các thẻ (cards) thống kê.

### 2. Cảnh báo hàng tồn & Hết hạn (Inventory Alerts)
- **Backend (`stockinsight-backend`)**:
  - `[NEW]` Cài đặt `node-cron`.
  - `[NEW]` Tạo `src/jobs/inventoryCron.js`: Job chạy định kỳ để quét `StockBatch` sắp hết hạn (< 30 ngày) và `Product` có số lượng dưới mức tối thiểu.
  - `[NEW]` Schema/Model `Notification` (tuỳ chọn) hoặc tạo API `GET /api/notifications` báo cáo trực tiếp từ query.
- **Frontend (`stockinsight-frontend`)**:
  - `[NEW]` Tạo component `NotificationBell.jsx` trên Navbar.
  - `[MODIFY]` Hiển thị danh sách cảnh báo màu đỏ/vàng trên UI.

### 3. Xuất báo cáo ra Excel
- **Backend (`stockinsight-backend`)**:
  - `[NEW]` Cài đặt thư viện `exceljs`.
  - `[MODIFY]` `reportController.js`: Thêm API `GET /api/reports/export-excel` để tải file Excel tồn kho/nhập xuất.
- **Frontend (`stockinsight-frontend`)**:
  - `[MODIFY]` Các trang danh sách (Products, Inventory) thêm nút "Xuất Excel" và xử lý tải file (Blob).

---

## Giai đoạn 2: Mức độ 2 - Tính năng nâng cao (Barcode/QR, Socket.io, Internal Transfer)

### 4. Quét Mã Vạch / QR Code
- **Backend**:
  - `[NEW]` Cài đặt `qrcode`.
  - `[MODIFY]` API lấy chi tiết sản phẩm / lô hàng trả về thêm chuỗi Base64 của QR code (chứa mã `sku` hoặc `batchCode`).
- **Frontend**:
  - `[NEW]` Cài đặt thư viện `html5-qrcode` hoặc `react-qr-reader`.
  - `[NEW]` Modal quét QR Code trên di động để tự động điền form Nhập/Xuất hàng.

### 5. Cập nhật thời gian thực (Real-time Socket.io)
- **Backend**:
  - `[NEW]` Cài đặt `socket.io`.
  - `[MODIFY]` Tích hợp Socket.io vào file `server.js`.
  - `[MODIFY]` Bắn sự kiện (emit) khi có đơn nhập/xuất mới được duyệt.
- **Frontend**:
  - `[NEW]` Cài đặt `socket.io-client`.
  - `[MODIFY]` Bắt sự kiện trên Dashboard để cập nhật số liệu ngay lập tức mà không cần reload trang.

### 6. Chuyển kho / Điều chuyển nội bộ (Internal Transfer)
- **Backend**:
  - `[MODIFY]` `prisma/schema.prisma`: Thêm model `InternalTransfer` (từ location A sang location B).
  - `[NEW]` Tạo `transferController.js` xử lý logic trừ số lượng ở lô cũ, tạo/cộng số lượng ở lô mới tại location mới.
- **Frontend**:
  - `[NEW]` Tạo trang `TransfersPage.jsx` để thực hiện lệnh chuyển vị trí hàng hóa trong kho.

---

## Giai đoạn 3: Mức độ 3 - Tính năng Pro (Visual Map, Forecasting)

*(Chi tiết Giai đoạn 3 sẽ được làm rõ sau khi hoàn thành Giai đoạn 2)*
