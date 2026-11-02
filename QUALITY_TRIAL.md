# Theo dõi thử bộ lọc chất lượng cầu v1

Mục mới nằm ở tab đầu tiên, ngay dưới ba thẻ TOP đường cầu. Đây là theo dõi thử từ thời điểm bật tính năng, không phải cam kết tăng tỉ lệ hoặc sinh lời. Không tự đặt cược.

## Quy tắc cố định

- Dùng 60 kết quả liên tục trước ngày dự đoán, mỗi kết quả đủ 27 số lô tô.
- Quét với điều kiện mặc định của VIP 4 kỳ: min_occurrences=10, min_confidence=0.40, exact_streak=4, top_n=50. Top 1 đối chiếu lấy cùng lần quét này, không lấy một lần quét tùy chỉnh khác trên màn hình.
- Trong 50 cầu theo thứ tự sẵn có, chọn cầu đầu tiên đạt đủ: ≥40 lần đối chiếu, testHitRate ≥0.50, testHitRate ≥ trainHitRate−0.10, isOverfit=False, wilsonLower > baseline. Không có cầu đạt thì ghi quyết định bỏ ngày.
- Phần train/test của thuật toán cũ vẫn nằm trong tập dữ liệu khai phá. Chỉ kết quả phát sinh sau bản ghi mới là phép kiểm chứng về sau. Các ngưỡng v1 là giả thuyết khởi đầu, không được chọn theo kết quả tương lai. Đổi ngưỡng phải tạo version mới.
- Dự đoán chỉ có thể ghi cho hôm nay trước 18:00 giờ Việt Nam, hoặc ngày mai sau khi đã có đủ kết quả hôm nay. Không tạo bù quá khứ; dữ liệu quá cũ thì không ghi.
- Cặp số, Top 1 đối chiếu, các chỉ số, điều kiện và lý do chọn/bỏ được lưu một lần trong quality_trial_snapshots, khóa theo (version, target_date). Quét lại không ghi đè.
- Lưu riêng với lịch sử VIP hiện có. Không sửa hoặc nhập dự đoán lịch sử cũ thành dữ liệu của thử nghiệm.

## Cách chấm

Giữ nguyên một hoặc hai số tối đa hai ngày liên tiếp. Một số xuất hiện là trúng khung; trúng ngày đầu thì dừng. Chỉ đưa vào thống kê khi có đủ kết quả cả hai ngày để mẫu chấm của các phương án cùng độ chín.

Hiển thị bộ lọc, Top 1 mọi ngày đã ghi và Top 1 trên đúng những ngày bộ lọc chọn. Bỏ ngày không tính là thua và không cắt chuỗi trượt của các khung đã chọn. Khung kép (1 số) và cặp (2 số) đếm riêng. Các khung ngày liên tiếp có thể chồng nhau nên không xem là các quan sát độc lập.

Tiền thử do người dùng nhập, không có mặc định về mức cược hoặc trả thưởng. Chi phí = tiền mỗi số mỗi ngày × số lượng số × số ngày dùng (1 nếu trúng ngày đầu, 2 nếu không). Tiền nhận = tổng số nháy ở những ngày sử dụng × tổng tiền nhận mỗi nháy. Không tăng tiền ngày hai. Phép tính theo khung có thể trùng ngày/số, không phải sổ tiền thực tế.

## Vận hành

Web worker đồng bộ kết quả và thử ghi quyết định mỗi 15 phút; nhiều worker có thể cùng chạy nhưng khóa duy nhất và giao dịch ghi bảo vệ bản ghi đầu tiên. Nếu dịch vụ ngủ hoặc kết quả thiếu, hệ thống có thể bỏ lỡ ngày và không tự tạo bù. Nút “Ghi nhận & làm mới” cho phép thử ghi ngay khi đủ điều kiện. Có thể đặt XSMB_DISABLE_BACKGROUND_SYNC=1 trong môi trường kiểm thử để tắt vòng chạy nền.

GET /api/quality-trial chỉ đọc. POST /api/quality-trial/capture thử ghi quyết định. GET hỗ trợ stake và payout (phải đi cùng nhau, hữu hạn, >0 và ≤10^12).

Trước khi đưa lên Railway, cần xác nhận file xsmb.db hiện tại nằm trên vùng lưu bền và sao lưu file này bằng công cụ quản trị của Railway. Cấu hình hiện tại trỏ vào thư mục mã nguồn; không thể xác nhận cơ chế lưu bền chỉ từ URL công khai. Không thay thế file dữ liệu đang chạy bằng xsmb.db cũ trong GitHub. Bản thay đổi này không sửa file xsmb.db được theo dõi trong Git.

## Các bước kiểm tra bằng tay

1. Mở web, vào tab **Vẽ Đường Cầu (Trang Chủ)**. Kéo xuống dưới ba thẻ Top; thấy **Theo dõi thử · Lọc chất lượng cầu**.
2. Mở **Điều kiện cố định của bản thử v1**. Kiểm tra điều kiện và giờ chốt là 18:00 giờ Việt Nam.
3. Bấm **Ghi nhận & làm mới**. Nếu đủ dữ liệu và chưa qua giờ chốt, có một dòng mới với số hoặc **Bỏ ngày**, cùng thời điểm ghi. Nếu thiếu dữ liệu/quá giờ, thấy lý do và không thêm dự đoán quá khứ.
4. Bấm lại, tải lại trang hoặc quét lại VIP. Cặp số và thời điểm của dòng đã lưu phải giữ nguyên.
5. Chưa có đủ kết quả hai ngày thì dòng chọn hiển thị **Chờ đủ 2 ngày**, tỉ lệ không hiện thành 0%. Khi đủ, đối chiếu cả cặp với 27 số của từng ngày, rồi kiểm tra tổng trúng trong bảng.
6. Nhập chỉ một ô tiền, bấm **Tính thử lãi/lỗ**: ứng dụng yêu cầu nhập đủ hai ô. Nhập cả hai mức dương: hiển thị lãi/lỗ giả định; không phát sinh giao dịch.
7. Mở trên điện thoại: tiêu đề/nút/ô nhập xuống dòng, bảng có thể kéo ngang, phần điều hướng bên phải không che nội dung mới.

## Kiểm thử tự động

Chạy `python -m unittest test_quality_trial -v`. Các bài kiểm tra dùng kho dữ liệu tạm, không cào mạng và không sửa lịch sử thật.
