# Kế hoạch Nâng cấp Frontend (UI/UX & Giai đoạn 3)

Kế hoạch này tập trung vào 2 mục tiêu lớn: (1) Nâng tầm giao diện (UI/UX) đạt chuẩn "Premium" và (2) Hoàn thiện các tính năng nâng cao (Giai đoạn 3) của hệ thống StockInsight.

## 1. Mục tiêu nâng cấp UI/UX (Premium Design)
Cải tiến toàn diện giao diện hiện tại để trông hiện đại, sống động và thu hút hơn, áp dụng các best practice trong thiết kế Web:
- **Color Palette & Dark Mode**: Thiết lập hệ thống biến màu sắc mới ưu tiên tông màu hiện đại, tối giản. Tích hợp Dark Mode sang trọng.
- **Glassmorphism**: Thêm các hiệu ứng kính mờ (backdrop-blur, border trong suốt) cho các Card báo cáo, Sidebar và Modal.
- **Typography**: Nâng cấp Font chữ sang các dạng chữ hiện đại (Inter, Outfit).
- **Micro-animations**: Cài đặt thư viện `framer-motion` để xử lý các hiệu ứng chuyển trang (Page Transitions), hiệu ứng hover mượt mà và các pop-up animation.

## 2. Mục tiêu tính năng (Giai đoạn 3 - Tính năng Pro)

### A. Sơ đồ kho trực quan (Visual Map)
- Tạo màn hình `VisualMapPage.jsx`.
- **Mô tả**: Giao diện hiển thị sơ đồ kho dưới dạng một bản đồ 2D (Sử dụng CSS Grid hoặc Canvas).
- **Logic**: Màu sắc của các vị trí kệ/kho sẽ thay đổi dựa vào sức chứa và mật độ hàng hóa (VD: Màu đỏ báo hiệu kệ đầy, xanh lá báo hiệu còn trống).
- **Tương tác**: Click vào từng ô (Vị trí) sẽ hiển thị chi tiết các lô hàng (StockBatch) đang được lưu trữ tại đó.

### B. Biểu đồ Dự báo xu hướng (Forecasting)
- Cập nhật trang `DashboardPage.jsx`.
- **Mô tả**: Tích hợp một biểu đồ dạng đường (Line Chart) dự báo nhu cầu nhập/xuất trong thời gian tới dựa trên dữ liệu lịch sử hoặc hiển thị rõ ràng xu hướng tăng giảm so với chu kỳ trước.
- **UX**: Bổ sung Loading Skeletons ở các biểu đồ để tạo cảm giác mượt mà trong lúc chờ API Backend tải dữ liệu.

## 3. Các bước thực hiện dự kiến
1. **Setup & Config**: Cài đặt `framer-motion`, cấu hình lại `index.css`.
2. **Component Refactoring**: Cập nhật lại cấu trúc UI của Navbar, Sidebar, Layout.
3. **Phase 3 - Visual Map**: Dựng giao diện Sơ đồ kho 2D và kết nối dữ liệu Location từ API.
4. **Phase 3 - Forecasting**: Cập nhật Dashboard, thêm các biểu đồ dự báo.
5. **Testing & Polish**: Kiểm tra độ mượt của các hiệu ứng (60fps), tối ưu hóa re-render và responsive trên Mobile.
