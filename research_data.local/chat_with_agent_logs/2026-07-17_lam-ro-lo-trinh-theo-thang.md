# Chat with Agent Log

Nhật ký này ghi lại những điều nhà nghiên cứu và tác nhân đã thống nhất trong
từng phiên trao đổi. Các giả thuyết hoặc hướng chưa được chốt phải nằm riêng ở
phần “Điểm còn mở”. Nhật ký không thay thế `PROJECT.md`, `STATE.md` hoặc bằng
chứng nghiên cứu.

## Phiên 2026-07-17 — Làm rõ lộ trình theo tháng

### Quy ước trao đổi

- Khi trao đổi bằng tiếng Việt, ưu tiên dùng tiếng Việt nhất quán; thuật ngữ
  tiếng Anh chỉ giữ lại khi là tên riêng hoặc chưa có cách dịch phù hợp.
- Khi bản dịch tiếng Việt dễ gây hiểu lầm, giữ thuật ngữ tiếng Anh quen dùng và
  thêm một câu giải thích hoặc nhận xét ngay lần xuất hiện đầu tiên.
- Tác nhân cần chất vấn những tên gọi, tiêu chí hoàn tất và ranh giới công việc
  còn mơ hồ, nhưng không đi quá sâu vào chi tiết triển khai khi chưa cần thiết.

### Phân biệt hai kho mã nguồn

- Kho hiện tại là kho điều phối nghiên cứu: lưu lộ trình, quyết định, ghi chú,
  bằng chứng và liên kết đến sản phẩm bên ngoài. Kho này được sử dụng và cải
  tiến dần theo phản hồi, không phải sản phẩm cần “hoàn thiện” trong một tháng
  hay trọng tâm nghiên cứu của tháng 7.
- Mã nguồn chạy GeoCLIP, Grounding DINO và phép can thiệp chú ý nằm trong không
  gian thực nghiệm bên ngoài. Đây là phần cần được tổ chức thành mã nguồn thực
  nghiệm có cấu hình rõ ràng, dễ thay thế mô-đun và dễ tái lập.
- O4 nói về việc thiết lập kho mã nguồn thực nghiệm này, không nói về kho điều
  phối nghiên cứu hiện tại. O4 sở hữu cấu hình, khả năng thay mô-đun, khả năng
  tái lập và chạy trên nhiều môi trường; O1 sở hữu định nghĩa khoa học và lựa
  chọn phép can thiệp chú ý.
- Việc bảo trì kho mã nguồn thực nghiệm diễn ra xuyên suốt, nhưng không được
  dùng như một tiêu chí hoàn thành vô hạn. O4 có thể được xem xét hoàn thành khi
  một bản sao sạch của kho mã nguồn chạy lại được GeoCLIP, phương pháp đề xuất
  và quy trình phân tích dữ liệu khám phá bằng cấu hình trên các môi trường đã
  chọn, với đầu vào, đầu ra, phiên bản mã nguồn và sản phẩm chạy được ghi lại.
- O4 được chia thành hai khía cạnh: thiết kế kho mã nguồn điều khiển bằng cấu
  hình với mô-đun và định dạng đầu vào/đầu ra rõ ràng; và xác nhận khả năng tái
  lập trên nhiều môi trường từ một bản sao sạch.
- Khía cạnh thiết kế được gắn với mốc ghi yêu cầu thiết kế tháng 7 và mốc tổ
  chức mã nguồn theo cấu hình tháng 8. Khía cạnh tái lập được gắn với mốc chạy
  lại GeoCLIP, phương pháp đề xuất và phân tích dữ liệu khám phá trên Colab và
  Kaggle trong tháng 8.
- Việc chạy lại thành công ở mốc O4 chỉ xác nhận hạ tầng. Nếu lần chạy tạo kết
  quả khoa học, kết quả đó phải nằm trong node thực nghiệm riêng thuộc O1/O2 và
  chỉ trở thành bằng chứng sau khi được xem xét.

### Hướng đã thống nhất cho tháng 7

- Tháng 7 là vùng thử nghiệm có kỷ luật: có thể dùng sổ tay tính toán hoặc
  Colab để thử nhanh, chấp nhận thất bại và tìm hiểu luồng xử lý thực tế trước
  khi đóng cứng kiến trúc mã nguồn.
- Trọng tâm là thử nhiều cách trên sổ tay tính toán để hiểu dữ liệu, GeoCLIP,
  Grounding DINO và vị trí có thể can thiệp trước khi tổ chức mã nguồn chính.
- Chuẩn bị bộ dữ liệu, siêu dữ liệu, cách chia dữ liệu và quy trình đánh giá đủ
  kỹ để sẵn sàng chạy đánh giá chuẩn khi cần.
- Chạy được cả GeoCLIP nguyên bản và bản thử nghiệm Grounding DINO kết hợp phép
  can thiệp chú ý từ đầu vào đến đầu ra. Mục tiêu của giai đoạn này là xác nhận
  luồng xử lý, chưa phải chứng minh phương pháp tốt hơn.
- Mỗi mô-đun phải xác định rõ định dạng đầu vào và đầu ra. Hai quy trình cần
  dùng định dạng dữ liệu tương thích và tạo kết quả có cấu trúc so sánh được.
- Mọi lần chạy cần có khả năng tái lập, nhưng chỉ những lần chạy làm thay đổi
  hiểu biết, quyết định, hướng đi hoặc tạo ra thất bại đáng nhớ mới cần ghi chú
  trong kho điều phối.
- “Dấu vết tái lập” của một lần chạy gồm tối thiểu phiên bản mã nguồn, cấu hình,
  bộ dữ liệu, hạt giống ngẫu nhiên và vị trí lưu kết quả.
- Các thất bại và kinh nghiệm trong tháng 7 phải được chuyển thành yêu cầu thiết
  kế cho mã nguồn thực nghiệm ở tháng 8.

### Các tiêu chí đã thống nhất cho tháng 8

- Tổ chức lại những phần đã hiểu từ vùng thử nghiệm thành mã nguồn thực nghiệm
  có cấu hình rõ ràng, dễ thay thế mô-đun và có thể tái lập.
- Kiểm tra tính đúng đắn của quy trình, tái tạo được các kết quả tham chiếu từ
  một lần chạy sạch, rồi mới tập trung cải thiện và đánh giá phương pháp đề xuất.
- GeoCLIP nguyên bản là quy trình đối chiếu; Grounding DINO kết hợp phép can
  thiệp chú ý là phương pháp đề xuất. Cả hai dùng cùng hệ thống cấu hình và định
  dạng dữ liệu.
- Mã nguồn phải chạy được trên Colab và Kaggle. Sổ tay trên hai nền tảng chỉ
  sao chép kho mã nguồn, chuyển đến đúng phiên bản Git, cài thư viện, khai báo
  đường dẫn dữ liệu/kết quả và gọi cùng tập lệnh; không chứa logic nghiên cứu
  riêng.
- Dự kiến hoàn thành khoảng 3–4 thực nghiệm thăm dò có ý nghĩa ngoài các lần
  kiểm tra hạ tầng. Mỗi thực nghiệm cần trả lời một câu hỏi và ảnh hưởng đến
  quyết định tiếp theo; số lượng không tự nó chứng minh tiến độ.
- Phạm vi thử nghiệm phép can thiệp chú ý phải xét cả lớp được can thiệp, kiểu
  can thiệp, các cấu hình liên quan và bộ từ vựng đưa vào Grounding DINO.
- Chuyển phần phân tích dữ liệu khám phá của tháng 7 thành một quy trình chạy
  lại được bằng cấu hình và bản kê dữ liệu. Quy trình phải tái tạo đúng số lượng
  mẫu, cách chia dữ liệu, cảnh báo chất lượng và thống kê chính; giá trị số thực
  được phép có sai số rất nhỏ, còn lựa chọn ngẫu nhiên phải dùng hạt giống cố
  định.
- Việc tái tạo phân tích dữ liệu khám phá là kiểm tra hạ tầng và dữ liệu, không
  được tính vào 3–4 thực nghiệm nghiên cứu.
- Ranh giới chính xác giữa công việc tháng 8 và thử nghiệm có hệ thống ở tháng
  9 vẫn chưa được chốt.

### Hướng đã thống nhất cho tháng 9

- Tháng 9 là giai đoạn thử nghiệm có hệ thống dựa trên những gì đã học được từ
  sandbox tháng 7 và các thực nghiệm thăm dò tháng 8.
- Mục tiêu là thu hẹp các phương án và chọn một công thức/cấu hình can thiệp
  chính để mang sang đánh giá độ chính xác và độ bền trong tháng 10.
- Các biến số, tiêu chí chọn và ma trận thực nghiệm cụ thể sẽ được xác định sau
  khi có kết quả thực tế từ tháng 7–8.

### Hướng đã thống nhất cho tháng 10 và các tháng sau

- Bỏ cách gọi “dữ liệu sạch” và “dữ liệu dơ” vì không xác định rõ nguồn và loại
  thay đổi. Tháng 10 ưu tiên độ chính xác trên bộ đánh giá gốc và độ bền khi miền
  dữ liệu thay đổi tự nhiên; cả hai đều quan trọng.
- Bộ đánh giá gốc là tập kiểm thử chính thức của bộ dữ liệu dùng làm benchmark,
  giữ nguyên ảnh để so sánh công bằng với GeoCLIP. Số object Grounding DINO phát
  hiện chỉ dùng để chia nhóm phân tích, không dùng để chọn ảnh đưa vào tập này.
- Bộ nhiễu có kiểm soát được tạo từ bộ đánh giá gốc bằng các phép biến đổi, mức
  độ và hạt giống được xác định trước; không gọi nhóm này là dữ liệu dơ.
- Bộ ảnh thực tế bổ sung có thể đến từ nguồn khác hoặc một nhóm nhỏ khoảng
  40–50 ảnh do người quen hỗ trợ thu thập. Nhóm nhỏ này chỉ là một khả năng khảo
  sát thay đổi miền tự nhiên, không phải benchmark hay trụ cột kết luận chính;
  nếu sử dụng thì cần tọa độ thật, quyền sử dụng và quy trình thu thập phù hợp.
- Thay đổi miền tự nhiên có thể gồm điều kiện sáng/tối và thay đổi theo thời
  gian giữa ảnh cũ với ảnh mới; các nhóm cụ thể sẽ được chốt theo bộ dữ liệu.
- Nhiễu có kiểm soát vẫn thuộc phạm vi nghiên cứu nhưng chưa phải trọng tâm cần
  đóng cứng cho tháng 10. Chỉ chọn một số loại nhiễu nhân tạo hoặc tự nhiên có
  lý do rõ ràng thay vì cố đánh giá mọi khả năng.
- Các tháng phía sau là khoảng định hướng mềm, không phải hạn hoàn tất cứng.
  Thực nghiệm có thể kéo dài sang tháng sau khi cần; lộ trình sẽ được điều chỉnh
  theo bằng chứng và khối lượng thực tế.

### Hướng đã thống nhất cho tháng 11

- Tháng 11 tập trung vào `ablation study`: tắt, thay thế hoặc thay đổi từng
  thành phần/cấu hình để đo đóng góp của nó; đồng thời phân tích trường hợp thất
  bại và củng cố các kết quả đã có. Đây không mặc định là xóa object khỏi ảnh.
- Việc che, cắt hoặc đảo vùng object để xem dự đoán thay đổi thế nào thuộc nhóm
  kiểm tra tính trung thực nhân quả và cần được mô tả riêng khi lên thực nghiệm.
- Không buộc đóng objective theo lịch. Objective đủ bằng chứng thì được tổng
  hợp để nhà nghiên cứu xem xét; objective chưa đủ tiếp tục sang giai đoạn sau.
- Tháng 11 cũng có thể tiếp nhận phần đánh giá từ tháng 10 kéo dài sang.

### Hướng đã thống nhất cho tháng 12 và tháng 1

- Tháng 12 tập trung tạo bằng chứng chính cho RQ3 về tính trung thực nhân quả,
  trường hợp thất bại của bộ phát hiện và chi phí tính toán.
- Cuối tháng 12 tạo bản tổng hợp tạm thời cho RQ1–RQ3 cùng danh sách bằng chứng
  còn thiếu, mâu thuẫn hoặc cần kiểm tra thêm; chưa coi đây là câu trả lời cuối.
- Tháng 1 xử lý các thực nghiệm còn thiếu, củng cố hạn chế và rủi ro, rồi chuẩn
  bị kết quả cuối cùng cùng câu trả lời đề xuất để nhà nghiên cứu xem xét.
- Ranh giới tháng 12–1 vẫn mềm và có thể tiếp nhận công việc kéo dài từ các
  tháng trước.

### Hướng đã thống nhất cho tháng 2 và tháng 3

- Không đợi đến tháng 2 mới bắt đầu viết; phương pháp, quyết định, kết quả và
  hình minh họa được ghi lại dần trong quá trình nghiên cứu.
- Tháng 2 ghép các nội dung đã có thành bản thảo đầy đủ đầu tiên, hoàn thiện
  hình/bảng, phần hạn chế và thông tin tái lập, rồi nhận phản hồi nội bộ.
- Tháng 3 xử lý phản hồi, kiểm tra các tuyên bố so với bằng chứng, hoàn thiện
  sản phẩm tái lập và nộp bài nếu hạn phù hợp.
- Nếu hạn nộp thay đổi, hai giai đoạn viết và hoàn thiện được dịch theo mà không
  làm thay đổi ý nghĩa của chúng.

### Quy trình từ câu hỏi nghiên cứu đến kết luận

- Câu hỏi nghiên cứu đóng vai trò định hướng; không cần trả lời xong hoàn toàn
  một câu rồi mới chuyển sang câu khác.
- Trước mỗi thực nghiệm cần nêu câu hỏi nhỏ mà nó kiểm tra, kết quả nào có thể
  làm thay đổi quyết định và câu hỏi nghiên cứu mà nó dự kiến đóng góp chủ yếu.
- Chỉ liên kết một kết quả làm bằng chứng sau khi xem xét nó thực sự hỗ trợ,
  phản bác hay làm rõ giới hạn của câu hỏi; không gán liên hệ chỉ vì kết quả có
  vẻ phù hợp sau khi đã quan sát.
- Cuối mỗi tháng tổng hợp câu trả lời tạm thời và khoảng trống bằng chứng. Câu
  trả lời cuối chỉ được chốt sau khi đã tích lũy và tổng hợp đủ bằng chứng.
- Objective chỉ hoàn tất sau khi các khía cạnh đã được tổng hợp và nhà nghiên
  cứu xác nhận, không phải chỉ vì đã chạy đủ số thực nghiệm.
- Tháng 8 chủ yếu tạo bằng chứng thăm dò cho RQ1. Tháng 9 hoàn tất lựa chọn cấu
  hình chính cho RQ1 và chuẩn bị giao thức đánh giá; tháng 10 tập trung bằng
  chứng cho RQ2; tháng 11–12 tập trung vào RQ3 và tổng hợp các câu hỏi nghiên
  cứu.

### Cấu trúc node đã thống nhất

- Các synthesis node trống được tạo sẵn cho O1–O4 sẽ bị xóa cùng các link đi
  kèm. Chỉ tạo synthesis node khi một khía cạnh đã có bằng chứng thật để tổng
  hợp và đưa cho nhà nghiên cứu xem xét.
- O1 có hai khía cạnh: định nghĩa phép can thiệp và các trường hợp biên; chọn
  cấu hình can thiệp chính thông qua thực nghiệm thăm dò và có hệ thống.
- GeoCLIP baseline và việc chạy quy trình là task hỗ trợ; O4 chịu trách nhiệm
  cho khả năng chạy lại, còn kết quả khoa học được ghi trong experiment node.
- Cặp location encoder và gallery gốc của GeoCLIP được giữ cố định cho cả
  baseline lẫn phương pháp đề xuất. Thay gallery hoặc huấn luyện lại location
  encoder không thuộc phạm vi chính và chỉ là hướng tùy chọn nếu sau này có lý
  do riêng.
- Chỉ ghi nguồn, phiên bản và giới hạn rò rỉ của gallery trong phạm vi có thể
  kiểm tra. Không tuyên bố gallery đã được kiểm soát rò rỉ nếu thiếu dữ liệu để
  xác nhận; trường hợp đó phải được ghi thành hạn chế.
- O3 có ba khía cạnh: ảnh hưởng của lỗi Grounding DINO; tính trung thực nhân
  quả; và chi phí tính toán của toàn quy trình. Ablation study về thành phần của
  phép can thiệp thuộc O1, còn ablation riêng về lỗi detector thuộc O3.
- O1 định nghĩa hành vi khi không phát hiện; O3 đo hậu quả thực tế của hành vi
  đó. Phép đối chứng ngẫu nhiên cùng diện tích được giữ như một ý tưởng thiết kế
  cho kiểm tra tính trung thực nhân quả, chưa phải bằng chứng hoặc kết luận.
- Đã tạo ghi chú chi tiết tại
  `nodes/note_random_equal_area_control.md`.
- RQ1 chỉ ánh xạ với O1, RQ2 chỉ ánh xạ với O2 và RQ3 chỉ ánh xạ với O3. O4
  là mục tiêu hỗ trợ nên không trực tiếp trả lời câu hỏi nghiên cứu nào.
- RQ2 tập trung vào độ chính xác trên bộ đánh giá gốc và độ bền trước thay đổi
  miền tự nhiên. Nhiễu có kiểm soát là phân tích bổ sung nếu được thực hiện,
  không phải điều kiện bắt buộc để trả lời RQ2.
- Tiêu đề Project, objective, aspect và RQ được chuyển sang tiếng Việt. Tên
  riêng được giữ nguyên; thuật ngữ tiếng Anh chỉ giữ khi cần và phải được giải
  thích bằng tiếng Việt trong nội dung node.
- O1 không chốt trước rằng trường hợp không phát hiện phải giữ nguyên GeoCLIP.
  O1 cần xác định và kiểm chứng một quy tắc hợp lệ; giữ nguyên GeoCLIP, dùng quy
  tắc thích nghi hoặc hành vi khác vẫn là các phương án cần xem xét.
- O2 có ba khía cạnh chính: nền tảng dữ liệu và giao thức đánh giá; độ chính xác
  trên bộ đánh giá gốc; và độ bền trước thay đổi miền tự nhiên. Chưa tạo khía
  cạnh bắt buộc cho nhiễu có kiểm soát.
- Chỉ tạo task node cho công việc tháng 7–8 đã đủ rõ. Các experiment node tháng
  8 và node cho những tháng xa chỉ được tạo khi câu hỏi hoặc công việc cụ thể đã
  được xác định, tránh graph đầy node rỗng.

### Ghi chú về hệ số α–β

- Không phát hiện được hộp nào là một đầu ra hợp lệ của Grounding DINO, không
  phải lỗi của quy trình.
- Với cách biểu diễn hiện tại, khi tập vùng phát hiện rỗng thì mọi phép kiểm tra
  mảnh ảnh có thuộc tập đó đều cho kết quả sai; vì vậy mọi mảnh ảnh nhận hệ số α
  và toàn bộ vùng chú ý bị làm mờ.
- Có thể cho α và β phụ thuộc vào tỷ lệ diện tích được phát hiện, nhưng công thức
  và các ràng buộc chưa được xác định.
- Ghi chú nghiên cứu chi tiết nằm tại
  `nodes/note_alpha_beta_area_scaling.md`.

### Điểm còn mở

- Chốt nội dung của 3–4 thực nghiệm thăm dò phục vụ RQ1 trong tháng 8.
- Chưa đặt tiêu chí giữ lại hoặc loại bỏ một cách can thiệp trước khi có dữ liệu
  thực tế. Sau khi hoàn tất sandbox tháng 7, xem lại các dạng thực nghiệm, hành
  vi và kết quả đã quan sát để xây dựng tiêu chí có căn cứ.
- Chốt nguồn dữ liệu chính, vai trò của Google Drive/Hugging Face và cách xử lý
  bộ dữ liệu không được phép phân phối lại.
- Chốt thời điểm và phạm vi đánh giá nhiễu có kiểm soát sau khi biết tiến độ
  đánh giá dữ liệu sạch và thay đổi miền tự nhiên.
- Xác định công thức liên hệ α–β với diện tích phát hiện.
- Chọn hành vi khi không phát hiện: giữ nguyên GeoCLIP hay dùng quy tắc thích
  nghi từ công thức tổng quát.
- Tháng 3/2027 hiện là cửa sổ nộp bài dự kiến, chưa phải hạn đã xác nhận. Cần
  hỏi người hướng dẫn về nơi nộp, thể thức và ngày hạn trước khi chốt kế hoạch
  viết tháng 2–3.

### Trạng thái cập nhật

- Đã tạo ghi chú α–β.
- Đã cập nhật `timeline.json` theo bản timeline được nhà nghiên cứu duyệt trong
  phiên này; các chi tiết được đánh dấu mở vẫn có thể được điều chỉnh sau.
- Đã sửa Project, O1–O4, RQ1–RQ3 và các aspect theo cấu trúc đã duyệt; O4 hiện
  nói đúng về kho mã nguồn thực nghiệm.
- Đã tạo các task gần nhất cho tháng 7–8, decision giữ cố định location encoder
  và gallery GeoCLIP, cùng các link `step`/`informs` tương ứng.
- Đã xóa bốn synthesis node trống và các link phụ thuộc; synthesis chỉ được tạo
  lại khi có bằng chứng thật để tổng hợp.
