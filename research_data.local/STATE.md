---
generated: true
fingerprint: "c45e9991af466587"
---

# Current research state

Source fingerprint: `c45e9991af466587`

## Project

- **Can thiệp attention dựa trên vùng phát hiện cho định vị địa lý bằng ảnh có thể giải thích** · [PROJECT.md](PROJECT.md)

## Objectives

- **O1: Định nghĩa và lựa chọn phép can thiệp attention dựa trên vùng Grounding DINO cho bộ mã hóa ảnh GeoCLIP cố định.** — 0/2 aspects synthesized · [o1](nodes/o1.md)

- **O2: Đánh giá ảnh hưởng của phép can thiệp lên độ chính xác trên bộ đánh giá gốc và độ bền trước thay đổi miền tự nhiên.** — 0/3 aspects synthesized · [o2](nodes/o2.md)

- **O3: Đánh giá tính trung thực nhân quả, ảnh hưởng của lỗi Grounding DINO và chi phí tính toán của phép can thiệp.** — 0/3 aspects synthesized · [o3](nodes/o3.md)

- **O4: Thiết lập kho mã nguồn thực nghiệm điều khiển bằng cấu hình, dễ thay mô-đun và có thể tái lập trên nhiều môi trường.** — 0/2 aspects synthesized · [o4](nodes/o4.md)

## Priorities

- **Chuẩn bị và cấu trúc bộ dữ liệu đánh giá** — pinned, current milestone · [task_dataset_foundation](nodes/task_dataset_foundation.md)

- **Chạy GeoCLIP baseline và phương pháp đề xuất từ đầu vào đến đầu ra** — current milestone · [task_baseline_proposed_e2e](nodes/task_baseline_proposed_e2e.md)

- **Khảo sát sandbox trên notebook** — current milestone · [task_july_sandbox](nodes/task_july_sandbox.md)

- **Ghi yêu cầu thiết kế và dấu vết tái lập từ sandbox** — current milestone · [task_repro_design_requirements](nodes/task_repro_design_requirements.md)

## Research questions

- **RQ1** (open) — 0 merged evidence · Có thể tích hợp các dấu hiệu thị giác cục bộ từ bộ phát hiện dùng từ vựng mở thành phép can thiệp attention không cần huấn luyện trong GeoCLIP như thế nào?

- **RQ2** (open) — 0 merged evidence · Phép can thiệp attention ảnh hưởng như thế nào đến độ chính xác trên bộ đánh giá gốc và độ bền trước thay đổi miền tự nhiên so với GeoCLIP?

- **RQ3** (open) — 0 merged evidence · Giải thích theo vùng đối tượng trung thực về mặt nhân quả đến đâu, lỗi Grounding DINO ảnh hưởng thế nào và phép can thiệp tạo ra đánh đổi tính toán gì?

## Timeline

- **Tháng 7/2026 — Vùng thử nghiệm có kỷ luật và nền tảng dữ liệu** — 4 milestones

## Decisions and retained dead ends

- **Giữ cố định location encoder và gallery gốc của GeoCLIP** (active) · [decision_fixed_geoclip_gallery](nodes/decision_fixed_geoclip_gallery.md)

## Team

- Lê Anh Duy (`le-anh-duy`)

- Trần Gia Huy (`tran-gia-huy`)
