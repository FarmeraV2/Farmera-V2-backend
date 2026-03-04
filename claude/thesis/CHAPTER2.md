## Chương 2: Tổng Quan

### 2.1 Các sản phẩm tương tự trên thị trường

#### 2.1.1 IBM Food Trust

**Mô tả:** IBM Food Trust là nền tảng truy xuất nguồn gốc thực phẩm dựa trên Hyperledger Fabric, được triển khai tại quy mô doanh nghiệp. Các đối tác lớn bao gồm Walmart, Nestlé, Dole.

**Tính năng chính:**
- Ghi nhận dữ liệu chuỗi cung ứng từ nông trại đến cửa hàng
- Truy xuất nguồn gốc trong vòng vài giây thay vì vài ngày
- API tích hợp với hệ thống ERP doanh nghiệp
- Chứng nhận và tài liệu số hóa

**Mô hình kinh doanh:** B2B, phí thuê bao doanh nghiệp, chi phí cao.

**Giới hạn:** Không dành cho nông hộ nhỏ; không có tính năng thương mại điện tử trực tiếp; không cung cấp điểm minh bạch định lượng; chuỗi khối liên minh (permissioned), không công khai hoàn toàn.

---

#### 2.1.2 TE-FOOD

**Mô tả:** TE-FOOD là nền tảng truy xuất nguồn gốc thực phẩm kết hợp blockchain công khai và mã QR, phổ biến tại các thị trường châu Á, bao gồm Việt Nam.

**Tính năng chính:**
- Gắn mã QR vào sản phẩm, người tiêu dùng quét để xem nguồn gốc
- Dữ liệu được lưu trên blockchain riêng của TE-FOOD
- Tích hợp với hệ thống quản lý trang trại
- Hỗ trợ nhiều loại sản phẩm (thịt, rau củ, hải sản)

**Mô hình kinh doanh:** Phí đăng ký theo doanh nghiệp; hướng đến các nhà phân phối và siêu thị.

**Giới hạn:** Phụ thuộc vào blockchain tập trung của TE-FOOD; không có cơ chế định lượng độ tin cậy; không có luồng thương mại điện tử; không kết nối trực tiếp nông dân với người tiêu dùng.

---

#### 2.1.3 OriginTrail (OT-DKG)

**Mô tả:** OriginTrail xây dựng **Decentralized Knowledge Graph (DKG)** — một mạng lưới đồ thị tri thức phi tập trung cho dữ liệu chuỗi cung ứng, tích hợp chuẩn GS1 và các tiêu chuẩn doanh nghiệp.

**Tính năng chính:**
- Lưu trữ và liên kết dữ liệu chuỗi cung ứng dưới dạng knowledge graph
- Hỗ trợ chuẩn GS1 EPCIS
- Token TRAC cho kinh tế phi tập trung
- API cho nhà phát triển tích hợp

**Mô hình kinh doanh:** Token-based, protocol-level — dành cho doanh nghiệp và nhà tích hợp.

**Giới hạn:** Phức tạp về kỹ thuật; không có UI người dùng cuối; không có chợ điện tử; độ minh bạch ở cấp dữ liệu, không có chấm điểm tổng hợp.

---

#### 2.1.4 VinEco (Vingroup) — Hệ thống truy xuất nguồn gốc nội bộ

**Mô tả:** VinEco là mạng lưới trang trại nông nghiệp công nghệ cao của Vingroup, với hệ thống quản lý và truy xuất nguồn gốc riêng, phân phối qua chuỗi VinMart/WinMart.

**Tính năng chính:**
- Quản lý canh tác tiêu chuẩn VietGAP/GlobalGAP tập trung
- Gắn tem truy xuất QR cho sản phẩm
- Chuỗi phân phối khép kín từ trang trại đến siêu thị
- Kiểm soát chất lượng nội bộ

**Giới hạn:** Hệ thống đóng, chỉ dành cho trang trại VinEco; không mở cho nông dân độc lập; không có blockchain công khai; người tiêu dùng phải tin tưởng vào hệ thống nội bộ Vingroup.

---

#### 2.1.5 Nền tảng chợ điện tử nông sản Việt Nam (Sendo Farm, Bachhoaxanh, Tiki Ngon)

**Mô tả:** Các nền tảng thương mại điện tử trong nước có phân khúc nông sản sạch, hoạt động theo mô hình marketplace thông thường.

**Tính năng chính:**
- Đặt hàng, thanh toán online
- Giao hàng tận nơi
- Đánh giá sản phẩm từ người mua
- Bộ lọc tìm kiếm theo danh mục, thương hiệu

**Giới hạn:** Không có cơ chế xác minh nguồn gốc độc lập; chứng nhận "sạch" dựa trên tự công bố của người bán; không có tích hợp dữ liệu canh tác; không có blockchain; người tiêu dùng không có công cụ xác minh.

---

### 2.2 Tổng kết ưu nhược điểm các sản phẩm tương tự

| Tiêu chí | IBM Food Trust | TE-FOOD | OriginTrail | VinEco | Sendo/Tiki Ngon | **Farmera V2** |
|---|---|---|---|---|---|---|
| **Truy xuất nguồn gốc** | Tốt | Tốt | Tốt | Trung bình | Yếu | **Tốt** |
| **Blockchain công khai** | Không | Riêng | Có | Không | Không | **Có (zkSync)** |
| **Chấm điểm minh bạch định lượng** | Không | Không | Không | Không | Không | **Có (FTES)** |
| **Thương mại điện tử trực tiếp** | Không | Không | Không | Qua siêu thị | Có | **Có** |
| **Kết nối nông dân nhỏ** | Không | Hạn chế | Không | Không | Có | **Có** |
| **Xác minh ảnh bằng AI** | Không | Không | Không | Không | Không | **Có (Google Vision)** |
| **Xác minh GPS** | Không | Không | Không | Không | Không | **Có** |
| **Mã QR truy xuất** | Có | Có | Không | Có | Hạn chế | **Có** |
| **Chi phí triển khai** | Rất cao | Cao | Cao | N/A (nội bộ) | Thấp | **Thấp (L2)** |
| **Mã nguồn mở** | Không | Không | Có | Không | Không | **Có thể** |

**Nhận xét tổng quan:**

Các sản phẩm hiện tại trên thị trường chưa giải quyết đồng thời ba vấn đề cốt lõi:
1. **Tính xác minh độc lập** — dữ liệu phải có thể được bất kỳ ai xác minh mà không cần tin tưởng nhà vận hành
2. **Định lượng độ minh bạch** — cần có điểm số cụ thể, không chỉ nhãn "đã xác minh"
3. **Tích hợp thương mại** — nền tảng truy xuất cần gắn liền với nơi mua bán thực tế

Farmera V2 được thiết kế để đáp ứng cả ba yêu cầu trên trong một nền tảng thống nhất.

---
