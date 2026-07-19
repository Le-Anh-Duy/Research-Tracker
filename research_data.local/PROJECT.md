---
schemaVersion: 2
topic: "Can thiệp attention dựa trên vùng phát hiện cho định vị địa lý bằng ảnh có thể giải thích: nghiên cứu liệu các dấu hiệu thị giác cục bộ từ Grounding DINO có thể dẫn hướng bộ mã hóa ảnh GeoCLIP cố định mà không cần huấn luyện lại, đồng thời đánh giá độ chính xác, độ bền, tính trung thực nhân quả và chi phí tính toán."
---

# Can thiệp attention dựa trên vùng phát hiện cho định vị địa lý bằng ảnh có thể giải thích

## Hướng nghiên cứu

**Nhà nghiên cứu:** Lê Anh Duy và Trần Gia Huy  
**Lĩnh vực:** Thị giác máy tính, OSINT, trí tuệ nhân tạo có thể giải thích

Dự án nghiên cứu liệu các hộp giới hạn từ Grounding DINO có thể tạo thành thông
tin ưu tiên về không gian bên trong bộ mã hóa ảnh GeoCLIP cố định mà không cần
huấn luyện lại hay không. Lớp/head, dạng can thiệp, công thức và hành vi khi
không phát hiện vẫn là những nội dung cần xác định bằng sandbox và thực nghiệm.

Cả GeoCLIP baseline và phương pháp đề xuất dùng cùng location encoder và gallery
gốc của GeoCLIP. Thay gallery hoặc huấn luyện lại location encoder không thuộc
phạm vi chính. Nguồn, phiên bản và rủi ro rò rỉ của gallery chỉ được báo cáo
trong phạm vi có thể kiểm tra.

Khoảng trống nghiên cứu được giới hạn ở hiệu quả, độ bền và tính trung thực nhân
quả của phép can thiệp dựa trên vùng phát hiện trong một bộ mã hóa định vị địa
lý cố định; dự án không giả định rằng mọi hệ thống định vị đều thiếu giải thích.

Đánh giá được tách thành:

- độ chính xác trên bộ đánh giá gốc;
- thay đổi miền tự nhiên từ những nguồn hoặc điều kiện được chọn;
- một số loại nhiễu có kiểm soát nếu tiến độ cho phép;
- tính trung thực nhân quả bằng các phép che/giữ vùng và đối chứng ngẫu nhiên
  cùng diện tích khi phù hợp;
- phát hiện thiếu, sai, không phát hiện, lựa chọn bộ từ vựng/threshold, vùng
  chồng lấn và hành vi CLS;
- thời gian chạy, thông lượng và bộ nhớ của toàn quy trình trên cùng phần cứng.

Chỉ số chính gồm sai số khoảng cách Haversine/GCD và độ chính xác tại các ngưỡng
1/25/200/750/2500 km, bổ sung bằng chỉ số riêng của bộ dữ liệu, chênh lệch theo
cặp và khoảng tin cậy bootstrap khi khả thi.

## Quyết định phạm vi

- GeoCLIP cố định là baseline chính. Grounding DINO kết hợp GeoCLIP phải được đo
  như một quy trình hoàn chỉnh; so sánh với VLM chỉ là hướng phụ.
- Bộ từ vựng của detector được chọn bằng thông tin huấn luyện/thẩm định để tránh
  đưa trực tiếp nhãn địa lý vào detector.
- Mức trùng khớp attention cao chỉ là mô tả, không tự chứng minh ảnh hưởng nhân
  quả.
- Trích dẫn công trình liên quan được giữ như ghi chú cho đến giai đoạn viết;
  kho điều phối này không thay thế công cụ quản lý tài liệu tham khảo.
- Thực nghiệm, dữ liệu, log thô và checkpoint nằm trong không gian thực nghiệm
  bên ngoài. Kho điều phối lưu URL kho mã nguồn, commit, mã lần chạy, kết quả đã
  chọn, diễn giải và liên kết bằng chứng.
- Định vị địa lý bằng ảnh có khả năng sử dụng kép. Báo cáo cuối phải đề cập đến
  riêng tư, nguy cơ lạm dụng, rò rỉ benchmark, giới hạn và phạm vi OSINT phù hợp.
