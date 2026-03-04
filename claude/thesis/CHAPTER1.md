## TÓM TẮT

Đề tài xây dựng **Farmera** — một nền tảng chợ số thông minh dành cho thực phẩm sạch, kết hợp giữa thương mại điện tử và hệ thống minh bạch quy trình sản xuất nông nghiệp dựa trên công nghệ blockchain. Hệ thống cho phép nông dân ghi nhận toàn bộ nhật ký canh tác (từ chuẩn bị đất, gieo trồng, chăm sóc, thu hoạch đến sau thu hoạch) lên chuỗi khối, trong khi người tiêu dùng có thể truy xuất và xác minh độc lập tính xác thực của thông tin. Cơ chế đánh giá minh bạch đa tầng — **FTES (Farm Transparency & Evaluation System)** — tính điểm từ cấp độ từng nhật ký đến toàn trang trại, tích hợp xác minh ảnh bằng AI (Google Cloud Vision), GPS và kiểm tra tính liên tục của dữ liệu. Nền tảng còn tích hợp đầy đủ luồng thương mại điện tử: đặt hàng, thanh toán, vận chuyển (GHN), mã QR truy xuất nguồn gốc và hệ thống thông báo đa kênh.

---

## ABSTRACT

This thesis presents **Farmera**, a smart digital marketplace for clean food products that integrates e-commerce capabilities with a blockchain-based agricultural production transparency system. The platform enables farmers to record complete cultivation logs — from land preparation, seeding, crop care, harvesting to post-harvest processing — on an immutable blockchain, while consumers can independently trace and verify the authenticity of production data. A multi-level transparency scoring mechanism — **FTES (Farm Transparency & Evaluation System)** — evaluates farm practices from individual activity logs up to the whole-farm level, incorporating AI-based image verification (Google Cloud Vision), GPS validation, and data continuity assessment. The platform also features a complete e-commerce flow: ordering, payment integration, shipping (GHN), QR-based traceability, and multi-channel notifications.

---

## Chương 1: Mở Đầu

### 1.1 Đặt vấn đề

Thực phẩm sạch và an toàn đang là mối quan tâm hàng đầu của người tiêu dùng Việt Nam hiện nay. Tuy nhiên, khoảng cách giữa người sản xuất và người tiêu dùng ngày càng lớn, khiến việc xác minh nguồn gốc và quy trình sản xuất trở nên vô cùng khó khăn. Người tiêu dùng không có cách nào để tự kiểm chứng rằng sản phẩm họ mua có thực sự được sản xuất theo đúng tiêu chuẩn an toàn hay không — họ chỉ có thể tin tưởng dựa trên nhãn mác, chứng nhận, hoặc uy tín của thương hiệu.

Vấn đề này dẫn đến một nghịch lý trên thị trường: người nông dân sản xuất sạch không thể phân biệt và định giá sản phẩm của mình cao hơn sản phẩm thông thường, trong khi người tiêu dùng sẵn sàng trả thêm tiền cho sản phẩm có chứng minh nguồn gốc rõ ràng. Cả hai phía đều chịu thiệt — nông dân mất đi lợi thế cạnh tranh, người tiêu dùng thiếu thông tin để đưa ra quyết định đúng đắn.

Bên cạnh đó, các hệ thống kiểm định hiện tại (VietGAP, GlobalGAP, hữu cơ TCVN) phần lớn dựa vào kiểm tra định kỳ, tốn kém chi phí và không phản ánh được quá trình sản xuất diễn ra hàng ngày. Chứng nhận có thể bị cấp sai, bị lợi dụng, hoặc không còn phản ánh thực tế sau thời điểm kiểm tra.

**Câu hỏi nghiên cứu:** Liệu có thể xây dựng một nền tảng kỹ thuật số vừa hỗ trợ giao dịch thực phẩm sạch, vừa cung cấp bằng chứng minh bạch về quy trình sản xuất một cách đáng tin cậy, chi phí thấp và có thể xác minh độc lập?

---

### 1.2 Thực trạng

#### 1.2.1 Thực trạng sản xuất nông nghiệp và an toàn thực phẩm tại Việt Nam

Theo báo cáo của Bộ Nông nghiệp và Phát triển Nông thôn, Việt Nam có hơn 9 triệu hộ sản xuất nông nghiệp, trong đó phần lớn là sản xuất nhỏ lẻ. Việc áp dụng và duy trì tiêu chuẩn an toàn thực phẩm trong điều kiện này là thách thức lớn về mặt giám sát và xác minh.

Một số thực trạng nổi bật:

- **Thiếu hệ thống ghi chép nhật ký sản xuất:** Đa số nông dân không có thói quen hoặc không có công cụ để ghi lại đầy đủ các hoạt động canh tác. Thông tin về lượng thuốc bảo vệ thực vật sử dụng, ngày bón phân, ngày thu hoạch thường chỉ nằm trong ký ức.
- **Khó kiểm tra chứng nhận:** Người tiêu dùng không có phương tiện để xác minh tính hợp lệ của chứng nhận VietGAP hay tem nhãn an toàn thực phẩm.
- **Chuỗi cung ứng dài và phức tạp:** Nông sản thường qua nhiều trung gian trước khi đến tay người tiêu dùng, làm mất đi thông tin nguồn gốc ban đầu.
- **Thiếu nền tảng kết nối trực tiếp:** Nông dân phụ thuộc vào thương lái, không tiếp cận được thị trường cuối trực tiếp, không thể xây dựng thương hiệu cá nhân.

#### 1.2.2 Thực trạng ứng dụng công nghệ blockchain trong nông nghiệp

Blockchain đã được nghiên cứu và triển khai thí điểm trong lĩnh vực nông nghiệp tại nhiều quốc gia. Tuy nhiên, hầu hết các dự án hiện tại đều gặp một vấn đề chung: **sử dụng blockchain như một cơ sở dữ liệu bổ sung**, không tận dụng được các tính năng cốt lõi về phi tập trung và bất biến dữ liệu.

Đặc biệt tại Việt Nam, các nền tảng truy xuất nguồn gốc nông sản chủ yếu dừng ở việc mã hóa QR và lưu thông tin trên máy chủ tập trung — về bản chất không khác gì tra cứu thông tin thông thường, không có cơ chế đảm bảo dữ liệu không bị thay đổi.

---

### 1.3 Mục tiêu đề tài

Đề tài đặt ra các mục tiêu cụ thể như sau:

**Mục tiêu chính:**
Xây dựng nền tảng **Farmera** — chợ số thông minh cho thực phẩm sạch, với chức năng cốt lõi là minh bạch hóa quy trình sản xuất nông nghiệp thông qua công nghệ blockchain.

**Mục tiêu cụ thể:**

1. **Xây dựng hệ thống quản lý canh tác số (Crop Management):** Cho phép nông dân ghi nhật ký canh tác đầy đủ theo cấu trúc Mảnh đất → Mùa vụ → Bước sản xuất → Nhật ký hoạt động.

2. **Tích hợp blockchain để đảm bảo tính bất biến dữ liệu:** Mỗi nhật ký và bước sản xuất được băm (SHA-256) và lưu trên smart contract, đảm bảo không ai (kể cả nhà vận hành hệ thống) có thể thay đổi dữ liệu đã công bố.

3. **Xây dựng hệ thống chấm điểm minh bạch đa tầng (FTES):** Đánh giá độ minh bạch từ cấp nhật ký (TrustScore) → bước sản xuất → mùa vụ → trang trại, kết hợp xác minh AI và GPS.

4. **Xây dựng luồng thương mại điện tử hoàn chỉnh:** Đặt hàng, thanh toán, vận chuyển qua đơn vị vận chuyển tích hợp (GHN), mã QR truy xuất nguồn gốc.

5. **Hỗ trợ nhiều loại người dùng:** Nông dân, Người mua, Kiểm định viên (Auditor), Quản trị viên.

---

### 1.4 Phạm vi đề tài

**Phạm vi kỹ thuật — Backend API:**
- Phát triển RESTful API bằng NestJS 11 với TypeScript
- Cơ sở dữ liệu PostgreSQL, quản lý bằng TypeORM
- Triển khai smart contract trên mạng zkSync Era (Ethereum Layer 2)
- Tích hợp Web3.js để tương tác với blockchain
- Xác thực bằng JWT (access token + refresh token)

**Phạm vi chức năng:**
- Quản lý tài khoản: đăng ký, đăng nhập, phân quyền (Buyer / Farmer / Admin)
- Quản lý trang trại: đăng ký, xác minh sinh trắc học (CCCD + video), chứng chỉ
- Quản lý canh tác: mảnh đất, cây trồng, mùa vụ, bước sản xuất, nhật ký
- Minh bạch hóa: hash dữ liệu lên blockchain, chấm điểm FTES, xác minh ảnh AI
- Thương mại điện tử: sản phẩm, đơn hàng, thanh toán, vận chuyển
- Truy xuất nguồn gốc: mã QR → lịch sử sản xuất đã xác minh
- Đánh giá: đánh giá sản phẩm, trả lời đánh giá
- Thông báo: Firebase push notification, SMS/Email qua Twilio/SendGrid

**Phạm vi ngoài đề tài (không bao gồm):**
- Ứng dụng Mobile/Frontend (chỉ phát triển backend API)
- Phát triển từ đầu smart contract cho thanh toán on-chain (sử dụng payment gateway truyền thống)
- Thương mại hóa thực tế và triển khai production

---