# Chainlink Functions — CR Oracle Integration Plan

## Mục tiêu

Tích hợp **Content Completeness Ratio (CR)** vào log trust score thông qua Chainlink Functions — giải quyết oracle problem bằng cách phi tập trung hóa quá trình tính CR thay vì tin tưởng vào một backend oracle duy nhất.

CR đo mức độ log text đề cập đủ các chủ đề yêu cầu cho loại hoạt động (activity type) của step, dựa trên keyword matching.

**Lý do chọn Chainlink Functions:** DON (Decentralized Oracle Network) với nhiều node độc lập chạy cùng logic JS — không node nào đơn lẻ có thể làm giả CR. Kết quả được aggregate và signed on-chain.

---

## Kiến trúc tổng quan

```
Farmer submit log
      │
      ▼
Backend lưu log text → IPFS → lấy CID
      │
      ▼
TrustComputation.requestCR(logId, ipfsCID, activityType)
      │
      ▼
Chainlink Functions DON
  ├─ Node 1: fetch IPFS CID → keyword match → cr_1
  ├─ Node 2: fetch IPFS CID → keyword match → cr_2
  └─ Node 3: fetch IPFS CID → keyword match → cr_3
  → consensus → cr (median)
      │
      ▼
CROracle.fulfillRequest(requestId, cr)  ← callback on-chain
  → lưu cr vào mapping[logId]
      │
      ▼
TrustComputation.computeLogScore(logId)
  → đọc cr từ mapping, đưa vào formula
```

---

## Thay đổi cần thực hiện

### 1. Smart Contract mới: `CROracle.sol`

```
src/trustworthiness/oracle/CROracle.sol
```

Kế thừa `FunctionsClient` từ Chainlink. Nhiệm vụ:
- Nhận request tính CR cho một log (logId, ipfsCID, activityType)
- Gửi request đến Chainlink DON
- Nhận callback với CR value
- Lưu CR vào `mapping(bytes32 logId => uint128 cr)`
- Expose `getCR(bytes32 logId) external view returns (uint128)`

```solidity
// Interface tham khảo
contract CROracle is FunctionsClient {
    mapping(bytes32 => uint128) public contentRatio;
    mapping(bytes32 => bytes32) private requestToLog; // requestId → logId

    function requestCR(
        bytes32 logId,
        string calldata ipfsCID,
        string calldata activityType
    ) external returns (bytes32 requestId);

    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override;

    function getCR(bytes32 logId) external view returns (uint128);
}
```

### 2. Cập nhật `LogDefaultPackage.sol`

Thêm `cr` vào payload — lấy từ `CROracle.getCR(logId)` trước khi gọi `computeTrustScore`:

```
Weights mới: 50·Tsp + 30·Tec + 20·CR = 100
Gate condition: Tsp=0 → max = 50 < 60 → always fail ✓
```

Payload struct:
```solidity
struct LogData {
    uint128 imageCount;
    uint128 videoCount;
    uint128 cr;          // từ CROracle.getCR(logId)
    Location logLocation;
    Location plotLocation;
}
```

### 3. Cập nhật `LogAuditorPackage.sol`

```
Weights mới: 45·Tc + 25·Tsp + 15·Te + 15·CR = 100
Gate condition: Tc=0 → max = 55 < 70 → always fail ✓
```

Payload struct:
```solidity
struct LogAuditorData {
    bytes32 identifier;
    uint64 id;
    uint128 imageCount;
    uint128 videoCount;
    uint128 cr;          // từ CROracle.getCR(logId)
    Location logLocation;
    Location plotLocation;
}
```

### 4. JavaScript source cho Chainlink Functions

File: `src/chainlink-functions/computeCR.js`

Logic:
1. Nhận args: `[ipfsCID, activityType]`
2. Fetch log text từ IPFS gateway
3. Load keyword vocabulary cho `activityType` (embed trong script hoặc fetch từ một API cố định)
4. Keyword matching: đếm số topics được đề cập / tổng topics yêu cầu
5. Return `cr` as `uint256` encoded

```javascript
// computeCR.js — Chainlink Functions source
const ipfsCID = args[0];
const activityType = args[1];

// Fetch log text from IPFS
const ipfsResponse = await Functions.makeHttpRequest({
  url: `https://ipfs.io/ipfs/${ipfsCID}`,
});
if (ipfsResponse.error) throw new Error("IPFS fetch failed");
const logText = ipfsResponse.data.toLowerCase();

// Keyword vocabularies per activity type
const vocabularies = {
  PLANTING: ["giống", "mật độ", "độ sâu", "khoảng cách", "đất"],
  CARE_WATERING: ["tưới", "lượng nước", "thời gian", "nguồn nước"],
  CARE_FERTILIZING: ["phân", "npk", "liều lượng", "phương pháp"],
  CARE_PESTICIDE: ["thuốc", "sâu", "bệnh", "nồng độ", "phun"],
  HARVEST: ["thu hoạch", "sản lượng", "chất lượng", "ngày"],
  POST_HARVEST: ["bảo quản", "đóng gói", "nhiệt độ", "vận chuyển"],
};

const keywords = vocabularies[activityType] || [];
if (keywords.length === 0) return Functions.encodeUint256(100); // unknown type → full score

let matched = 0;
for (const kw of keywords) {
  if (logText.includes(kw)) matched++;
}

const cr = Math.round((matched / keywords.length) * 100);
return Functions.encodeUint256(cr);
```

### 5. Backend NestJS — thay đổi flow

File cần cập nhật: `src/modules/crop-management/log/log.service.ts`

Flow mới khi farmer submit log:
1. Lưu log text vào database
2. Upload log text lên IPFS → lấy CID
3. Gọi `CROracle.requestCR(logId, ipfsCID, activityType)` on-chain
4. Lắng nghe event `CRFulfilled(logId, cr)` từ contract (hoặc poll)
5. Khi CR đã có: gọi `TrustComputation.computeScore(logId)` với payload đầy đủ

Backend cần thêm:
- IPFS upload service (đã có Pinata adapter trong `src/core/file-storage/`)
- Event listener cho `CRFulfilled`
- Queue/delay mechanism (Chainlink Functions mất ~30-90 giây)

---

## Chainlink Functions Setup

### Subscription

```bash
# Tạo subscription trên Chainlink Functions
# https://functions.chain.link/

# Fund subscription với LINK tokens
# Minimum: ~2 LINK per request

SUBSCRIPTION_ID=<id từ functions.chain.link>
```

### Deploy CROracle

```bash
# Constructor params
FUNCTIONS_ROUTER=<Chainlink Functions Router address cho network>
DON_ID=<bytes32 DON ID>
SUBSCRIPTION_ID=<subscription id>
CALLBACK_GAS_LIMIT=300000  # ước lượng cho fulfillRequest
```

### Network

- Development: Avalanche Fuji testnet (Chainlink Functions available)
- Production: Avalanche Mainnet / Ethereum Mainnet / Polygon

---

## Dependency cần thêm

```bash
# Trong smartcontracts/
npm install @chainlink/contracts  # đã có cho VRF, cần thêm Functions interface

# Import trong contract:
import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
```

---

## Rủi ro và giới hạn cần biết

| Rủi ro | Mô tả | Mitigation |
|---|---|---|
| Latency | Chainlink Functions mất 30–90s | Log score tính async; hiển thị "pending" cho đến khi CR ready |
| IPFS availability | IPFS gateway có thể fail | Dùng nhiều gateway (ipfs.io, cloudflare-ipfs.com, w3s.link) |
| JS source immutability | Source code embed vào request — cần version control | Lưu source hash on-chain, verify khi upgrade |
| LINK cost | ~0.2–0.5 LINK/request | Tính vào platform fee của farmer |
| Vocabulary static | Keywords cứng trong JS script | Vocabulary update = deploy script mới; version theo activityType |

---

## Thứ tự triển khai

- [ ] 1. Viết và test `computeCR.js` locally với Chainlink Functions Toolkit
- [ ] 2. Deploy `CROracle.sol` lên testnet
- [ ] 3. Fund subscription với LINK
- [ ] 4. Test end-to-end: submit log → IPFS upload → requestCR → fulfillCR
- [ ] 5. Cập nhật `LogDefaultPackage` và `LogAuditorPackage` thêm CR vào formula
- [ ] 6. Cập nhật backend NestJS flow (log.service.ts)
- [ ] 7. Cập nhật `TrustComputation.sol` để đọc CR từ `CROracle` trước khi gọi `computeTrustScore`
