# Phân tích Chi tiết Dự án StockInsight Frontend

Dưới đây là tài liệu phân tích chi tiết về kiến trúc, cấu trúc thư mục, các công nghệ sử dụng, và các tính năng giao diện cốt lõi của ứng dụng StockInsight Frontend.

---

## 1. Tổng quan Dự án (Project Overview)
* **Tên dự án:** StockInsight Frontend
* **Vai trò:** Cung cấp giao diện Web Single Page Application (SPA) trực quan, tương tác cao, giúp thủ kho, nhân viên và người quản lý điều hành mọi hoạt động của kho hàng theo thời gian thực.
* **Ngôn ngữ thiết kế:** Hiện đại, tối giản, bản địa hóa hoàn toàn bằng **Tiếng Việt**, tập trung vào trải nghiệm người dùng (UX) và khả năng phản hồi nhanh (Responsive).

---

## 2. Công nghệ Sử dụng (Tech Stack)
* **Thư viện chính:** React (v19)
* **Build Tool:** Vite (v8) - Cung cấp hiệu năng phát triển cực nhanh với cơ chế Hot Module Replacement (HMR).
* **Định tuyến (Routing):** React Router DOM (v7) hỗ trợ định tuyến phân lớp (Nested Routes) và bảo vệ tuyến đường (Protected Routes).
* **Giao tiếp API:** Axios (v1.16+) để gửi yêu cầu HTTP và tích hợp Interceptor quản lý token tự động.
* **Trực quan hóa dữ liệu (Data Visualization):** Chart.js phối hợp với `react-chartjs-2` để vẽ các biểu đồ phân tích trực quan.
* **Styling (CSS):** Sử dụng Vanilla CSS thuần túy được tổ chức khoa học thành các module chuyên biệt:
  * `index.css`: Định nghĩa CSS reset, hệ màu CSS variables chung.
  * `landing.css`: Thiết kế giao diện giới thiệu sản phẩm.
  * `auth.css`: Thiết kế biểu mẫu đăng nhập và xác thực.
  * `management.css`: Bộ quy tắc giao diện quản trị (Sidebar, Bảng dữ liệu, Nút bấm, Modal, Dashboard Panels).

---

## 3. Cấu trúc Thư mục (Directory Structure)
Cấu trúc mã nguồn được phân chia theo từng nhóm vai trò cụ thể để dễ dàng quản lý và mở rộng:

```
stockinsight-frontend/
├── docs/
│   ├── TEST_CASES.md        # Kịch bản kiểm thử phía giao diện
│   └── project-analysis.md  # File phân tích này
├── public/                  # Các tài nguyên tĩnh (logo, favicon)
├── src/
│   ├── assets/              # Hình ảnh phục vụ trong mã nguồn
│   ├── components/          # Các UI components dùng chung
│   │   ├── ProtectedRoute.jsx # Hợp lệ hóa phiên đăng nhập trước khi vào admin
│   │   └── ...
│   ├── context/             # Quản lý trạng thái toàn cục
│   │   └── AuthContext.jsx  # Lưu giữ thông tin người dùng và token đăng nhập
│   ├── layouts/             # Các mẫu layout chính cho giao diện
│   │   └── DashboardLayout.jsx # Bố cục trang quản trị với Sidebar điều hướng
│   ├── pages/               # Tương ứng với các màn hình chức năng chính
│   │   ├── LandingPage.jsx  # Trang giới thiệu ứng dụng
│   │   ├── LoginPage.jsx    # Trang đăng nhập tài khoản
│   │   ├── DashboardPage.jsx# Tổng quan số liệu và biểu đồ
│   │   ├── InventoryReportPage.jsx # Báo cáo chi tiết lô cận hạn, tồn thấp
│   │   ├── ProductsPage.jsx # Danh sách và CRUD sản phẩm
│   │   ├── CategoriesPage.jsx # Quản lý danh mục
│   │   ├── SuppliersPage.jsx # Quản lý nhà cung cấp
│   │   ├── ImportsPage.jsx  # Tạo/Duyệt phiếu nhập hàng
│   │   └── ExportsPage.jsx  # Tạo/Duyệt phiếu xuất hàng (FEFO)
│   ├── services/            # Tầng giao tiếp với API
│   │   ├── api.js           # Khởi tạo Axios Instance và cấu hình Interceptor
│   │   ├── auth.js          # API liên quan đến xác thực (login, profile)
│   │   └── storage.js       # Helper quản lý ghi/đọc token vào localStorage
│   ├── utils/               # Các hàm tiện ích dùng chung
│   │   └── helpers.js       # Xử lý định dạng tiền tệ, ngày tháng, bắt lỗi API
│   ├── App.jsx              # Khai báo các Route và sơ đồ liên kết của ứng dụng
│   ├── index.css            # CSS toàn cục
│   └── main.jsx             # File khởi động React Application
```

---

## 4. Cơ chế Xác thực & Giao tiếp API (Security & API Integration)

### Tự động Đính kèm Token (Axios Interceptors)
Trong file [api.js](file:///home/noir/Documents/ITC5/tttn/stockinsight-frontend/src/services/api.js), Axios Interceptor được cấu hình để tự động kiểm tra xem có JWT token trong localStorage hay không. Nếu có, nó sẽ tự động thêm vào Header của mọi request:
```javascript
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Quản lý Phiên Đăng nhập Toàn cục (`AuthContext`)
File [AuthContext.jsx](file:///home/noir/Documents/ITC5/tttn/stockinsight-frontend/src/context/AuthContext.jsx) đóng vai trò trung tâm lưu trữ trạng thái người dùng hiện tại (`user`), trạng thái tải thông tin (`loading`), và hàm đăng nhập/đăng xuất.
* **Bảo vệ Định tuyến (`ProtectedRoute`):** Bọc ngoài tất cả các route dạng `/dashboard/*`. Nếu người dùng chưa đăng nhập, hệ thống sẽ điều hướng (Redirect) trở lại trang `/login` ngay lập tức.

---

## 5. Chi tiết các Phân hệ Chức năng (UI Modules)

### 5.1. Dashboard Overview (`DashboardPage`)
* **KPI Indicators:** Hiển thị nhanh 4 chỉ số: Tổng số lượng sản phẩm, Tổng giá trị hàng tồn kho (VND), Số sản phẩm sắp hết hàng (tồn dưới định mức tối thiểu), và Số lượng lô hàng sắp hết hạn (dưới 30 ngày).
* **Biểu đồ Cột (Bar Chart):** So sánh giá trị nhập và xuất kho theo 6 tháng gần nhất để quản lý dòng tiền hàng hóa.
* **Top sản phẩm bán chạy:** Bảng danh sách sản phẩm có số lượng xuất bán cao nhất.

### 5.2. Báo cáo Tồn kho (`InventoryReportPage`)
* **Biểu đồ Tròn (Doughnut Chart):** Thể hiện cơ cấu phân loại hàng hóa trong kho theo từng Danh mục (`Category`).
* **Cảnh báo Tồn thấp:** Danh sách các sản phẩm đang có số lượng tồn kho thực tế nhỏ hơn giá trị cấu hình `minStock`.
* **Cảnh báo Lô hàng Hết hạn:** Danh sách các lô hàng (`StockBatch`) sắp hết hạn sử dụng để thủ kho kịp thời có phương án xả hàng hoặc trả hàng nhà cung cấp.

### 5.3. Quản lý Danh mục, Nhà cung cấp & Sản phẩm (`ProductsPage`)
* **Bộ lọc thông minh:** Cho phép tìm kiếm sản phẩm theo tên/mã SKU và lọc theo từng danh mục hoặc nhà cung cấp.
* **Quản lý thông tin:** CRUD sản phẩm, thiết lập mức tồn tối thiểu (`minStock`), giá vốn và giá bán.
* **Giả lập Mã vạch (Barcode):** Hỗ trợ sinh mã vạch ngẫu nhiên và hiển thị trực quan.

### 5.4. Quy trình Nhập kho (`ImportsPage`)
* Cung cấp giao diện tạo phiếu nhập chi tiết. Người dùng có thể thêm nhiều sản phẩm vào danh sách, nhập số lượng, đơn giá, đồng thời thiết lập số lô sản xuất (`lotNumber`) và ngày hết hạn (`expiryDate`) của từng dòng hàng.
* Cho phép quản lý và duyệt hoặc từ chối phiếu (dành riêng cho thủ kho/quản trị viên).

### 5.5. Quy trình Xuất kho FEFO (`ExportsPage`)
* **Tích hợp xem trước FEFO:** Khi người dùng thêm sản phẩm và nhập số lượng cần xuất, hệ thống sẽ gửi yêu cầu xem trước. Backend sẽ tính toán xem số lượng đó sẽ được trừ từ những lô hàng nào (theo thứ tự ưu tiên hạn sử dụng sớm nhất).
* Hiển thị bảng chi tiết các lô hàng sẽ bị ảnh hưởng giúp nhân viên dễ dàng kiểm tra trực quan trước khi gửi yêu cầu duyệt xuất kho.
* Ẩn/hiển thị nút duyệt phiếu (`APPROVED`/`REJECTED`) dựa trên quyền hạn của người đăng nhập.
