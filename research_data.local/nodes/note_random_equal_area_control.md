---
id: "note_random_equal_area_control"
title: "Đối chứng ngẫu nhiên cùng diện tích cho kiểm tra tính trung thực nhân quả"
role: "note"
homeAspect: "o3_a1"
status: "active"
outcome: ""
tags: ["tinh-trung-thuc-nhan-qua","doi-chung-ngau-nhien","thiet-ke-thuc-nghiem"]
---

# Đối chứng ngẫu nhiên cùng diện tích cho kiểm tra tính trung thực nhân quả

## 2026-07-17

### Ý tưởng

Khi che hoặc loại bỏ các vùng được Grounding DINO phát hiện, kết quả GeoCLIP có thể giảm chỉ vì một phần ảnh đã bị mất, không nhất thiết vì các vùng được phát hiện có ý nghĩa đặc biệt. Để kiểm tra cách giải thích này, tạo các vùng ngẫu nhiên có cùng tổng diện tích với vùng detector và áp dụng cùng phép biến đổi để đối chiếu.

Ví dụ, nếu các hộp được phát hiện chiếm 20% diện tích ảnh, so sánh mức thay đổi dự đoán khi che 20% vùng phát hiện với khi che 20% vùng được chọn ngẫu nhiên. Nếu vùng phát hiện tạo ảnh hưởng lớn hơn các vùng ngẫu nhiên, kết quả cung cấp bằng chứng tốt hơn rằng phép can thiệp đang tập trung vào thông tin có ý nghĩa.

### Vai trò

Đây là một phép đối chứng trong thiết kế thực nghiệm, chưa phải bằng chứng hoặc kết luận về tính trung thực nhân quả. Nó giúp loại bớt cách giải thích rằng kết quả thay đổi đơn thuần vì ảnh bị che nhiều hơn.

### Điểm còn mở

- Cách lấy vùng ngẫu nhiên: chỉ khớp tổng diện tích hay còn khớp số lượng, kích thước và hình dạng hộp.
- Số lần lấy mẫu và hạt giống ngẫu nhiên.
- Chỉ số dùng để so sánh mức thay đổi dự đoán hoặc độ chính xác.
- Cách kết hợp với phép che, chỉ giữ lại vùng, loại bỏ vùng hoặc các kiểm tra khác.
- Trường hợp không phát hiện hộp được xử lý riêng vì diện tích đối chứng bằng không không tạo ra so sánh có ích.
