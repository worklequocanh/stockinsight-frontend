# Kế hoạch Triển khai Chi tiết - StockInsight Frontend

Tài liệu này phác thảo kế hoạch bổ sung giao diện và khắc phục các điểm không đồng bộ giữa Frontend và Backend hiện tại.

---

## 1. Khắc Phục Lỗi Tạo Phiếu Xuất Kho (Exports Form Bug)
* **Mục tiêu:** Cho phép chọn và gửi kèm `customerId` khi tạo phiếu xuất có phân loại là `SALE`.
* **Công việc:**
  * **Tải danh sách khách hàng:** Trong [ExportsPage.jsx](file:///home/noir/Documents/ITC5/tttn/stockinsight-frontend/src/pages/ExportsPage.jsx), thực hiện fetch danh sách khách hàng từ `GET /api/customers?limit=100` khi component mount.
  * **Cập nhật Giao diện (Form):** Bổ sung trường chọn Khách hàng (Dropdown Select) nằm ngay dưới ô chọn Loại phiếu xuất, chỉ hiển thị khi `exportType === 'SALE'`.
  * **Cập nhật Payload gửi API:** Thêm thuộc tính `customerId` vào state `form` và đính kèm vào yêu cầu gửi tới backend.
  * **Cập nhật Danh sách Phiếu xuất:** Hiển thị thêm cột "Khách hàng" trên bảng dữ liệu danh sách phiếu xuất.

---

## 2. Phát triển 02 Phân Hệ CRUD Cơ Bản mới (Customers & Locations)
Tạo giao diện quản trị cơ bản cho các thực thể tĩnh hỗ trợ nhập xuất.

### 2.1. Phân hệ Khách hàng (`CustomersPage.jsx`)
* **Định tuyến:** Khai báo route `/dashboard/customers` trong `App.jsx` và thêm liên kết vào Sidebar điều hướng.
* **Giao diện:**
  * Bảng danh sách khách hàng (Tên, Số điện thoại, Email, Địa chỉ, Ngày tạo).
  * Form thêm mới và chỉnh sửa thông tin khách hàng trong cột Panel bên phải (tương tự trang Nhà cung cấp).

### 2.2. Phân hệ Vị trí lưu kho (`LocationsPage.jsx`)
* **Định tuyến:** Khai báo route `/dashboard/locations` và thêm liên kết vào Sidebar.
* **Giao diện:**
  * Bảng danh sách vị trí kho hàng (Mã vị trí, Tên vị trí, Mô tả).
  * Form CRUD vị trí kho hàng.
* **Tích hợp vào Nhập kho (`ImportsPage.jsx`):**
  * Tải danh sách vị trí từ `GET /api/locations` khi component mount.
  * Thêm dropdown chọn Vị trí lưu kho cho từng sản phẩm trong form tạo phiếu nhập hàng mới.

---

## 3. Phát triển 02 Phân Hệ Nghiệp Vụ Nâng Cao (Inventory Checks & Returns)
Hỗ trợ các quy trình kho chuyên sâu.

### 3.1. Phân hệ Kiểm kê kho (`InventoryChecksPage.jsx`)
* **Định tuyến:** Khai báo route `/dashboard/inventory-checks` và thêm liên kết vào Sidebar.
* **Giao diện & Luồng nghiệp vụ:**
  * **Danh sách phiếu kiểm kê:** Hiển thị mã phiếu, trạng thái (`DRAFT`, `IN_PROGRESS`, `COMPLETED`, `CANCELED`), người tạo, ngày tạo.
  * **Tạo phiếu kiểm kê mới:** Cho phép nhân viên chọn các sản phẩm cần kiểm kê. Hệ thống tự động snapshot số lượng tồn kho trên hệ thống.
  * **Cập nhật số thực tế:** Giao diện nhập số lượng thực tế (`actualQty`) của từng sản phẩm/lô hàng, tự động tính toán chênh lệch (lệch thừa/lệch thiếu).
  * **Duyệt/Hoàn thành kiểm kê:** Cung cấp nút bấm gửi yêu cầu chốt kiểm kê lên Backend để cân bằng kho tự động.

### 3.2. Phân hệ Trả hàng (`ReturnsPage.jsx`)
* **Định tuyến:** Khai báo route `/dashboard/returns` và thêm liên kết vào Sidebar.
* **Giao diện & Luồng nghiệp vụ:**
  * **Danh sách phiếu trả:** Hiển thị mã phiếu, lý do trả, trạng thái xử lý (`PENDING`, `INSPECTED`, `RETURNED_TO_STOCK`, `DISCARDED`).
  * **Tạo phiếu trả:** Form chọn sản phẩm trả, số lượng, lý do và tình trạng hàng hóa (ví dụ: "Tốt", "Hư hỏng").
  * **Xử lý hàng trả:** Cung cấp các thao tác cập nhật trạng thái phiếu trả hàng để cộng lại hàng vào kho hoặc ghi nhận tiêu hủy.

---

## 4. Bổ sung Phân Hệ Nhật ký hoạt động dành cho Quản trị viên (`AuditLogsPage.jsx`)
* **Định tuyến:** Khai báo route `/dashboard/audit-logs` trong `App.jsx`.
* **Giao diện:**
  * Chỉ hiển thị liên kết "Nhật ký hệ thống" trên Sidebar nếu `user.role === 'ADMIN'`.
  * Bảng danh sách nhật ký gồm: Thời gian thao tác, Tài khoản thực hiện, Loại hành động (Thêm/Sửa/Xóa/Duyệt), Tài nguyên bị tác động, Mô tả chi tiết (ví dụ: các trường thay đổi giá trị).
