---
id: "task_dataset_foundation"
pinned: true
outcome: ""
homeAspect: "o2_a1"
tags: ["dataset","evaluation","reproducibility"]
role: "task"
title: "Chuẩn bị và cấu trúc bộ dữ liệu đánh giá"
status: "active"
priorityRank: 1
---

# Chuẩn bị và cấu trúc bộ dữ liệu đánh giá

## Mục đích

Chuẩn bị nền tảng có thể tái lập cho bộ đánh giá gốc và các thay đổi miền tự
nhiên. Nhiễu có kiểm soát chỉ được bổ sung khi phạm vi cụ thể được chốt.

## Công việc

- Xác nhận quyền truy cập, giấy phép, nguồn gốc/lịch sử dữ liệu và phạm vi sử dụng.
- Chuẩn bị dữ liệu benchmark đã chọn trong không gian thực nghiệm bên ngoài.
- Xác định cấu trúc thư mục và lược đồ siêu dữ liệu mà không đưa dữ liệu thô vào
  kho điều phối.
- Tạo bản kê dữ liệu xác định được và ghi rõ các tập huấn luyện/thẩm định/kiểm thử
  hoặc query nếu bộ dữ liệu sử dụng các khái niệm này.
- Ghi nguồn và phiên bản location encoder cùng gallery GeoCLIP cố định; chỉ kiểm
  tra trùng lặp/rò rỉ trong phạm vi dữ liệu có thể truy cập.
- Xây dựng EDA ban đầu và ghi rõ số mẫu, cách chia, cảnh báo chất lượng cùng các
  thống kê chính.
- Ghi các mẫu thiếu/hỏng và quy ước tọa độ riêng của từng bộ dữ liệu.

## Dấu hiệu hoàn thành

Liên kết kho mã nguồn/commit có thể dùng ở môi trường khác, bản kê dữ liệu,
thống kê chia tập, kết quả kiểm tra trong phạm vi khả thi và cấu trúc đánh giá đã
được thống nhất.
