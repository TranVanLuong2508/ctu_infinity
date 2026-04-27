# Phân tích & đặc tả triển khai hệ thống gợi ý (Recommendation API)

## 1) Mục tiêu

Hệ thống gợi ý phục vụ bài toán điểm rèn luyện (ĐRL):

- Ưu tiên hoạt động giúp sinh viên bù **tiêu chí còn thiếu điểm**.
- Chỉ gợi ý sự kiện **còn đăng ký được** và **còn chỗ**.
- Kết hợp sở thích tường minh (subscription) + hành vi ngầm định (history).
- Triển khai 3 thuật toán độc lập: `content`, `collab`, `hybrid`.

Tài liệu này vừa là tài liệu phân tích, vừa là tài liệu để dev nắm được:

- dữ liệu nào được truyền từ NestJS sang FastAPI
- giá trị trung gian nào cần được tính
- mỗi công thức sử dụng những biến nào
- thứ tự xử lý để tránh sai logic nghiệp vụ

---

## 2) Kiến trúc tối thiểu cần giữ

### 2.1 Phân tách trách nhiệm

**NestJS**

- Sở hữu dữ liệu và logic nghiệp vụ.
- Build dataset recommendation theo từng sinh viên.
- Candidate filtering (lọc ứng viên) trước khi gửi qua FastAPI.
- Proxy API cho frontend.

**FastAPI**

- Không truy cập DB trực tiếp.
- Không join bảng nghiệp vụ.
- Không candidate filtering.
- Chỉ nhận dataset đã sạch và tính điểm cho `content/collab/hybrid`.

Ý nghĩa của cách tách này:

- Mọi điều kiện nghiệp vụ như hết hạn đăng ký, full chỗ, đã đăng ký rồi, đã hủy rồi đều phải được xử lý trước ở NestJS.
- FastAPI chỉ làm nhiệm vụ scoring, nên cùng một dataset đầu vào thì kết quả tính điểm sẽ dễ tái hiện và dễ debug hơn.
- Khi cần kiểm tra sai lệch, dev có thể tách bài toán thành 2 phần: sai ở bước build dataset hay sai ở bước tính điểm.

---

## 3) Dataset contract (NestJS -> FastAPI)

```json
{
  "studentId": "uuid",
  "candidateEvents": [
    {
      "eventId": "uuid",
      "eventName": "string",
      "criteriaId": "uuid",
      "categoryIds": ["uuid"],
      "status": "APPROVED",
      "registrationStatus": "OPEN|CLOSED",
      "registrationDeadline": "ISO8601|null",
      "startDate": "ISO8601",
      "endDate": "ISO8601",
      "capacity": 200,
      "registeredCount": 120,
      "remainingSlots": 80,
      "score": 5
    }
  ],
  "interactions": [
    {
      "studentId": "uuid",
      "eventId": "uuid",
      "status": "REGISTERED|ATTENDED|ABSENT|CANCELLED",
      "updatedAt": "ISO8601"
    }
  ],
  "allStudentsInteractions": [
    {
      "studentId": "uuid",
      "eventId": "uuid",
      "status": "REGISTERED|ATTENDED|ABSENT|CANCELLED"
    }
  ],
  "scores": [
    {
      "studentId": "uuid",
      "criteriaId": "uuid",
      "scoreValue": 2
    }
  ],
  "subscription": {
    "studentId": "uuid",
    "subscribedCategoryIds": ["uuid"],
    "subscribedCriteriaIds": ["uuid"]
  },
  "criterias": [
    {
      "criteriaId": "uuid",
      "criteriaCode": "III.1",
      "criteriaName": "string",
      "maxScore": 10
    }
  ]
}
```

### 3.1 Ý nghĩa từng nhóm dữ liệu

- `studentId`: sinh viên mục tiêu đang được tính recommendation.
- `candidateEvents`: toàn bộ sự kiện đã qua bước lọc nghiệp vụ và sẵn sàng để chấm điểm.
- `interactions`: lịch sử tương tác của chính sinh viên mục tiêu.
- `allStudentsInteractions`: lịch sử tương tác của toàn bộ sinh viên để dựng ma trận CF.
- `scores`: dữ liệu điểm hiện tại theo từng tiêu chí để tính mức còn thiếu.
- `subscription`: sở thích tường minh mà sinh viên đã chọn.
- `criterias`: danh sách tiêu chí và `maxScore` dùng để chuẩn hóa `deficit_ratio`.

### 3.2 Giải thích các field quan trọng trong `candidateEvents`

- `criteriaId`: cho biết sự kiện cộng điểm vào tiêu chí nào. Đây là field bắt buộc để tính `deficitMatch`.
- `categoryIds`: dùng cho `categorySubMatch`, `historyMatch`, và logic ABSENT cùng category.
- `registrationStatus`: giúp NestJS xác định còn được phép đăng ký hay không.
- `registrationDeadline`: dùng cho điều kiện lọc và tính `time_bonus`.
- `capacity`, `registeredCount`, `remainingSlots`: dùng để đảm bảo không gợi ý sự kiện full chỗ.
- `score`: điểm rèn luyện sự kiện đóng góp nếu sinh viên tham gia thành công.

### 3.3 Ghi chú về `allStudentsInteractions`

`allStudentsInteractions` chỉ cần:

- `studentId`
- `eventId`
- `status`

Lý do là ở giai đoạn hiện tại, CF chỉ cần ánh xạ:

```text
status -> interaction_weight
```

để dựng ma trận `M[user][event]`. Không cần timestamp trong phần này.

---

## 4) Candidate filtering (bắt buộc tại NestJS)

Một sự kiện được vào `candidateEvents` khi thỏa:

1. `status = APPROVED`
2. `registrationDeadline != null`
3. `registrationDeadline >= now`
4. `registrationStatus = OPEN`
5. `remainingSlots > 0` (hoặc `registeredCount < capacity`)
6. `criteriaId != null`

Loại khỏi candidate theo từng sinh viên nếu đã có trạng thái với chính sự kiện đó:

- `ATTENDED`
- `REGISTERED`
- `CANCELLED`

Không loại theo `ABSENT`.

### 4.1 Ý nghĩa của bước candidate filtering

Đây là bước làm sạch dữ liệu nghiệp vụ trước khi vào thuật toán.

Nếu candidate filtering làm đúng:

- FastAPI không cần mất thời gian chấm điểm cho sự kiện không thể đăng ký.
- Kết quả recommendation sẽ đúng với trải nghiệm thật của sinh viên.
- Dev có thể tin rằng mọi event đi vào thuật toán đều là event hợp lệ.

### 4.2 Lưu ý triển khai

- Không dùng `startDate > now` làm điều kiện lọc chính nếu hệ thống cho phép đăng ký đến sát giờ hoặc đăng ký sau khi sự kiện đã bắt đầu.
- `registrationDeadline` mới là điều kiện chốt để quyết định còn đăng ký được hay không.
- `ABSENT` không bị loại vì mục tiêu là giảm ưu tiên, không phải cấm gợi ý mãi mãi các sự kiện tương tự.

---

## 5) Thuật toán Content-Based Filtering (CBF)

## 5.1 Mục tiêu

Trong tập candidate đã lọc sạch, chọn sự kiện vừa:

- Bù tiêu chí còn thiếu điểm.
- Hợp sở thích subscription.
- Hợp lịch sử tham gia trước đây.

CBF là thuật toán bám sát nghiệp vụ ĐRL nhất vì nó nhìn trực tiếp vào:

- sinh viên đang thiếu tiêu chí nào
- sinh viên quan tâm tiêu chí/category nào
- sinh viên từng tham gia loại hoạt động nào

## 5.2 Tín hiệu đầu vào

- `deficit_ratio(student, criteria)`
- `subscription theo criteria`
- `subscription theo category`
- `history ATTENDED theo category`
- `time_bonus` theo hạn đăng ký

### 5.2.1 Giải thích từng tín hiệu

- `deficit_ratio`: phản ánh mức độ cần bù điểm của sinh viên ở một tiêu chí.
- `subscription theo criteria`: phản ánh sinh viên chủ động quan tâm đến tiêu chí nào.
- `subscription theo category`: phản ánh sinh viên chủ động quan tâm đến nhóm hoạt động nào.
- `history ATTENDED theo category`: phản ánh sở thích ngầm định học từ hành vi thật.
- `time_bonus`: ưu tiên sự kiện cần quyết định sớm vì sắp hết hạn đăng ký.

## 5.2.2 Vector event và user profile

### Event vector

Mỗi sự kiện `e` được biểu diễn bởi:

```text
event_vector(e) = [
  criteria_one_hot,
  category_multi_hot,
  time_bucket,
  capacity_signal
]
```

- `criteria_one_hot`: one-hot theo toàn bộ tiêu chí.
- `category_multi_hot`: multi-hot theo toàn bộ category.
- `time_bucket`: mã hóa theo `days_left` (`<=3`, `<=7`, `<=14`, `>14`).
- `capacity_signal`: chuẩn hóa từ `remainingSlots / capacity` trong `[0..1]`.

Ý nghĩa:

- `criteria_one_hot` cho biết event thuộc tiêu chí nào.
- `category_multi_hot` cho biết event thuộc các nhóm hoạt động nào.
- `time_bucket` cho biết event đang gấp đến mức nào về mặt hạn đăng ký.
- `capacity_signal` cho biết event còn dễ tham gia hay không.

### User profile vector

Mỗi sinh viên `u` được biểu diễn bởi:

```text
user_profile(u) = [
  deficit_vector,
  subscription_criteria_vector,
  subscription_category_vector,
  attended_category_vector
]
```

- `deficit_vector[c] = deficit_ratio(u, c)` theo từng tiêu chí `c`.
- `subscription_criteria_vector[c] ∈ {0,1}`.
- `subscription_category_vector[k] ∈ {0,1}`.
- `attended_category_vector[k] = normalized_count_attended(k)`.

Gợi ý chuẩn hóa:

- Count lịch sử: dùng `min-max` hoặc chia tổng để đưa về `[0..1]`.
- User mới chưa có history: đặt `attended_category_vector = 0`.

Ý nghĩa:

- `deficit_vector` là phần quan trọng nhất của bài toán ĐRL.
- `subscription_*` là sở thích tường minh.
- `attended_category_vector` là sở thích ngầm định.
- User mới vẫn chạy được vì không phụ thuộc hoàn toàn vào history.

### Ánh xạ vector vào score

- `deficitMatch` lấy từ `deficit_vector` theo `event.criteriaId`.
- `categorySubMatch` tính bằng Jaccard/overlap giữa `event.categoryIds` và category subscription.
- `historyMatch` tính bằng cosine giữa `event.category_multi_hot` và `attended_category_vector`.

Đây là bước biến dữ liệu thô thành các đại lượng trung gian mà công thức CBF sử dụng trực tiếp.

## 5.3 Công thức điểm

$$
Score_{CBF}(u,e)=w_1\cdot deficitMatch + w_2\cdot subscriptionMatch + w_3\cdot historyMatch + w_4\cdot timeBonus
$$

Đề xuất trọng số khởi tạo:

- `w1 = 0.50`
- `w2 = 0.25`
- `w3 = 0.15`
- `w4 = 0.10`

Tổng trọng số bằng `1.0`.

### 5.3.1 Ý nghĩa từng thành phần trong công thức

- `deficitMatch`: event có giúp bù đúng tiêu chí đang thiếu không.
- `subscriptionMatch`: event có đúng sở thích sinh viên đã khai báo không.
- `historyMatch`: event có giống với loại hoạt động sinh viên từng thật sự tham gia không.
- `timeBonus`: event có cần ưu tiên sớm vì sắp hết hạn đăng ký không.

## 5.4 Tách `subscription_match` chi tiết

Thay vì nhị phân 0/1 chung, tách thành:

$$
subscriptionMatch = s_1\cdot criteriaSubMatch + s_2\cdot categorySubMatch
$$

Trong đó:

- `criteriaSubMatch = 1` nếu `event.criteriaId ∈ subscribedCriteriaIds`, ngược lại `0`
- `categorySubMatch = Jaccard(event.categoryIds, subscribedCategoryIds)` hoặc overlap ratio `[0..1]`
- Đề xuất: `s1 = 0.7`, `s2 = 0.3`

Ưu tiên match theo tiêu chí hơn match theo category.

### 5.4.1 Cách hiểu

- Nếu sinh viên subscribe đúng tiêu chí, đây là tín hiệu rất mạnh.
- Nếu chỉ trùng category, vẫn là tín hiệu tốt nhưng yếu hơn.
- Tách 2 phần này ra sẽ giúp dev debug dễ hơn so với một biến `subscriptionMatch` duy nhất.

## 5.5 ABSENT penalty trong CBF

- Nếu có lịch sử `ABSENT` cùng tiêu chí hoặc giao category, áp hệ số nhẹ:
  - `historyMatch = historyMatch * 0.85`
- Chỉ áp trên thành phần `historyMatch`, không phạt vào `deficitMatch`.

Giải thích:

- `ABSENT` chỉ cho biết sinh viên từng không tham gia thành công một hoạt động tương tự.
- Nó không có nghĩa là sinh viên không còn thiếu tiêu chí đó.
- Vì vậy chỉ được phép làm giảm `historyMatch`, không được làm giảm phần thiếu điểm.

---

## 6) Thuật toán Collaborative Filtering (User-based CF)

## 6.1 Mục tiêu

Học từ nhóm sinh viên có hành vi tương tự để dự đoán mức phù hợp của sự kiện ứng viên.

CF trả lời câu hỏi:

> "Những sinh viên giống với user hiện tại thường tham gia sự kiện nào?"

## 6.2 Trọng số tương tác

- `ATTENDED = 2.0`
- `REGISTERED = 1.0`
- `ABSENT = -0.2`
- `CANCELLED = 0.0`

### 6.2.1 Ý nghĩa các trọng số

- `ATTENDED = 2.0`: tín hiệu mạnh nhất vì đã tham gia thật.
- `REGISTERED = 1.0`: có quan tâm nhưng chưa chắc là phù hợp mạnh như `ATTENDED`.
- `ABSENT = -0.2`: tín hiệu âm nhẹ, chỉ giảm độ tin cậy.
- `CANCELLED = 0.0`: không dùng làm positive signal, cũng không phạt mạnh.

## 6.3 Tính điểm CF

- Dựng ma trận `M[user][event] = interaction_weight`
- Similarity mặc định: cosine
- Chọn `top-N neighbors` có similarity > 0

$$
Score_{CF}(u,e)=\frac{\sum_v sim(u,v)\cdot interaction(v,e)}{\sum_v |sim(u,v)|}
$$

Nếu không có neighbor nào đã tương tác với `e`:

$$
Score_{CF}(u,e) = 0
$$

CF chỉ học từ hành vi cộng đồng, không xét nội dung sự kiện hay tiêu chí còn thiếu. `deficitMatch` đã có trong CBF — khi Hybrid kết hợp `alpha * normalize(CBF) + beta * normalize(CF)`, thành phần này được mang theo tự động.

### 6.3.1 Luồng tính CF mà dev cần implement

1. Từ `allStudentsInteractions`, ánh xạ mỗi `status` sang `interaction_weight`.
2. Dựng ma trận `M[user][event]`.
3. Với user mục tiêu `u`, tính similarity giữa `u` và các user còn lại.
4. Lọc các user có similarity dương.
5. Chọn `top-N neighbors`.
6. Với từng event ứng viên `e`, lấy các neighbor đã có tương tác với `e`.
7. Áp công thức weighted average để ra `Score_CF(u,e)`.

### 6.3.2 Ý nghĩa công thức

- Tử số: tổng "mức giống nhau" nhân với "mức độ tương tác" của các neighbor với event.
- Mẫu số: tổng độ lớn similarity để chuẩn hóa.
- Nếu không có neighbor phù hợp, trả `0` để thể hiện CF không học được gì từ cộng đồng cho event đó.

---

## 7) Thuật toán Hybrid

## 7.1 Mục đích endpoint

- POST /recommendations/content -> học thuật, so sánh, không dùng production
- POST /recommendations/collab -> học thuật, so sánh, không dùng production
- POST /recommendations/hybrid -> endpoint chính dùng cho frontend/production

Hybrid **không gọi HTTP** tới /content hay /collab. Hybrid gọi trực tiếp internal scoring functions score_cbf(...) và score_cf(...) trong cùng Python process.

Điều này có nghĩa là trong code Python:

- `content` và `collab` là các endpoint để kiểm thử độc lập từng thuật toán
- `hybrid` là luồng chính
- nhưng cả 3 đều có thể dùng chung các hàm scoring nội bộ

## 7.2 Công thức

$$
Score_{Hybrid}(u,e)=\alpha\cdot normalize(Score_{CBF})+\beta\cdot normalize(Score_{CF})
$$

Mặc định:

- alpha = 0.6
- beta = 0.4

Sau khi tính xong điểm hybrid, nếu sinh viên có lịch sử ABSENT với sự kiện cùng criteriaId hoặc có categoryIds giao nhau:

$$
Score_{Hybrid}(u,e) = Score_{Hybrid}(u,e) \times 0.85
$$

Penalty ABSENT chỉ áp **một lần duy nhất tại Hybrid**, không áp thêm ở CBF hay CF khi chạy trong luồng Hybrid.

### 7.2.1 Thứ tự tính điểm Hybrid

1. Tính toàn bộ `Score_CBF`.
2. Tính toàn bộ `Score_CF`.
3. Chuẩn hóa hai tập điểm.
4. Trộn điểm theo `alpha`, `beta`.
5. Sau cùng mới áp penalty `ABSENT` nếu điều kiện xảy ra.

Thứ tự này rất quan trọng để tránh phạt nhiều lần cùng một tín hiệu.

## 7.3 Chuẩn hóa điểm

Dùng min-max normalization trước khi trộn:

$$
x_{norm} = \frac{x - min}{max - min}
$$

Nếu toàn bộ điểm bằng nhau, trả 0.5.

Giải thích:

- Chuẩn hóa giúp CBF và CF về cùng thang đo trước khi cộng lại.
- Nếu không chuẩn hóa, thuật toán nào có biên độ điểm lớn hơn sẽ lấn át thuật toán còn lại.
- Giá trị `0.5` trong trường hợp tất cả điểm bằng nhau giúp tránh chia cho 0 mà vẫn giữ trạng thái trung tính.

## 7.4 Dynamic weighting (tương lai)

Giai đoạn đầu dùng cố định 0.6 / 0.4. Có thể mở rộng sau:

- User mới, ít lịch sử: alpha = 0.8, beta = 0.2
- User có lịch sử vừa: alpha = 0.6, beta = 0.4
- User có lịch sử dày: alpha = 0.5, beta = 0.5

Ở giai đoạn hiện tại, dev chỉ cần giữ:

- CBF là thành phần mạnh hơn
- CF là thành phần bổ sung hành vi cộng đồng

## 7.5 Fallback

Nếu CF không có đủ dữ liệu (score = 0 hoặc không có neighbor):

$$
Score_{Hybrid}(u,e) = Score_{CBF\_norm}(u,e)
$$

Điều này đảm bảo:

- hệ thống vẫn hoạt động tốt cho user mới
- dữ liệu cộng đồng còn ít vẫn không làm recommendation bị rỗng
- Hybrid luôn có hành vi ổn định ngay từ giai đoạn đầu

## 7.6 Tính đa dạng (Diversity)

Đây là **bước hậu xử lý sau scoring**, không phải một phần của công thức Hybrid gốc.

Mục tiêu của bước này là tránh trường hợp một tiêu chí chiếm lĩnh toàn bộ danh sách gợi ý, ví dụ Top-20 đều thuộc cùng một `criteriaId`. Điều đó có thể đúng về mặt điểm số, nhưng không tốt về mặt trải nghiệm người dùng vì sinh viên sẽ không nhìn thấy các cơ hội bù điểm ở các tiêu chí khác.

### 7.6.1 Thời điểm áp dụng

Áp dụng **sau khi** đã hoàn tất toàn bộ các bước sau:

1. Tính `Score_CBF`
2. Tính `Score_CF`
3. Chuẩn hóa điểm
4. Trộn điểm Hybrid
5. Áp penalty `ABSENT` tại Hybrid
6. Sắp xếp danh sách theo `Score_Hybrid` giảm dần

Chỉ sau đó mới chạy Diversity Re-ranking trên danh sách đã sort.

### 7.6.2 Nguyên tắc giới hạn theo tiêu chí

Trong Top-K kết quả cuối cùng, mỗi `criteriaId` không được chiếm quá `N` vị trí.

Đề xuất mặc định:

- `N = 3`

Không nên hardcode giá trị này trong code. Khi implement nên đưa ra cấu hình riêng, ví dụ:

```text
MAX_PER_CRITERIA_IN_TOPK=3
```

### 7.6.3 Cách cài đặt

Input của bước re-ranking:

- danh sách event đã có `Score_Hybrid`
- danh sách đã được sort giảm dần theo score
- giá trị `RECOMMENDATION_TOP_K`
- giá trị `MAX_PER_CRITERIA_IN_TOPK`

Thuật toán re-ranking:

1. Tạo một map `criteriaCounter[criteriaId] = 0`
2. Tạo danh sách kết quả rỗng `finalResults`
3. Duyệt lần lượt từng event trong danh sách đã sort theo `Score_Hybrid`
4. Với mỗi event:
   - lấy `criteriaId` của event
   - nếu `criteriaCounter[criteriaId] < MAX_PER_CRITERIA_IN_TOPK` thì thêm event vào `finalResults`
   - tăng bộ đếm cho `criteriaId`
   - nếu đã đạt giới hạn thì bỏ qua event đó và tiếp tục duyệt event kế tiếp
5. Dừng khi `finalResults.length == RECOMMENDATION_TOP_K`

### 7.6.4 Fallback khi dữ liệu ít

Nếu sau vòng lọc đầu tiên mà `finalResults` vẫn chưa đủ `RECOMMENDATION_TOP_K`, cần chạy một vòng fill bổ sung:

1. Duyệt lại danh sách đã sort ban đầu
2. Chọn các event chưa có trong `finalResults`
3. Bỏ qua giới hạn `MAX_PER_CRITERIA_IN_TOPK`
4. Thêm dần cho đến khi đủ `RECOMMENDATION_TOP_K` hoặc hết dữ liệu

Lý do của bước fill này là:

- nếu dữ liệu candidate ít
- hoặc phần lớn candidate cùng thuộc một số ít tiêu chí

thì quota cứng có thể làm danh sách cuối bị ngắn hơn mong muốn.

### 7.6.5 Ý nghĩa khi triển khai

Điểm cần nhớ cho dev:

- Diversity không làm thay đổi cách tính `Score_Hybrid`
- Diversity chỉ thay đổi **thứ tự và thành phần cuối cùng của Top-K**
- Đây là một bước `post-processing / re-ranking`
- Nếu cần benchmark thuật toán thuần, có thể tắt bước này để so sánh

Ý nghĩa sản phẩm:

- giúp danh sách gợi ý cân bằng hơn
- giúp sinh viên thấy nhiều hướng bù điểm khác nhau
- tránh cảm giác hệ thống chỉ biết gợi ý lặp đi lặp lại một loại hoạt động

---

## 8) API tối thiểu

## 8.1 API cho sinh viên (NestJS proxy)

```text
GET /api/v1/recommendation/content
GET /api/v1/recommendation/collab
GET /api/v1/recommendation/hybrid
```

- `studentId` lấy từ JWT (`@User()`), không nhận từ path.

### 8.1.1 Ý nghĩa

- Frontend chỉ giao tiếp với NestJS.
- NestJS chịu trách nhiệm xác định user hiện tại là ai.
- Frontend không được tự truyền `studentId` để tránh lấy recommendation của người khác.

## 8.2 API nội bộ FastAPI

```text
POST /recommendations/content
POST /recommendations/collab
POST /recommendations/hybrid
```

- Nhận dataset qua body.
- `studentId` nằm trong body dataset.

### 8.2.1 Luồng request

1. Frontend gọi NestJS.
2. NestJS đọc JWT, xác định `studentId`.
3. NestJS build dataset theo đúng sinh viên đó.
4. NestJS gọi FastAPI bằng `POST`.
5. FastAPI trả kết quả scoring.
6. NestJS trả kết quả cuối về frontend.

## 8.3 Tính giải thích (Explainability)

Mỗi sự kiện trả về cần kèm theo lý do gợi ý để sinh viên hiểu tại sao họ nên tham gia.

### 8.3.1 Cấu trúc dữ liệu trả về (FastAPI)

```json
{
  "eventId": "uuid",
  "score": 0.85,
  "explanation": {
    "reasonType": "DEFICIT|SUBSCRIPTION|HISTORY|COMMUNITY",
    "message": "string"
  }
}
```

### 8.3.2 Nguyên tắc chung

Explainability là **metadata đi kèm kết quả**, không làm thay đổi logic thuật toán và không làm thay đổi score.

Mỗi endpoint đều nên trả explanation, nhưng cách sinh explanation phụ thuộc vào thuật toán:

- `content`: giải thích dựa trên các thành phần của CBF
- `collab`: giải thích dựa trên neighbor/community
- `hybrid`: giải thích dựa trên thành phần đóng góp mạnh nhất sau khi kết hợp

### 8.3.3 Logic giải thích cho endpoint `content`

Với `POST /recommendations/content`, explanation được lấy từ thành phần đóng góp lớn nhất trong:

- `deficitMatch`
- `subscriptionMatch`
- `historyMatch`

Rule:

- Nếu `deficitMatch` là thành phần cao nhất:
  - `reasonType = DEFICIT`
  - `message = "Phù hợp để bù điểm cho tiêu chí [Tên tiêu chí] đang thiếu."`
- Nếu `subscriptionMatch` là thành phần cao nhất:
  - `reasonType = SUBSCRIPTION`
  - `message = "Đúng với sở thích bạn đã đăng ký."`
- Nếu `historyMatch` là thành phần cao nhất:
  - `reasonType = HISTORY`
  - `message = "Tương tự với các hoạt động bạn từng tham gia."`

### 8.3.4 Logic giải thích cho endpoint `collab`

Với `POST /recommendations/collab`, không nên dùng `DEFICIT`, `SUBSCRIPTION`, `HISTORY` để giải thích chính vì CF không dựa trực tiếp vào các thành phần đó.

CF chỉ học từ hành vi cộng đồng, vì vậy reason type phù hợp là:

- `reasonType = COMMUNITY`

Message gợi ý:

- `"Nhiều sinh viên có hành vi tương tự bạn đã quan tâm hoặc tham gia sự kiện này."`

Nếu muốn chi tiết hơn ở bản debug hoặc bản nội bộ, có thể sinh thêm message dựa trên:

- số lượng neighbor đóng góp
- neighbor mạnh nhất
- mức similarity trung bình

Ví dụ:

- `"Được đề xuất vì nhiều sinh viên có hành vi tương tự bạn đã tham gia sự kiện này."`
- `"Được đề xuất từ nhóm sinh viên gần giống bạn trong lịch sử tham gia hoạt động."`

### 8.3.5 Logic giải thích cho endpoint `hybrid`

Với `POST /recommendations/hybrid`, explanation nên phản ánh **thành phần chi phối kết quả cuối cùng**, không chỉ phản ánh riêng CBF hay riêng CF.

Cách xác định:

1. Tính các thành phần explanation candidate:
   - từ CBF: `DEFICIT`, `SUBSCRIPTION`, `HISTORY`
   - từ CF: `COMMUNITY`
2. So sánh mức đóng góp tương đối của từng thành phần vào kết quả cuối
3. Chọn `reasonType` có đóng góp nổi bật nhất

Triển khai tối thiểu có thể làm như sau:

- Nếu `Score_CF_norm = 0` hoặc Hybrid fallback hoàn toàn về CBF:
  - dùng explanation của CBF
- Nếu `Score_CF_norm > 0` nhưng `alpha * Score_CBF_norm` vẫn chi phối rõ rệt:
  - ưu tiên explanation từ CBF
- Nếu `beta * Score_CF_norm` là phần nổi bật nhất:
  - `reasonType = COMMUNITY`

### 8.3.6 Ý nghĩa khi triển khai

Explainability giúp:

- tăng độ tin cậy của hệ thống
- giúp sinh viên hiểu vì sao sự kiện được gợi ý
- giúp demo đồ án rõ ràng hơn
- giúp debug dễ hơn khi score không như kỳ vọng

Điểm cần nhớ cho dev:

- Explanation là lớp trình bày kết quả
- Không dùng explanation để tác động ngược lại vào score
- Không được để endpoint `collab` trả explanation kiểu giả lập `DEFICIT` hoặc `SUBSCRIPTION`

Ý nghĩa: Tăng sự tin tưởng và kích thích hành động đăng ký của sinh viên.

---

## 9) Môi trường

```text
RECOMMENDATION_TOP_K=20
```

(Tùy chọn nếu cần debug nội bộ)

```text
NESTJS_INTERNAL_URL=http://...
```

### 9.1 Ý nghĩa biến môi trường

- `RECOMMENDATION_TOP_K`: số lượng sự kiện tối đa trả về cho mỗi thuật toán.
- `NESTJS_INTERNAL_URL`: chỉ dùng nếu về sau cần luồng nội bộ hoặc debug kết nối giữa các service.

---

## 10) Checklist nghiệp vụ bắt buộc khi code

1. Không gợi ý sự kiện hết hạn đăng ký.
2. Không gợi ý sự kiện đã `ATTENDED/REGISTERED/CANCELLED` bởi chính sinh viên.
3. Không gợi ý sự kiện đã full chỗ.
4. Recommendation cuối cùng phải luôn phản ánh `deficitMatch` theo tiêu chí còn thiếu điểm thông qua CBF.
5. `ABSENT` chỉ phạt nhẹ và có penalty tại Hybrid theo đúng công thức đã chốt.
6. FastAPI không truy cập DB trực tiếp, không candidate filtering.

Checklist này dùng như danh sách xác nhận cuối cùng sau khi dev hoàn tất implementation.

---

## 11) Test scenario tối thiểu

1. User mới (không history) vẫn có kết quả từ CBF.
2. User có history thì CF cho kết quả khác biệt theo neighbors.
3. Event full chỗ không xuất hiện trong recommendation.
4. Event hết hạn đăng ký không xuất hiện.
5. Không thể ép lấy recommendation của người khác qua path `studentId`.
6. User có ABSENT vẫn có thể được gợi ý event tương tự nhưng bị giảm điểm nhẹ.
7. Không có candidate thì trả mảng rỗng, không lỗi 500.

### 11.1 Cách hiểu các test scenario

- Case 1 xác nhận hệ thống không phụ thuộc hoàn toàn vào CF.
- Case 2 xác nhận CF thực sự học từ cộng đồng.
- Case 3 và 4 xác nhận candidate filtering phía NestJS chạy đúng.
- Case 5 xác nhận luồng bảo mật API không bị sai thiết kế.
- Case 6 xác nhận penalty `ABSENT` chỉ làm giảm điểm, không chặn cứng.
- Case 7 xác nhận hệ thống an toàn trong trường hợp không có dữ liệu đầu vào hợp lệ.

---

## 12) Bổ sung từ source NestJS backend

## 12.1 Convention dự án

### Cấu trúc thư mục

Quan sát được trong `ctu_infinity_backend/src/modules`:

- Mỗi feature là một thư mục riêng, ví dụ: `events`, `event-registration`, `subscriptions`, `students`, `recommendation`.
- Trong mỗi feature thường có:
  - `*.module.ts`
  - `*.controller.ts`
  - `*.service.ts`
  - `dto/`
  - `entities/`
  - đôi khi có `*.spec.ts`

Ví dụ đang có:

- `src/modules/events/event.module.ts`
- `src/modules/events/event.controller.ts`
- `src/modules/events/event.service.ts`
- `src/modules/events/dto/*`
- `src/modules/events/entities/event.entity.ts`

### Cách đặt tên file, class, method

- File dùng `kebab-case`: `event-registration.service.ts`, `student-score.entity.ts`, `recommendation.controller.ts`
- Class dùng `PascalCase`: `EventRegistrationService`, `StudentScore`, `RecommendationController`
- Method dùng `camelCase`: `getRecommendationDataset`, `getRecommendationsByAlgorithm`, `createOrUpdateSubscription`, `findByStudent`

### Cách inject dependency

- Controller inject service qua constructor:

```ts
constructor(private readonly recommendationService: RecommendationService) {}
```

- Service inject repository qua `@InjectRepository(...)`:

```ts
constructor(
  @InjectRepository(Event)
  private readonly eventRepository: Repository<Event>,
)
```

- Convention đang dùng repository trực tiếp trong service, không bắt buộc phải đi qua service của module khác.

### Cách dùng decorator có sẵn

Quan sát được trong controller:

- `@Controller('...')`
- `@Get`, `@Post`, `@Patch`, `@Delete`
- `@Body()`, `@Param()`, `@Query()`
- `@User()` để lấy user từ JWT
- `@ResponseMessage('...')` để gắn message cho response wrapper
- `@Public()` để bypass JWT guard
- `@SkipCheckPermission()` để bypass check permission trong `JwtAuthGuard`
- `@Permission(name, SYSTEM_MODULE.XXX)` cho các endpoint có phân quyền

Ngoài ra:

- `main.ts` đang bật global `ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })`
- `main.ts` đang bật global `JwtAuthGuard`
- `main.ts` đang bật global `TransformInterceptor`
- `main.ts` đang set global prefix `api` và URI versioning (`/api/v1/...`)

## 12.2 Response format chuẩn

### Response thành công

Source quan sát được:

- `src/cores/transform.interceptor.ts`
- `src/decorators/customize.ts`

Khi controller gắn `@ResponseMessage('...')`, `TransformInterceptor` sẽ wrap response thành:

```json
{
  "statusCode": 200,
  "message": "Get recommended events",
  "data": { ... }
}
```

Nếu service trả object có `EC` và `EM`, interceptor sẽ tách ra thành:

```json
{
  "statusCode": 200,
  "message": "Get recommended events",
  "EC": 1,
  "EM": "Lấy gợi ý sự kiện thành công",
  "data": {
    "...": "..."
  }
}
```

### Field bắt buộc trong response thành công

Quan sát theo interceptor:

- `statusCode`
- `message`
- `data`

Nếu service trả theo style business hiện tại thì có thêm:

- `EC`
- `EM`

### Response lỗi

Không tìm thấy `ExceptionFilter` riêng cho lỗi trong source hiện tại.

Quan sát được trong service:

- Service thường `throw new BadRequestException({ EC: 0, EM: '...' })`
- Hoặc `NotFoundException`, `ConflictException`, `InternalServerErrorException`

Vì không có custom error filter riêng, response lỗi hiện tại phụ thuộc vào NestJS exception response mặc định, với body exception mà service truyền vào.

### Yêu cầu cho recommendation proxy

NestJS proxy recommendation nên tuân thủ đúng pattern hiện tại:

- Thành công: service trả `{ EC, EM, ...payload }`, để `TransformInterceptor` wrap thành response chuẩn
- Lỗi: throw `HttpException` chuẩn của Nest với body `{ EC: 0, EM: '...' }`

## 12.3 Các entity liên quan

## 12.3.1 Event

- File: `src/modules/events/entities/event.entity.ts`
- Tên bảng: `events`

Field cần dùng để build dataset:

- `eventId`
- `eventName`
- `description`
- `location`
- `startDate`
- `endDate`
- `registrationDeadline`
- `maxParticipants`
- `status`
- `criteriaId`
- `score`
- `organizerId`
- `semesterId`

Relation cần join:

- `categories: EventCategory[]` qua bảng nối `event_categories_mapping`
- `organizer` nếu muốn enrich thêm event detail khi trả frontend

## 12.3.2 EventRegistration

- File: `src/modules/event-registration/entities/event-registration.entity.ts`
- Tên bảng: `event_registrations`

Field cần dùng:

- `id`
- `studentId`
- `eventId`
- `status`
- `registeredAt`
- `attendedAt`
- `cancelledAt`

Relation cần join:

- `event` qua `eventId` nếu cần đọc thêm thông tin event lúc query interaction

Enum trạng thái quan sát được:

- `REGISTERED`
- `CANCELLED`
- `ATTENDED`
- `ABSENT`

## 12.3.3 StudentScore

- File: `src/modules/student-score/entities/student-score.entity.ts`
- Tên bảng: `student_scores`

Field cần dùng:

- `id`
- `studentId`
- `eventId`
- `criteriaId`
- `scoreValue`
- `semesterId`
- `createdAt`

Relation cần join:

- `event`
- `semester`

## 12.3.4 Subscription

- File: `src/modules/subscriptions/entities/subscription.entity.ts`
- Tên bảng: `subscriptions`

Field cần dùng:

- `subscriptionId`
- `studentId`
- `createdAt`
- `updatedAt`

Relation cần join:

- `categories: EventCategory[]` qua bảng `subscription_categories`
- `criteria: Criteria[]` qua bảng `subscription_criteria`
- `student`

Lưu ý:

- `categories` và `criteria` đang để `eager: true`

## 12.3.5 Criteria

- File: `src/modules/criterias/entities/criteria.entity.ts`
- Tên bảng: `criterias`

Field cần dùng:

- `criteriaId`
- `criteriaCode`
- `criteriaName`
- `maxScore`
- `parentId`
- `frameworkId`
- `displayOrder`

Relation cần join:

- `framework: CriteriaFrame`
- `parent`
- `children`

## 12.3.6 EventCategory

- File: `src/modules/event_category/entities/event_category.entity.ts`
- Tên bảng: `event_category`

Field cần dùng:

- `categoryId`
- `categoryName`
- `slug`
- `description`

Relation cần join:

- Không thấy relation khai báo ngược trong entity này
- Category được join từ phía `Event.categories` và `Subscription.categories`

## 12.4 Cách build dataset trong NestJS

Nguyên tắc chung theo source hiện tại:

- Build dataset trong `RecommendationService`
- Dùng repository + TypeORM relation/query builder
- Dataset build theo từng sinh viên, không build toàn bộ hệ thống cho một request frontend

## 12.4.1 Query lấy `candidateEvents`

Cần query từ `events` và join `categories`.

Điều kiện chắc chắn quan sát được từ source/entity:

- `events.status = APPROVED`
- `events.criteriaId IS NOT NULL`
- `events.registrationDeadline IS NOT NULL`
- `events.registrationDeadline >= now`

Điều kiện loại theo sinh viên mục tiêu:

- Loại event mà sinh viên đã có `EventRegistration.status` là:
  - `ATTENDED`
  - `REGISTERED`
  - `CANCELLED`

Cách viết phù hợp với dự án:

- Dùng `eventRepository.createQueryBuilder('event')`
- `leftJoinAndSelect('event.categories', 'category')`
- `leftJoin(EventRegistration, 'mine', 'mine.eventId = event.eventId AND mine.studentId = :studentId', { studentId })`
- `where('event.status = :status', { status: EVENT_STATUS.APPROVED })`
- `andWhere('event.criteriaId IS NOT NULL')`
- `andWhere('event.registrationDeadline IS NOT NULL')`
- `andWhere('event.registrationDeadline >= :now', { now: new Date() })`
- `andWhere('(mine.id IS NULL OR mine.status = :absent)', { absent: REGISTRATION_STATUS.ABSENT })`

Lưu ý:

- Source hiện tại chưa có query candidate-filtered per student; phần này cần viết mới trong `RecommendationService`
- Source hiện tại cũng chưa có logic full-slot sẵn trong recommendation service

## 12.4.2 Query lấy `interactions` của sinh viên mục tiêu

Cần query từ `event_registrations` theo `studentId`.

Cách viết gần với convention hiện tại:

```ts
await eventRegistrationRepository.find({
  where: { studentId },
  order: { registeredAt: 'DESC' },
})
```

Field map ra dataset:

- `studentId`
- `eventId`
- `status`
- `updatedAt`

Lưu ý quan sát từ entity:

- `EventRegistration` không có field `updatedAt`
- Nếu dataset vẫn giữ `updatedAt` như mục 3 hiện tại thì phải tự suy ra từ:
  - `attendedAt ?? cancelledAt ?? registeredAt`

## 12.4.3 Query lấy `allStudentsInteractions`

Cần query toàn bộ `event_registrations`.

Cách viết đơn giản nhất theo source hiện tại:

```ts
await eventRegistrationRepository.find()
```

Field cần map:

- `studentId`
- `eventId`
- `status`

Không cần timestamp cho phần này vì CF hiện tại chỉ cần:

```text
status -> interaction_weight
```

## 12.4.4 Query lấy `scores`

Cần query từ `student_scores` theo `studentId`.

Cách viết:

```ts
await studentScoreRepository.find({
  where: { studentId },
})
```

Field cần map:

- `studentId`
- `criteriaId`
- `scoreValue`

Lưu ý:

- Entity có thêm `semesterId`, nhưng source recommendation hiện tại chưa có filter theo học kỳ

## 12.4.5 Query lấy `subscription`

Cần query 1 bản ghi từ `subscriptions` theo `studentId`.

Cách viết:

```ts
await subscriptionRepository.findOne({
  where: { studentId },
  relations: ['categories', 'criteria'],
})
```

Field cần map:

- `studentId`
- `subscribedCategoryIds`
- `subscribedCriteriaIds`

## 12.4.6 Query lấy `criterias`

Cần query từ `criterias`.

Cách viết gần với source recommendation hiện tại:

```ts
await criteriaRepository.find({
  select: {
    criteriaId: true,
    criteriaCode: true,
    criteriaName: true,
    maxScore: true,
    parentId: true,
  },
})
```

Field tối thiểu nên đưa vào dataset:

- `criteriaId`
- `criteriaCode`
- `criteriaName`
- `maxScore`

Lưu ý:

- Source hiện tại của recommendation service chưa join `framework`
- `SubscriptionsService` có validate `criteria.framework.status === ACTIVE`, nhưng recommendation service hiện tại chưa tái sử dụng rule đó

## 12.4.7 Cách tính `registeredCount`, `remainingSlots`, `registrationStatus`

Quan sát từ source hiện tại:

- `Event` có `maxParticipants`
- `Event` có `registrationDeadline`
- `EventRegistration` có các status
- Không tìm thấy helper/hàm có sẵn trong source để tính 3 giá trị này
- Không tìm thấy logic full-slot đã được cài sẵn trong `EventService` hoặc `EventRegistrationService`

Vì vậy khi build dataset recommendation, `RecommendationService` phải tự tính thêm:

- `registeredCount`: đếm từ `event_registrations` theo `eventId`
- `remainingSlots`: suy ra từ `maxParticipants` và `registeredCount`
- `registrationStatus`: suy ra từ `registrationDeadline` và trạng thái slot

Phần này cần được implement mới trong recommendation query, không có sẵn utility tái sử dụng trong source hiện tại.

## 12.5 Module recommendation cần tạo

Quan sát từ source hiện tại: module recommendation đã có sẵn.

File đang có:

- `src/modules/recommendation/recommendation.module.ts`
- `src/modules/recommendation/recommendation.controller.ts`
- `src/modules/recommendation/recommendation.service.ts`

### Tổ chức file theo đúng convention dự án

Nếu tiếp tục theo convention hiện tại thì giữ đúng 3 file trên.

Không thấy `dto/` riêng cho recommendation trong source hiện tại. Nếu cần request body cho proxy endpoint mới, có thể thêm:

- `src/modules/recommendation/dto/...`

### Các dependency hiện đang dùng trong `RecommendationModule`

`recommendation.module.ts` hiện import:

```ts
TypeOrmModule.forFeature([
  Event,
  EventRegistration,
  StudentScore,
  Subscription,
  Student,
  Criteria,
])
```

### Các module khác cần import

Không tìm thấy `RecommendationModule` hiện tại import `EventModule`, `SubscriptionsModule`, `StudentScoreModule`, `StudentModule` hay `CriteriasModule`.

Theo source hiện tại, recommendation service đang làm theo hướng:

- inject repository trực tiếp
- không tái sử dụng service của các module khác

Vì vậy nếu giữ đúng convention đang có, module recommendation có thể tiếp tục:

- không import thêm feature module khác
- chỉ dùng `TypeOrmModule.forFeature(...)`

## 12.6 Decorator và utility có sẵn nên tái sử dụng

### Decorator

Quan sát được:

- `@User()` trong `src/decorators/customize.ts`
  - dùng để lấy toàn bộ user hoặc một field cụ thể từ `request.user`
- `@ResponseMessage()` trong `src/decorators/customize.ts`
  - dùng để set `message` cho `TransformInterceptor`
- `@Public()` trong `src/decorators/customize.ts`
  - dùng khi muốn endpoint không cần JWT
- `@SkipCheckPermission()` trong `src/decorators/customize.ts`
  - dùng khi muốn bỏ qua check permission trong `JwtAuthGuard`
- `@Permission()` trong `src/decorators/permission.decorator.ts`
  - dùng cho endpoint cần permission metadata

### Guard

Quan sát được:

- `JwtAuthGuard` ở `src/modules/auth/jwt-auth.guard.ts`

Cách hoạt động:

- là global guard trong `main.ts`
- nếu không có `@Public()` thì bắt buộc qua JWT
- nếu không có `@SkipCheckPermission()` thì tiếp tục check permission theo `request.method` và `route.path`

### Interceptor / response wrapper

Quan sát được:

- `TransformInterceptor` ở `src/cores/transform.interceptor.ts`

Recommendation controller/service nên tái sử dụng interceptor này theo pattern hiện có, không tự tạo format response riêng.

### Utility khác

Quan sát được:

- `filterResponse`
- `excludeFields`

trong `src/common/filerRespone.ts`

Không tìm thấy utility pagination dùng chung trong source đã đọc.

## 12.8 Cấu trúc thư mục đề xuất cho FastAPI

Để khớp dataset contract ở mục 3 và 3 thuật toán ở mục 5, 6, 7, cấu trúc nên là:

```text
recommendation_api/
├── main.py                     ← khởi tạo FastAPI app
├── routers/
│   ├── content.py              ← POST /recommendations/content
│   ├── collab.py               ← POST /recommendations/collab
│   └── hybrid.py               ← POST /recommendations/hybrid
├── services/
│   ├── cbf.py                  ← toàn bộ logic scoring CBF
│   ├── cf.py                   ← toàn bộ logic scoring CF
│   └── hybrid.py               ← import cbf.py và cf.py, trộn điểm
├── schemas/
│   └── dataset.py              ← Pydantic models cho dataset contract
├── core/
│   └── config.py               ← đọc RECOMMENDATION_TOP_K từ env
└── .env
```

Ràng buộc cần giữ:

- `services/hybrid.py` chỉ import hàm từ `services/cbf.py` và `services/cf.py`
- `services/hybrid.py` không được gọi HTTP tới router `/content` hay `/collab`
- `routers/` chỉ nhận request, validate schema, gọi `services/`, và trả response
- `schemas/dataset.py` phải khớp hoàn toàn với dataset contract ở mục 3 của tài liệu này
