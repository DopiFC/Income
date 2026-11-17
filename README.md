# DOPI GRINCOME – HỆ THỐNG TÍNH LƯƠNG & QUẢN TRỊ NHÂN SỰ VIỆT NAM

**Dopi GRIncome** là ứng dụng web mã nguồn mở cao cấp, giải pháp toàn diện thay thế các bảng tính Excel tiền lương thủ công cho doanh nghiệp vừa và nhỏ, startup và hộ kinh doanh Việt Nam.

Ứng dụng kết hợp giữa **tính chuẩn xác tuyệt đối theo pháp luật Việt Nam (kỳ tính thuế 2026)** và **cơ chế bảo mật dữ liệu tối đa (Client-side Privacy & AES-256 Encrypted Local Storage)**.

---

## 1. CÁC TÍNH NĂNG MỚI ĐÃ NÂNG CẤP

### 1.1. Tự Lưu Trữ & Khôi Phục Dữ Liệu Mã Hóa (IndexedDB + AES-256-GCM)
* **Mã hóa trên thiết bị (Client-side Encryption):** Sử dụng Web Crypto API với thuật toán **AES-256-GCM** và cơ chế dẫn xuất khóa **PBKDF2-SHA256 (100.000 vòng lặp)** từ mật khẩu của người dùng.
* **Tự động lưu (Auto-Save):** Sau khi mở khóa, các thay đổi đối với nhân viên, chấm công, phụ cấp, cấu hình và thông tin tổ chức được tự động mã hóa và ghi vào IndexedDB.
* **Trạng thái lưu trực quan:** Huy hiệu trạng thái trên thanh điều hướng hiển thị rõ ràng: `Đang lưu...`, `Đã lưu (AES-256)`, `Đã khóa hồ sơ` hoặc `Tạm thời (Chưa lưu)`.
* **Quản trị hồ sơ an toàn:**
  * Khóa hồ sơ (xóa khóa giải mã khỏi RAM).
  * Đổi mật khẩu hồ sơ (tái mã hóa dữ liệu với khóa mới).
  * Xóa vĩnh viễn hồ sơ khỏi thiết bị khi không sử dụng nữa.
* **Sao lưu & Khôi phục file `.dopigr`:**
  * Xuất file sao lưu định dạng `.dopigr` (chứa ciphertext, salt, iv và thông tin phiên bản). Tuyệt đối không lưu mật khẩu.
  * Nhập file sao lưu: yêu cầu mật khẩu giải mã và xác nhận trước khi thay thế dữ liệu đang làm việc.
* **Không gửi máy chủ:** Toàn bộ quá trình mã hóa, giải mã và lưu trữ chỉ diễn ra trong trình duyệt của bạn.

### 1.2. Quản Lý Thông Tin Doanh Nghiệp & Hộ Kinh Doanh
* Quản lý thông tin tổ chức tại menu **"Thông tin tổ chức"**:
  * Tên công ty / hộ kinh doanh.
  * Mã số thuế (MST).
  * Địa chỉ trụ sở, số điện thoại, email.
  * Tải lên Logo tổ chức (hiển thị sắc nét trên phiếu lương).
  * Người lập bảng lương & Người duyệt / Giám đốc.
* **Tích hợp đồng bộ vào Phiếu lương cá nhân:**
  * Hiển thị logo, tên công ty, MST, địa chỉ.
  * Tự động ẩn các trường nếu để trống, tránh vỡ layout khi in hoặc tải ảnh PNG.
  * Chữ ký phân quyền (Người lập biểu, Người lao động, Người duyệt).

### 1.3. Dashboard Báo Cáo Bảng Lương Đa Chiều
* **10 Chỉ số tài chính & nhân sự tức thời:**
  1. Số lượng nhân sự trong phạm vi lọc.
  2. Tổng quỹ lương Gross.
  3. Lương thực nhận Net.
  4. Thuế TNCN nộp Nhà nước.
  5. Tổng chi phí nhân sự của DN (Gross + BH DN).
  6. Bảo hiểm người lao động đóng (10.5%).
  7. Bảo hiểm & Kinh phí Công đoàn DN đóng (23.5%).
  8. Tổng tiền thưởng & các khoản phụ cấp.
  9. Tổng tiền làm thêm giờ (OT).
  10. Số trường hợp cảnh báo vi phạm pháp lý.
* **Bộ lọc dữ liệu đồng bộ:** Lọc tức thời theo Kỳ lương, Phòng ban, Cấp bậc, Loại hợp đồng và Hình thức lương (Gross / Net).
* **Biểu đồ & Phân tích trực quan:**
  * Thanh phân bổ tỉ lệ cơ cấu chi phí (Net, Bảo hiểm DN, Bảo hiểm NLĐ, Thuế TNCN).
  * Biểu đồ so sánh quỹ lương giữa các phòng ban.
  * Chi phí nhân sự theo nhóm cấp bậc.
* **Xuất báo cáo đa dạng:**
  * Tải ảnh Dashboard định dạng **PNG** độ phân giải cao.
  * In hoặc xuất **PDF** theo chuẩn trang in.
  * Tải báo cáo **Excel** tổng hợp.

---

## 2. BỘ MÁY TÍNH LƯƠNG & QUY TẮC PHÁP LUẬT (NĂM 2026)

1. **Bộ luật Lao động 45/2019/QH14:**
   * Tiền lương làm thêm giờ (Điều 98): Ngày thường 150%, ngày nghỉ hằng tuần 200%, ngày lễ/tết 300%.
   * Phụ trội làm ban đêm (+30%) và làm thêm giờ ban đêm (+20%).
   * Cảnh báo giới hạn giờ làm thêm vượt quá 40 giờ/tháng (Điều 107).
   * Chống tự ý phạt tiền, trừ lương nhân viên trái luật (Điều 102 & 127).
2. **Luật Thuế Thu nhập cá nhân & Giảm trừ gia cảnh từ 2026:**
   * Giảm trừ bản thân: **15.500.000 ₫/tháng** (186 triệu ₫/năm).
   * Giảm trừ người phụ thuộc: **6.200.000 ₫/người/tháng** (74,4 triệu ₫/năm).
   * Biểu thuế TNCN lũy tiến từng phần 5 bậc:
     * Đến 10 triệu đồng: **5%**
     * Trên 10 đến 30 triệu đồng: **10%**
     * Trên 30 đến 60 triệu đồng: **20%**
     * Trên 60 đến 100 triệu đồng: **30%**
     * Trên 100 triệu đồng: **35%**
   * Miễn thuế phần tiền lương làm thêm giờ vượt trên mức chuẩn 100% (theo Điểm i Khoản 1 Điều 3 Thông tư 111/2013/TT-BTC).
   * Miễn thuế ăn trưa tối đa **730.000 ₫/tháng**.
3. **Nghị định 293/2025/NĐ-CP (Lương tối thiểu vùng từ 01/01/2026):**
   * Vùng I: **5.310.000 ₫/tháng**
   * Vùng II: **4.730.000 ₫/tháng**
   * Vùng III: **4.140.000 ₫/tháng**
   * Vùng IV: **3.700.000 ₫/tháng**
4. **Bảo hiểm xã hội & Trần đóng:**
   * NLĐ: BHXH 8%, BHYT 1.5%, BHTN 1% = **10.5%**.
   * NSDLĐ: BHXH 17.5%, BHYT 3%, BHTN 1%, Kinh phí công đoàn 2% = **23.5%**.
   * Trần BHXH & BHYT: Tối đa 20 lần mức tham chiếu (**46.800.000 ₫**).
   * Trần BHTN: Tối đa 20 lần mức lương tối thiểu từng vùng.
5. **Quy đổi Gross – Net 2 chiều:**
   * Gross sang Net: Khấu trừ tuần tự các khoản bảo hiểm, giảm trừ gia cảnh và tính thuế lũy tiến.
   * Net sang Gross: Giải phương trình phi tuyến bằng thuật toán **Tìm kiếm nhị phân (Binary Search)** chính xác từng đồng VND.

---

## 3. CÀI ĐẶT & CHẠY THỬ NGHIỆM TẠI LOCAL

### Yêu cầu
* **Node.js**: Phiên bản 18+ trở lên
* **npm**: Phiên bản 9+

### Khởi chạy môi trường phát triển
```bash
# 1. Cài đặt các thư viện phụ thuộc
npm install

# 2. Khởi chạy máy chủ phát triển
npm run dev

# 3. Mở ứng dụng trên trình duyệt
http://localhost:3000
```

### Chạy bộ kiểm thử tự động (Vitest)
```bash
npm run test
```
Bộ kiểm thử bao gồm 16 test cases kiểm tra:
* Biểu thuế TNCN 2026, các điểm chuyển bậc thuế và giảm trừ người phụ thuộc.
* Trần đóng BHXH/BHTN, sàn lương tối thiểu và ngày công làm không đủ tháng.
* Phân bổ thu nhập tăng ca chịu thuế và miễn thuế theo Điều 98 BLLĐ.
* Thuật toán giải ngược Net sang Gross đạt dung sai $\le 1$ đồng.
* Mã hóa AES-256-GCM, giải mã đúng/sai mật khẩu và tính toàn vẹn file sao lưu `.dopigr`.

### Build bản Production
```bash
npm run build
```

---

## 4. TRIỂN KHAI LÊN GITHUB PAGES TỪ THƯ MỤC `/docs`

Dự án đã được cấu hình build trực tiếp ra thư mục `/docs` (`outDir: 'docs'`).

### Các bước kích hoạt:
1. Chạy lệnh `npm run build` để tạo bản build mới nhất trong thư mục `/docs`.
2. Đẩy mã nguồn (bao gồm thư mục `/docs`) lên nhánh `main` trên GitHub.
3. Vào tab **Settings > Pages** trên repository.
4. Tại **Build and deployment > Source**, chọn **Deploy from a branch**, chọn nhánh **`main`** và thư mục **`/docs`**, sau đó bấm **Save**.
5. Trang web sẽ hoạt động tại địa chỉ `https://<username>.github.io/<repository-name>/`.

