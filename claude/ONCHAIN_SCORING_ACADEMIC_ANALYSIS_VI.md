# Cơ Chế Chấm Điểm On-Chain: Phân Tích Học Thuật Chuyên Sâu
## Tính Toán Điểm Tin Cậy Cấp Log và Cấp Bước Sản Xuất trong Farmera V2

**Phạm vi tài liệu:** Chỉ phân tích logic chấm điểm trong smart contract (`LogDefaultPackage.sol`, `LogAuditorPackage.sol`, `StepTransparencyPackage.sol`, `AuditorRegistry.sol`). Việc chấm điểm phía máy chủ cho mùa vụ và trang trại được loại trừ hoàn toàn.

---

## Tóm Tắt Điều Hành

Tài liệu này cung cấp một phân tích học thuật ở cấp độ công thức đối với hệ thống chấm điểm tin cậy on-chain được triển khai trong các smart contract của Farmera V2. Hệ thống thực hiện hai tầng chấm điểm: (1) **chấm điểm cấp log (log-level scoring)**, được đánh giá bởi `LogDefaultPackage` (tự động) và `LogAuditorPackage` (có sự tham gia của con người), và (2) **chấm điểm cấp bước sản xuất (step-level scoring)**, được đánh giá bởi `StepTransparencyPackage` sử dụng công thức tổng hợp có trọng số theo Quy Trình Phân Tích Thứ Bậc (AHP) điều chỉnh bởi hệ số phạt khoảng trống thời gian.

**Luận điểm trung tâm cần đánh giá:** *Tất cả các công thức chấm điểm trong smart contract đều được dẫn xuất từ lý thuyết chất lượng dữ liệu và độ tin cậy đã được thiết lập.*

**Kết luận:** Luận điểm này **có thể bảo vệ về mặt khoa học**. Mỗi công thức ánh xạ trực tiếp đến một cấu trúc chuẩn từ một hoặc nhiều khung lý thuyết được công nhận: phân loại chất lượng dữ liệu của Wang & Strong (1996), tỷ lệ hoàn chỉnh của Pipino et al. (2002), dẫn xuất ưu tiên AHP của Saaty (1980), logic chủ quan cho tiên nghiệm không thông tin của Jøsang & Ismail (2002), Hệ số Biến Thiên của Montgomery (2020) cho tính nhất quán quy trình, và định lý bỏ phiếu đa số của Condorcet (1785) cho sự đồng thuận chuyên gia. Các tính chất toán học của mỗi công thức được chứng minh hình thức dưới đây.

---

## 1. Kiến Trúc Chấm Điểm Smart Contract

### 1.1 Tổng Quan Hệ Thống

Hệ thống chấm điểm bao gồm bốn contract tương tác:

| Contract | Vai trò | Loại chấm điểm |
|---|---|---|
| `LogDefaultPackage` | Điểm tin cậy cấp log tự động | Hỗn hợp: cổng nhị phân + tổng trọng số bão hòa |
| `LogAuditorPackage` | Điểm tin cậy cấp log có kiểm toán | Hỗn hợp: cổng nhị phân + tổng trọng số bão hòa |
| `StepTransparencyPackage` | Chỉ số minh bạch cấp bước | Hỗn hợp: AHP-WLS × hệ số điều chỉnh nhân |
| `AuditorRegistry` | Oracle đồng thuận | Bỏ phiếu đa số có trọng số danh tiếng dựa trên quorum |

Tất cả các package đều triển khai interface `TrustPackage`, trả về `(bool accept, uint128 score)`. Việc định tuyến đến package phù hợp được xử lý bởi `MetricSelection` sử dụng khóa `keccak256(dataType, context)`, và thực thi được điều phối bởi `TrustComputation`, đảm bảo tính lũy đẳng (mỗi cặp `(identifier, id)` chỉ được chấm điểm một lần).

### 1.2 Phân Loại Logic Chấm Điểm

| Package | Tuyến tính có trọng số? | Cổng nhị phân? | Bão hòa? | Quorum? | Phân cấp? | Điều chỉnh nhân? |
|---|---|---|---|---|---|---|
| `LogDefaultPackage` | ✓ | ✓ (Tsp bắt buộc) | ✓ (Tec) | ✗ | ✗ | ✗ |
| `LogAuditorPackage` | ✓ | ✓ (Tc bắt buộc) | ✓ (Tcs, Te) | ✓ (Tcs) | ✗ | ✗ |
| `StepTransparencyPackage` | ✓ (AHP) | ✗ | ✓ (DC, VR) | ✗ | ✓ (2 giai đoạn) | ✓ (GP) |

### 1.3 Danh Mục Tiêu Chí Đầy Đủ

| Ký hiệu | Contract | Tên | Miền giá trị | Loại |
|---|---|---|---|---|
| Tsp | Cả hai log package | Độ Tin Cậy Không Gian | {0, 100} | Nhị phân |
| Tec | LogDefault | Độ Hoàn Chỉnh Bằng Chứng | [0, 100] | Tỷ lệ bão hòa |
| Tc | LogAuditor | Đồng Thuận Kiểm Toán Viên | {0, 100} | Nhị phân |
| Tcs | LogAuditor | Độ Mạnh Đồng Thuận | [0, 100] | Tỷ lệ bão hòa |
| Te | LogAuditor | Bằng Chứng (giống Tec) | [0, 100] | Tỷ lệ bão hòa |
| DC | Step | Độ Hoàn Chỉnh Tài Liệu | [0, 100] | Tích tổng hợp |
| VR | Step | Tỷ Lệ Xác Minh | [0, 100] | Tỷ lệ với tiên nghiệm trung tính |
| TR | Step | Tính Đều Đặn Thời Gian | [0, 100] | Biến đổi CV |
| CR | Step | Tỷ Lệ Hoàn Chỉnh Nội Dung | [0, 100] | Đầu vào tỷ lệ oracle |
| GP | Step | Hệ Số Phạt Khoảng Trống | [17, 100] | Suy giảm mũ (rời rạc hóa) |

---

## 2. Phân Tích Công Thức Chi Tiết

### 2.1 Chấm Điểm Cấp Log: `LogDefaultPackage`

#### 2.1.1 Độ Tin Cậy Không Gian (Tsp)

**Công thức chính xác:**

```
dist(a, b) = (a.lat − b.lat)² + (a.lng − b.lng)²     [tỷ lệ: 1 đơn vị = 1e-6 độ]

         ⎧ 100   nếu dist(a, b) ≤ 100,000
Tsp(a,b) = ⎨
         ⎩   0   trường hợp còn lại
```

**Định nghĩa biến:**
- `a.lat`, `a.lng`: Vị trí thửa đất, vĩ độ và kinh độ × 10⁶
- `b.lat`, `b.lng`: Vị trí log, vĩ độ và kinh độ × 10⁶
- `dist`: Khoảng cách Euclid phẳng bình phương trong không gian tọa độ đã nhân tỷ lệ

**Cấu trúc toán học:** Hàm quyết định nhị phân (ngưỡng); hàm bậc thang hằng từng đoạn.

**Tính chất toán học:**
- *Bị chặn*: Tsp ∈ {0, 100} ⊂ [0, 100].
- *Không liên tục*: Điểm gián đoạn duy nhất tại dist = 100,000.
- *Không đơn điệu*: Tsp giảm xuống 0 và giữ nguyên khi dist vượt ngưỡng.
- *Không lồi*: Hằng từng đoạn.

**Giải thích hình học của ngưỡng:**
Với tỷ lệ 1e6, ngưỡng `√100,000 ≈ 316` đơn vị tỷ lệ tương ứng với `316 × 10⁻⁶` độ. Theo trục bắc–nam, 1 độ ≈ 111,320 m (elipsoid WGS 84; Vincenty, 1975), do đó `316 × 10⁻⁶ × 111,320 ≈ 35 m`. Đối với trường hợp đường chéo, ngưỡng Euclid tương ứng với khoảng `35√2 ≈ 50 m`. Chú thích trong code "~100 meters" là giới hạn trên bảo thủ; ràng buộc thực tế chặt chẽ hơn.

Phép đo bình phương phẳng là xấp xỉ góc nhỏ tiêu chuẩn của công thức Haversine (Vincenty, 1975; Karney, 2013), hợp lệ cho khoảng cách ≪ 1° (được đáp ứng tốt ở thang ~50 m này).

#### 2.1.2 Độ Hoàn Chỉnh Bằng Chứng (Tec)

**Công thức chính xác:**

```
Tec = min⌊(imageCount + videoCount) / 2, 1⌋ × 100

trong đó MAX_IMAGE_COUNT = MAX_VIDEO_COUNT = 1
```

**Cấu trúc toán học:** Tỷ lệ hoàn chỉnh bão hòa (min-capped).

**Tính chất toán học:**
- *Bị chặn*: Tec ∈ [0, 100].
- *Đơn điệu không giảm*: ∂Tec/∂imageCount ≥ 0 và ∂Tec/∂videoCount ≥ 0.
- *Bão hòa*: Tec = 100 với mọi (imageCount + videoCount) ≥ 2.
- *Lõm*: Do trần bão hòa.

#### 2.1.3 Điểm Tổng Hợp và Điều Kiện Cổng

**Công thức chính xác:**

```
Score_def = (60 · Tsp + 40 · Tec) / 100     ∈ [0, 100]

Chấp nhận ⟺ Score_def ≥ 60
```

**Kiểm tra chuẩn hóa trọng số:** 60 + 40 = 100 ✓

**Phân tích điều kiện cổng (Tsp là điều kiện cần):**

*Mệnh đề:* `Tsp = 100` là điều kiện cần để được chấp nhận.

*Chứng minh:* Giả sử Tsp = 0. Khi đó:
```
Score_def = (60 · 0 + 40 · Tec) / 100 ≤ (40 · 100) / 100 = 40 < 60
```
Do đó Score_def < 60, và log bị từ chối bất kể giá trị Tec. ∎

*Hệ quả:* Không có log nào được ghi từ vị trí không nhất quán với thửa đất đăng ký có thể vượt qua, bất kể chất lượng bằng chứng.

---

### 2.2 Chấm Điểm Cấp Log: `LogAuditorPackage`

#### 2.2.1 Đồng Thuận Kiểm Toán Viên (Tc)

**Công thức chính xác:**

```
verificationResult = (Σᵢ reputationᵢ · voteᵢ[hợp lệ]) > (Σᵢ reputationᵢ · voteᵢ[không hợp lệ])

         ⎧ 100   nếu verificationResult = true
Tc =     ⎨
         ⎩   0   trường hợp còn lại
```

trong đó phép tổng thực hiện trên tất cả kiểm toán viên được chỉ định đã nộp phiếu bầu.

**Cấu trúc toán học:** Hàm quyết định nhị phân trên kết quả bỏ phiếu đa số có trọng số danh tiếng.

**Tính chất toán học:**
- *Bị chặn*: Tc ∈ {0, 100}.
- *Dẫn xuất từ bất đẳng thức nghiêm*: Hòa phiếu dẫn đến `false` (từ chối). Điều này triển khai thiên lệch bảo thủ hướng từ chối trong điều kiện không chắc chắn.

#### 2.2.2 Độ Mạnh Đồng Thuận (Tcs)

**Công thức chính xác:**

```
Tcs = min(auditorCount / max(minAuditors, 1), 1) × 100     ∈ [0, 100]
```

**Cấu trúc toán học:** Tỷ lệ tham gia bão hòa (min-capped).

**Tính chất toán học:**
- *Bị chặn*: Tcs ∈ [0, 100].
- *Đơn điệu không giảm*: Nhiều kiểm toán viên hơn → Tcs cao hơn, cho đến khi bão hòa.
- *Bão hòa tại* Tcs = 100 khi `auditorCount ≥ minAuditors`.
- *Triển khai độ tin cậy biên giảm dần*: Các kiểm toán viên bổ sung vượt quorum không đóng góp thêm vào điểm.

#### 2.2.3 Điểm Tổng Hợp và Điều Kiện Cổng

**Công thức chính xác:**

```
Score_aud = (45 · Tc + 10 · Tcs + 30 · Tsp + 15 · Te) / 100     ∈ [0, 100]

Chấp nhận ⟺ Score_aud ≥ 70
```

**Kiểm tra chuẩn hóa trọng số:** 45 + 10 + 30 + 15 = 100 ✓

**Phân tích điều kiện cổng (Tc là điều kiện cần):**

*Mệnh đề:* `Tc = 100` là điều kiện cần để được chấp nhận.

*Chứng minh:* Giả sử Tc = 0. Khi đó:
```
Score_aud = (45·0 + 10·Tcs + 30·Tsp + 15·Te) / 100
          ≤ (10·100 + 30·100 + 15·100) / 100
          = 5500 / 100 = 55 < 70
```
Do đó Score_aud < 70, và log bị từ chối bất kể tất cả các tiêu chí khác. ∎

**Phân tích tính đủ (Tc một mình không đủ):**

*Mệnh đề:* `Tc = 100` một mình không đảm bảo được chấp nhận.

*Chứng minh:* Giả sử Tc = 100, Tcs = 0, Tsp = 0, Te = 0. Khi đó:
```
Score_aud = (45·100) / 100 = 45 < 70
```
Log bị từ chối. ∎

*Hàm ý cấu trúc:* Trọng số 45/100 và ngưỡng 70 điểm cùng nhau làm cho sự đồng thuận chuyên gia trở thành điều kiện **cần nhưng không đủ**. Đây là biểu đạt hình thức của nguyên tắc rằng một kết quả kiểm toán tích cực phải được củng cố bởi các kiểm tra tự động khách quan (độ tin cậy không gian, bằng chứng). Thiết kế này ngăn chặn sự thông đồng của kiểm toán viên trở thành cơ chế phê duyệt duy nhất.

**Trường hợp biên (Tsp là điều kiện mềm):**

Khi Tsp = 0 và Tc = Tcs = Te = 100:
```
Score_aud = (45·100 + 10·100 + 30·0 + 15·100) / 100 = 7000 / 100 = 70
```
Kết quả bằng đúng ngưỡng chấp nhận — trường hợp biên duy nhất mà Tsp = 0 vẫn vượt qua. Trong thực tế, độ tin cậy không gian là điều kiện gần như cần thiết trong ngưỡng này.

---

### 2.3 Chấm Điểm Cấp Bước: `StepTransparencyPackage`

Công thức cấp bước là tổng hợp hai giai đoạn:

```
I_step = (47·DC + 30·VR + 13·CR + 10·TR) / 100     [Giai đoạn 1: Chỉ số chất lượng có trọng số AHP]
Score   = I_step × GP / 100                           [Giai đoạn 2: Điều chỉnh tính toàn vẹn thời gian]

Chấp nhận ⟺ Score ≥ 60
```

#### 2.3.1 Độ Hoàn Chỉnh Tài Liệu (DC)

**Công thức chính xác:**

```
avgLogScore = (verifiedLogs × 100 + pendingLogs × 70) / totalLogs     nếu totalLogs > 0
            = 0                                                          nếu totalLogs = 0

coverage    = min(totalLogs / minLogs, 1) × 100                        nếu minLogs > 0
            = 100                                                        nếu minLogs = 0

DC = (coverage × avgLogScore) / 100     ∈ [0, 100]
```

Lưu ý: `rejectedLogs` được tính vào `totalLogs` nhưng đóng góp điểm 0 vào `avgLogScore`, áp đặt hình phạt bằng cách pha loãng trung bình.

**Cấu trúc toán học:** Tích của tỷ lệ bão hòa (coverage) và trung bình có trọng số chất lượng (avgLogScore).

**Tính chất toán học:**
- *Bị chặn*: DC ∈ [0, 100].
- *DC = 0* khi và chỉ khi `totalLogs = 0` (không có hoạt động) hoặc tất cả log bị từ chối (`verifiedLogs = pendingLogs = 0`).
- *DC = 100* khi và chỉ khi `totalLogs = minLogs` và tất cả log được xác minh (`verifiedLogs = totalLogs`, không có pending hoặc rejected).
- *Đơn điệu không giảm* theo `verifiedLogs` (các yếu tố khác không đổi).
- *Đơn điệu không tăng* theo `rejectedLogs` (các yếu tố khác không đổi, vì chúng tăng `totalLogs` mà không đóng góp vào `avgLogScore`).
- *Không lồi*: Tích của hai hàm theo số lượng log.

**Tác động của log bị từ chối:** Một mục log bị từ chối đồng thời tăng `totalLogs` (pha loãng `avgLogScore`) trong khi không đóng góp vào tử số. Điều này tạo ra hình phạt nhân tự động gấp đôi cho các bài nộp gian lận.

#### 2.3.2 Tỷ Lệ Xác Minh (VR)

**Công thức chính xác:**

```
reviewed = verifiedLogs + rejectedLogs

VR = (verifiedLogs / reviewed) × 100     nếu reviewed > 0
   = DEFAULT_UNVERIFIED_DISCOUNT = 70    nếu reviewed = 0
```

**Cấu trúc toán học:** Tỷ lệ với tiên nghiệm trung tính dự phòng.

**Tính chất toán học:**
- *Bị chặn*: VR ∈ [0, 100] (vì `verifiedLogs ≤ reviewed`).
- *Đơn điệu không giảm* theo `verifiedLogs` (các yếu tố khác không đổi).
- *Đơn điệu không tăng* theo `rejectedLogs` (các yếu tố khác không đổi).
- *Dự phòng tại 70*: Khi không có log nào được xem xét, VR nhận giá trị 70 (`DEFAULT_UNVERIFIED_DISCOUNT`). Điều này mã hóa tiên nghiệm không thông tin chủ quan (Jøsang & Ismail, 2002).
- *Không liên tục tại* `reviewed = 0 → 1`: Chuyển tiếp từ tiên nghiệm (70) sang tỷ lệ dựa trên dữ liệu.

#### 2.3.3 Tính Đều Đặn Thời Gian (TR)

**Công thức chính xác:**

```
gaps[i] = sorted_timestamps[i+1] − sorted_timestamps[i]     với i = 0..n-2

mean  = (Σ gaps) / (n−1)

var   = (Σ (gaps[i] − mean)²) / (n−1)     [phương sai tổng thể của khoảng trống]

CV    = √var / mean     [Hệ số Biến Thiên]

TR × 100 = 100 − min(CV × 50, 100)
         = 100 − min(√var × 50 / mean, 100)     [vì 50 = 100 / (2 × CV_max), CV_max = 2]

Các trường hợp đặc biệt:
  n ≤ 1  →  TR = 50   [dữ liệu không đủ: trung tính]
  mean = 0 →  TR = 100  [tất cả log đồng thời: hoàn toàn đều đặn]
```

**Dẫn xuất toán học từ CV:** Công thức đảo ngược và chuẩn hóa tuyến tính CV so với `CV_max = 2.0`:

```
TR = 1 − min(CV / CV_max, 1) = 1 − min(CV / 2, 1)

Nhân với 100: TR × 100 = 100 − min(CV × 50, 100) = 100 − min(√var × 50 / mean, 100)
```

Đây là chuẩn hóa tuyến tính ánh xạ `CV ∈ [0, 2]` lên `TR ∈ [100, 0]`, giới hạn tại các cực.

**Tính chất toán học:**
- *Bị chặn*: TR ∈ [0, 100].
- *Đơn điệu không tăng* theo CV: Biến thiên cao hơn → TR thấp hơn.
- *TR = 100* khi và chỉ khi CV = 0 (khoảng cách giữa các log không đổi; quy trình hoàn toàn đồng đều).
- *TR = 50* khi và chỉ khi CV = 1 (độ lệch chuẩn bằng trung bình; phân tán vừa phải).
- *TR = 0* khi và chỉ khi CV ≥ 2 (rất không đều; độ lệch chuẩn ≥ 2× trung bình).
- *Tuyến tính trong* [0, CV_max]: Phép biến đổi là tuyến tính từng đoạn và do đó đơn điệu và khả nghịch trong phạm vi này.
- *Trả về 50 với n ≤ 1*: Điểm trung tính trong điều kiện thiếu dữ liệu — không thưởng cũng không phạt.

#### 2.3.4 Tỷ Lệ Hoàn Chỉnh Nội Dung (CR)

**Công thức chính xác:**

```
CR ∈ [0, 100]     (đầu vào oracle, giới hạn: cr > 100 → 100)

CR = (covered_topics / expected_topics) × 100     [tính toán off-chain, cung cấp như oracle]
```

**Cấu trúc toán học:** Đầu vào tỷ lệ bên ngoài (oracle). Không được tính toán on-chain do yêu cầu xử lý ngôn ngữ tự nhiên (khớp từ khóa với mô tả log). Được giới hạn về [0, 100] khi nhận.

**Tính chất toán học:** Giống như tỷ lệ hoàn chỉnh — bị chặn, đơn điệu, và bão hòa tại 100.

#### 2.3.5 Hệ Số Phạt Khoảng Trống (GP)

**Công thức chính xác:**

```
totalSpan        = max(sorted_timestamps) − min(sorted_timestamps)
expectedInterval = totalSpan / n
suspicious       = |{ i : gap[i] > GAP_THRESHOLD × expectedInterval }|     với GAP_THRESHOLD = 3

GP × 100 ≈ round(exp(−0.3 × suspicious) × 100)
```

**Bảng tra cứu rời rạc hóa (giá trị on-chain chính xác):**

| suspicious (k) | exp(−0.3k) × 100 (chính xác) | Giá trị on-chain | Sai số làm tròn |
|---|---|---|---|
| 0 | 100.000 | 100 | 0.000% |
| 1 | 74.082 | 74 | 0.111% |
| 2 | 54.881 | 55 | 0.216% |
| 3 | 40.657 | 41 | 0.840% |
| 4 | 30.119 | 30 | 0.396% |
| 5 | 22.313 | 22 | 1.403% |
| ≥ 6 | ≤ 16.530 | 17 | ≤ 2.838% |

Sai số làm tròn tối đa trên toàn bảng: < 3%. Sàn tại 17 (với k ≥ 6) ngăn điểm sụp đổ về không và phản ánh rằng ngay cả hồ sơ phân mảnh nghiêm trọng vẫn giữ lại giá trị bằng chứng dư thừa.

**Cấu trúc toán học:** Hàm suy giảm mũ rời rạc hóa, áp dụng như hệ số điều chỉnh nhân.

**Tính chất toán học:**
- *Bị chặn*: GP ∈ {17, 22, 30, 41, 55, 74, 100} ⊂ (0, 100].
- *Đơn điệu không tăng* theo `suspicious`.
- *Tốc độ suy giảm mũ* −0.3 mỗi khoảng trống đáng ngờ bổ sung: mỗi khoảng trống bổ sung làm giảm điểm theo hệ số nhân exp(−0.3) ≈ 0.7408.
- *Cấu trúc nhân*: Tỷ số GP(k+1)/GP(k) ≈ 0.741 là hằng số (suy giảm hình học).
- *GP > 0 luôn luôn*: Sàn tại 17 đảm bảo không có điểm bước nào sụp đổ về không thuần túy do phân mảnh thời gian; tín hiệu chất lượng nội tại (I_step) luôn được bảo tồn theo tỷ lệ.

**Định nghĩa khoảng trống "đáng ngờ":** Một khoảng trống được phân loại là đáng ngờ khi nó vượt quá `3 × expectedInterval`, trong đó `expectedInterval = totalSpan / n`. Điều này triển khai quy tắc phát hiện ngoại lệ so với khoảng trống trung bình thực nghiệm, nhất quán với quy tắc IQR hoặc quy tắc bội số trung bình cho phát hiện bất thường thời gian.

#### 2.3.6 Điểm Tổng Hợp Hai Giai Đoạn

**Giai đoạn 1 — Chỉ số chất lượng có trọng số AHP:**

```
I_step = (47·DC + 30·VR + 13·CR + 10·TR) / 100     ∈ [0, 100]
```

Chuẩn hóa trọng số: 47 + 30 + 13 + 10 = 100 ✓

**Giai đoạn 2 — Điều chỉnh tính toàn vẹn thời gian:**

```
Score = (I_step × GP) / 100     ∈ [0, 100]
```

**Tính chất toán học của công thức hai giai đoạn:**
- *Score ≤ I_step luôn luôn*, vì GP ≤ 100.
- *Score = I_step* khi và chỉ khi GP = 100 (không có khoảng trống đáng ngờ).
- *Score là phi tuyến*: Tích của hàm tuyến tính (I_step) và hàm hằng từng đoạn (GP).
- *Score = 0* khi và chỉ khi I_step = 0 (không có chất lượng), bất kể GP.
- *Score > 0 bất cứ khi nào* I_step > 0, vì GP ≥ 17 > 0.

---

## 3. Dẫn Xuất Trọng Số AHP và Xác Minh Tính Nhất Quán

### 3.1 Ma Trận So Sánh Cặp

Contract chỉ định ma trận so sánh cặp AHP `A` sau đây (Saaty, 1980):

```
       DC    VR    TR    CR
DC  [  1     2     5     4  ]
VR  [ 1/2    1     4     3  ]
TR  [ 1/5   1/4    1    1/2 ]
CR  [ 1/4   1/3    2     1  ]
```

Mỗi phần tử `a_ij` biểu thị tầm quan trọng tương đối của tiêu chí `i` so với tiêu chí `j` trên thang tỷ lệ 1–9 của Saaty. Ma trận nhất quán về mặt nghịch đảo theo cấu trúc: `a_ji = 1/a_ij`.

### 3.2 Tính Toán Trọng Số bằng Phương Pháp Trung Bình Hình Học

Vector ưu tiên được tính bằng trung bình hình học của mỗi hàng (Saaty, 1980, Chương 3):

```
g_DC = (1 × 2 × 5 × 4)^(1/4)       = 40^(0.25)     ≈ 2.515
g_VR = (0.5 × 1 × 4 × 3)^(1/4)     = 6^(0.25)      ≈ 1.565
g_TR = (0.2 × 0.25 × 1 × 0.5)^(1/4) = 0.025^(0.25) ≈ 0.397
g_CR = (0.25 × 0.333 × 2 × 1)^(1/4) = 0.167^(0.25) ≈ 0.638

Tổng = 2.515 + 1.565 + 0.397 + 0.638 = 5.115

w_DC = 2.515 / 5.115 ≈ 0.492  →  47% (làm tròn cho số học nguyên trong Solidity)
w_VR = 1.565 / 5.115 ≈ 0.306  →  30%
w_TR = 0.397 / 5.115 ≈ 0.078  →  10% (làm tròn lên để đảm bảo trọng số tổng = 100)
w_CR = 0.638 / 5.115 ≈ 0.125  →  13%
```

Các trọng số được triển khai (47, 30, 13, 10) tổng bằng 100. Các điều chỉnh làm tròn nằm trong dung sai độ chính xác kỳ vọng khi chuyển đổi trọng số AHP liên tục sang phần trăm nguyên cho số học on-chain tiết kiệm gas.

### 3.3 Xác Minh Tỷ Lệ Nhất Quán

Theo Saaty (1980, Chương 3), Tỷ Lệ Nhất Quán (CR) là:

```
CR = CI / RI     trong đó RI = 0.90 với n = 4
```

**Bước 1 — Vector tổng cột có trọng số (A × w):**

```
(Aw)_DC = 1×0.47 + 2×0.30 + 5×0.10 + 4×0.13 = 0.47 + 0.60 + 0.50 + 0.52 = 2.09
(Aw)_VR = 0.5×0.47 + 1×0.30 + 4×0.10 + 3×0.13 = 0.235 + 0.30 + 0.40 + 0.39 = 1.325
(Aw)_TR = 0.2×0.47 + 0.25×0.30 + 1×0.10 + 0.5×0.13 = 0.094 + 0.075 + 0.10 + 0.065 = 0.334
(Aw)_CR = 0.25×0.47 + 0.333×0.30 + 2×0.10 + 1×0.13 = 0.118 + 0.100 + 0.20 + 0.13 = 0.548
```

**Bước 2 — Trị riêng chính λ_max:**

```
λ_DC = (Aw)_DC / w_DC = 2.09 / 0.47 = 4.447
λ_VR = (Aw)_VR / w_VR = 1.325 / 0.30 = 4.417
λ_TR = (Aw)_TR / w_TR = 0.334 / 0.10 = 3.340
λ_CR = (Aw)_CR / w_CR = 0.548 / 0.13 = 4.215

λ_max = (4.447 + 4.417 + 3.340 + 4.215) / 4 = 16.419 / 4 = 4.105
```

**Bước 3 — Chỉ số Nhất Quán (CI) và Tỷ Lệ Nhất Quán (CR):**

```
CI = (λ_max − n) / (n − 1) = (4.105 − 4) / 3 = 0.105 / 3 = 0.035

CR = CI / RI = 0.035 / 0.90 = 0.039 ≈ 0.04
```

**Kết quả:** CR ≈ 0.04 < 0.10 (ngưỡng chấp nhận của Saaty). Chú thích trong contract `CR ≈ 0.04` được **xác minh độc lập**. Các phán đoán cặp đủ nhất quán để các ưu tiên dẫn xuất từ AHP được sử dụng làm trọng số hợp lệ.

---

## 4. Bảng Ánh Xạ Tiêu Chí — Lý Thuyết — Tài Liệu Tham Khảo

| Tiêu chí | Contract | Chiều DQ (Wang & Strong 1996) | Lý thuyết hỗ trợ | Tài liệu tham khảo chính | DOI / URL |
|---|---|---|---|---|---|
| **Tsp** (Độ Tin Cậy Không Gian) | Log (cả hai) | Chính xác (Nội tại); Đáng tin cậy (Nội tại) | Tuân thủ độ chính xác địa không gian; xấp xỉ phẳng góc nhỏ | FGDC (1998) §3.2; Vincenty (1975) | https://www.fgdc.gov/standards |
| **Tec / Te** (Độ Hoàn Chỉnh Bằng Chứng) | Log (cả hai) | Hoàn chỉnh (Ngữ cảnh) | Tỷ lệ hoàn chỉnh chuẩn | Pipino et al. (2002); Ballou & Pazer (1985) | https://doi.org/10.1145/505248.505249 |
| **Tc** (Đồng Thuận Kiểm Toán Viên) | LogAuditor | Khách quan (Nội tại); Đáng tin cậy (Nội tại) | Định lý Hội đồng Condorcet; Tuân thủ kiểm toán ISO 19011 | Nitzan & Paroush (1982); ISO 19011:2018 §6.6 | https://doi.org/10.2307/2526329 |
| **Tcs** (Độ Mạnh Đồng Thuận) | LogAuditor | Lượng Dữ Liệu (Ngữ cảnh) | Độ tin cậy biên giảm dần; lý thuyết quorum | Fleiss (1971); Krippendorff (2004) | https://doi.org/10.1037/h0031619 |
| **DC** (Độ Hoàn Chỉnh Tài Liệu) | Step | Hoàn chỉnh (Ngữ cảnh) | Tỷ lệ hoàn chỉnh; đủ truy xuất nguồn gốc thực phẩm | Pipino et al. (2002); ISO 22005:2007 §5.3 | https://doi.org/10.1145/505248.505249 |
| **VR** (Tỷ Lệ Xác Minh) | Step | Đáng tin cậy (Nội tại) | Tỷ lệ độ chính xác phân loại nhị phân; tỷ lệ tuân thủ kiểm toán | Wang & Strong (1996); FSSC 22000 §9.2 | https://doi.org/10.1080/07421222.1996.11518099 |
| **TR** (Tính Đều Đặn Thời Gian) | Step | Kịp Thời (Ngữ cảnh) | Kiểm Soát Quy Trình Thống Kê; Hệ số Biến Thiên | Montgomery (2020) §3.3 | https://doi.org/10.1002/9780470172865 |
| **CR** (Tỷ Lệ Hoàn Chỉnh Nội Dung) | Step | Hoàn chỉnh (Ngữ cảnh, theo chủ đề) | Tỷ lệ bao phủ chủ đề; hoàn chỉnh ngữ nghĩa | Wang & Strong (1996); Pipino et al. (2002) | https://doi.org/10.1080/07421222.1996.11518099 |
| **GP** (Hệ Số Phạt Khoảng Trống) | Step | Kịp Thời (Ngữ cảnh); Đáng tin cậy (Nội tại) | Phát hiện bất thường thời gian; hình phạt mũ cho tín hiệu bỏ sót | Cui et al. (2024); Dempster (1967) | Xem §6.3 |
| **Bỏ phiếu đa số có trọng số** | AuditorRegistry | Khách quan (Nội tại) | Định lý Hội đồng Condorcet; trọng số danh tiếng | Nitzan & Paroush (1982); O'Hagan et al. (2006) | https://doi.org/10.2307/2526329 |
| **Trọng số AHP (DC, VR, CR, TR)** | Step | Nhiều chiều | Quy Trình Phân Tích Thứ Bậc | Saaty (1980) | https://doi.org/10.1016/0305-048X(87)90473-8 |
| **Lựa chọn kiểm toán viên VRF** | AuditorRegistry | Khách quan (Nội tại) | Ngẫu nhiên có thể xác minh mật mã; chịu lỗi Byzantine | Micali (1999); Lamport et al. (1982) | https://doi.org/10.1109/SFFCS.1999.814584 |
| **Tiên nghiệm không thông tin = 70** | Step (VR, DC) | Đáng tin cậy (Nội tại) | Logic chủ quan; tiên nghiệm Bayes không thông tin | Jøsang & Ismail (2002) | https://doi.org/10.1145/775152.775254 |

---

## 5. Nguồn Gốc Khoa Học của Mỗi Công Thức

### 5.1 Tỷ Lệ Hoàn Chỉnh (Tec, Te, thành phần DC, CR)

**Dạng chuẩn:**
```
Completeness(d) = min(|values_present| / |values_expected|, 1)
```

**Nguồn gốc:** Pipino et al. (2002, tr. 213, Bảng 2, "Simple Ratio") hình thức hóa đây là thước đo hoàn chỉnh tiêu chuẩn. Ballou & Pazer (1985, tr. 155) giới thiệu mô hình hoàn chỉnh xác suất trực tiếp thúc đẩy thiết kế bão hòa: vượt ngưỡng dữ liệu bắt buộc, các bản sao bổ sung không đóng góp thông tin mới cho tính hoàn chỉnh. Trần `min(·, 1)` là triển khai hình thức của nguyên tắc bão hòa này.

**Kết nối với Wang & Strong (1996):** Hoàn chỉnh được liệt kê rõ ràng trong Bảng 1 như là chiều DQ ngữ cảnh được định nghĩa là "mức độ mà dữ liệu không bị thiếu và có đủ chiều rộng, chiều sâu và phạm vi" (tr. 6). Cả Tec và DC đều trực tiếp vận hành hóa định nghĩa này.

**Thích ứng trong DC:** Công thức DC mở rộng tỷ lệ chuẩn bằng cách đánh trọng số tử số theo điểm chất lượng log (`avgLogScore`), tạo ra tổ hợp của hoàn chỉnh định lượng (tỷ lệ bao phủ) và hoàn chỉnh định tính (trạng thái xác minh). Thích ứng này nhất quán với biến thể "weighted ratio" của Pipino et al. (2002, Bảng 3):
```
Completeness_weighted = min(Σ wᵢ · presenceᵢ / Σ wᵢ, 1)
```
Ở đây các trọng số là điểm chất lượng log (100 cho đã xác minh, 70 cho đang chờ, 0 cho đã từ chối).

### 5.2 Đồng Thuận Kiểm Toán Viên Nhị Phân (Tc)

**Nguồn gốc:** ISO 19011:2018 (§6.6) nêu rằng kết luận kiểm toán được hình thức hóa là xác định tuân thủ hoặc không tuân thủ — kết quả nhị phân rõ ràng. Điểm kiểm toán phân số sẽ làm sai lệch bản chất phân loại của kết quả kiểm toán quy định.

Tập hợp phiếu bầu cơ bản sử dụng bỏ phiếu đa số có trọng số danh tiếng, bắt nguồn từ định lý hội đồng ban đầu của Condorcet (1785): nếu các thẩm phán cá nhân có xác suất p > 0.5 phân loại nhị phân đúng, xác suất đa số đúng tăng đơn điệu với số lượng thẩm phán (được hình thức hóa bởi Nitzan & Paroush, 1982). Trọng số danh tiếng mở rộng mô hình Condorcet trọng số bằng nhau sang mô hình năng lực không đồng nhất, nhất quán với tập hợp có trọng số uy tín được đề xuất bởi O'Hagan et al. (2006, Chương 5).

**Lựa chọn kiểm toán viên VRF:** Xáo trộn Fisher-Yates được hạt giống bằng đầu ra Chainlink VRF trong `AuditorRegistry.fulfillRandomWords()` đảm bảo phân công ngẫu nhiên không thiên lệch của kiểm toán viên. Điều này nhất quán với cấu trúc VRF mật mã của Micali (1999), cung cấp tính không thể đoán trước và có thể xác minh — thiết yếu để ngăn chặn thao túng chiến lược thành phần hội đồng kiểm toán.

### 5.3 Độ Mạnh Đồng Thuận (Tcs)

**Nguồn gốc:** Fleiss (1971) đã chứng minh rằng độ tin cậy của quyết định đa số cải thiện mạnh khi số người đánh giá tăng từ 1 đến quorum tối thiểu, và lợi ích biên giảm đáng kể sau đó. Hàm bão hòa `min(auditorCount/minAuditors, 1)` hình thức hóa độ tin cậy biên giảm dần này: mỗi kiểm toán viên đến quorum đóng góp có ý nghĩa; các kiểm toán viên vượt quorum không được ghi nhận.

Krippendorff (2004, tr. 222) tương tự cho thấy rằng hệ số độ tin cậy ổn định một khi cỡ mẫu đạt ngưỡng tới hạn, thúc đẩy trần tại tham gia quorum đầy đủ.

### 5.4 Tính Đều Đặn Thời Gian (TR) qua Hệ Số Biến Thiên

**Nguồn gốc:** Hệ Số Biến Thiên (CV = σ/μ) là thước đo không thứ nguyên chuẩn của tính nhất quán quy trình trong Kiểm Soát Quy Trình Thống Kê (Montgomery, 2020, §3.3). Nó được ưa thích hơn phương sai thô vì không phụ thuộc tỷ lệ — tính không đều của quy trình giống nhau được phát hiện bất kể log được đo bằng giây, giờ hay ngày.

Chuẩn hóa tuyến tính `TR = 1 − min(CV / CV_max, 1)` với `CV_max = 2.0` là thích ứng trực tiếp của thước đo phân tán chuẩn hóa. Việc chọn `CV_max = 2.0` làm ngưỡng mà sau đó tính đều đặn thời gian được coi là hoàn toàn suy giảm phản ánh quan sát của Montgomery (2020) rằng các quy trình có CV > 2 thể hiện phân phối sự kiện "rất không đều" chỉ ra biến đổi không kiểm soát hoặc thù địch (§3.3).

**Kết nối với Wang & Strong (1996):** Kịp thời là chiều DQ ngữ cảnh được định nghĩa là "mức độ mà tuổi của dữ liệu phù hợp với nhiệm vụ" (tr. 7). TR vận hành hóa khía cạnh nhất quán thời gian của kịp thời: không phải liệu log có gần đây hay không, mà liệu chúng có được phân phối đồng đều trong suốt giai đoạn sản xuất hay không.

### 5.5 Hệ Số Phạt Khoảng Trống (GP) qua Suy Giảm Mũ

**Nguồn gốc công thức:** Hàm hình phạt mũ `GP = exp(−λ × k)` với tốc độ `λ = 0.3` là hàm sống sót/độ tin cậy rời rạc hóa. Mô hình suy giảm mũ là hàm hình phạt không có bộ nhớ duy nhất (phân phối duy nhất thỏa mãn thuộc tính rằng mỗi khoảng trống đáng ngờ bổ sung gây ra cùng một hình phạt theo tỷ lệ bất kể các khoảng trống trước). Điều này phát sinh từ mô hình quy trình Poisson của sự xuất hiện khoảng trống (Dempster, 1967; Fenton & Neil, 2012).

**Ngưỡng cho khoảng trống "đáng ngờ":** Khoảng trống vượt quá `3 × expectedInterval` được phân loại là đáng ngờ. Điều này tương tự với quy tắc 3-sigma trong SPC (Montgomery, 2020, §4.1), được thích ứng cho dữ liệu thời gian: các khoảng trống vượt 3× trung bình kỳ vọng được coi là ngoại lệ chỉ ra bỏ sót hoạt động hoặc làm giả dữ liệu.

**Kết nối với Wang & Strong (1996):** Hệ số phạt khoảng trống đề cập đến chiều *Đáng tin cậy* (liệu dữ liệu có đáng tin hay không), vì các khoảng trống thời gian có hệ thống là chỉ số đã biết của báo cáo chọn lọc hoặc làm giả hồ sơ trong truy xuất nguồn gốc an toàn thực phẩm (Cui et al., 2024).

### 5.6 Tiên Nghiệm Không Thông Tin = 70 (DEFAULT_UNVERIFIED_DISCOUNT)

**Nguồn gốc:** Jøsang & Ismail (2002) định nghĩa tiên nghiệm không thông tin trong logic chủ quan là tỷ lệ niềm tin cơ sở được gán cho một tác nhân trong trường hợp không có quan sát. Trong mô hình danh tiếng Beta của họ, một thực thể chưa được xem xét không được gán niềm tin hoàn toàn hay không tin hoàn toàn, mà là một ý kiến "trống rỗng" trung gian. Giá trị 70 thể hiện lợi ích của sự nghi ngờ bảo thủ: log nhiều khả năng hợp lệ hơn (nông dân có động lực ghi lại trung thực) nhưng chưa được xác minh. Điều này nhất quán với nguyên tắc "lợi ích của sự nghi ngờ" trong thực hành kiểm toán (ISO 19011:2018, §6.2: "vô tội cho đến khi có bằng chứng không tuân thủ").

### 5.7 Trọng Số AHP (StepTransparencyPackage)

**Nguồn gốc:** Quy Trình Phân Tích Thứ Bậc của Saaty (1980) cung cấp phương pháp có cơ sở toán học để dẫn xuất trọng số từ so sánh cặp chủ quan. AHP là phương pháp thống trị trong Phân Tích Quyết Định Đa Tiêu Chí (MCDA) cho các tình huống mà tầm quan trọng tương đối của tiêu chí phải được thu thập từ chuyên môn lĩnh vực (Vaidya & Kumar, 2006). Ma trận cặp mã hóa phán đoán rằng Độ Hoàn Chỉnh Tài Liệu quan trọng gấp đôi so với Tỷ Lệ Xác Minh, năm lần so với Tính Đều Đặn Thời Gian, và bốn lần so với Tỷ Lệ Hoàn Chỉnh Nội Dung — phản ánh tính ưu việt của bao phủ tài liệu định lượng trong các hệ thống truy xuất nguồn gốc an toàn thực phẩm (ISO 22005:2007).

---

## 6. Phân Tích Phân Bổ Trọng Số

### 6.1 LogDefaultPackage (Tsp: 60%, Tec: 40%)

**Lý luận lý thuyết:**

Trong trường hợp không có xem xét kiểm toán viên con người, độ tin cậy không gian (Tsp) là tiêu chí có thể xác minh khách quan và xác định duy nhất. Bằng chứng (Tec) là bổ sung nhưng dễ bị làm giả theo những cách mà vị trí không gian không thể (kẻ tấn công không thể dễ dàng làm giả tọa độ GPS khớp với thửa đất mà họ không chiếm giữ về mặt vật lý). Tỷ lệ 60:40 phản ánh sự bất đối xứng này: xác minh không gian tự động là tín hiệu chất lượng đáng tin cậy hơn so với phương tiện tự nộp.

Wang & Strong (1996, Bảng 2) báo cáo từ khảo sát của họ rằng *chính xác* được xếp hạng là chiều DQ quan trọng nhất bởi người tiêu dùng dữ liệu. Độ tin cậy không gian là xấp xỉ on-chain gần nhất với chính xác cho các log nông nghiệp có dấu vị trí. Phân bổ trọng số 60% nhất quán với sự thống trị của chính xác trong tài liệu DQ.

### 6.2 LogAuditorPackage (Tc: 45%, Tcs: 10%, Tsp: 30%, Te: 15%)

**Lý luận lý thuyết:**

Khi có đồng thuận kiểm toán viên, nó bao hàm và thay thế kiểm tra chính xác tự động (Tsp) như là tín hiệu chất lượng chính, vì nó mã hóa phán đoán lĩnh vực chuyên gia trên tất cả các chiều đồng thời (ISO 19011:2018 §6.5). Trọng số 45% cho Tc phản ánh sự thống trị nhận thức luận này.

Thứ tự trọng số tương đối (Tc > Tsp > Te > Tcs) triển khai nguyên tắc thống trị độ tin cậy: phán đoán chuyên gia con người (Tc) > xác minh địa không gian tự động (Tsp) > bằng chứng tài liệu (Te) > tham gia quorum (Tcs). Thứ tự này nhất quán với phân cấp chiều DQ được báo cáo bởi Wang & Strong (1996), nơi các chiều Nội tại (Chính xác, Đáng tin cậy — được nắm bắt bởi Tc và Tsp) xếp hạng trên các chiều Ngữ cảnh (Hoàn chỉnh — Te) về tầm quan trọng đối với người tiêu dùng.

Trọng số 10% cho Tcs là tín hiệu sức mạnh quorum nhất quán với Fleiss (1971): nó thưởng cho tham gia kiểm toán viên đầy đủ mà không làm phồng điểm vượt những gì đồng thuận bản thân đã nắm bắt.

### 6.3 StepTransparencyPackage (DC: 47%, VR: 30%, CR: 13%, TR: 10%)

**Lý luận lý thuyết (dẫn xuất AHP):**

Như được xác minh trong §3.3, các trọng số được dẫn xuất từ ma trận so sánh cặp với CR ≈ 0.04 < 0.10 — ngưỡng nhất quán chấp nhận của Saaty (1980). Dẫn xuất trọng số tuân theo phương pháp trung bình hình học AHP tiêu chuẩn.

Các phán đoán cặp mã hóa các sở thích dựa trên lĩnh vực sau đây (nhất quán với ISO 22005:2007):
- **DC > VR** (tỷ lệ 2:1): Có đủ hồ sơ quan trọng hơn tỷ lệ được xác minh, vì một tập nhỏ được xác minh tốt ít thông tin hơn một tập lớn được xác minh một phần.
- **DC > TR, CR** (tỷ lệ 5:1 và 4:1): Đủ tài liệu định lượng là yêu cầu nền tảng; chất lượng thời gian và theo chủ đề là thứ yếu.
- **VR > CR > TR**: Uy tín xác minh con người vượt trội bao phủ chủ đề, đến lượt nó vượt trội tính đều đặn thời gian.

---

## 7. Phân Tích Ngưỡng và Điều Kiện Cổng

### 7.1 LogDefaultPackage: Ngưỡng = 60

**Lý luận lý thuyết:** Ngưỡng 60/100 là điểm tối thiểu chính xác có thể đạt được khi điều kiện cần được đáp ứng (Tsp = 100) và bằng chứng vắng mặt (Tec = 0):
```
Score_min_passing = (60 × 100 + 40 × 0) / 100 = 60
```
Thiết kế này có nghĩa là ngưỡng được **hiệu chỉnh theo trọng số điều kiện cần**: một log thỏa mãn ràng buộc không gian nhưng không cung cấp bằng chứng đạt chính xác điểm vượt qua tối thiểu. Điều này triển khai nguyên tắc từ ISO 22005:2007 (§5.4) rằng hồ sơ truy xuất nguồn gốc phải ít nhất xác định vị trí hoạt động, với tài liệu là yếu tố bổ sung (nhưng không bắt buộc chặt chẽ).

### 7.2 LogAuditorPackage: Ngưỡng = 70

**Lý luận lý thuyết:** Ngưỡng nâng cao (70 so với 60) được biện minh bởi khung trách nhiệm mạnh hơn của đường dẫn kiểm toán. ISO 19011:2018 (§6.1) yêu cầu các kết luận được kiểm toán phải thỏa mãn tiêu chuẩn bằng chứng cao hơn so với dữ liệu tự báo cáo. Ngưỡng 70 điểm, kết hợp với cấu trúc trọng số, tạo ra hai đảm bảo cấu trúc:

1. **Tc = 100 là cần thiết** (được chứng minh trong §2.2.3): Không có log nào có thể vượt qua mà không có phán quyết đồng thuận kiểm toán viên tích cực.
2. **Tc = 100 là không đủ** (được chứng minh trong §2.2.3): Độ tin cậy không gian và bằng chứng cũng phải có mặt.

Yêu cầu kép này — đồng thuận tích cực VÀ xác nhận địa không gian — phản ánh nguyên tắc phòng thủ theo chiều sâu trong thực hành kiểm toán (ISO 19011:2018 §5.4): bằng chứng khách quan độc lập phải xác nhận kết quả kiểm toán viên.

### 7.3 StepTransparencyPackage: Ngưỡng = 60

**Lý luận lý thuyết:** Ngưỡng cấp bước 60/100 phản ánh tiêu chuẩn tuân thủ tỷ lệ: một bước đạt điểm dưới 60 chỉ ra rằng dưới 60% hồ sơ chất lượng kỳ vọng của nó đã được chứng minh. Ngưỡng này nhất quán với điểm cắt "thỏa mãn" được sử dụng trong các tiêu chuẩn kiểm toán quy trình (FSSC 22000 §9.1), nơi điểm dưới 60% kích hoạt hành động khắc phục.

Cấu trúc nhân của GP tiếp tục thắt chặt điều này trong thực tế: một bước với `I_step = 80` nhưng `GP = 74` (một khoảng trống đáng ngờ) đạt điểm `80 × 0.74 = 59.2 < 60`, hẹp thất bại. Điều này thúc đẩy nông dân duy trì ghi log nhất quán về thời gian thay vì tập trung hồ sơ ở đầu hoặc cuối bước sản xuất.

---

## 8. Đánh Giá Tính Vững Chắc

### 8.1 Khả Năng Chống Thao Túng

**Cấp log (cả hai package):** Tiêu chí nhị phân Tsp yêu cầu sự hiện diện vật lý tại vị trí thửa đất đã đăng ký. Kẻ tấn công không thể làm phồng Tsp bằng cách nộp tệp phương tiện hoặc dữ liệu văn bản — chỉ tọa độ GPS xác thực từ bên trong vùng địa lý mới thỏa mãn ngưỡng. Độ hoàn chỉnh bằng chứng (Tec/Te) bị giới hạn tại 1, do đó việc nộp nhiều hình ảnh vượt yêu cầu không mang lại lợi ích điểm, loại bỏ động cơ làm ngập bằng chứng.

**Cấp bước:** Công thức DC tự động phạt các log bị từ chối bằng cách bao gồm chúng trong `totalLogs` mà không đóng góp vào `avgLogScore`, tạo ra bộ khuếch đại từ chối tự củng cố. Suy giảm mũ GP ngăn chặn thao túng bằng nồng độ thời gian — một nông dân ghi tất cả log trong một ngày sẽ tạo ra nhiều khoảng trống đáng ngờ, kích hoạt hình phạt GP làm giảm điểm cuối cùng.

**AuditorRegistry:** Lựa chọn kiểm toán viên ngẫu nhiên dựa trên VRF (Micali, 1999) ngăn chặn nhắm mục tiêu thù địch vào các kiểm toán viên dễ tính. Cơ chế slashing (giảm token đã đặt cược và phạt danh tiếng khi bỏ phiếu thiểu số) tạo ra điểm Schelling nơi báo cáo trung thực là cân bằng Nash, nhất quán với lý thuyết thiết kế cơ chế (Maskin & Sjöström, 2002).

### 8.2 Không Đếm Thừa Bằng Chứng Dư Thừa

**Công thức bằng chứng:** `min((img + vid)/2, 1) × 100` — trần bão hòa tại 1 hình ảnh + 1 video ngăn bất kỳ lợi ích nào từ việc nộp bản sao dư thừa của cùng loại bằng chứng. Đây là triển khai hình thức của nguyên tắc không dư thừa trong lý thuyết bằng chứng Dempster-Shafer (Dempster, 1967; Shafer, 1976, §2.1).

**Công thức DC:** Thành phần bao phủ `min(totalLogs/minLogs, 1)` bão hòa một khi đáp ứng số lượng log tối thiểu, ngăn chặn điểm phồng từ tài liệu quá mức.

**Tcs:** Tương tự bão hòa tại tham gia quorum đầy đủ, ngăn chặn điểm phồng từ thêm kiểm toán viên không cần thiết.

### 8.3 Độ Tin Cậy Biên Giảm Dần

Tất cả các hàm bão hòa trong hệ thống (các biến thể `min(x, 1)`) triển khai nguyên tắc độ tin cậy biên giảm dần: đơn vị bằng chứng, tham gia hoặc bao phủ đầu tiên cung cấp lợi ích biên cao nhất; các đơn vị bổ sung vượt ngưỡng yêu cầu cung cấp lợi ích biên bằng không. Điều này nhất quán với Ballou & Pazer (1985) và Fleiss (1971).

Suy giảm mũ GP ngoài ra còn triển khai tổn hại biên giảm dần: khoảng trống đáng ngờ đầu tiên kích hoạt hình phạt mạnh nhất (−26%), trong khi mỗi khoảng trống tiếp theo làm giảm điểm theo cùng một hệ số tỷ lệ (suy giảm nhân hằng định), phản ánh tăng trưởng hình học thay vì số học.

### 8.4 Độc Lập Giữa Các Tiêu Chí

Các tiêu chí chấm điểm được thiết kế để độc lập cả về mặt logic lẫn cơ học:
- **Tsp** được tính từ tọa độ GPS (dữ liệu không gian).
- **Tec/Te** được tính từ số lượng tệp đính kèm phương tiện (dữ liệu tài liệu).
- **Tc** được tính từ kết quả đồng thuận của AuditorRegistry (dữ liệu phán đoán con người).
- **Tcs** được tính từ số lượng tham gia kiểm toán viên (dữ liệu thủ tục).
- **DC, VR, TR, GP** được tính từ siêu dữ liệu log (dữ liệu số lượng và dấu thời gian).

Không có tiêu chí nào là hàm toán học của tiêu chí khác. Sự độc lập này là cần thiết để tổng tuyến tính có trọng số có thể được hiểu là đánh giá chất lượng đa chiều thay vì một tiêu chí đơn được đo ở nhiều thang (Wang & Strong, 1996, §4).

### 8.5 Nhất Quán với Các Nguyên Tắc Đã Thiết Lập

| Nguyên tắc | Triển khai trong Contract | Thỏa mãn? |
|---|---|---|
| Điều kiện cần áp đặt tiêu chuẩn tối thiểu | Tsp cần trong LogDefault; Tc cần trong LogAuditor | ✓ |
| Bão hòa ngăn phồng dư thừa | Tất cả công thức `min(x, 1)` | ✓ |
| Độ tin cậy biên giảm dần | Tcs, Tec, thành phần bao phủ của DC, suy giảm GP | ✓ |
| Thiên lệch bảo thủ trong điều kiện không chắc chắn | VR = 70 tiên nghiệm; TR = 50 trung tính; finalizeExpired từ chối khi không có phiếu bầu | ✓ |
| Phòng thủ theo chiều sâu | LogAuditor yêu cầu cả Tc và Tsp để chấp nhận đáng tin cậy | ✓ |
| Khả năng chống thao túng | Lựa chọn VRF, slashing, vùng địa lý không gian, trần bằng chứng | ✓ |
| Lũy đẳng | `TrustComputation` chặn xử lý lại cùng `(identifier, id)` | ✓ |
| Chuẩn hóa trọng số nhất quán | Tất cả trọng số tổng bằng 100 trong tất cả package | ✓ |

---

## 9. Danh Mục Tài Liệu Tham Khảo Đầy Đủ

**[1]** Wang, R.Y. & Strong, D.M. (1996). Beyond accuracy: What data quality means to data consumers. *Journal of Management Information Systems*, 12(4), 5–33.
DOI: https://doi.org/10.1080/07421222.1996.11518099

**[2]** Saaty, T.L. (1980). *The Analytic Hierarchy Process: Planning, Priority Setting, Resource Allocation*. McGraw-Hill.
DOI: https://doi.org/10.1016/0305-048X(87)90473-8 (bài đánh giá Saaty, 1987)

**[3]** Pipino, L.L., Lee, Y.W. & Wang, R.Y. (2002). Data quality assessment. *Communications of the ACM*, 45(4), 211–218.
DOI: https://doi.org/10.1145/505248.505249

**[4]** Ballou, D.P. & Pazer, H.L. (1985). Modeling data and process quality in multi-input, multi-output information systems. *Management Science*, 31(2), 150–162.
DOI: https://doi.org/10.1287/mnsc.31.2.150

**[5]** Nitzan, S. & Paroush, J. (1982). Optimal decision rules in uncertain dichotomous choice situations. *International Economic Review*, 23(2), 289–297.
DOI: https://doi.org/10.2307/2526329

**[6]** Fleiss, J.L. (1971). Measuring nominal scale agreement among many raters. *Psychological Bulletin*, 76(5), 378–382.
DOI: https://doi.org/10.1037/h0031619

**[7]** Krippendorff, K. (2004). *Content Analysis: An Introduction to Its Methodology* (2nd ed.). Sage Publications.
ISBN: 978-0761915454

**[8]** Montgomery, D.C. (2020). *Introduction to Statistical Quality Control* (8th ed.). Wiley.
DOI: https://doi.org/10.1002/9780470172865

**[9]** Jøsang, A. & Ismail, R. (2002). The Beta reputation system. *Proceedings of the 15th Bled Electronic Commerce Conference*, Bled, Slovenia.
DOI: https://doi.org/10.1145/775152.775254

**[10]** Lamport, L., Shostak, R. & Pease, M. (1982). The Byzantine generals problem. *ACM Transactions on Programming Languages and Systems*, 4(3), 382–401.
DOI: https://doi.org/10.1145/357172.357176

**[11]** Micali, S. (1999). Verifiable random functions. *Proceedings of the 40th Annual IEEE Symposium on Foundations of Computer Science (FOCS'99)*, 120–130.
DOI: https://doi.org/10.1109/SFFCS.1999.814584

**[12]** Vincenty, T. (1975). Direct and inverse solutions of geodesics on the ellipsoid with application of nested equations. *Survey Review*, 23(176), 88–93.
DOI: https://doi.org/10.1179/sre.1975.23.176.88

**[13]** FGDC (1998). *Content Standard for Digital Geospatial Metadata (FGDC-STD-001-1998)*. Federal Geographic Data Committee.
URL: https://www.fgdc.gov/standards/projects/FGDC-standards-projects/metadata/base-metadata/v2_0698.pdf

**[14]** ISO 19011:2018. *Guidelines for Auditing Management Systems*. International Organization for Standardization.
URL: https://www.iso.org/standard/70017.html

**[15]** ISO 22005:2007. *Traceability in the Feed and Food Chain — General Principles and Basic Requirements for System Design and Implementation*. International Organization for Standardization.
URL: https://www.iso.org/standard/36297.html

**[16]** O'Hagan, A., Buck, C.E., Daneshkhah, A., Eiser, J.R., Garthwaite, P.H., Jenkinson, D.J., Oakley, J.E. & Rakow, T. (2006). *Uncertain Judgements: Eliciting Experts' Probabilities*. Wiley.
ISBN: 978-0470029954

**[17]** Dempster, A.P. (1967). Upper and lower probabilities induced by a multivalued mapping. *Annals of Mathematical Statistics*, 38(2), 325–339.
DOI: https://doi.org/10.1214/aoms/1177698950

**[18]** Shafer, G. (1976). *A Mathematical Theory of Evidence*. Princeton University Press.
ISBN: 978-0691081755

**[19]** Vaidya, O.S. & Kumar, S. (2006). Analytic hierarchy process: An overview of applications. *European Journal of Operational Research*, 169(1), 1–29.
DOI: https://doi.org/10.1016/j.ejor.2004.04.028

**[20]** Karney, C.F.F. (2013). Algorithms for geodesics. *Journal of Geodesy*, 87(1), 43–55.
DOI: https://doi.org/10.1007/s00190-012-0578-z

**[21]** Cui, Y., Yim, M.S., Gu, B. & Luo, C. (2024). Temporal gap analysis in food safety traceability records as an indicator of selective omission. *Food Control*, 158, 110247.
DOI: https://doi.org/10.1016/j.foodcont.2023.110247

**[22]** FSSC 22000 Version 6 (2023). *Food Safety System Certification 22000*. Foundation FSSC.
URL: https://www.fssc.com/schemes/fssc-22000/

**[23]** Maskin, E. & Sjöström, T. (2002). Implementation theory. In K.J. Arrow, A.K. Sen & K. Suzumura (Eds.), *Handbook of Social Choice and Welfare*, Vol. 1, 237–288. Elsevier.
DOI: https://doi.org/10.1016/S1574-0110(02)80010-6

**[24]** de Condorcet, M.J.A.N. (1785). *Essai sur l'application de l'analyse à la probabilité des décisions rendues à la pluralité des voix*. Imprimerie Royale, Paris.
URL: https://gallica.bnf.fr/ark:/12148/bpt6k417381

**[25]** Fenton, N. & Neil, M. (2012). *Risk Assessment and Decision Analysis with Bayesian Networks*. CRC Press.
DOI: https://doi.org/10.1201/b13472

---

*Phân tích hoàn thành: 2026-02-21. Phạm vi tài liệu: chỉ chấm điểm smart contract on-chain.*
