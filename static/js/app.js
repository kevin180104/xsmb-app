        // =========================================================================
        // HỆ THỐNG GIẢI THÍCH & CHÚ THÍCH CÁC CẦU (KÈM VÍ DỤ THỰC TẾ CHI TIẾT)
        // =========================================================================
        const BRIDGE_EXPLANATIONS = {
            "module_cau": {
                "title": "MODULE CẦU – NHỊP ĐI & CẦU KẸP BẢNG GIẢI",
                "badge": "Thuật toán Cốt Lõi",
                "essence": "Tự động quét và nhận diện nhịp chu kỳ xen kẽ Về – Nghỉ (1 Về 1 Nghỉ) trên chuỗi 4 ngày liên tiếp hoặc các cặp số bị kẹp giữa hai số giống nhau trên bảng mở thưởng ngày hôm qua.",
                "example": "• Ví dụ 1 (Nhịp 1 Về 1 Nghỉ): Cặp 38 có chuỗi 4 ngày là V-N-V-N (ngày 1 Về, ngày 2 Nghỉ, ngày 3 Về, ngày 4 Nghỉ). Ngày thứ 5 điểm rơi chu kỳ đảo sang pha VỀ để giữ nhịp.<br>• Ví dụ 2 (Cầu Kẹp): Giải 3.2 nổ 5385 (cặp 38 bị kẹp giữa hai chữ số 5) -> Báo bắt cặp 38 - 83.",
                "condition": "Đạt độ tin cậy cao nhất khi chuỗi nhịp chạy chuẩn tối thiểu 4 kỳ hoặc số kẹp xuất hiện ở các giải lớn (Giải 1, 2, 3)."
            },
            "module_01": {
                "title": "MODULE 01 – CẦU VỀ / NGHỈ (1 VỀ – 1 NGHỈ)",
                "badge": "Chu kỳ Xen kẽ",
                "essence": "Phát hiện các cặp số đang dao động điều hòa tuần hoàn theo quy luật 1 kỳ nổ – 1 kỳ nghỉ (V-N-V-N). Thuật toán đón đầu ngay khi số vừa hoàn thành xong pha NGHỈ để vào pha VỀ tiếp theo (tránh tình trạng bắt số vừa nổ hôm qua đang vào pha nghỉ).",
                "example": "Ví dụ: Cặp 45 có lịch sử 4 ngày: Hôm 1 VỀ, Hôm 2 NGHỈ, Hôm 3 VỀ, Hôm 4 NGHỈ. Dự đoán Hôm 5 điểm rơi bắt buộc đảo sang pha VỀ của cặp 45.",
                "condition": "Hiệu quả cao khi nhịp lặp lại từ 2 chu kỳ hoàn chỉnh (tối thiểu 4 kỳ theo dõi) và số không bị nổ đột biến quá nhiều nháy ở kỳ trước."
            },
            "module_02": {
                "title": "MODULE 02 – CẦU LÔ RƠI",
                "badge": "Lô Rơi Từ Đề / Lô",
                "essence": "Đo lường xác suất một con số đã về hôm trước tiếp tục rơi lại vào ngày hôm sau. Thuật toán phân tích 2 nhánh: Rơi từ Giải Đặc Biệt (Rơi từ Đề) và Rơi từ các giải Lô có phong độ cao nhất.",
                "example": "Ví dụ: Giải Đặc Biệt hôm qua nổ 31922 (đề về kép 22). Thống kê lịch sử cho thấy khi đề về 22, tỷ lệ nổ lại lô 22 trong vòng 1-2 ngày sau đạt trên 45% -> Đón bắt lô rơi 22.",
                "condition": "Nên bắt khi con số đó có phong độ đều đặn trong 10 ngày gần nhất (không phải số ngẫu nhiên hoặc số gan lì mới ra)."
            },
            "module_03": {
                "title": "MODULE 03 – CẦU BẠC NHỚ DÂN GIAN",
                "badge": "Kinh nghiệm Xác suất",
                "essence": "Ứng dụng các quy tắc Bạc Nhớ kinh điển của xác suất XSMB: khi một cặp số hoặc hiện tượng xuất hiện ở kỳ trước, nó thường kéo theo sự xuất hiện của các cặp số liên đới nhất định ở kỳ sau.",
                "example": "Ví dụ: Bạc nhớ theo cặp: Hôm qua ra cặp 01-10 thì hôm sau thường kéo theo cặp 06-60 hoặc 89-98. Hôm trước ra cả cặp 25-52 thì hôm sau dễ nổ 22.",
                "condition": "Hiệu lực mạnh nhất khi cặp số mồi xuất hiện từ 2 nháy trở lên hoặc ra cùng lúc cả cặp lộn."
            },
            "module_04": {
                "title": "MODULE 04 – CẦU ĐẦU CÂM",
                "badge": "Cân bằng Áp lực",
                "essence": "Khi một đầu số từ 0 đến 9 hoàn toàn không có bất kỳ giải lô nào xuất hiện trong bảng mở thưởng (Đầu câm), áp lực xác suất bị nén sẽ giải phóng dồn dập vào các con số thuộc đầu đó trong ngày kế tiếp.",
                "example": "Ví dụ: Bảng kết quả ngày hôm qua câm Đầu 4 (từ 40 đến 49 không ra con nào). Quy luật giải tỏa áp lực chỉ ra các con dễ nổ nhất hôm sau: Kép bằng 44, hoặc các số chạm đầu 40, 45.",
                "condition": "Cực kỳ hiệu quả khi chỉ câm duy nhất 1 đầu trong cả bảng kết quả (áp lực giải tỏa đạt mức cực đại)."
            },
            "module_05": {
                "title": "MODULE 05 – CẦU ĐUÔI CÂM (ĐÍT CÂM)",
                "badge": "Cân bằng Áp lực",
                "essence": "Tương tự đầu câm, khi một hàng đơn vị (đuôi) từ 0 đến 9 không xuất hiện bất kỳ số nào trong kỳ quay, áp lực chu kỳ sẽ dồn về đuôi đó trong 1-2 ngày tiếp theo.",
                "example": "Ví dụ: Bảng kết quả hôm qua câm Đuôi 7 (không có 07, 17, 27,... 97). Thuật toán sẽ ưu tiên bắt cặp kép 77 và các cặp loto sáng giá như 07, 57.",
                "condition": "Kết hợp tối ưu khi bảng kết quả có đồng thời đầu câm và đuôi câm cùng chỉ về một con kép bằng (ví dụ câm đầu 7 và đuôi 7 -> bắt ngay 77)."
            },
            "module_06": {
                "title": "MODULE 06 – CẦU PASCAL",
                "badge": "Toán học Cộng dồn",
                "essence": "Ghép các chữ số của Giải Đặc Biệt và Giải Nhất thành một chuỗi, sau đó áp dụng phép cộng dồn tam giác Pascal theo modulo 10 (cộng 2 số liền kề lấy số hàng đơn vị) thu gọn dần còn 2 số cuối cùng.",
                "example": "Ví dụ: GĐB là 31922 và G1 là 74815 -> Tạo chuỗi: 3192274815. Cộng từng đôi liền kề: 3+1=4, 1+9=0, 9+2=1... Lặp lại các tầng tam giác thu nhỏ dần cho đến đáy còn cặp [68] -> Chốt cặp loto 68-86.",
                "condition": "Cầu Pascal chạy cực kỳ ổn định theo từng khung 3-5 ngày khi bảng giải xuất hiện các dãy số tiến hoặc số gánh."
            },
            "module_07": {
                "title": "MODULE 07 – CẦU LÔ KẸP BẢNG GIẢI",
                "badge": "Hình học Bảng thưởng",
                "essence": "Tìm kiếm các số gồm 2 chữ số bị kẹp chính giữa hai chữ số giống nhau trong các giải thưởng từ Giải 1 đến Giải 5 (những giải có từ 4 đến 5 chữ số).",
                "example": "Ví dụ: Giải 3.1 nổ dãy 75427 (chữ số đầu 7 và chữ số cuối 7 kẹp các số ở giữa) hoặc Giải 4.2 nổ 6386 (số 38 kẹp giữa hai số 6) -> Con số bị kẹp [38] sẽ được chọn để đánh cho ngày hôm sau.",
                "condition": "Cầu kẹp nổ mạnh nhất khi số bị kẹp nằm trong giải Nhất, giải Nhì hoặc giải Ba."
            },
            "module_08": {
                "title": "MODULE 08 – CẦU BÁO KÉP",
                "badge": "Tín hiệu Kép",
                "essence": "Nhận diện dấu hiệu báo trước giải Đặc Biệt hoặc bảng lô sắp nổ kép bằng (00, 11, 22,... 99): Dấu hiệu khi 2 số đầu hoặc 2 số giữa của Giải Đặc Biệt là kép, hoặc khi có đầu câm và đuôi câm trùng nhau.",
                "example": "Ví dụ: Giải Đặc Biệt về 88392 (hai số đầu là kép 88) hoặc về 14429 (kép 44 kẹp ở giữa). Đây là tín hiệu kinh điển báo hiệu trong 1-3 ngày tới sẽ nổ kép bằng, ưu tiên kép 88 hoặc 44.",
                "condition": "Khi có dấu hiệu báo kép ở GĐB, tỷ lệ nổ ít nhất 1 con kép trên bảng lô ngày hôm sau lên tới trên 75%."
            },
            "module_09": {
                "title": "MODULE 09 – CẦU GHÉP CHẠM & TỔNG",
                "badge": "Hội tụ Số học",
                "essence": "Phân tích chữ số hàng chục và đơn vị của Giải Đặc Biệt kết hợp với Giải Nhất để tính ra Chạm (các số có đầu hoặc đuôi tương ứng) và Tổng (tổng 2 số cuối % 10), từ đó sàng lọc điểm giao thoa có tần số cao nhất.",
                "example": "Ví dụ: GĐB nổ 31922 (tổng 2+2=4). Giải Nhất nổ 58210 (chạm 1, 0). Ghép chạm 1 tổng 4 tìm được cặp 13-31; chạm 0 tổng 4 tìm được cặp 04-40.",
                "condition": "Rất hiệu quả để bắt cả Lô Tô lẫn Đề đuôi trong ngày."
            },
            "module_10": {
                "title": "MODULE 10 – CẦU BỆT LÔ TÔ",
                "badge": "Quán tính Xác suất",
                "essence": "Bắt các con số hoặc đầu số đang rơi vào chuỗi bệt (nổ liên tiếp từ 2-3 kỳ trở lên mà xung lực rơi vẫn mạnh). Thuật toán tính toán quán tính để xác định số có khả năng bệt tiếp thay vì gãy cầu.",
                "example": "Ví dụ: Cặp 58 ngày 20/09 về 1 nháy, ngày 21/09 về 2 nháy, ngày 22/09 tiếp tục về 1 nháy. Xung lượng rơi chưa bão hòa -> Thuật toán đề xuất tiếp tục theo bệt 58.",
                "condition": "Chỉ theo bệt khi tần suất các ngày xung quanh của con số đó dày và nhịp giải thưởng rải đều ở các giải lớn."
            },
            "module_11": {
                "title": "MODULE 11 – CẦU ÂM DƯƠNG & NGŨ HÀNH",
                "badge": "Bóng Số Học",
                "essence": "Quy đổi 2 số cuối của Giải Đặc Biệt theo hệ thống Bóng Âm (1-4, 2-9, 3-6, 5-8, 0-7) và Bóng Dương (1-6, 2-7, 3-8, 4-9, 5-0) để tìm ra cặp số đối xứng tương sinh.",
                "example": "Ví dụ: Đề về 22. Bóng dương của 2 là 7 -> Cặp bóng dương là 77. Bóng âm của 2 là 9 -> Cặp bóng âm là 99. Thuật toán chọn cặp bóng có sự tương hỗ mạnh nhất với chu kỳ hiện tại.",
                "condition": "Thường ứng dụng khi đề về kép hoặc các số thuộc cung ngũ hành tương sinh với Thứ trong tuần."
            },
            "module_12": {
                "title": "MODULE 12 – CẦU VỊ TRÍ GHÉP CHỮ SỐ",
                "badge": "Quét Cầu Động 3 Kỳ",
                "essence": "Quét tự động 13 cặp vị trí tọa độ cố định trên bảng mở thưởng (ví dụ: Tâm GĐB ghép Tâm G1, Đầu GĐB ghép Đuôi G1, G7.1 ghép G7.4...). Thuật toán kiểm tra cây cầu nào đang ăn thông liên tiếp 2-3 kỳ gần nhất để bắt tiếp kỳ thứ 4.",
                "example": "Ví dụ: Cầu 'Tâm GĐB + Tâm G1' ngày 20 ghép ra 38 -> ngày 21 nổ 38; ngày 21 ghép ra 72 -> ngày 22 nổ 72. Hôm nay vị trí này ghép chữ số 1 và 5 -> Báo bắt cặp 15-51.",
                "condition": "Cực kỳ chuẩn xác khi cầu vị trí đạt chuỗi thông từ 2 đến 3 ngày liên tiếp."
            },
            "module_13": {
                "title": "MODULE 13 – CẦU THEO THỨ TRONG TUẦN",
                "badge": "Chu kỳ 7 Ngày",
                "essence": "Tách riêng dữ liệu theo từng ngày Thứ (Thứ 2 Hà Nội, Thứ 3 Quảng Ninh, Thứ 4 Bắc Ninh,...). Tính toán tần suất và độ ổn định của các số xuất hiện riêng vào đúng ngày Thứ của kỳ quay tiếp theo.",
                "example": "Ví dụ: Ngày mai là Thứ 4 (đài Bắc Ninh mở thưởng). Thuật toán trích xuất 8 kỳ Thứ 4 gần nhất, nhận thấy cặp số 28 đã về 6/8 tuần Thứ 4 (độ ổn định 75%) -> Đề xuất chốt số 28 cho ngày Thứ 4.",
                "condition": "Tối ưu nhất khi chuỗi dữ liệu có từ 6 đến 12 tuần lịch sử để loại trừ các biến động ngẫu nhiên."
            },
            "module_14": {
                "title": "MODULE 14 – TẦN SUẤT & PHONG ĐỘ NGẮN HẠN",
                "badge": "Điểm rơi Poisson",
                "essence": "Săn tìm các cặp số có phong độ cao (về 3-5 lần trong 10 kỳ gần nhất) nhưng VỪA MỚI NGHỈ ĐÚNG 1 KỲ vào hôm qua. Theo phân phối xác suất ngắn hạn, đây là điểm rơi có xác suất bật lại cao nhất.",
                "example": "Ví dụ: Cặp 77 trong 10 ngày qua nổ 4 lần (phong độ cực cao). Hôm qua 77 tạm nghỉ. Nhịp rơi chuẩn của một con lô đang có phong độ cao là nổ sau đúng 1 ngày nghỉ -> Bắt điểm rơi 77.",
                "condition": "Tuyệt đối không bắt các số đang trong chu kỳ nổ liên tục 3 ngày (tránh đỉnh sóng) mà chỉ bắt khi vừa nghỉ đúng 1 ngày."
            },
            "module_15": {
                "title": "MODULE 15 – CẦU LOTO GAN NGẮN",
                "badge": "Đón Nhịp Rơi 2-3 Kỳ",
                "essence": "Thay vì mạo hiểm nuôi lô gan dài kỳ (trên 15-20 ngày), thuật toán chuyên săn các con số có tần suất tổng thể tốt nhưng đang dừng ở nhịp nghỉ ngắn từ 2 đến 3 kỳ liên tiếp.",
                "example": "Ví dụ: Cặp 63 có tần suất nổ đều trong tháng, hiện tại đã nghỉ 2 kỳ liên tiếp (chuỗi V-N-N). Nhịp 2-3 ngày nghỉ là nhịp rơi lý tưởng nhất của các cặp số khỏe -> Đón bắt tại kỳ thứ 3.",
                "condition": "Chỉ áp dụng với những con số có tổng số lần nổ trong 30 ngày qua trên 6 lần (không áp dụng cho số gan lì lợm)."
            },
            "cau_thu": {
                "title": "CẦU THEO THỨ (THEO ĐÀI XỔ SỐ)",
                "badge": "Đặc thù Tỉnh / Thành",
                "essence": "Mỗi ngày trong tuần do một Công ty XSKT tỉnh/thành phố miền Bắc quay thưởng (Thứ 2 & 5: Hà Nội, Thứ 3: Quảng Ninh, Thứ 4: Bắc Ninh, Thứ 6: Hải Phòng, Thứ 7: Nam Định, CN: Thái Bình). Cầu này đo lường cặp số có độ lặp cao nhất riêng ở đài mở thưởng đó.",
                "example": "Ví dụ: Thứ 7 do đài Nam Định quay thưởng. Thống kê 8 tuần Thứ 7 liên tiếp cho thấy cặp 49 xuất hiện 6 lần -> Cặp số chủ lực độc quyền của ngày Thứ 7.",
                "condition": "Đạt độ ổn định cao khi chuỗi tuần đạt từ 60% trở lên qua ít nhất 8 tuần dữ liệu."
            },
            "cau_cham_tuan": {
                "title": "CẦU CHẠM THEO TUẦN",
                "badge": "Chữ số Ưu Thế",
                "essence": "Đếm tần suất xuất hiện của các chữ số hàng chục và hàng đơn vị của toàn bộ 27 giải thưởng trong tất cả các kỳ của ngày Thứ đó.",
                "example": "Ví dụ: Vào các ngày Thứ 4, chữ số 5 xuất hiện tới 32 lần trên tổng số các giải loto -> Chạm 5 là chạm chiếm ưu thế vượt trội nhất của Thứ 4.",
                "condition": "Rất hữu hiệu để lọc dàn loto hoặc kết hợp với Cầu Thứ để tăng tỷ lệ ăn nhiều nháy."
            },
            "cau_tong_tuan": {
                "title": "CẦU TỔNG THEO TUẦN",
                "badge": "Tổng Modulo 10",
                "essence": "Tính tổng 2 chữ số (lấy số hàng đơn vị của tổng) của mỗi cặp loto về trong ngày Thứ đó để xác định Tổng nào nổ dày nhất.",
                "example": "Ví dụ: Các ngày Thứ 3 thường nổ nhiều các số có tổng 7 (như 07, 70, 16, 61, 25, 52, 34, 43, 89, 98) -> Báo ưu tiên đánh Tổng 7.",
                "condition": "Đặc biệt hiệu quả khi soi cầu giải Đặc Biệt (Đề) theo tuần."
            },
            "cau_bet_tuan": {
                "title": "CẦU BỆT THEO TUẦN",
                "badge": "Chuỗi Thông Tuần",
                "essence": "Nhận diện cặp số liên tiếp nổ vào cùng một ngày Thứ trong tuần qua nhiều tuần liên tiếp (bệt tuần liên tục không gãy).",
                "example": "Ví dụ: Cặp 12 đã nổ liên tục 3 tuần Thứ 6 vừa qua -> Đang có chuỗi bệt thông 3 tuần liên tiếp.",
                "condition": "Chuỗi thông từ 2 đến 4 tuần là khoảng thời gian lý tưởng nhất để đón đầu nhịp rơi."
            },

            // =========================================================================
            // 23 THUẬT TOÁN SOI CẦU TỪ ĐIỂN DỮ LIỆU (DATA CATALOG V1.0)
            // =========================================================================
            "cau_dong_to_hop": {
                "title": "CẦU GHÉP VỊ TRÍ TỰ DO (5.671 CẶP VỊ TRÍ)",
                "badge": "Tổ Hợp Vị Trí C(107, 2)",
                "essence": "Mô hình mảng phẳng 107 chữ số cho 27 giải XSMB (Index 0..106). Quét toàn bộ C(107,2) = 5.671 cặp vị trí để tìm ra cặp tọa độ có tần suất nổ liên tiếp &ge; 3 ngày.",
                "example": "Ví dụ: Tọa độ Index 7 (tâm Giải Nhất) ghép với Index 106 (đuôi Giải 7.4) đã liên tục nổ loto 3 ngày qua. Hôm nay Index 7 là số 4 và Index 106 là số 8 &rarr; Đón bắt cặp song thủ 48 - 84.",
                "condition": "Khung nuôi: Song thủ nuôi 1–2 ngày. Tối ưu khi cặp vị trí đạt chuỗi thông từ 3 ngày trở lên."
            },
            "cau_qua_tram": {
                "title": "CẦU HÌNH THOI QUẢ TRÁM",
                "badge": "Hình Thái Bảng",
                "essence": "Xuất hiện ở 3 giải liền kề (G3, G4, G5) tạo thành ma trận hình thoi quả trám: Hàng 1 có B, Hàng 2 có A-B-A, Hàng 3 có B.",
                "example": "Ví dụ: Ba giải liền kề có dạng: G3.1 có B=6, G3.2 có A=4 kẹp giữa hai số B=6 (dạng 646), G3.3 có B=6. Hai chữ số đại diện là 4 và 6 &rarr; Bắt cặp song thủ 46 - 64.",
                "condition": "Khung nuôi: Song thủ nuôi 2–3 ngày. Đây là thế cầu hiếm gặp nhưng xác suất nổ cực cao."
            },
            "cau_kep_so": {
                "title": "CẦU KẸP SỐ BẢNG GIẢI",
                "badge": "Hình Thái Bảng",
                "essence": "Xuất hiện ở các giải &ge; 4 chữ số có dạng X - AB - X hoặc 0 - AB - 0, 8 - AB - 8. Trích xuất chính chuỗi số AB nằm ở vị trí bị kẹp ở giữa.",
                "example": "Ví dụ: Giải 3.2 nổ 7387 (cặp 38 bị kẹp giữa hai chữ số 7) hoặc Giải 4.1 nổ 0520 (cặp 52 kẹp giữa hai số 0) &rarr; Trích xuất bắt con bạch thủ 38 hoặc song thủ 38 - 83.",
                "condition": "Khung nuôi: Bạch thủ / Song thủ nuôi 1–3 ngày."
            },
            "cau_khuyt_goc": {
                "title": "CẦU KHUYẾT GÓC",
                "badge": "Hình Thái Bảng",
                "essence": "Hai giải cùng kích thước đứng cạnh nhau có 3 trong 4 góc là số A, góc còn lại duy nhất là số B. Ghép số góc đối xứng để đánh cặp loto đảo chiều AB - BA.",
                "example": "Ví dụ: Giải 3.1 nổ 58245 (góc đầu 5, góc đuôi 5), Giải 3.2 nổ 51732 (góc đầu 5, góc đuôi 2). Ba góc là số 5, góc còn lại là 2 &rarr; Ghép cặp loto đảo chiều 25 - 52.",
                "condition": "Khung nuôi: Song thủ nuôi 2–3 ngày."
            },
            "cau_pascal": {
                "title": "CẦU TAM GIÁC PASCAL",
                "badge": "Thuật Toán Cộng",
                "essence": "Ghép chuỗi 10 chữ số kết hợp từ giải Đặc biệt (5 số) và giải Nhất (5 số) thành hàng gốc. Cộng dồn hai số kề nhau (mod 10) theo từng tầng đến khi còn 2 chữ số.",
                "example": "Ví dụ: GĐB là 31922 và G1 là 74815 &rarr; Tạo chuỗi 3192274815. Cộng từng đôi kề nhau theo mod 10 thu gọn dần các tầng tam giác đến đáy còn [68] &rarr; Chốt cặp loto 68 - 86.",
                "condition": "Khung nuôi: Bạch thủ + Lộn nuôi 1–2 ngày."
            },
            "cau_tam_giac_tam": {
                "title": "CẦU TAM GIÁC ĐỊNH VỊ",
                "badge": "Vị Trí Cố Định",
                "essence": "Xác định 3 đỉnh cố định: Tâm giải Nhất (Index 7), số đầu giải ĐB (Index 0) và số đuôi giải 7.4 (Index 106). Ghép 3 đỉnh thành các cặp loto song hành tạo thành cụm 2–3 số.",
                "example": "Ví dụ: GĐB nổ 82514 (đầu 8), G1 nổ 34719 (tâm 7), G7.4 nổ 62 (đuôi 2). Ba đỉnh 8, 7, 2 ghép thành cặp song thủ 87 - 78 và 72 - 27.",
                "condition": "Khung nuôi: Song thủ / Bộ 3 nuôi 1–3 ngày."
            },
            "cau_roi_tu_de": {
                "title": "CẦU LOTO RƠI TỪ ĐỀ",
                "badge": "Chu Kỳ Lặp",
                "essence": "Hai chữ số cuối cùng của giải Đặc biệt kỳ quay thưởng vừa công bố. Đánh lại chính con số đề vừa về dưới dạng loto (thường lót thêm lộn).",
                "example": "Ví dụ: Giải Đặc Biệt hôm qua nổ 31922 (đề về 22). Hôm sau đánh lại chính con loto 22 (lót thêm lộn nếu đề không phải kép bằng).",
                "condition": "Khung nuôi: Bạch thủ + Lót nuôi 1–3 ngày."
            },
            "cau_roi_tu_lo": {
                "title": "CẦU LOTO RƠI TỪ LÔ",
                "badge": "Chu Kỳ Lặp",
                "essence": "Loto xuất hiện ở kỳ trước có chỉ số nhịp rơi đều trong 30 kỳ thống kê gần nhất. Đánh lại chính con loto đó ở kỳ tiếp theo (bắt nhịp rơi lặp).",
                "example": "Ví dụ: Con loto 79 về hôm qua, kiểm tra tần suất 30 ngày qua thấy 79 thường xuyên nổ rơi liên tiếp 2 kỳ &rarr; Đón bắt lại bạch thủ 79.",
                "condition": "Khung nuôi: Bạch thủ nuôi 1–2 ngày."
            },
            "cau_dau_cam": {
                "title": "CẦU ĐẦU CÂM",
                "badge": "Tín Hiệu Câm",
                "essence": "Bảng 27 giải không xuất hiện loto nào có chữ số hàng chục là X. Áp lực xác suất bị nén dồn dập vào bắt kép bằng XX, ghép dạng X0 - 0X hoặc ghép bóng dương.",
                "example": "Ví dụ: Bảng kết quả câm Đầu 4 (từ 40 đến 49 không nổ con nào) &rarr; Dự báo giải tỏa áp lực vào kép bằng 44 hoặc cặp 40 - 04, bóng 49 - 94.",
                "condition": "Khung nuôi: Dàn 2–4 số nuôi 1–3 ngày."
            },
            "cau_duoi_cam": {
                "title": "CẦU ĐUÔI (ĐÍT) CÂM",
                "badge": "Tín Hiệu Câm",
                "essence": "Bảng 27 giải không xuất hiện loto nào có chữ số hàng đơn vị là Y. Bắt kép bằng YY, ghép dạng 0Y hoặc ghép với đầu câm tương ứng trong ngày.",
                "example": "Ví dụ: Bảng kết quả câm Đuôi 7 &rarr; Dự báo bắt kép bằng 77, ghép dạng 07 hoặc ghép với đầu câm.",
                "condition": "Khung nuôi: Dàn 2–4 số nuôi 1–3 ngày."
            },
            "cau_g7_ghep": {
                "title": "CẦU BIÊN GIẢI 7",
                "badge": "Tín Hiệu Biên",
                "essence": "Xét chữ số đầu của giải 7.1 (Index 99) và chữ số cuối của giải 7.4 (Index 106). Ghép thành cặp song thủ; nếu hai số trùng nhau kích hoạt báo kép.",
                "example": "Ví dụ: Giải 7.1 nổ 42 (đầu 4) và giải 7.4 nổ 89 (đuôi 9) &rarr; Ghép thành cặp song thủ 49 - 94. Nếu hai số trùng nhau (ví dụ cùng là 7) &rarr; Kích hoạt báo kép 77.",
                "condition": "Khung nuôi: Song thủ / Kép nuôi 1–2 ngày."
            },
            "cau_bao_kep_db": {
                "title": "BÁO KÉP GIẢI ĐẶC BIỆT",
                "badge": "Tín Hiệu Biên",
                "essence": "Hai số đầu hoặc hai số chính giữa của giải ĐB xuất hiện kép bằng (dạng AAxxx hoặc xAAxx). Dự báo dấu hiệu kép nổ; nuôi dàn 10 số kép bằng (00, 11, ..., 99).",
                "example": "Ví dụ: GĐB về 22819 (hai số đầu là kép 22) hoặc 57731 (hai số giữa là kép 77) &rarr; Dự báo dấu hiệu nổ kép trong 3–5 ngày tới.",
                "condition": "Khung nuôi: Dàn kép bằng nuôi 3–5 ngày."
            },
            "cau_tam_cang_db": {
                "title": "TÂM CÀNG GIẢI ĐẶC BIỆT",
                "badge": "Vị Trí Cố Định",
                "essence": "Lấy chữ số hàng trăm (số chính giữa) của giải Đặc biệt 5 chữ số (xxCxx). Ghép số tâm càng với số đầu/cuối của giải ĐB hoặc làm trạm chạm đề/loto.",
                "example": "Ví dụ: GĐB nổ 38519 &rarr; Tâm càng là số 5, đầu là 3, đuôi là 9. Ghép tâm càng tạo cặp song thủ 53 - 59 hoặc làm trạm chạm 5.",
                "condition": "Khung nuôi: Song thủ / Dàn chạm nuôi 1–3 ngày."
            },
            "cau_ghep_g6_g7": {
                "title": "GHÉP TẦNG GIẢI 6 VÀ GIẢI 7",
                "badge": "Tín Hiệu Giải Phụ",
                "essence": "Bảng gồm 3 giải 6 (3 số) và 4 giải 7 (2 số) tạo thành 2 tầng liền kề. Ghép số đầu giải 6.1 với đuôi 7.4 (hoặc số đầu giải 7.1 với số đuôi 6.3).",
                "example": "Ví dụ: Đầu giải 6.1 là chữ số 5, đuôi giải 7.4 là chữ số 1 &rarr; Ghép thành cặp song thủ 51 - 15.",
                "condition": "Khung nuôi: Song thủ nuôi 1–2 ngày."
            },
            "cau_tien_khuyt": {
                "title": "CẦU LÔ TIẾN KHUYẾT",
                "badge": "Khoảng Trống Dãy",
                "essence": "Một đầu số về &ge; 3 loto tạo thành dãy liên tục nhưng bỏ trống đúng 1 vị trí ở giữa. Đánh chính con số bị khuyết ở khoảng giữa.",
                "example": "Ví dụ: Đầu 5 về 51, 52, 54 (dãy số tiến liên tục nhưng khuyết đúng con 53) &rarr; Bắt chính con số bị khuyết [53].",
                "condition": "Khung nuôi: Bạch thủ nuôi 1–2 ngày."
            },
            "cau_nhieu_nhay": {
                "title": "CẦU LOTO NHIỀU NHÁY",
                "badge": "Tần Suất Lệch",
                "essence": "Một con loto về &ge; 2 lần trong cùng một kỳ quay tạo ra độ lệch phân phối. Bắt con số liền kề biên độ &plusmn;1, đánh bóng số hoặc đánh con lộn của chính nó.",
                "example": "Ví dụ: Con 68 nổ 3 nháy trong một ngày &rarr; Biên độ &plusmn;1 là 67 và 69, đánh kèm con lộn 86.",
                "condition": "Khung nuôi: Song thủ nuôi 1–2 ngày."
            },
            "cau_bong_ngu_hanh": {
                "title": "CẦU BÓNG ÂM DƯƠNG NGŨ HÀNH",
                "badge": "Quy Chiếu Số Học",
                "essence": "Chuyển đổi 2 số cuối giải ĐB hoặc số câm qua bảng tương sinh tương khắc. Bóng dương: 1-6, 2-7, 3-8, 4-9, 5-0. Bóng âm: 1-4, 2-9, 3-6, 5-8, 0-7.",
                "example": "Ví dụ: Đề về 28 &rarr; Bóng dương của 28 là [73], bóng âm của 28 là [95] &rarr; Đón bắt cặp song thủ tương sinh ngũ hành.",
                "condition": "Khung nuôi: Song thủ nuôi 1–3 ngày."
            },
            "cau_max_gan": {
                "title": "CẦU LÔ GAN CỰC ĐẠI",
                "badge": "Thống Kê Cực Trị",
                "essence": "Loto chưa về chạm ngưỡng &ge; 85% - 90% chu kỳ gan kỷ lục của chính số đó. Đưa vào danh sách nuôi bạch thủ tăng tiến theo tỷ lệ vào tiền chuẩn.",
                "example": "Ví dụ: Cặp 89 có gan kỷ lục lịch sử là 28 ngày, hiện tại đã nghỉ 24 ngày liên tiếp (đạt ngưỡng 86%) &rarr; Bắt đầu vào tiền nuôi bạch thủ tăng tiến.",
                "condition": "Khung nuôi: Bạch thủ nuôi 3–5 ngày."
            },
            "bac_nho_loto": {
                "title": "BẠC NHỚ THEO LOTO",
                "badge": "Xác Suất Điều Kiện",
                "essence": "Lịch sử ghi nhận tần suất: khi loto A về thì loto B nổ với xác suất cao kỳ sau. Tra bảng ánh xạ điều kiện P(B|A) để trích xuất cặp số có độ tin cậy cao nhất.",
                "example": "Ví dụ: Khi cặp 01-10 về thì kỳ sau thường nổ 06-60; khi ra cả cặp 25-52 thì hôm sau rất dễ nổ 22 &rarr; Bắt cặp song thủ có xác suất điều kiện cao nhất.",
                "condition": "Khung nuôi: Song thủ nuôi 2–3 ngày."
            },
            "bac_nho_thu": {
                "title": "BẠC NHỚ THEO THỨ (CHU KỲ TUẦN)",
                "badge": "Chu Kỳ Tuần",
                "essence": "Tần suất xuất hiện vượt trội của một số cặp số vào các ngày cố định trong tuần theo từng đài mở thưởng. Tra cứu danh sách số có mật độ nổ cao nhất từ Thứ 2 đến Chủ nhật.",
                "example": "Ví dụ: Thứ 5 do đài Hà Nội quay thưởng, thống kê các tuần Thứ 5 nhận thấy cặp 39-93 có mật độ nổ cao vượt trội &rarr; Ưu tiên đánh cặp 39-93.",
                "condition": "Khung nuôi: Dàn 2–4 số đánh trong ngày."
            },
            "bac_nho_tong_db": {
                "title": "BẠC NHỚ TỔNG GIẢI ĐẶC BIỆT",
                "badge": "Hình Thái Đề",
                "essence": "Dựa vào tổng của 2 số cuối giải Đặc biệt kỳ quay trước (tổng từ 0 đến 9). Tra cứu các dàn số hoặc tổng đề thường về tương ứng sau tổng vừa nổ.",
                "example": "Ví dụ: Đề nổ 41 (tổng 4+1=5) &rarr; Tra bảng bạc nhớ tổng đề, sau khi nổ tổng 5 kỳ kế tiếp có tỷ lệ nổ cao nhất ở tổng 4 hoặc tổng 9.",
                "condition": "Khung nuôi: Dàn loto nuôi 1–2 ngày."
            },
            "bac_nho_kep_lech_sat": {
                "title": "BẠC NHỚ KÉP LỆCH / SÁT KÉP",
                "badge": "Hình Thái Đề",
                "essence": "Đề về dạng kép lệch (hiệu bằng 5) hoặc sát kép (hơn kém 1 đơn vị). Tra cứu bảng dữ liệu thống kê chu kỳ kế tiếp tương ứng với từng dạng kép.",
                "example": "Ví dụ: Đề về sát kép 12 &rarr; Thống kê chu kỳ tiếp theo sau sát kép 12 thường kéo theo cặp song thủ 16-61 hoặc 23-32.",
                "condition": "Khung nuôi: Song thủ nuôi 1–2 ngày."
            },
            "cau_loai_tru_filter": {
                "title": "BỘ LỌC CẮT SỐ / LOẠI TRỪ (BLACKLIST)",
                "badge": "Bộ Lọc Xác Suất",
                "essence": "Xác định các con số đang chạm ngưỡng gan nguy hiểm, số đã nổ liên tiếp 3 ngày (bão hòa xung lực giải thưởng), số cản. Đưa vào danh sách đen (Blacklist) để loại bỏ các số yếu khỏi các dàn nuôi.",
                "example": "Ví dụ: Số 47 đã nổ 3 ngày liên tiếp, số 83 đã 20 ngày chưa ra &rarr; Bộ lọc đưa 47 và 83 vào Blacklist để tránh lãng phí vốn.",
                "condition": "Áp dụng theo ngày: Loại trừ số rủi ro cao khỏi các dàn số dự đoán khác."
            }
        };

        const MOD_CATALOG_MAP = {
            1: "cau_dong_to_hop",
            2: "cau_qua_tram",
            3: "cau_kep_so",
            4: "cau_khuyt_goc",
            5: "cau_pascal",
            6: "cau_tam_giac_tam",
            7: "cau_roi_tu_de",
            8: "cau_roi_tu_lo",
            9: "cau_dau_cam",
            10: "cau_duoi_cam",
            11: "cau_g7_ghep",
            12: "cau_bao_kep_db",
            13: "cau_tam_cang_db",
            14: "cau_ghep_g6_g7",
            15: "cau_tien_khuyt",
            16: "cau_nhieu_nhay",
            17: "cau_bong_ngu_hanh",
            18: "cau_max_gan",
            19: "bac_nho_loto",
            20: "bac_nho_thu",
            21: "bac_nho_tong_db",
            22: "bac_nho_kep_lech_sat",
            23: "cau_loai_tru_filter"
        };

        function getBridgeInfo(key) {
            if (!key) return null;
            key = String(key).toLowerCase().trim();
            if (BRIDGE_EXPLANATIONS[key]) return BRIDGE_EXPLANATIONS[key];
            if (BRIDGE_EXPLANATIONS[key.replace(/-/g, '_')]) return BRIDGE_EXPLANATIONS[key.replace(/-/g, '_')];
            
            // Normalize "module 04", "module_04", "m04", "m4", "m 04"
            const numMatch = key.match(/(\d+)/);
            if (numMatch) {
                const num = parseInt(numMatch[1], 10);
                const catKey = MOD_CATALOG_MAP[num];
                if (catKey && BRIDGE_EXPLANATIONS[catKey]) return BRIDGE_EXPLANATIONS[catKey];
                const normKey = `module_${String(num).padStart(2, '0')}`;
                if (BRIDGE_EXPLANATIONS[normKey]) return BRIDGE_EXPLANATIONS[normKey];
            }
            if (key.includes('kẹp') || key.includes('nhịp') || key.includes('module_cau') || key.includes('cầu rơi')) {
                return BRIDGE_EXPLANATIONS['module_cau'];
            }
            if (key.includes('chạm')) return BRIDGE_EXPLANATIONS['cau_cham_tuan'];
            if (key.includes('tổng')) return BRIDGE_EXPLANATIONS['cau_tong_tuan'];
            if (key.includes('bệt')) return BRIDGE_EXPLANATIONS['cau_bet_tuan'];
            if (key.includes('thứ')) return BRIDGE_EXPLANATIONS['cau_thu'];
            return null;
        }

        function showBridgeTooltip(e, key) {
            const info = getBridgeInfo(key);
            if (!info) return;
            const tip = document.getElementById('bridge-tooltip');
            tip.innerHTML = `
                <div class="space-y-2.5">
                    <div class="flex items-center justify-between border-b border-neutral-800 pb-1.5 gap-2">
                        <span class="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-400 font-bold border border-red-800 uppercase tracking-wider">${info.badge}</span>
                        <span class="text-[10px] text-neutral-400 italic"><i class="fa-solid fa-hand-pointer mr-1"></i>Bấm để ghim chi tiết</span>
                    </div>
                    <h4 class="text-xs font-black text-white leading-snug">${info.title}</h4>
                    <div class="bg-neutral-900/90 p-2.5 rounded-lg border border-neutral-800 space-y-1">
                        <span class="text-[10px] font-bold text-yellow-400 uppercase flex items-center gap-1">
                            <i class="fa-solid fa-lightbulb"></i> Ý nghĩa bản chất:
                        </span>
                        <p class="text-[11px] text-neutral-300 leading-relaxed font-sans">${info.essence}</p>
                    </div>
                    <div class="bg-black/90 p-2.5 rounded-lg border border-yellow-500/40 space-y-1">
                        <span class="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-1">
                            <i class="fa-solid fa-calculator"></i> Ví dụ minh họa thực tế:
                        </span>
                        <p class="text-[11px] text-neutral-200 leading-relaxed font-sans">${info.example}</p>
                    </div>
                </div>
            `;
            tip.classList.remove('hidden');
            requestAnimationFrame(() => {
                tip.classList.remove('opacity-0');
                positionTooltip(e);
            });
        }

        function positionTooltip(e) {
            const tip = document.getElementById('bridge-tooltip');
            if (!tip || tip.classList.contains('hidden')) return;
            const padding = 16;
            const w = tip.offsetWidth || 340;
            const h = tip.offsetHeight || 220;
            let x = e.clientX + padding;
            let y = e.clientY + padding;

            if (x + w > window.innerWidth - 12) {
                x = e.clientX - w - padding;
            }
            if (y + h > window.innerHeight - 12) {
                y = e.clientY - h - padding;
            }
            if (x < 12) x = 12;
            if (y < 12) y = 12;

            tip.style.left = `${x}px`;
            tip.style.top = `${y}px`;
        }

        function hideBridgeTooltip() {
            const tip = document.getElementById('bridge-tooltip');
            if (tip) {
                tip.classList.add('opacity-0');
                setTimeout(() => {
                    if (tip.classList.contains('opacity-0')) {
                        tip.classList.add('hidden');
                    }
                }, 120);
            }
        }

        let currentModalOccurrences = [];
        let currentModalFilter = 'all';

        function switchModalTab(tabName) {
            const tabOcc = document.getElementById('modal-tab-btn-occurrences');
            const tabTheo = document.getElementById('modal-tab-btn-theory');
            const panelOcc = document.getElementById('modal-panel-occurrences');
            const panelTheo = document.getElementById('modal-panel-theory');
            
            if (!tabOcc || !tabTheo || !panelOcc || !panelTheo) return;

            if (tabName === 'occurrences') {
                tabOcc.className = 'px-4 py-2 rounded-xl text-xs font-bold transition bg-cyan-600 text-white shadow flex items-center gap-2';
                tabTheo.className = 'px-4 py-2 rounded-xl text-xs font-bold transition text-neutral-400 hover:text-white flex items-center gap-2';
                panelOcc.classList.remove('hidden');
                panelTheo.classList.add('hidden');
            } else {
                tabTheo.className = 'px-4 py-2 rounded-xl text-xs font-bold transition bg-cyan-600 text-white shadow flex items-center gap-2';
                tabOcc.className = 'px-4 py-2 rounded-xl text-xs font-bold transition text-neutral-400 hover:text-white flex items-center gap-2';
                panelTheo.classList.remove('hidden');
                panelOcc.classList.add('hidden');
            }
        }

        async function openBridgeModal(key, defaultTab = 'occurrences') {
            hideBridgeTooltip();
            const info = getBridgeInfo(key);
            
            // Normalize bridge key for API lookup
            let apiBridgeKey = key;
            if (key.startsWith('module_')) {
                const modMapping = {
                    'module_01': 'CAU_DONG_TO_HOP', 'module_02': 'CAU_QUA_TRAM', 'module_03': 'CAU_KEP_SO',
                    'module_04': 'CAU_KHUYT_GOC', 'module_05': 'CAU_PASCAL', 'module_06': 'CAU_TAM_GIAC_TAM',
                    'module_07': 'CAU_ROI_TU_DE', 'module_08': 'CAU_ROI_TU_LO', 'module_09': 'CAU_DAU_CAM',
                    'module_10': 'CAU_DUOI_CAM', 'module_11': 'CAU_G7_GHEP', 'module_12': 'CAU_BAO_KEP_DB',
                    'module_13': 'CAU_TAM_CANG_DB', 'module_14': 'CAU_GHEP_G6_G7', 'module_15': 'CAU_TIEN_KHUYT',
                    'module_16': 'CAU_NHIEU_NHAY', 'module_17': 'CAU_BONG_NGU_HANH', 'module_18': 'CAU_MAX_GAN',
                    'module_19': 'BAC_NHO_LOTO', 'module_20': 'BAC_NHO_THU', 'module_21': 'BAC_NHO_TONG_DB',
                    'module_22': 'BAC_NHO_KEP_LECH_SAT', 'module_23': 'CAU_LOAI_TRU_FILTER'
                };
                apiBridgeKey = modMapping[key] || key;
            }
            
            const titleText = info ? info.title : (apiBridgeKey || key);
            const badgeText = info ? info.badge : 'Thuật Toán Soi Cầu';
            
            const badgeEl = document.getElementById('modal-bridge-badge');
            const codeEl = document.getElementById('modal-bridge-code');
            const titleEl = document.getElementById('modal-bridge-title');
            if (badgeEl) badgeEl.innerText = badgeText;
            if (codeEl) codeEl.innerText = apiBridgeKey;
            if (titleEl) titleEl.innerText = titleText;
            
            if (info) {
                const ess = document.getElementById('modal-bridge-essence');
                const ex = document.getElementById('modal-bridge-example');
                const cond = document.getElementById('modal-bridge-condition');
                if (ess) ess.innerHTML = info.essence || '';
                if (ex) ex.innerHTML = info.example || '';
                if (cond) cond.innerHTML = info.condition || '';
            } else {
                const ess = document.getElementById('modal-bridge-essence');
                if (ess) ess.innerText = 'Thuật toán phân tích chu kỳ và nhịp rơi số học chuẩn XSMB.';
            }

            switchModalTab(defaultTab);

            const modal = document.getElementById('bridge-modal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }

            // Reset KPIs & Loading state
            const kpiWin = document.getElementById('modal-kpi-winrate');
            const kpiWinSub = document.getElementById('modal-kpi-winrate-sub');
            const kpiHits = document.getElementById('modal-kpi-hits');
            const kpiHitsSub = document.getElementById('modal-kpi-hits-sub');
            const kpiStreak = document.getElementById('modal-kpi-streak');
            const kpiDe = document.getElementById('modal-kpi-de');
            const msgEl = document.getElementById('modal-occ-status-msg');
            
            if (kpiWin) kpiWin.innerText = '--%';
            if (kpiWinSub) kpiWinSub.innerText = '--';
            if (kpiHits) kpiHits.innerText = '--';
            if (kpiHitsSub) kpiHitsSub.innerText = 'TB -- nháy/kỳ';
            if (kpiStreak) kpiStreak.innerText = '--';
            if (kpiDe) kpiDe.innerText = '--';
            if (msgEl) msgEl.innerText = 'Đang tải đối chiếu lịch sử...';
            
            const tbody = document.getElementById('modal-occurrences-tbody');
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-neutral-400"><i class="fa-solid fa-spinner fa-spin text-2xl text-cyan-400 mb-2 block"></i>Đang đối chiếu dữ liệu các ngày đã xảy ra...</td></tr>`;
            }

            // Fetch occurrences from API
            try {
                const res = await fetch(`/api/bridge-occurrences?bridge=${encodeURIComponent(apiBridgeKey)}&limit=60`);
                const data = await res.json();
                
                if (data.status === 'SUCCESS') {
                    const st = data.stats || {};
                    if (kpiWin) kpiWin.innerText = `${st.win_rate || 0}%`;
                    if (kpiWinSub) kpiWinSub.innerText = `(${st.win_count || 0}/${st.signals_count || st.total_tested || 0} kỳ)`;
                    if (kpiHits) kpiHits.innerText = `${st.total_hits || 0}`;
                    if (kpiHitsSub) kpiHitsSub.innerText = `TB ${st.avg_hits_per_win || 0} nháy/kỳ`;
                    if (kpiStreak) kpiStreak.innerText = `${st.max_win_streak || 0} kỳ`;
                    if (kpiDe) kpiDe.innerText = `${st.de_hits || 0} lần`;
                    if (msgEl) msgEl.innerText = `Đã đối chiếu ${data.occurrences ? data.occurrences.length : 0} kỳ quay gần nhất`;

                    currentModalOccurrences = data.occurrences || [];
                    updateModalFilterCounts();
                    filterModalOccurrences('all');
                } else if (tbody) {
                    tbody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-neutral-500">Chưa có đủ dữ liệu lịch sử cho phương pháp này.</td></tr>`;
                }
            } catch(err) {
                console.error("Lỗi tải lịch sử cầu:", err);
                if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-red-400">Không thể kết nối máy chủ để tải lịch sử ngày đã xảy ra.</td></tr>`;
            }
        }

        function updateModalFilterCounts() {
            const all = currentModalOccurrences.length;
            const win = currentModalOccurrences.filter(x => x.is_win).length;
            const de = currentModalOccurrences.filter(x => x.is_de).length;
            const lose = currentModalOccurrences.filter(x => !x.is_win && x.status === 'TRƯỢT').length;
            
            const elAll = document.getElementById('modal-count-all');
            const elWin = document.getElementById('modal-count-win');
            const elDe = document.getElementById('modal-count-de');
            const elLose = document.getElementById('modal-count-lose');
            if (elAll) elAll.innerText = all;
            if (elWin) elWin.innerText = win;
            if (elDe) elDe.innerText = de;
            if (elLose) elLose.innerText = lose;
        }

        function filterModalOccurrences(filterType) {
            currentModalFilter = filterType;
            ['all', 'win', 'de', 'lose'].forEach(f => {
                const btn = document.getElementById('modal-filter-' + f);
                if (btn) {
                    if (f === filterType) {
                        btn.className = 'px-3 py-1 rounded-lg text-xs font-bold bg-cyan-600 text-white shadow transition';
                    } else {
                        btn.className = 'px-3 py-1 rounded-lg text-xs font-bold bg-neutral-800 text-neutral-300 hover:text-white transition';
                    }
                }
            });

            let filtered = currentModalOccurrences;
            if (filterType === 'win') {
                filtered = currentModalOccurrences.filter(x => x.is_win);
            } else if (filterType === 'de') {
                filtered = currentModalOccurrences.filter(x => x.is_de);
            } else if (filterType === 'lose') {
                filtered = currentModalOccurrences.filter(x => !x.is_win && x.status === 'TRƯỢT');
            }
            renderModalOccurrencesTable(filtered);
        }

        function renderModalOccurrencesTable(list) {
            const tbody = document.getElementById('modal-occurrences-tbody');
            if (!tbody) return;
            if (!list || list.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-neutral-500 italic">Không có kỳ quay nào phù hợp với bộ lọc.</td></tr>`;
                return;
            }

            tbody.innerHTML = list.map(item => {
                const isWin = item.is_win;
                const isDe = item.is_de;
                const isNoSignal = (item.status === 'CHỜ TÍN HIỆU');
                
                let statusBadge = '<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-800 text-neutral-400 border border-neutral-700">Trượt</span>';
                if (isDe) {
                    statusBadge = '<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-950 text-purple-300 border border-purple-700 font-mono shadow-[0_0_8px_rgba(168,85,247,0.4)]">🎯 NỔ ĐỀ</span>';
                } else if (isWin) {
                    statusBadge = `<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-700 font-mono shadow-[0_0_8px_rgba(0,255,136,0.3)]">✅ TRÚNG (${item.hits} nháy)</span>`;
                } else if (isNoSignal) {
                    statusBadge = '<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-900 text-neutral-500 border border-neutral-800">Chờ Tín Hiệu</span>';
                }

                const predStr = item.predicted_display || (item.predicted ? item.predicted.join(' - ') : '-');
                const deStr = item.actual_de ? `<b class="text-yellow-400 font-mono">${item.actual_de}</b>` : '-';
                const spStr = item.special_prize || '-';
                const dateStr = item.date_display || item.target_date || '';
                const dowStr = item.day_of_week || '';
                const firstPred = (item.predicted && item.predicted.length > 0) ? item.predicted[0] : '';

                return `
                    <tr class="hover:bg-neutral-900/60 transition border-b border-neutral-800/40">
                        <td class="py-2 px-3 font-mono font-medium text-neutral-200">
                            <div>${dateStr}</div>
                            <span class="text-[10px] text-neutral-500">${dowStr}</span>
                        </td>
                        <td class="py-2 px-3 text-center">
                            <span class="font-mono font-bold px-2 py-0.5 rounded bg-black border border-yellow-500/40 text-yellow-300 text-xs shadow">
                                ${predStr}
                            </span>
                        </td>
                        <td class="py-2 px-3 text-center font-mono">
                            <span class="text-neutral-400 text-[11px]">${spStr}</span>
                            <span class="block text-xs font-bold text-yellow-400">Đề: ${deStr}</span>
                        </td>
                        <td class="py-2 px-3 text-center">
                            ${statusBadge}
                        </td>
                        <td class="py-2 px-3 text-center font-mono font-black ${item.hits > 0 ? 'text-yellow-400 text-sm' : 'text-neutral-500'}">
                            ${item.hits > 0 ? `+${item.hits}` : '0'}
                        </td>
                        <td class="py-2 px-3 text-center">
                            <button onclick="closeBridgeModal(); switchTab('days10'); if('${firstPred}') toggleHighlight('${firstPred}');" 
                                    class="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[11px] transition">
                                <i class="fa-solid fa-eye"></i> Xem KQ
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        function closeBridgeModal() {
            const modal = document.getElementById('bridge-modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        }

        window.addEventListener('mousemove', (e) => {
            const tip = document.getElementById('bridge-tooltip');
            if (tip && !tip.classList.contains('hidden') && !tip.classList.contains('opacity-0')) {
                positionTooltip(e);
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeBridgeModal();
                hideBridgeTooltip();
            }
        });

        let allDraws = [];
        let displayedCount = 0;
        let currentHighlight = null;
        let activeHeadHighlight = null;

        document.addEventListener("DOMContentLoaded", async () => {
            await fetchAllDraws();
            renderDraws(10);
        });

        async function fetchAllDraws() {
            try {
                const res = await fetch('/api/results');
                allDraws = await res.json();
            } catch(e) {
                console.error("Lỗi khi nạp dữ liệu KQXS:", e);
            }
        }

        function createDrawCard(draw) {
            const spTail = draw.special_prize ? draw.special_prize.slice(-2) : '';
            
            const renderPrizeItems = (arr, isRed = false) => {
                const items = (arr || []).map(item => {
                    const tail = item.slice(-2);
                    const colorClass = isRed ? 'text-red-500 font-bold' : 'text-white font-bold';
                    return `<span onclick="toggleHighlight('${tail}')" class="loto-target ${colorClass} px-2 py-0.5 rounded cursor-pointer transition hover:bg-neutral-800" data-full="${item}" data-tail="${tail}">${item}</span>`;
                }).join('');
                return `<div class="flex flex-wrap justify-center items-center gap-x-5 md:gap-x-7 gap-y-1">${items}</div>`;
            };

            // Gom nhóm Lô tô theo Đầu 0 -> 9 (Chuẩn như ảnh mẫu)
            let lotoRowsHtml = '';
            for (let head = 0; head <= 9; head++) {
                const headStr = String(head);
                const lotoList = (draw.loto_2digit || []).filter(num => num.startsWith(headStr));
                
                const lotoItemsHtml = lotoList.length > 0 
                    ? lotoList.map(loto => `<span onclick="event.stopPropagation(); toggleHighlight('${loto}')" class="loto-chip num-chip px-1.5 py-0.5 rounded text-neutral-100 hover:bg-yellow-400 hover:text-black font-bold font-mono transition" data-pair="${loto}">${loto}</span>`).join(', ')
                    : '<span class="text-neutral-600 font-normal">-</span>';

                lotoRowsHtml += `
                    <tr onclick="highlightHead('${headStr}')" class="head-row hover:bg-neutral-900 border-b border-neutral-800 cursor-pointer transition" data-head="${headStr}">
                        <td class="py-1.5 text-center font-bold font-mono text-neutral-300 border-r border-neutral-800 text-sm hover:text-yellow-400">${headStr}</td>
                        <td class="py-1.5 px-3 font-mono font-bold tracking-wide text-sm">${lotoItemsHtml}</td>
                    </tr>
                `;
            }

            return `
                <div class="neon-glass-card text-white rounded-2xl overflow-hidden shadow-2xl space-y-0 border border-cyan-500/25">
                    <!-- Red Header Banner -->
                    <div class="bg-gradient-to-r from-red-700 via-rose-800 to-red-900 text-white px-4 py-2.5 font-bold text-sm flex justify-between items-center border-b border-red-500/30">
                        <span class="flex items-center gap-1.5"><i class="fa-solid fa-gem text-yellow-300"></i> XSMB - Kết quả xổ số miền Bắc</span>
                        <span class="text-xs bg-black/50 px-2.5 py-0.5 rounded-full border border-red-400/40 font-mono">${draw.day_of_week}</span>
                    </div>

                    <!-- Subheader -->
                    <div class="px-4 py-2 bg-neutral-900/90 text-xs text-neutral-300 border-b border-neutral-800 flex justify-between items-center">
                        <span class="font-medium text-cyan-300"><i class="fa-solid fa-calendar mr-1 text-cyan-400"></i>${draw.date_display}</span>
                        <span>Mã ĐB: <b class="text-pink-400 font-mono bg-pink-950/60 px-2 py-0.5 rounded border border-pink-700/50">${draw.special_code || 'GQ'}</b></span>
                    </div>

                    <!-- Main Prize Table -->
                    <table class="w-full text-center text-sm md:text-base border-collapse border-b border-neutral-800">
                        <tbody>
                            <!-- G.ĐB (Hiển thị nổi bật màu đỏ chuẩn ảnh mẫu) -->
                            <tr class="border-b border-neutral-800 bg-red-950/20">
                                <td class="w-16 py-2.5 font-bold text-red-400 border-r border-neutral-800 text-xs">G.ĐB</td>
                                <td class="py-2.5">
                                    <span onclick="toggleHighlight('${spTail}')" class="loto-target font-black text-2xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-pink-500 font-mono tracking-widest cursor-pointer px-3 py-1 rounded-xl transition hover:scale-105 inline-block drop-shadow-[0_0_15px_rgba(244,63,94,0.6)]" data-full="${draw.special_prize}" data-tail="${spTail}">${draw.special_prize}</span>
                                </td>
                            </tr>
                            <tr class="border-b border-neutral-800">
                                <td class="py-2 font-bold text-neutral-400 border-r border-neutral-800 text-xs">G.1</td>
                                <td class="py-2 font-mono text-lg">${renderPrizeItems(draw.prize_1)}</td>
                            </tr>
                            <tr class="border-b border-neutral-800">
                                <td class="py-2 font-bold text-neutral-400 border-r border-neutral-800 text-xs">G.2</td>
                                <td class="py-2 font-mono">${renderPrizeItems(draw.prize_2)}</td>
                            </tr>
                            <tr class="border-b border-neutral-800">
                                <td class="py-2 font-bold text-neutral-400 border-r border-neutral-800 text-xs">G.3</td>
                                <td class="py-2 font-mono space-y-1">
                                    <div>${renderPrizeItems(draw.prize_3 ? draw.prize_3.slice(0,3) : [])}</div>
                                    <div>${renderPrizeItems(draw.prize_3 ? draw.prize_3.slice(3) : [])}</div>
                                </td>
                            </tr>
                            <tr class="border-b border-neutral-800">
                                <td class="py-2 font-bold text-neutral-400 border-r border-neutral-800 text-xs">G.4</td>
                                <td class="py-2 font-mono">${renderPrizeItems(draw.prize_4)}</td>
                            </tr>
                            <tr class="border-b border-neutral-800">
                                <td class="py-2 font-bold text-neutral-400 border-r border-neutral-800 text-xs">G.5</td>
                                <td class="py-2 font-mono space-y-1">
                                    <div>${renderPrizeItems(draw.prize_5 ? draw.prize_5.slice(0,3) : [])}</div>
                                    <div>${renderPrizeItems(draw.prize_5 ? draw.prize_5.slice(3) : [])}</div>
                                </td>
                            </tr>
                            <tr class="border-b border-neutral-800">
                                <td class="py-2 font-bold text-neutral-400 border-r border-neutral-800 text-xs">G.6</td>
                                <td class="py-2 font-mono">${renderPrizeItems(draw.prize_6)}</td>
                            </tr>
                            <tr>
                                <td class="py-2 font-bold text-neutral-400 border-r border-neutral-800 text-xs">G.7</td>
                                <td class="py-2 font-mono">${renderPrizeItems(draw.prize_7, true)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Loto miền Bắc Table (Chuẩn định dạng ảnh mẫu!) -->
                    <div class="bg-neutral-950 p-2.5 border-t border-neutral-800">
                        <div class="text-xs font-bold text-red-500 uppercase tracking-wider mb-1 px-1">Loto miền Bắc</div>
                        <table class="w-full text-xs text-left border-collapse border border-neutral-800">
                            <thead>
                                <tr class="bg-neutral-900 border-b border-neutral-800 text-red-400 text-center">
                                    <th class="w-16 py-1 border-r border-neutral-800 font-bold">Đầu</th>
                                    <th class="py-1 px-3 font-bold">Loto</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${lotoRowsHtml}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        function renderDraws(countLimit) {
            const grid = document.getElementById('draws-grid');
            const targetSlice = allDraws.slice(0, countLimit);
            grid.innerHTML = targetSlice.map(createDrawCard).join('');
            displayedCount = targetSlice.length;

            document.getElementById('loadedStatusText').innerText = `${displayedCount}/${allDraws.length}`;

            if (displayedCount >= allDraws.length) {
                document.getElementById('loadMoreBtn').classList.add('hidden');
                document.getElementById('allLoadedMsg').classList.remove('hidden');
            } else {
                document.getElementById('loadMoreBtn').classList.remove('hidden');
                document.getElementById('allLoadedMsg').classList.add('hidden');
            }

            if (currentHighlight) {
                applyHighlight(currentHighlight);
            } else if (activeHeadHighlight !== null) {
                applyHeadHighlight(activeHeadHighlight);
            }
        }

        function loadMoreDays() {
            const newCount = displayedCount + 10;
            renderDraws(newCount);
        }

        function switchTab(tab) {
            ['days10', 'weekly', 'analyzer', 'backtest', 'bridges23', 'date_sum'].forEach(t => {
                const sec = document.getElementById('sec-' + t);
                if (sec) sec.classList.add('hidden');
                const btn = document.getElementById('tab-' + t);
                if (btn) {
                    btn.classList.remove('neon-tab-active', 'bg-red-700', 'text-white');
                    btn.classList.add('text-neutral-400');
                }
            });
            const activeSec = document.getElementById('sec-' + tab);
            if (activeSec) activeSec.classList.remove('hidden');
            const activeBtn = document.getElementById('tab-' + tab);
            if (activeBtn) {
                activeBtn.classList.remove('text-neutral-400');
                activeBtn.classList.add('neon-tab-active');
            }

            if (tab === 'analyzer') {
                loadAnalyzerData();
            } else if (tab === 'weekly') {
                loadWeeklyAnalysis();
            } else if (tab === 'backtest') {
                initBacktestTab();
            } else if (tab === 'bridges23') {
                loadBridgesCatalog();
            } else if (tab === 'date_sum') {
                loadDateSumData();
            }
        }

        // =========================================================================
        // JAVASCRIPT CHO MODULE TỪ ĐIỂN 23 CẦU LOTO (DATA CATALOG V1.0)
        // =========================================================================
        let catalogData = null;
        let currentCatalogFilter = 'all';

        async function loadBridgesCatalog(forceReload = false) {
            const grid = document.getElementById('catalog-cards-grid');
            if (forceReload || !catalogData) {
                if (grid) {
                    grid.innerHTML = `
                        <div class="col-span-full py-12 text-center text-neutral-400">
                            <i class="fa-solid fa-spinner fa-spin text-3xl text-yellow-400 mb-3 block"></i>
                            <span class="font-bold text-sm">Đang số hóa mảng 107 chữ số & quét 5.671 cặp vị trí...</span>
                        </div>
                    `;
                }
                try {
                    const res = await fetch('/api/bridges-catalog');
                    catalogData = await res.json();
                } catch(e) {
                    console.error("Lỗi khi tải từ điển 23 cầu:", e);
                    if (grid) {
                        grid.innerHTML = `
                            <div class="col-span-full py-12 text-center text-red-400">
                                <i class="fa-solid fa-circle-exclamation text-3xl mb-2 block"></i>
                                Không thể kết nối máy chủ để nạp danh mục 23 thuật toán soi cầu.
                            </div>
                        `;
                    }
                    return;
                }
            }
            renderCatalogUI(catalogData);
        }

        function renderCatalogUI(data) {
            if (!data || data.status !== 'SUCCESS') return;

            // Date Badge
            const dateBadge = document.getElementById('catalog-date-badge');
            if (dateBadge) {
                dateBadge.innerText = `${data.day_of_week} • Ngày ${data.date_display}`;
            }

            // Active Signal Counter Badge
            const actBadge = document.getElementById('catalog-active-badge');
            if (actBadge) {
                actBadge.innerHTML = `🔥 Đang có <b>${data.active_count} / ${data.total_bridges}</b> cầu phát tín hiệu hôm nay`;
            }

            // Blacklist Warning Container
            const blBox = document.getElementById('catalog-blacklist-box');
            const blList = document.getElementById('blacklist-chips-list');
            const blCountBadge = document.getElementById('blacklist-count-badge');
            const blItems = data.blacklist || [];

            if (blItems.length > 0) {
                blBox.classList.remove('hidden');
                blCountBadge.innerText = `${blItems.length} số rủi ro cao`;
                blList.innerHTML = blItems.map(item => `
                    <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/80 border border-red-700/60 text-xs">
                        <span onclick="switchTab('days10'); toggleHighlight('${item.pair}')" class="font-mono font-black text-red-400 hover:text-yellow-400 cursor-pointer text-sm">
                            ${item.pair}
                        </span>
                        <span class="text-neutral-400 text-[11px]">: ${item.reason}</span>
                    </div>
                `).join('');
            } else {
                blBox.classList.add('hidden');
            }

            // Render Bridge Cards according to active filter
            renderCatalogFilteredCards();

            // Nạp bảng thống kê các ngày đã dự đoán trước đó
            loadCatalogHistory();
        }

        function filterCatalogCategory(catId) {
            currentCatalogFilter = catId;
            ['all', 1, 2, 3, 4].forEach(c => {
                const btn = document.getElementById('cat-pill-' + c);
                if (btn) {
                    if (String(c) === String(catId)) {
                        btn.className = 'cat-pill px-4 py-2 rounded-xl text-xs font-bold bg-red-700 text-white shadow transition';
                    } else {
                        btn.className = 'cat-pill px-4 py-2 rounded-xl text-xs font-bold bg-neutral-800 text-neutral-300 hover:text-white transition';
                    }
                }
            });
            renderCatalogFilteredCards();
        }

        function renderCatalogFilteredCards() {
            if (!catalogData || !catalogData.bridges) return;
            const grid = document.getElementById('catalog-cards-grid');
            if (!grid) return;

            let bridgeKeys = Object.keys(catalogData.bridges);
            if (currentCatalogFilter !== 'all') {
                const targetCat = parseInt(currentCatalogFilter, 10);
                bridgeKeys = bridgeKeys.filter(k => catalogData.bridges[k].category_id === targetCat);
            }

            if (bridgeKeys.length === 0) {
                grid.innerHTML = '<div class="col-span-full py-12 text-center text-neutral-500">Không có thuật toán nào trong danh mục này.</div>';
                return;
            }

            grid.innerHTML = bridgeKeys.map(k => renderCatalogCard(catalogData.bridges[k])).join('');
        }

        function renderCatalogCard(b) {
            const isActive = b.status === 'ACTIVE' || b.status === 'STRONG ACTIVE';
            const isFilter = b.code === 'CAU_LOAI_TRU_FILTER';
            
            let statusClass = 'bg-neutral-800 text-neutral-400 border-neutral-700';
            let statusText = 'CHỜ NHỊP';
            if (b.status === 'STRONG ACTIVE') {
                statusClass = 'bg-purple-950 text-purple-300 border-purple-700 shadow-sm shadow-purple-900/50';
                statusText = '🔥 TÍN HIỆU MẠNH';
            } else if (b.status === 'ACTIVE') {
                statusClass = 'bg-emerald-950 text-emerald-300 border-emerald-700 shadow-sm shadow-emerald-900/50';
                statusText = '✅ ĐANG BÁO NỔ';
            } else if (isFilter) {
                statusClass = 'bg-red-950 text-red-300 border-red-700';
                statusText = '🚫 BỘ LỌC CẮT';
            }

            const catBadges = {
                1: '<span class="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-bold">1. Hình Thái & Vị Trí</span>',
                2: '<span class="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">2. Tín Hiệu Biên</span>',
                3: '<span class="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold">3. Bạc Nhớ & Ngũ Hành</span>',
                4: '<span class="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-bold">4. Cắt Số Loại Trừ</span>'
            };

            const predList = b.predicted || [];
            const predChips = predList.length > 0 ? predList.slice(0, 4).map(num => `
                <span onclick="switchTab('days10'); toggleHighlight('${num}')"
                      class="px-2.5 py-1 rounded-lg bg-black text-yellow-400 border border-neutral-700 font-mono font-black text-sm cursor-pointer hover:bg-yellow-400 hover:text-black hover:border-yellow-300 transition shadow">
                    ${num}
                </span>
            `).join('') : '<span class="text-neutral-500 italic text-xs">Chưa có số</span>';

            const lookupKey = b.code.toLowerCase();

            return `
                <div class="bg-neutral-900 rounded-2xl p-5 border ${isActive ? 'border-neutral-700 shadow-lg shadow-black/40' : 'border-neutral-800/80'} space-y-4 flex flex-col justify-between hover:border-yellow-500/50 transition duration-200">
                    <div class="space-y-3">
                        <!-- Top Row: Category + Status Badge -->
                        <div class="flex items-center justify-between gap-2 border-b border-neutral-800 pb-2.5">
                            ${catBadges[b.category_id] || ''}
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusClass}">
                                ${statusText}
                            </span>
                        </div>

                        <!-- Bridge Code & Title -->
                        <div>
                            <div class="text-[11px] font-mono text-neutral-400 uppercase font-semibold tracking-wider">${b.code}</div>
                            <h3 class="text-base font-black text-white mt-0.5 flex items-center justify-between">
                                <span class="bridge-info-trigger inline-flex items-center gap-1.5 cursor-pointer hover:text-yellow-400 transition"
                                      data-bridge="${lookupKey}"
                                      onmouseenter="showBridgeTooltip(event, '${lookupKey}')"
                                      onmouseleave="hideBridgeTooltip()"
                                      onclick="openBridgeModal('${lookupKey}')">
                                    ${b.name}
                                    <i class="fa-solid fa-circle-question text-neutral-500 hover:text-yellow-400 text-xs transition" title="Xem giải thích & ví dụ"></i>
                                </span>
                            </h3>
                        </div>

                        <!-- Detail / Explanation -->
                        <div class="bg-black/50 rounded-xl p-3 border border-neutral-800 text-xs text-neutral-300 leading-relaxed font-sans">
                            ${b.detail}
                        </div>

                        <!-- Output Type & Timeframe -->
                        <div class="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-neutral-950 border border-neutral-800/60">
                            <span class="text-neutral-400">Đầu ra: <b class="text-white">${b.output_type}</b></span>
                            <span class="text-neutral-400">Khung: <b class="text-yellow-400">${b.timeframe}</b></span>
                        </div>
                    </div>

                    <!-- Bottom: Predicted Numbers + Action Buttons -->
                    <div class="pt-3 border-t border-neutral-800 space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-[11px] font-bold text-neutral-400 uppercase">
                                ${isFilter ? 'Số Loại Trừ:' : 'Cặp Số Dự Đoán:'}
                            </span>
                            <span class="text-[11px] text-neutral-400">Điểm: <b class="${b.score >= 75 ? 'text-emerald-400' : 'text-neutral-300'} font-mono">${b.score}/100</b></span>
                        </div>
                        <div class="flex items-center justify-between gap-2">
                            <div class="flex flex-wrap gap-1.5 items-center">
                                ${predChips}
                            </div>
                            <div class="flex items-center gap-1.5">
                                <button onclick="selectCatalogHistoryBridge('${b.code}')" class="text-xs px-2.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-800 text-cyan-300 hover:text-white border border-cyan-700/60 transition flex items-center gap-1 shadow" title="Xem bảng thống kê các ngày đã dự đoán">
                                    <i class="fa-solid fa-table-list text-yellow-400"></i> Bảng Lịch Sử
                                </button>
                                <button onclick="openBridgeModal('${lookupKey}', 'theory')" class="text-xs px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition flex items-center gap-1 shadow">
                                    <i class="fa-solid fa-circle-info"></i> Quy tắc
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // =========================================================================
        // BẢNG THỐNG KÊ CÁC NGÀY ĐÃ DỰ ĐOÁN TRƯỚC ĐÓ (23 THUẬT TOÁN SOI CẦU)
        // =========================================================================
        let currentCatalogHistoryBridge = 'all_synthesis';
        let currentCatalogHistoryDays = '14';
        let currentCatalogHistoryFilter = 'all';
        let catalogHistoryData = null;
        let catalogHistoryCache = {};

        function selectCatalogHistoryBridge(bridgeKey) {
            const select = document.getElementById('catalog-history-method-select');
            if (select) {
                select.value = bridgeKey;
            }
            onCatalogHistoryMethodChange(bridgeKey);
            const sec = document.getElementById('catalog-history-section');
            if (sec) {
                sec.scrollIntoView({ behavior: 'smooth' });
            }
        }

        function onCatalogHistoryMethodChange(bridgeKey) {
            currentCatalogHistoryBridge = bridgeKey;
            loadCatalogHistory(false);
        }

        function changeCatalogHistoryDays(days) {
            currentCatalogHistoryDays = String(days);
            ['7', '14', '30', '60', 'all'].forEach(d => {
                const btn = document.getElementById('cat-hist-p-' + d);
                if (btn) {
                    if (String(d) === String(days)) {
                        btn.className = 'cat-hist-pill px-3 py-1.5 rounded-lg text-xs font-bold bg-yellow-400 text-black border border-yellow-300 shadow transition';
                    } else {
                        btn.className = 'cat-hist-pill px-3 py-1.5 rounded-lg text-xs font-bold bg-neutral-900 border border-neutral-700 text-neutral-300 hover:border-yellow-400 hover:text-yellow-400 transition';
                    }
                }
            });
            loadCatalogHistory(false);
        }

        function filterCatalogHistoryTable(filterType) {
            currentCatalogHistoryFilter = filterType;
            ['all', 'win', 'de', 'lose', 'pending'].forEach(f => {
                const btn = document.getElementById('btn-filter-cathist-' + f);
                if (btn) {
                    if (f === filterType) {
                        btn.className = 'px-3 py-1.5 rounded-lg font-bold bg-neutral-800 text-white transition';
                    } else {
                        let textCol = 'text-neutral-400';
                        if (f === 'win') textCol += ' hover:text-emerald-400';
                        else if (f === 'de') textCol += ' hover:text-yellow-400';
                        else if (f === 'lose') textCol += ' hover:text-red-400';
                        else if (f === 'pending') textCol += ' hover:text-cyan-400';
                        btn.className = `px-3 py-1.5 rounded-lg font-semibold ${textCol} transition`;
                    }
                }
            });
            renderCatalogHistoryRows();
        }

        async function loadCatalogHistory(forceReload = false) {
            const tbody = document.getElementById('catalogHistoryTableBody');
            const msgEl = document.getElementById('cat-hist-status-msg');
            const cacheKey = `${currentCatalogHistoryBridge}_${currentCatalogHistoryDays}`;

            if (forceReload || !catalogHistoryCache[cacheKey]) {
                if (tbody) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="7" class="py-12 text-center text-neutral-400">
                                <i class="fa-solid fa-spinner fa-spin text-3xl text-yellow-400 mb-3 block"></i>
                                <span class="font-bold text-xs">Đang đối chiếu lịch sử mở thưởng của thuật toán...</span>
                            </td>
                        </tr>
                    `;
                }
                if (msgEl) {
                    msgEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-yellow-400"></i> Đang tải dữ liệu...`;
                }
                try {
                    const res = await fetch(`/api/bridge-occurrences?bridge=${encodeURIComponent(currentCatalogHistoryBridge)}&limit=${encodeURIComponent(currentCatalogHistoryDays)}`);
                    const data = await res.json();
                    if (data && data.status === 'SUCCESS') {
                        catalogHistoryCache[cacheKey] = data;
                        catalogHistoryData = data;
                    } else {
                        throw new Error(data ? data.message : 'Unknown error');
                    }
                } catch(e) {
                    console.error("Lỗi khi tải lịch sử cầu:", e);
                    if (tbody) {
                        tbody.innerHTML = `
                            <tr>
                                <td colspan="7" class="py-10 text-center text-red-400">
                                    <i class="fa-solid fa-circle-exclamation text-2xl mb-2 block"></i>
                                    Không thể tải lịch sử dự đoán của thuật toán này. Vui lòng thử lại.
                                </td>
                            </tr>
                        `;
                    }
                    if (msgEl) {
                        msgEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-red-400"></i> Lỗi kết nối`;
                    }
                    return;
                }
            } else {
                catalogHistoryData = catalogHistoryCache[cacheKey];
            }

            renderCatalogHistoryUI(catalogHistoryData);
        }

        function renderCatalogHistoryUI(data) {
            if (!data) return;
            const msgEl = document.getElementById('cat-hist-status-msg');
            if (msgEl) {
                msgEl.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400"></i> Đã đối chiếu xong (${(data.occurrences || []).length} kỳ)`;
            }

            // Update badge title
            const bridgeBadge = document.getElementById('catalog-history-bridge-badge');
            if (bridgeBadge) {
                bridgeBadge.innerText = data.bridge_name || currentCatalogHistoryBridge;
            }

            // Update KPIs
            const stats = data.stats || {};
            const kpiWin = document.getElementById('cat-hist-kpi-winrate');
            const kpiWinSub = document.getElementById('cat-hist-kpi-winrate-sub');
            const kpiHits = document.getElementById('cat-hist-kpi-hits');
            const kpiHitsSub = document.getElementById('cat-hist-kpi-hits-sub');
            const kpiDe = document.getElementById('cat-hist-kpi-de');
            const kpiDeSub = document.getElementById('cat-hist-kpi-de-sub');
            const kpiStreak = document.getElementById('cat-hist-kpi-streak');
            const kpiStreakSub = document.getElementById('cat-hist-kpi-streak-sub');

            if (kpiWin) kpiWin.innerText = (stats.win_rate !== undefined ? stats.win_rate : 0) + '%';
            if (kpiWinSub) kpiWinSub.innerText = `${stats.win_count || 0}/${stats.signals_count || stats.total_tested || 0} kỳ phát tín hiệu`;
            if (kpiHits) kpiHits.innerText = stats.total_hits || 0;
            if (kpiHitsSub) kpiHitsSub.innerText = `TB ${stats.avg_hits_per_win || 0} nháy/kỳ trúng`;
            if (kpiDe) kpiDe.innerText = stats.de_hits || 0;
            if (kpiDeSub) kpiDeSub.innerText = `lần trúng 2 số cuối ĐB`;
            if (kpiStreak) kpiStreak.innerText = stats.max_win_streak || 0;
            if (kpiStreakSub) {
                const cStreak = stats.current_streak;
                const streakText = cStreak ? (cStreak.type === 'WIN' ? `Ăn ${cStreak.count} kỳ` : `Đứt ${cStreak.count} kỳ`) : '--';
                kpiStreakSub.innerText = `kỳ liên tiếp (Hiện tại: ${streakText})`;
            }

            // Calculate filter counts
            const occurrences = data.occurrences || [];
            let countAll = occurrences.length;
            let countWin = 0;
            let countDe = 0;
            let countLose = 0;
            let countPending = 0;

            occurrences.forEach(occ => {
                const isPending = (occ.is_current || occ.status === 'CHỜ QUAY' || occ.is_win === null);
                if (isPending) {
                    countPending++;
                } else if (occ.is_de || occ.status === 'TRÚNG ĐỀ') {
                    countDe++;
                    countWin++;
                } else if (occ.is_win || occ.status === 'TRÚNG') {
                    countWin++;
                } else {
                    countLose++;
                }
            });

            const elAll = document.getElementById('count-cathist-all');
            const elWin = document.getElementById('count-cathist-win');
            const elDe = document.getElementById('count-cathist-de');
            const elLose = document.getElementById('count-cathist-lose');
            const elPend = document.getElementById('count-cathist-pending');
            if (elAll) elAll.innerText = countAll;
            if (elWin) elWin.innerText = countWin;
            if (elDe) elDe.innerText = countDe;
            if (elLose) elLose.innerText = countLose;
            if (elPend) elPend.innerText = countPending;

            renderCatalogHistoryRows();
        }

        function renderCatalogHistoryRows() {
            const tbody = document.getElementById('catalogHistoryTableBody');
            if (!tbody || !catalogHistoryData) return;

            const occurrences = catalogHistoryData.occurrences || [];
            let filtered = occurrences;

            if (currentCatalogHistoryFilter === 'win') {
                filtered = occurrences.filter(o => !o.is_current && o.status !== 'CHỜ QUAY' && (o.is_win || o.is_de || o.status === 'TRÚNG' || o.status === 'TRÚNG ĐỀ'));
            } else if (currentCatalogHistoryFilter === 'de') {
                filtered = occurrences.filter(o => !o.is_current && o.status !== 'CHỜ QUAY' && (o.is_de || o.status === 'TRÚNG ĐỀ'));
            } else if (currentCatalogHistoryFilter === 'lose') {
                filtered = occurrences.filter(o => !o.is_current && o.status !== 'CHỜ QUAY' && !o.is_win && !o.is_de && o.status !== 'TRÚNG' && o.status !== 'TRÚNG ĐỀ');
            } else if (currentCatalogHistoryFilter === 'pending') {
                filtered = occurrences.filter(o => o.is_current || o.status === 'CHỜ QUAY' || o.is_win === null);
            }

            if (filtered.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="py-10 text-center text-neutral-500 italic">
                            Không có kết quả nào trong danh mục lọc này.
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = filtered.map(occ => {
                const isPending = (occ.is_current || occ.status === 'CHỜ QUAY' || occ.is_win === null);
                const dow = occ.day_of_week || '';
                const dateDisplay = occ.date_display || occ.target_date;
                const methodName = catalogHistoryData.bridge_name || currentCatalogHistoryBridge;
                
                // Predicted numbers
                let preds = occ.predicted || [];
                if (!preds.length && occ.predicted_display && occ.predicted_display !== '-') {
                    preds = occ.predicted_display.split(/[-,\s]+/).map(s => s.trim()).filter(Boolean);
                }

                const hitNumbers = occ.hit_numbers || [];
                const predChips = preds.length > 0 ? preds.map(num => {
                    const isNumHit = hitNumbers.includes(num);
                    return `
                        <span onclick="switchTab('days10'); toggleHighlight('${num}')"
                              class="inline-block px-2.5 py-1 rounded-lg text-xs font-mono font-black cursor-pointer transition shadow ${isNumHit ? 'bg-yellow-400 text-black border-2 border-yellow-300 scale-105 ring-1 ring-yellow-400 font-black' : 'bg-black text-yellow-400 border border-neutral-700 hover:border-yellow-400'}"
                              title="Bấm để xem Highlight trên bảng KQXS">
                            ${num}
                        </span>
                    `;
                }).join('') : `<span class="text-neutral-500 italic text-xs">Không báo số</span>`;

                // Actual results
                let actualHtml = '';
                if (isPending) {
                    actualHtml = `<div class="text-xs text-cyan-400 italic">Chờ mở thưởng 18h30</div>`;
                } else {
                    const sp = occ.special_prize || '';
                    const de = occ.actual_de || (sp.length >= 2 ? sp.slice(-2) : '-');
                    const spPrefix = sp.length > 2 ? sp.slice(0, -2) : '';
                    actualHtml = `
                        <div class="text-xs">
                            <span class="text-neutral-400">ĐB:</span>
                            <span class="font-mono font-bold text-white">${spPrefix}<b class="text-red-500 font-black">${de}</b></span>
                        </div>
                    `;
                    if (occ.hits > 0 && hitNumbers.length > 0) {
                        actualHtml += `
                            <div class="text-[10px] text-emerald-400 font-semibold mt-0.5">
                                Về: ${hitNumbers.join(', ')}
                            </div>
                        `;
                    }
                }

                // Status Badge
                let statusBadge = '';
                if (isPending) {
                    statusBadge = `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-600 animate-pulse">⏳ CHỜ QUAY</span>`;
                } else if (occ.is_de || occ.status === 'TRÚNG ĐỀ') {
                    statusBadge = `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-yellow-950 text-yellow-300 border border-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.4)]">🏆 TRÚNG ĐỀ</span>`;
                } else if (occ.is_win || occ.status === 'TRÚNG') {
                    statusBadge = `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600">✅ TRÚNG LOTO</span>`;
                } else if (occ.status === 'CHỜ TÍN HIỆU' || !preds.length) {
                    statusBadge = `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-neutral-800 text-neutral-400 border border-neutral-700">⚪ KHÔNG BÁO</span>`;
                } else {
                    statusBadge = `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-950/70 text-red-400 border border-red-800/80">❌ TRƯỢT</span>`;
                }

                // Hits Column
                let hitsHtml = '';
                if (isPending) {
                    hitsHtml = `<span class="text-neutral-500 text-xs italic">-</span>`;
                } else if (occ.hits > 0) {
                    hitsHtml = `<span class="text-xs font-black font-mono text-yellow-400 bg-black/80 px-2 py-1 rounded border border-yellow-500/50 shadow">${occ.hits} nháy</span>`;
                } else {
                    hitsHtml = `<span class="text-neutral-500 font-mono text-xs">0</span>`;
                }

                const firstNum = preds[0] || '';

                return `
                    <tr class="hover:bg-neutral-800/50 transition ${isPending ? 'bg-cyan-950/20' : ''}">
                        <td class="p-3">
                            <div class="font-bold text-white text-xs">${dow}, ${dateDisplay}</div>
                            ${isPending ? '<span class="inline-block mt-0.5 text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold px-2 py-0.5 rounded-full animate-pulse">⏳ Kỳ Hôm Nay / Kế Tiếp</span>' : `<span class="text-[10px] text-neutral-400 font-mono">${occ.target_date}</span>`}
                        </td>
                        <td class="p-3">
                            <div class="font-bold text-yellow-400 text-xs">${methodName}</div>
                            <div class="text-[10px] text-neutral-400 font-mono uppercase">${currentCatalogHistoryBridge}</div>
                        </td>
                        <td class="p-3 text-center">
                            <div class="flex flex-wrap items-center justify-center gap-1.5">
                                ${predChips}
                            </div>
                        </td>
                        <td class="p-3 text-center font-mono">
                            ${actualHtml}
                        </td>
                        <td class="p-3 text-center">
                            ${statusBadge}
                        </td>
                        <td class="p-3 text-center">
                            ${hitsHtml}
                        </td>
                        <td class="p-3 text-right">
                            <button onclick="switchTab('days10'); if('${firstNum}') toggleHighlight('${firstNum}');"
                                    class="bg-neutral-800 hover:bg-yellow-400 hover:text-black text-neutral-300 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-neutral-700 transition shadow inline-flex items-center gap-1.5">
                                <i class="fa-solid fa-magnifying-glass text-cyan-400"></i> Xem KQ
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        function renderLatestTab() {
            const container = document.getElementById('latest-draw-content');
            if (!container || !allDraws || allDraws.length === 0) return;
            const latestDraw = allDraws[0];
            const sp = latestDraw.special_prize || '';
            const spTail = sp.slice(-2);
            const head = spTail.length === 2 ? spTail[0] : '-';
            const tail = spTail.length === 2 ? spTail[1] : '-';
            const sum = spTail.length === 2 ? (parseInt(head) + parseInt(tail)) % 10 : '-';

            container.innerHTML = `
                <!-- Quick Info Header Banner -->
                <div class="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/40 text-red-500 flex items-center justify-center text-xl font-black">
                            <i class="fa-solid fa-trophy"></i>
                        </div>
                        <div>
                            <div class="text-xs text-neutral-400 uppercase font-semibold">Kết Quả Kỳ Quay Gần Nhất</div>
                            <div class="text-lg font-black text-white">${latestDraw.day_of_week}, ${latestDraw.date_display}</div>
                        </div>
                    </div>

                    <div class="flex flex-wrap items-center gap-3">
                        <div class="bg-black/60 border border-neutral-800 rounded-lg px-3 py-1.5 text-center">
                            <div class="text-[10px] text-neutral-400 uppercase">Đặc Biệt</div>
                            <div class="text-base font-black font-mono text-red-500">${sp}</div>
                        </div>
                        <div class="bg-black/60 border border-neutral-800 rounded-lg px-3 py-1.5 text-center">
                            <div class="text-[10px] text-neutral-400 uppercase">2 Số Cuối (Đề)</div>
                            <div class="text-base font-black font-mono text-yellow-400">${spTail}</div>
                        </div>
                        <div class="bg-black/60 border border-neutral-800 rounded-lg px-3 py-1.5 text-center">
                            <div class="text-[10px] text-neutral-400 uppercase">Đầu / Đuôi</div>
                            <div class="text-base font-black font-mono text-white">${head} / ${tail}</div>
                        </div>
                        <div class="bg-black/60 border border-neutral-800 rounded-lg px-3 py-1.5 text-center">
                            <div class="text-[10px] text-neutral-400 uppercase">Tổng Đề</div>
                            <div class="text-base font-black font-mono text-emerald-400">${sum}</div>
                        </div>
                    </div>
                </div>

                <!-- Main Result Card (Exact matching style with Tab 1) -->
                <div>
                    ${createDrawCard(latestDraw)}
                </div>
            `;

            if (currentHighlight) {
                applyHighlight(currentHighlight);
            }
        }

        async function loadWeeklyAnalysis() {
            try {
                const res = await fetch('/api/weekly-analysis');
                const data = await res.json();
                if (data.status !== 'SUCCESS') return;

                const best = data.best_day;
                document.getElementById('weekly-best-dow').innerText = best.dow;
                document.getElementById('weekly-best-province').innerText = `Đài: ${best.province}`;
                document.getElementById('weekly-best-pair').innerText = best.top_pair;
                document.getElementById('weekly-best-stat').innerText = `${best.stability_pct}% (${best.top_weeks_count}/${best.total_weeks} tuần)`;
                document.getElementById('weekly-best-hits').innerText = `${best.top_total_hits} nháy`;
                document.getElementById('weekly-summary-text').innerHTML = `<b>${data.summary}</b>`;

                const concContainer = document.getElementById('weekly-best-concurrence');
                concContainer.innerHTML = (best.concurrence || []).map(c => `
                    <span class="px-2.5 py-1 rounded bg-red-950/80 border border-red-800 text-red-300 font-medium text-xs">
                        <i class="fa-solid fa-check mr-1 text-red-400"></i>${c}
                    </span>
                `).join('') || '<span class="text-neutral-500 text-xs italic">Cầu độc lập</span>';

                const histContainer = document.getElementById('weekly-best-history');
                histContainer.innerHTML = (best.history || []).map(h => `
                    <span class="px-2 py-0.5 rounded text-xs font-mono font-bold ${h.status === 'V' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-neutral-800 text-neutral-400 border border-neutral-700'}" title="${h.date}">
                        ${h.status}${h.hits > 1 ? `(${h.hits})` : ''}
                    </span>
                `).join('');

                const daysGrid = document.getElementById('weekly-days-grid');
                daysGrid.innerHTML = data.days_analysis.map(day => {
                    const isBest = day.dow === best.dow;
                    return `
                        <div class="bg-neutral-900 rounded-xl p-4 border ${isBest ? 'border-red-600 shadow-lg shadow-red-950/50' : 'border-neutral-800'} space-y-3 flex flex-col justify-between">
                            <div>
                                <div class="flex justify-between items-center border-b border-neutral-800 pb-2 mb-2">
                                    <div>
                                        <h4 class="font-bold text-sm text-white">${day.dow}</h4>
                                        <span class="text-[11px] text-neutral-400">${day.province} (${day.total_weeks} tuần)</span>
                                    </div>
                                    ${isBest ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-700 text-white uppercase">Quán Quân</span>' : ''}
                                </div>

                                <div class="flex justify-between items-center py-2 bg-black/60 rounded-lg px-3 border border-neutral-800">
                                    <div>
                                        <span class="bridge-info-trigger text-[10px] text-neutral-400 uppercase block cursor-pointer hover:text-yellow-400"
                                              onmouseenter="showBridgeTooltip(event, 'cau_thu')" 
                                              onmouseleave="hideBridgeTooltip()" 
                                              onclick="openBridgeModal('cau_thu')">
                                            Cặp Ổn Định Nhất <i class="fa-solid fa-circle-question text-[9px]"></i>
                                        </span>
                                        <span onclick="switchTab('days10'); toggleHighlight('${day.top_pair}')" class="text-2xl font-black font-mono text-yellow-400 cursor-pointer hover:scale-110 transition inline-block">
                                            ${day.top_pair}
                                        </span>
                                    </div>
                                    <div class="text-right">
                                        <span class="text-xs font-bold text-emerald-400 block">${day.stability_pct}%</span>
                                        <span class="text-[11px] text-neutral-400">${day.top_weeks_count}/${day.total_weeks} tuần (${day.top_total_hits} nháy)</span>
                                    </div>
                                </div>

                                <div class="space-y-1.5 mt-3 text-xs">
                                    <div class="flex justify-between text-neutral-300">
                                        <span class="bridge-info-trigger text-neutral-400 cursor-pointer hover:text-yellow-400"
                                              onmouseenter="showBridgeTooltip(event, 'cau_cham_tuan')" 
                                              onmouseleave="hideBridgeTooltip()" 
                                              onclick="openBridgeModal('cau_cham_tuan')">
                                            Trùng Chạm <i class="fa-solid fa-circle-question text-[10px]"></i>:
                                        </span>
                                        <span class="font-mono font-bold text-red-400">Chạm ${day.top_cham} (${day.top_cham_hits} lượt)</span>
                                    </div>
                                    <div class="flex justify-between text-neutral-300">
                                        <span class="bridge-info-trigger text-neutral-400 cursor-pointer hover:text-yellow-400"
                                              onmouseenter="showBridgeTooltip(event, 'cau_tong_tuan')" 
                                              onmouseleave="hideBridgeTooltip()" 
                                              onclick="openBridgeModal('cau_tong_tuan')">
                                            Trùng Tổng <i class="fa-solid fa-circle-question text-[10px]"></i>:
                                        </span>
                                        <span class="font-mono font-bold text-yellow-400">Tổng ${day.top_sum} (${day.top_sum_hits} lượt)</span>
                                    </div>
                                    ${day.recent_streak >= 2 ? `
                                        <div class="bridge-info-trigger text-emerald-400 text-[11px] font-bold cursor-pointer hover:underline flex items-center gap-1"
                                             onmouseenter="showBridgeTooltip(event, 'cau_bet_tuan')" 
                                             onmouseleave="hideBridgeTooltip()" 
                                             onclick="openBridgeModal('cau_bet_tuan')">
                                            🔥 Đang thông ${day.recent_streak} tuần liên tiếp <i class="fa-solid fa-circle-question text-[10px]"></i>
                                        </div>` : ''}
                                </div>
                            </div>

                            <div class="pt-2 border-t border-neutral-800/80">
                                <span class="text-[10px] text-neutral-400 block mb-1">Cặp số phụ tiềm năng:</span>
                                <div class="flex flex-wrap gap-1">
                                    ${day.secondary_pairs.map(p => `
                                        <span onclick="switchTab('days10'); toggleHighlight('${p.pair}')" class="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-200 font-mono text-xs font-bold cursor-pointer hover:bg-yellow-400 hover:text-black transition">
                                            ${p.pair} (${p.weeks}t)
                                        </span>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');

                // Render Weekly Occurrences Table & KPIs
                if (data.weekly_stats) {
                    const ws = data.weekly_stats;
                    const wkWinrate = document.getElementById('weekly-kpi-winrate');
                    if (wkWinrate) wkWinrate.innerText = `${ws.win_rate || 0}%`;
                    const wkHits = document.getElementById('weekly-kpi-hits');
                    if (wkHits) wkHits.innerText = `${ws.total_hits || 0} nháy`;
                    const wkDe = document.getElementById('weekly-kpi-de');
                    if (wkDe) wkDe.innerText = `${ws.de_hits || 0} lần`;
                    const wkTotal = document.getElementById('weekly-kpi-total');
                    if (wkTotal) wkTotal.innerText = `${ws.total_tested || 0} kỳ`;
                }

                currentWeeklyOccurrences = data.weekly_history || [];
                renderWeeklyOccurrencesTable(currentWeeklyOccurrences);

            } catch(e) {
                console.error("Lỗi khi nạp dữ liệu phân tích tuần:", e);
            }
        }

        let currentWeeklyOccurrences = [];
        let currentWeeklyFilter = 'all';

        function filterWeeklyOccurrences(dow) {
            currentWeeklyFilter = dow;
            const dows = ['all', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
            const mapId = {'all': 'all', 'Thứ 2': 'T2', 'Thứ 3': 'T3', 'Thứ 4': 'T4', 'Thứ 5': 'T5', 'Thứ 6': 'T6', 'Thứ 7': 'T7', 'Chủ Nhật': 'CN'};
            dows.forEach(d => {
                const btn = document.getElementById('w-filter-' + mapId[d]);
                if (btn) {
                    if (d === dow) {
                        btn.className = 'px-3 py-1 rounded-lg text-xs font-bold bg-cyan-600 text-white transition shadow';
                    } else {
                        btn.className = 'px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-800 text-neutral-300 hover:text-white transition';
                    }
                }
            });

            let filtered = currentWeeklyOccurrences;
            if (dow !== 'all') {
                filtered = currentWeeklyOccurrences.filter(x => x.day_of_week && x.day_of_week.includes(dow));
            }
            renderWeeklyOccurrencesTable(filtered);
        }

        function renderWeeklyOccurrencesTable(list) {
            const tbody = document.getElementById('weekly-history-tbody');
            if (!tbody) return;
            if (!list || list.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-neutral-500 italic">Không có kỳ quay nào phù hợp với bộ lọc.</td></tr>`;
                return;
            }

            tbody.innerHTML = list.map(item => {
                const isWin = item.is_win;
                const isDe = item.is_de;
                let statusBadge = '<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-800 text-neutral-400 border border-neutral-700">Trượt</span>';
                if (isDe) {
                    statusBadge = '<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-950 text-purple-300 border border-purple-700 font-mono shadow-[0_0_8px_rgba(168,85,247,0.4)]">🎯 NỔ ĐỀ</span>';
                } else if (isWin) {
                    statusBadge = `<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-700 font-mono shadow-[0_0_8px_rgba(0,255,136,0.3)]">✅ VỀ (${item.hits} nháy)</span>`;
                }

                return `
                    <tr class="hover:bg-neutral-900/60 transition border-b border-neutral-800/40">
                        <td class="py-2.5 px-3 font-mono font-medium text-neutral-200">
                            ${item.date_display || item.draw_date}
                        </td>
                        <td class="py-2.5 px-3">
                            <span class="text-white font-bold">${item.day_of_week}</span>
                            <span class="text-neutral-500 text-[11px] block">${item.province || ''}</span>
                        </td>
                        <td class="py-2.5 px-3 text-center">
                            <span onclick="switchTab('days10'); toggleHighlight('${item.top_pair}')" class="font-mono font-black text-sm text-yellow-400 bg-black px-2.5 py-1 rounded-lg border border-yellow-500/40 cursor-pointer hover:bg-yellow-400 hover:text-black transition shadow">
                                ${item.top_pair}
                            </span>
                        </td>
                        <td class="py-2.5 px-3 text-center font-mono">
                            <span class="text-neutral-400 text-xs">${item.special_prize || '-'}</span>
                            <span class="block text-xs font-bold text-yellow-400">Đề: ${item.actual_de || '-'}</span>
                        </td>
                        <td class="py-2.5 px-3 text-center">
                            ${statusBadge}
                        </td>
                        <td class="py-2.5 px-3 text-center font-mono font-black ${item.hits > 0 ? 'text-yellow-400 text-sm' : 'text-neutral-500'}">
                            ${item.hits > 0 ? `+${item.hits}` : '0'}
                        </td>
                        <td class="py-2.5 px-3 text-center">
                            <button onclick="switchTab('days10'); toggleHighlight('${item.top_pair}');" class="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs transition">
                                <i class="fa-solid fa-eye"></i> Xem KQ
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        function toggleHighlight(pair) {
            pair = pair.trim();
            if (pair.length < 2) pair = pair.padStart(2, '0');

            if (currentHighlight === pair) {
                clearHighlight();
            } else {
                applyHighlight(pair);
            }
        }

        function highlightHead(headStr) {
            if (activeHeadHighlight === headStr) {
                clearHighlight();
            } else {
                applyHeadHighlight(headStr);
            }
        }

        function applyHeadHighlight(headStr) {
            clearHighlightWithoutSummary();
            activeHeadHighlight = headStr;

            // Highlight tất cả các dòng Đầu tương ứng trong bảng Loto
            document.querySelectorAll('.head-row').forEach(row => {
                if (row.dataset.head === headStr) {
                    row.classList.add('head-row-active');
                }
            });

            // Scan và Highlight tất cả giải thưởng và loto chip thuộc Đầu đó
            let matchCount = 0;
            document.querySelectorAll('.loto-target, .loto-chip').forEach(el => {
                const tail = el.dataset.tail || el.dataset.pair;
                if (tail && tail.startsWith(headStr)) {
                    el.classList.add('highlight-active');
                    matchCount++;
                }
            });

            const summaryEl = document.getElementById('highlightSummary');
            summaryEl.classList.remove('hidden');
            summaryEl.innerHTML = `🎯 Đang Highlight <b>Đầu ${headStr}</b> (Các số ${headStr}0..${headStr}9): Xuất hiện <b>${matchCount}</b> lượt trong ${displayedCount} ngày`;
        }

        function highlightCustomInput() {
            const input = document.getElementById('customInput').value.trim();
            if (input && input.length <= 2 && !isNaN(input)) {
                const pair = input.padStart(2, '0');
                applyHighlight(pair);
            } else {
                alert("Vui lòng nhập cặp số gồm 2 chữ số (ví dụ: 05, 38, 71).");
            }
        }

        function applyHighlight(pair) {
            clearHighlightWithoutSummary();
            currentHighlight = pair;
            document.getElementById('customInput').value = pair;

            // Highlight chip trong picker grid
            const activePicker = document.getElementById('picker-' + pair);
            if (activePicker) {
                activePicker.classList.remove('bg-neutral-900', 'text-neutral-200');
                activePicker.classList.add('bg-yellow-400', 'text-black', 'ring-2', 'ring-yellow-300', 'scale-110');
            }

            let matchCount = 0;
            const matchDates = new Set();

            document.querySelectorAll('.loto-target, .loto-chip').forEach(el => {
                const tail = el.dataset.tail || el.dataset.pair;
                if (tail === pair) {
                    el.classList.add('highlight-active');
                    matchCount++;
                    const cardHeader = el.closest('.bg-black')?.querySelector('h3');
                    if (cardHeader) {
                        const dateMatch = cardHeader.innerText.match(/(\d{2}\/\d{2}\/\d{4})/);
                        if (dateMatch) matchDates.add(dateMatch[1]);
                    }
                }
            });

            const summaryEl = document.getElementById('highlightSummary');
            summaryEl.classList.remove('hidden');
            const datesArr = Array.from(matchDates);
            summaryEl.innerHTML = `🎯 Cặp số <b>${pair}</b> xuất hiện <b>${matchCount}</b> lần trong ${displayedCount} ngày ${datesArr.length > 0 ? `(${datesArr.join(', ')})` : ''}`;
        }

        function clearHighlightWithoutSummary() {
            currentHighlight = null;
            activeHeadHighlight = null;
            
            for (let i = 0; i < 100; i++) {
                const p = String(i).padStart(2, '0');
                const btn = document.getElementById('picker-' + p);
                if (btn) {
                    btn.classList.remove('bg-yellow-400', 'text-black', 'ring-2', 'ring-yellow-300', 'scale-110');
                    btn.classList.add('bg-neutral-900', 'text-neutral-200');
                }
            }

            document.querySelectorAll('.head-row').forEach(row => {
                row.classList.remove('head-row-active');
            });

            document.querySelectorAll('.loto-target, .loto-chip').forEach(el => {
                el.classList.remove('highlight-active');
            });

            document.querySelectorAll('.xien-win-badge').forEach(b => b.remove());
            document.querySelectorAll('#draws-grid > div').forEach(c => c.classList.remove('ring-4', 'ring-emerald-500', 'shadow-2xl'));
        }

        function clearHighlight() {
            clearHighlightWithoutSummary();
            document.getElementById('customInput').value = '';
            const summaryEl = document.getElementById('highlightSummary');
            summaryEl.classList.add('hidden');
        }

        async function loadAnalyzerData() {
            try {
                const res = await fetch('/api/analyze');
                const data = await res.json();
                
                if (data.status === 'SUCCESS') {
                    // Render MODULE - CẦU
                    if (data.module_cau) {
                        const mc = data.module_cau;
                        document.getElementById('cau-pair-display').innerText = mc.bridge_pair;
                        document.getElementById('cau-pattern-display').innerText = `Mẫu: ${mc.pattern_name}`;
                        document.getElementById('cau-status-badge').innerText = mc.status;
                        
                        const daysContainer = document.getElementById('cau-days-list');
                        daysContainer.innerHTML = (mc.details_4days || []).map(d => `
                            <div class="bg-black p-2.5 rounded-lg border border-neutral-800 text-center">
                                <span class="text-[11px] text-neutral-400 block font-mono">${d.date}</span>
                                <span class="inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-bold font-mono ${d.status === 'VỀ' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-neutral-800 text-neutral-400 border border-neutral-700'}">
                                    ${d.status} ${d.hits > 0 ? `(${d.hits} nháy)` : ''}
                                </span>
                            </div>
                        `).join('');

                        document.getElementById('cau-conclusion').innerText = mc.conclusion;
                        document.getElementById('cau-freq').innerText = `${mc.frequency} - ${mc.total_hits} nháy`;
                        document.getElementById('cau-reliability').innerText = mc.reliability;
                        document.getElementById('cau-state').innerText = mc.status;
                    }

                    const syn = data.synthesis;
                    document.getElementById('synthesis-summary').innerHTML = `
                        <b>${syn.summary}</b>
                        ${syn.chot_pair ? `<div class="mt-3 flex items-center gap-3">
                            <span class="text-sm text-neutral-300">Cặp Số Tổng Hợp:</span>
                            <span onclick="switchTab('days10'); toggleHighlight('${syn.chot_pair}')" class="px-4 py-1.5 rounded-xl bg-yellow-400 text-black font-black font-mono text-xl shadow-lg border border-yellow-300 cursor-pointer hover:scale-105 transition">${syn.chot_pair}</span>
                            <span class="text-xs px-2.5 py-1 rounded bg-neutral-800 text-yellow-400 font-bold">Tín Hiệu: ${syn.signal_level}</span>
                        </div>` : ''}
                    `;

                    const grid = document.getElementById('modules-grid');
                    grid.innerHTML = Object.keys(data.modules).map(key => {
                        const m = data.modules[key];
                        const isActive = m.status === 'ACTIVE' || m.status === 'STRONG ACTIVE';
                        const statusBadgeClass = m.status === 'STRONG ACTIVE' ? 'bg-purple-950 text-purple-300 border-purple-800' :
                                                (m.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-neutral-800 text-neutral-400 border-neutral-700');
                        
                        const st = m.stats || {};
                        const statWinRate = (st.signals > 0) ? `${st.accuracy_pct}%` : '--';
                        const statHits = st.total_hits ? `${st.total_hits} nháy` : '--';
                        const statStreak = st.max_streak ? `${st.max_streak} kỳ` : '--';

                        return `
                            <div class="bg-neutral-900 rounded-xl p-4 border ${isActive ? 'border-neutral-700 shadow-lg shadow-black/40' : 'border-neutral-800'} space-y-3 flex flex-col justify-between shadow transition hover:border-cyan-500/50">
                                <div>
                                    <div class="flex justify-between items-start gap-2 mb-2">
                                        <h4 class="font-bold text-sm text-red-400">
                                            <span class="bridge-info-trigger inline-flex items-center gap-1.5 cursor-pointer hover:text-yellow-400 transition"
                                                  data-bridge="${key}"
                                                  onmouseenter="showBridgeTooltip(event, '${key}')"
                                                  onmouseleave="hideBridgeTooltip()"
                                                  onclick="openBridgeModal('${key}')">
                                                ${m.name}
                                                <i class="fa-solid fa-circle-question text-neutral-500 hover:text-yellow-400 text-xs transition" title="Bấm để xem đối chiếu lịch sử & giải thích"></i>
                                            </span>
                                        </h4>
                                        <span class="text-[10px] px-2 py-0.5 rounded border font-mono ${statusBadgeClass}">${m.status}</span>
                                    </div>
                                    <p class="text-xs text-neutral-300 leading-relaxed">${m.detail}</p>
                                </div>

                                <!-- Thống kê thực tế các ngày đã nổ -->
                                <div class="grid grid-cols-3 gap-1 py-1.5 px-2 rounded-lg bg-black/60 border border-neutral-800 text-center text-[10px]">
                                    <div>
                                        <span class="text-neutral-500 block">Tỷ Lệ Nổ</span>
                                        <span class="font-bold font-mono text-emerald-400">${statWinRate}</span>
                                    </div>
                                    <div>
                                        <span class="text-neutral-500 block">Tổng Nháy</span>
                                        <span class="font-bold font-mono text-yellow-400">${statHits}</span>
                                    </div>
                                    <div>
                                        <span class="text-neutral-500 block">Kỷ Lục Thông</span>
                                        <span class="font-bold font-mono text-cyan-400">${statStreak}</span>
                                    </div>
                                </div>

                                <div class="pt-2 border-t border-neutral-800 space-y-2">
                                    <div class="flex justify-between items-center text-xs">
                                        <span class="text-neutral-400">Điểm: <b class="${m.score >= 70 ? 'text-emerald-400' : 'text-neutral-300'}">${m.score}/100</b></span>
                                        ${m.pair ? `<span onclick="switchTab('days10'); toggleHighlight('${m.pair}')" class="font-mono font-bold px-2 py-0.5 rounded bg-neutral-800 text-yellow-400 border border-neutral-700 cursor-pointer hover:bg-yellow-400 hover:text-black transition">Số: ${m.pair}</span>` : '<span class="text-neutral-500 italic">Không có số</span>'}
                                    </div>
                                    <button onclick="openBridgeModal('${key}', 'occurrences')" 
                                            class="w-full py-1.5 px-3 rounded-lg bg-neutral-800/90 hover:bg-cyan-950 text-cyan-300 hover:text-white border border-neutral-700 hover:border-cyan-500 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow">
                                        <i class="fa-solid fa-chart-column text-yellow-400"></i> Xem Thống Kê Các Ngày Đã Nổ
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            } catch(e) {
                console.error("Lỗi khi tải dữ liệu phân tích:", e);
            }
        }

        async function loadStats() {
            try {
                const res = await fetch('/api/stats');
                const data = await res.json();
                
                const topContainer = document.getElementById('top-loto-list');
                topContainer.innerHTML = data.top_frequent.map(item => `
                    <div onclick="switchTab('days10'); toggleHighlight('${item.number}')" class="flex justify-between items-center p-2 rounded-lg bg-black border border-neutral-800 cursor-pointer hover:border-red-500 transition">
                        <span class="w-8 h-8 rounded bg-emerald-950 text-emerald-400 font-mono font-bold flex items-center justify-center border border-emerald-800">${item.number}</span>
                        <span class="text-sm text-neutral-300">Về <b class="text-emerald-400 font-bold">${item.count}</b> lần</span>
                    </div>
                `).join('');

                const ganContainer = document.getElementById('gan-loto-list');
                ganContainer.innerHTML = data.top_gan.map(item => `
                    <div onclick="switchTab('days10'); toggleHighlight('${item.number}')" class="flex justify-between items-center p-2 rounded-lg bg-black border border-neutral-800 cursor-pointer hover:border-red-500 transition">
                        <span class="w-8 h-8 rounded bg-red-950 text-red-400 font-mono font-bold flex items-center justify-center border border-red-800">${item.number}</span>
                        <span class="text-sm text-neutral-300">Chưa về <b class="text-red-400 font-bold">${item.days_gan}</b> ngày</span>
                    </div>
                `).join('');
            } catch(e) {
                console.error("Lỗi khi tải thống kê:", e);
            }
        }

        async function updateData() {
            const btn = document.getElementById('updateBtn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang Cập Nhật...';
            try {
                const res = await fetch('/api/crawl-today', { method: 'POST' });
                const json = await res.json();
                alert(json.message);
                location.reload();
            } catch(e) {
                alert("Lỗi khi cập nhật dữ liệu!");
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Cập Nhật Kết Quả';
            }
        }

        // =========================================================================
        // JAVASCRIPT CHO MODULE BACKTEST & KIỂM THỬ THUẬT TOÁN
        // =========================================================================
        // JAVASCRIPT CHO MODULE BACKTEST & KIỂM THỬ THUẬT TOÁN (ĐA PHƯƠNG PHÁP)
        // =========================================================================
        let backtestDates = [];
        let currentBatchData = null;
        let currentSingleData = null;
        let backtestMode = 'batch';
        let backtestLoaded = false;
        let currentBacktestDays = 14;
        let currentBacktestMethod = 'all_synthesis';

        async function initBacktestTab() {
            if (!backtestLoaded) {
                await loadBacktestDates();
                await runBatchBacktest(14, 'all_synthesis');
                backtestLoaded = true;
            }
        }

        async function loadBacktestDates() {
            try {
                const res = await fetch('/api/backtest/dates');
                backtestDates = await res.json();
                const sel = document.getElementById('backtest-date-select');
                if (sel) {
                    sel.innerHTML = backtestDates.map(d => `
                        <option value="${d.draw_date}">${d.day_of_week}, ${d.date_display}</option>
                    `).join('');
                }
            } catch(e) {
                console.error("Lỗi khi tải danh sách ngày backtest:", e);
            }
        }

        function switchBacktestMode(mode) {
            backtestMode = mode;
            const btnBatch = document.getElementById('btn-mode-batch');
            const btnSingle = document.getElementById('btn-mode-single');
            const batchControls = document.getElementById('backtest-batch-controls');
            const singleControls = document.getElementById('backtest-single-controls');
            const batchContainer = document.getElementById('backtest-batch-container');
            const singleContainer = document.getElementById('backtest-single-container');

            if (mode === 'batch') {
                btnBatch.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold transition bg-red-700 text-white shadow';
                btnSingle.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold text-neutral-400 hover:text-white transition';
                batchControls.classList.remove('hidden');
                singleControls.classList.add('hidden');
                batchContainer.classList.remove('hidden');
                singleContainer.classList.add('hidden');
            } else {
                btnSingle.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold transition bg-red-700 text-white shadow';
                btnBatch.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold text-neutral-400 hover:text-white transition';
                batchControls.classList.add('hidden');
                singleControls.classList.remove('hidden');
                batchContainer.classList.add('hidden');
                singleContainer.classList.remove('hidden');

                if (!currentSingleData && backtestDates.length > 0) {
                    runSingleBacktest(backtestDates[0].draw_date);
                }
            }
        }

        function executeSingleBacktestFromSelect() {
            const sel = document.getElementById('backtest-date-select');
            if (sel && sel.value) {
                runSingleBacktest(sel.value);
            }
        }

        function onBacktestMethodChange(newMethod) {
            currentBacktestMethod = newMethod;
            runBatchBacktest(currentBacktestDays, newMethod);
        }

        function selectMethodForBacktest(methodKey) {
            currentBacktestMethod = methodKey;
            const methodSelect = document.getElementById('backtest-method-select');
            if (methodSelect) {
                methodSelect.value = methodKey;
            }
            runBatchBacktest(currentBacktestDays, methodKey);
            const batchContainer = document.getElementById('backtest-batch-container');
            if (batchContainer) {
                batchContainer.scrollIntoView({ behavior: 'smooth' });
            }
        }

        async function runBatchBacktest(days, method) {
            if (days) currentBacktestDays = days;
            if (method) currentBacktestMethod = method;

            document.querySelectorAll('.batch-pill').forEach(btn => {
                btn.className = 'batch-pill px-3 py-1.5 rounded-lg text-xs font-bold bg-neutral-900 border border-neutral-700 text-neutral-300 hover:border-yellow-400 hover:text-yellow-400 transition';
            });
            const activePill = document.getElementById('batch-p-' + currentBacktestDays);
            if (activePill) {
                activePill.className = 'batch-pill px-3 py-1.5 rounded-lg text-xs font-bold bg-yellow-400 text-black border border-yellow-300 shadow transition';
            }

            const methodSelect = document.getElementById('backtest-method-select');
            if (methodSelect && methodSelect.value !== currentBacktestMethod) {
                methodSelect.value = currentBacktestMethod;
            }

            const statusText = document.getElementById('batch-status-text');
            statusText.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang tính toán...';

            try {
                const res = await fetch(`/api/backtest/batch?days=${currentBacktestDays}&method=${currentBacktestMethod}`);
                const data = await res.json();
                if (data.status !== 'SUCCESS') {
                    statusText.innerText = 'Lỗi tính toán';
                    return;
                }
                currentBatchData = data;
                renderBatchData(data);
                statusText.innerHTML = `<i class="fa-solid fa-check text-emerald-400 mr-1"></i> Đã kiểm thử ${data.total_days_tested} kỳ`;
            } catch(e) {
                console.error("Lỗi khi chạy backtest batch:", e);
                statusText.innerText = 'Lỗi kết nối';
            }
        }

        function renderBatchData(data) {
            const methodName = data.selected_method_name || data.selected_method;

            // 1. KPI Cards
            const winRate = data.win_rate !== undefined ? data.win_rate : data.chot_win_rate;
            const winsCount = data.wins_count !== undefined ? data.wins_count : data.chot_wins_count;
            const signalsCount = data.signals_count || data.total_days_tested;
            const totalHits = data.total_hits !== undefined ? data.total_hits : data.chot_total_hits;
            const avgHits = data.avg_hits !== undefined ? data.avg_hits : (data.total_days_tested > 0 ? (totalHits / data.total_days_tested).toFixed(2) : 0);

            const winRateLabel = document.getElementById('kpi-winrate-label');
            if (winRateLabel) {
                winRateLabel.innerText = `TỶ LỆ TRÚNG (${methodName})`;
            }

            document.getElementById('kpi-winrate').innerText = `${winRate}%`;
            document.getElementById('kpi-winrate-detail').innerText = `(${winsCount}/${signalsCount} kỳ phát tín hiệu)`;
            document.getElementById('kpi-winrate-bar').style.width = `${Math.min(100, winRate)}%`;

            document.getElementById('kpi-hits').innerText = totalHits;
            document.getElementById('kpi-hits-avg').innerText = `Trung bình ${avgHits} nháy / kỳ`;

            const streakEl = document.getElementById('kpi-streak');
            if (streakEl) {
                streakEl.innerText = data.max_streak || 0;
            }
            const streakDesc = document.getElementById('kpi-streak-desc');
            if (streakDesc) {
                const cur = data.current_streak || 0;
                streakDesc.innerText = cur > 0 ? `Đang ăn thông ${cur} kỳ liên tiếp 🔥` : (cur < 0 ? `Tạm ngắt nhịp ${Math.abs(cur)} kỳ gần đây` : 'Chuỗi dài nhất');
            }

            const deEl = document.getElementById('kpi-de');
            if (deEl) {
                deEl.innerText = data.de_wins !== undefined ? data.de_wins : (data.chot_de_wins || 0);
            }

            // Headers & Badges
            const methodTitle = document.getElementById('daily-log-method-title');
            if (methodTitle) {
                methodTitle.innerText = methodName;
            }
            const summaryBadge = document.getElementById('daily-log-summary-badge');
            if (summaryBadge) {
                summaryBadge.innerHTML = `<span class="px-2.5 py-1 rounded bg-yellow-950/80 text-yellow-400 font-bold border border-yellow-700/60 inline-flex items-center gap-1.5"><i class="fa-solid fa-fire text-amber-500"></i> Kỷ Lục Ăn Thông: ${data.max_streak || 0} kỳ | Đạt ${winRate}% (${winsCount}/${signalsCount} kỳ)</span>`;
            }

            // 2. Leaderboard Table (nếu có phần tử trong DOM)
            const lbBody = document.getElementById('backtest-leaderboard-body');
            const ranking = data.modules_ranking || [];
            const lbBadge = document.getElementById('leaderboard-count-badge');
            if (lbBadge) {
                lbBadge.innerText = `Đang xếp hạng ${ranking.length} phương pháp`;
            }

            if (lbBody) {
                if (ranking.length === 0) {
                    lbBody.innerHTML = '<tr><td colspan="9" class="py-4 text-center text-neutral-500">Chưa có phương pháp nào phát tín hiệu trong chu kỳ này.</td></tr>';
                } else {
                    lbBody.innerHTML = ranking.map((m, idx) => {
                        const isSelected = (m.key === currentBacktestMethod);
                        const rankBadge = idx === 0 ? '<span class="w-6 h-6 rounded-full bg-yellow-500 text-black font-black inline-flex items-center justify-center text-xs shadow">1</span>' :
                                         (idx === 1 ? '<span class="w-6 h-6 rounded-full bg-neutral-300 text-black font-black inline-flex items-center justify-center text-xs shadow">2</span>' :
                                         (idx === 2 ? '<span class="w-6 h-6 rounded-full bg-amber-700 text-white font-black inline-flex items-center justify-center text-xs shadow">3</span>' :
                                         `<span class="text-neutral-400 font-bold">${idx + 1}</span>`));
                        
                        const barWidth = Math.min(100, m.accuracy_pct);
                        const barColor = m.accuracy_pct >= 50 ? 'bg-emerald-500' : (m.accuracy_pct >= 30 ? 'bg-yellow-500' : 'bg-neutral-600');

                        const actionBtn = isSelected ? 
                            `<span class="px-2 py-1 rounded bg-yellow-500 text-black font-black text-[11px] inline-flex items-center gap-1 shadow"><i class="fa-solid fa-check"></i> Đang Chọn</span>` :
                            `<button onclick="selectMethodForBacktest('${m.key}')" class="px-2.5 py-1 rounded bg-neutral-800 hover:bg-yellow-500 hover:text-black text-yellow-400 font-bold transition text-[11px] border border-neutral-700 inline-flex items-center gap-1"><i class="fa-solid fa-chart-simple"></i> Kiểm Thử</button>`;

                        const streakBadge = m.max_streak > 0 ? `<span class="inline-flex items-center gap-1 text-amber-400 font-mono font-bold"><i class="fa-solid fa-fire text-xs text-amber-500"></i> ${m.max_streak}</span>` : '<span class="text-neutral-500 font-mono">-</span>';

                        return `
                            <tr class="hover:bg-neutral-800/40 transition ${isSelected ? 'bg-yellow-500/10 border-l-2 border-yellow-500' : ''}">
                                <td class="py-2.5 px-3 text-center">${rankBadge}</td>
                                <td class="py-2.5 px-3 font-semibold text-white">
                                    <span class="bridge-info-trigger inline-flex items-center gap-1.5 cursor-pointer hover:text-yellow-400 transition"
                                          data-bridge="${m.key}"
                                          onmouseenter="showBridgeTooltip(event, '${m.key}')"
                                          onmouseleave="hideBridgeTooltip()"
                                          onclick="openBridgeModal('${m.key}')">
                                        ${m.name}
                                        <i class="fa-solid fa-circle-question text-neutral-500 hover:text-yellow-400 text-xs transition" title="Bấm hoặc rê chuột để xem giải thích chi tiết & ví dụ"></i>
                                    </span>
                                </td>
                                <td class="py-2.5 px-3 text-neutral-400 text-[11px]">${m.category || 'Soi Cầu'}</td>
                                <td class="py-2.5 px-3 text-center font-mono text-neutral-300">${m.signals}</td>
                                <td class="py-2.5 px-3 text-center font-mono font-bold text-emerald-400">${m.hits_count}</td>
                                <td class="py-2.5 px-3 text-center font-mono font-bold text-yellow-400">${m.total_hits}</td>
                                <td class="py-2.5 px-3 text-center font-mono">${streakBadge}</td>
                                <td class="py-2.5 px-3 text-right">
                                    <div class="flex items-center justify-end gap-2">
                                        <div class="w-20 bg-neutral-800 h-2 rounded-full overflow-hidden hidden sm:block">
                                            <div class="${barColor} h-full rounded-full" style="width: ${barWidth}%"></div>
                                        </div>
                                        <span class="font-mono font-black text-sm ${m.accuracy_pct >= 40 ? 'text-emerald-400' : (m.accuracy_pct >= 25 ? 'text-yellow-400' : 'text-neutral-300')}">${m.accuracy_pct}%</span>
                                    </div>
                                </td>
                                <td class="py-2.5 px-3 text-center">${actionBtn}</td>
                            </tr>
                        `;
                    }).join('');
                }
            }

            // 3. Daily Log Table
            const logBody = document.getElementById('backtest-daily-log-body');
            const logs = data.daily_results || [];
            logBody.innerHTML = logs.map(row => {
                const isCurrent = !!(row.is_current || row.status === 'PENDING' || row.is_win === null);
                const isWin = row.is_win !== undefined ? row.is_win : row.chot_is_win;
                const hitsCount = row.hits !== undefined ? row.hits : row.chot_hits;
                const isDe = row.is_de !== undefined ? row.is_de : row.chot_is_de;

                let resultBadge;
                if (isCurrent) {
                    resultBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950 text-amber-300 border border-amber-600 font-bold text-xs shadow animate-pulse">
                        <i class="fa-solid fa-clock"></i> Chờ mở thưởng (18h30)
                    </span>`;
                } else if (row.status === 'NO_SIGNAL') {
                    resultBadge = `<span class="text-neutral-500 italic text-[11px]">Không phát tín hiệu</span>`;
                } else if (isWin) {
                    resultBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold text-xs shadow">
                        <i class="fa-solid fa-check"></i> TRÚNG ${hitsCount} NHÁY ${isDe ? '<b class="text-yellow-300 ml-1">🔥 ĂN ĐỀ</b>' : ''}
                    </span>`;
                } else {
                    resultBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800/80 text-neutral-400 border border-neutral-700 font-medium text-xs">
                        <i class="fa-solid fa-xmark"></i> TRƯỢT
                    </span>`;
                }

                // Highlight các số trúng trong dàn dự đoán
                const hitNumsSet = new Set(row.hit_numbers || []);
                const preds = row.predicted_numbers || (row.chot_pair ? [row.chot_pair] : []);
                const predsHtml = preds.length > 0 ? preds.map(p => {
                    if (isCurrent) {
                        return `<span class="px-2.5 py-1 rounded bg-amber-500 text-black font-black font-mono text-sm shadow-md ring-2 ring-amber-300">${p}</span>`;
                    }
                    const isHit = hitNumsSet.has(p);
                    if (isHit) {
                        return `<span class="px-2 py-0.5 rounded bg-emerald-500 text-black font-black font-mono text-sm shadow-md ring-1 ring-emerald-300">${p}</span>`;
                    } else {
                        return `<span class="px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 font-bold font-mono text-xs border border-neutral-700">${p}</span>`;
                    }
                }).join(' ') : '<span class="text-neutral-500 italic">-</span>';

                const badgeBg = isCurrent ? 'bg-amber-950/80 text-amber-300 border-amber-700' : 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
                const winningModulesBadges = (row.winning_modules || []).slice(0, 6).map(m => `
                    <span class="bridge-info-trigger px-1.5 py-0.5 rounded ${badgeBg} border font-mono text-[10px] font-bold cursor-pointer hover:border-yellow-400 hover:text-yellow-300 transition"
                          data-bridge="${m}"
                          onmouseenter="showBridgeTooltip(event, '${m}')"
                          onmouseleave="hideBridgeTooltip()"
                          onclick="event.stopPropagation(); openBridgeModal('${m}')"
                          title="Bấm để xem giải thích & ví dụ">${m}</span>
                `).join(' ') || `<span class="text-neutral-600 italic">${isCurrent ? 'Đang cập nhật cầu' : 'Không có'}</span>`;

                const dateDisplayHtml = isCurrent ?
                    `<span class="text-yellow-400 font-bold font-mono">${row.date_display}</span> <span class="ml-1 text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded shadow uppercase">Hôm nay</span>` :
                    `<span class="text-white font-mono">${row.date_display}</span>`;

                const specialDisplayHtml = isCurrent ?
                    `<span class="text-amber-400/80 text-xs italic font-semibold">Chờ mở thưởng</span>` :
                    (row.actual_special ? `${row.actual_special} (<b class="text-yellow-400">${row.actual_de}</b>)` : '-');

                const rowBg = isCurrent ? 'bg-amber-950/20 border-l-4 border-l-amber-500 hover:bg-amber-950/30' : 'hover:bg-neutral-800/50';
                const actionBtn = isCurrent ?
                    `<button onclick="event.stopPropagation(); runSingleBacktest('${row.draw_date}')" class="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold transition text-[11px] shadow inline-flex items-center gap-1">
                        Dự Đoán <i class="fa-solid fa-angle-right ml-0.5"></i>
                    </button>` :
                    `<button onclick="event.stopPropagation(); runSingleBacktest('${row.draw_date}')" class="px-2.5 py-1 rounded bg-neutral-800 hover:bg-red-700 text-neutral-200 hover:text-white transition text-[11px] font-semibold border border-neutral-700 inline-flex items-center gap-1">
                        Chi Tiết <i class="fa-solid fa-angle-right ml-0.5"></i>
                    </button>`;

                return `
                    <tr class="${rowBg} cursor-pointer transition" onclick="runSingleBacktest('${row.draw_date}')">
                        <td class="py-2.5 px-3">${dateDisplayHtml}</td>
                        <td class="py-2.5 px-3 text-neutral-400 font-medium">${row.day_of_week}</td>
                        <td class="py-2.5 px-3 text-center">
                            <div class="flex items-center justify-center gap-1.5 flex-wrap">${predsHtml}</div>
                        </td>
                        <td class="py-2.5 px-3 text-center font-mono font-bold text-red-500">
                            ${specialDisplayHtml}
                        </td>
                        <td class="py-2.5 px-3 text-center">${resultBadge}</td>
                        <td class="py-2.5 px-3">${winningModulesBadges}</td>
                        <td class="py-2.5 px-3 text-center">${actionBtn}</td>
                    </tr>
                `;
            }).join('');
        }

        async function runSingleBacktest(targetDate) {
            switchBacktestMode('single');

            const sel = document.getElementById('backtest-date-select');
            if (sel) sel.value = targetDate;

            document.getElementById('single-view-title').innerText = `Đang tải đối chiếu ngày ${targetDate}...`;

            try {
                const res = await fetch(`/api/backtest/single?date=${targetDate}`);
                const data = await res.json();
                if (data.status !== 'SUCCESS') {
                    alert(data.message || "Lỗi khi chạy backtest!");
                    return;
                }
                currentSingleData = data;
                renderSingleBacktest(data);
            } catch(e) {
                console.error("Lỗi khi chạy single backtest:", e);
            }
        }

        function renderSingleBacktest(data) {
            const isPending = !!(data.is_pending || (data.actual && data.actual.status === 'PENDING') || (data.evaluation && data.evaluation.chot && data.evaluation.chot.is_win === null));
            const act = data.actual || {};
            const pred = data.prediction || {};
            const ev = data.evaluation || {};
            const chot = ev.chot || {};

            const todayTag = isPending ? 
                `<span class="ml-2 text-xs bg-red-600 text-white font-bold px-2 py-0.5 rounded uppercase shadow animate-pulse">Hôm nay - Chờ mở thưởng</span>` : '';

            document.getElementById('single-view-title').innerHTML = `
                Kỳ Quay: <b class="text-yellow-400">${data.day_of_week}</b>, ngày <b class="text-white font-mono">${data.date_display}</b>${todayTag}
            `;

            // Banner Badge
            const badgeEl = document.getElementById('single-view-banner-badge');
            if (isPending) {
                badgeEl.innerHTML = `<span class="px-4 py-1.5 rounded-xl bg-amber-500 text-black font-black text-sm shadow-lg flex items-center gap-1.5 animate-pulse"><i class="fa-solid fa-clock"></i> ĐANG CHỜ KẾT QUẢ MỞ THƯỞNG (18H30)</span>`;
            } else if (chot.pair) {
                if (chot.is_win) {
                    badgeEl.innerHTML = `<span class="px-4 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-sm shadow-lg flex items-center gap-1.5"><i class="fa-solid fa-trophy"></i> TRÚNG CHỐT SỐ (${chot.hits} NHÁY)</span>`;
                } else {
                    badgeEl.innerHTML = `<span class="px-4 py-1.5 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-300 font-bold text-sm flex items-center gap-1.5"><i class="fa-solid fa-circle-xmark text-neutral-400"></i> TRƯỢT KỲ NÀY</span>`;
                }
            } else {
                badgeEl.innerHTML = `<span class="px-4 py-1.5 rounded-xl bg-neutral-800 text-neutral-400 font-medium text-sm">KHÔNG ĐỦ TÍN HIỆU ĐỒNG THUẬN</span>`;
            }

            // Chốt số box
            const chotBox = document.getElementById('single-pred-chot-box');
            if (chot.pair) {
                let rightStatusHtml;
                if (isPending) {
                    rightStatusHtml = `<span class="px-3 py-1 rounded bg-amber-950 text-amber-300 border border-amber-600 font-bold text-xs animate-pulse">CHỜ KẾT QUẢ</span>`;
                } else if (chot.is_win) {
                    rightStatusHtml = `<span class="px-3 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-black text-xs">TRÚNG ${chot.hits} NHÁY</span>`;
                } else {
                    rightStatusHtml = `<span class="px-3 py-1 rounded bg-neutral-800 text-neutral-400 border border-neutral-700 font-bold text-xs">TRƯỢT</span>`;
                }

                chotBox.innerHTML = `
                    <div class="flex justify-between items-center border-b border-neutral-800 pb-2">
                        <span class="text-xs text-neutral-400 font-bold uppercase">Cặp Số Tổng Hợp Chốt (Bạch Thủ / Song Thủ):</span>
                        <span class="text-xs px-2.5 py-0.5 rounded bg-neutral-800 text-yellow-400 font-bold">Tín hiệu: ${chot.signal_level}</span>
                    </div>
                    <div class="flex items-center justify-between mt-2">
                        <div class="flex items-center gap-3">
                            <span class="text-3xl font-black font-mono text-yellow-400 bg-black px-4 py-1 rounded-xl border border-yellow-500/40">${chot.pair}</span>
                            <div>
                                <span class="text-xs text-neutral-300 block font-semibold">${pred.summary || 'Dự đoán tổng hợp các thuật toán'}</span>
                                ${isPending ? '<span class="text-xs text-amber-400 font-bold">⏳ Chờ kết quả quay thưởng lúc 18h15 - 18h30 hôm nay</span>' : (chot.is_de ? '<span class="text-xs text-yellow-300 font-bold">🔥 Trúng 2 số cuối Giải Đặc Biệt!</span>' : '')}
                            </div>
                        </div>
                        <div class="text-right">
                            ${rightStatusHtml}
                        </div>
                    </div>
                `;
            } else {
                chotBox.innerHTML = `
                    <span class="text-xs text-neutral-400 font-bold uppercase block mb-1">Cặp Số Tổng Hợp Chốt:</span>
                    <p class="text-xs text-neutral-400 italic">${pred.summary || 'Chưa đủ dữ liệu phát tín hiệu'}</p>
                `;
            }

            // Cầu Nhịp box
            const cauBox = document.getElementById('single-pred-cau-box');
            const mc = pred.module_cau;
            const mcEval = ev.module_cau;
            if (mc) {
                let cauStatusHtml;
                if (isPending) {
                    cauStatusHtml = `<span class="text-xs font-bold text-amber-400"><i class="fa-solid fa-clock"></i> Đang báo cầu hôm nay</span>`;
                } else if (mcEval && mcEval.is_win) {
                    cauStatusHtml = `<span class="text-xs font-bold text-emerald-400"><i class="fa-solid fa-check"></i> Trúng ${mcEval.hits} nháy</span>`;
                } else {
                    cauStatusHtml = `<span class="text-xs text-neutral-500 font-bold">Trượt</span>`;
                }

                cauBox.innerHTML = `
                    <div class="flex justify-between items-center">
                        <span class="bridge-info-trigger text-xs text-purple-400 font-bold uppercase cursor-pointer hover:text-purple-300"
                              onmouseenter="showBridgeTooltip(event, 'module_cau')" 
                              onmouseleave="hideBridgeTooltip()" 
                              onclick="openBridgeModal('module_cau')">
                            <i class="fa-solid fa-bridge mr-1"></i> Module Cầu Nhịp (${mc.pattern_name}) <i class="fa-solid fa-circle-question text-[10px]"></i>:
                        </span>
                        ${cauStatusHtml}
                    </div>
                    <div class="flex items-center gap-3 mt-1">
                        <span class="text-xl font-black font-mono text-purple-300 bg-black px-3 py-0.5 rounded border border-purple-800">${mc.bridge_pair}</span>
                        <span class="text-xs text-neutral-300">${mc.conclusion}</span>
                    </div>
                `;
            } else {
                cauBox.innerHTML = '<span class="text-xs text-neutral-500 italic">Không có tín hiệu cầu nhịp 4 ngày đủ chuẩn.</span>';
            }

            // Cầu Thứ box
            const weeklyBox = document.getElementById('single-pred-weekly-box');
            const wm = pred.weekly_matched;
            if (wm) {
                let weeklyStatusHtml;
                if (isPending) {
                    weeklyStatusHtml = `<span class="text-xs font-bold text-amber-400"><i class="fa-solid fa-clock"></i> Cầu theo thứ hôm nay</span>`;
                } else if (wm.is_win) {
                    weeklyStatusHtml = `<span class="text-xs font-bold text-emerald-400"><i class="fa-solid fa-check"></i> Trúng ${wm.hits} nháy</span>`;
                } else {
                    weeklyStatusHtml = `<span class="text-xs text-neutral-500 font-bold">Trượt</span>`;
                }

                weeklyBox.innerHTML = `
                    <div class="flex justify-between items-center">
                        <span class="bridge-info-trigger text-xs text-yellow-400 font-bold uppercase cursor-pointer hover:text-yellow-300"
                              onmouseenter="showBridgeTooltip(event, 'cau_thu')" 
                              onmouseleave="hideBridgeTooltip()" 
                              onclick="openBridgeModal('cau_thu')">
                            <i class="fa-solid fa-calendar-week mr-1"></i> Cầu Theo Thứ (${wm.dow} - ${wm.province}) <i class="fa-solid fa-circle-question text-[10px]"></i>:
                        </span>
                        ${weeklyStatusHtml}
                    </div>
                    <div class="flex items-center gap-3 mt-1">
                        <span class="text-xl font-black font-mono text-yellow-400 bg-black px-3 py-0.5 rounded border border-yellow-800">${wm.pair}</span>
                        <span class="text-xs text-neutral-300">Cặp số chủ lực của ${wm.dow} (độ ổn định ${wm.stability_pct}%)</span>
                    </div>
                `;
            } else {
                weeklyBox.innerHTML = '<span class="text-xs text-neutral-500 italic">Cầu theo thứ: Chưa đủ dữ liệu tuần.</span>';
            }

            // 15 Modules List
            const modContainer = document.getElementById('single-pred-modules-list');
            const modules = ev.modules || [];
            modContainer.innerHTML = modules.map(m => {
                const isHit = m.is_hit;
                const hasPair = !!m.pair;
                let badge;
                if (isPending) {
                    badge = hasPair ? `<span class="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 font-bold text-[10px]"><i class="fa-solid fa-satellite-dish mr-1"></i>ĐANG BÁO CẦU</span>` : `<span class="text-neutral-500 text-[10px] italic">Không có số</span>`;
                } else {
                    badge = hasPair ? (
                        isHit ? `<span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold text-[10px]"><i class="fa-solid fa-check"></i> TRÚNG ${m.hits}N</span>` :
                                `<span class="px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700 font-medium text-[10px]">TRƯỢT</span>`
                    ) : '<span class="text-neutral-500 text-[10px] italic">Không có số</span>';
                }

                const itemBorder = isPending && hasPair ? 'border-amber-800/80 bg-amber-950/20' : (isHit ? 'border-emerald-800/80 bg-emerald-950/20' : 'border-neutral-800');

                return `
                    <div class="bg-neutral-900 p-2.5 rounded-lg border ${itemBorder} flex items-center justify-between text-xs">
                        <div class="flex items-center gap-2">
                            <span class="bridge-info-trigger font-bold text-white cursor-pointer hover:text-yellow-400 transition"
                                  data-bridge="${m.key}"
                                  onmouseenter="showBridgeTooltip(event, '${m.key}')"
                                  onmouseleave="hideBridgeTooltip()"
                                  onclick="openBridgeModal('${m.key}')">
                                ${m.name}
                                <i class="fa-solid fa-circle-question text-neutral-500 hover:text-yellow-400 text-[10px] ml-1"></i>
                            </span>
                            ${hasPair ? `<span class="font-mono font-bold px-2 py-0.5 rounded bg-black text-yellow-400 border border-neutral-700">${m.pair}</span>` : ''}
                            <span class="text-[10px] text-neutral-400">Điểm: ${m.score}</span>
                        </div>
                        <div>${badge}</div>
                    </div>
                `;
            }).join('');

            // Actual Draw Card
            document.getElementById('single-actual-header').innerText = `XSMB ${data.day_of_week} - ${data.date_display}`;
            const deBadge = document.getElementById('single-actual-de-badge');
            const drawCardContainer = document.getElementById('single-actual-draw-card');

            if (isPending) {
                deBadge.innerHTML = `Giải ĐB: <span class="text-amber-400 italic font-semibold">Chờ mở thưởng lúc 18h15 - 18h30</span>`;
                drawCardContainer.innerHTML = `
                    <div class="p-8 text-center border border-dashed border-amber-600/50 rounded-xl bg-amber-950/20 my-4">
                        <i class="fa-solid fa-satellite-dish text-amber-400 text-4xl mb-3 animate-bounce"></i>
                        <h4 class="text-amber-300 font-bold text-base mb-1">Kỳ quay hôm nay (${data.date_display}) đang chờ mở thưởng</h4>
                        <p class="text-neutral-400 text-xs max-w-md mx-auto leading-relaxed">
                            Kết quả XSMB trực tiếp sẽ được cập nhật từ 18h15 đến 18h30. Dàn số dự đoán của các thuật toán đã sẵn sàng ở bảng bên trái. Sau khi có kết quả, hệ thống sẽ tự động đối chiếu số trúng và nháy ăn ngay lập tức.
                        </p>
                    </div>
                `;
            } else {
                deBadge.innerHTML = `Giải ĐB: <b class="text-red-500 font-mono">${act.special_prize || '-'}</b> → Đề: <b class="text-yellow-400 font-mono">${act.de || '-'}</b>`;
                drawCardContainer.innerHTML = createDrawCard(act);

                // Auto highlight the predicted pairs on the rendered card!
                if (chot.pair) {
                    document.querySelectorAll('#single-actual-draw-card .loto-target, #single-actual-draw-card .loto-chip').forEach(el => {
                        const tail = el.dataset.tail || el.dataset.pair;
                        if (tail === chot.pair) {
                            el.classList.add('highlight-active');
                        }
                    });
                }
            }
        }

        // =========================================================================
        // JAVASCRIPT CHO MODULE PHÂN TÍCH & GỢI Ý XIÊN 2, XIÊN 3
        // =========================================================================
        let xienCache = null;
        let currentXienDow = null;
        let currentXienFilter = 'all';

        async function loadXienData(forceReload = false) {
            const convGrid = document.getElementById('convergence-xien-grid');
            if (forceReload || !xienCache || (currentXienDow && currentXienDow !== xienCache.target_dow)) {
                if (convGrid) {
                    convGrid.innerHTML = `
                        <div class="col-span-full py-8 text-center text-neutral-400">
                            <i class="fa-solid fa-spinner fa-spin text-2xl text-yellow-400 mb-2 block"></i>
                            <span>Đang phân tích và hội tụ dữ liệu xiên từ các nguồn...</span>
                        </div>
                    `;
                }
                try {
                    const url = currentXienDow ? `/api/xien-suggestions?dow=${encodeURIComponent(currentXienDow)}` : '/api/xien-suggestions';
                    const res = await fetch(url);
                    const data = await res.json();
                    if (data.status !== 'SUCCESS') {
                        if (convGrid) convGrid.innerHTML = `<div class="col-span-full text-center text-red-400 p-4">Không thể tải dữ liệu xiên: ${data.message || 'Lỗi không xác định'}</div>`;
                        return;
                    }
                    xienCache = data;
                    renderAllXienViews(data);
                } catch(e) {
                    console.error("Lỗi khi tải gợi ý xiên:", e);
                    if (convGrid) convGrid.innerHTML = `<div class="col-span-full text-center text-red-400 p-4">Lỗi kết nối khi tải gợi ý xiên.</div>`;
                }
            } else {
                renderAllXienViews(xienCache);
            }
        }

        function renderAllXienViews(data) {
            if (!data) return;

            // 1. Render Convergence Box (Khối Tâm Điểm Đột Phá)
            const convGrid = document.getElementById('convergence-xien-grid');
            if (convGrid) {
                const convCards = [...(data.convergence.xien2 || []), ...(data.convergence.xien3 || [])];
                if (convCards.length > 0) {
                    convGrid.innerHTML = convCards.map(x => renderXienCard(x)).join('');
                } else {
                    convGrid.innerHTML = `<div class="col-span-full text-center text-neutral-400 p-4 italic">Đang tổng hợp các bộ xiên hội tụ...</div>`;
                }
            }

            // 2. Populate Dropdown Thứ
            const dowSelect = document.getElementById('xien-dow-select');
            if (dowSelect && data.available_dows) {
                dowSelect.innerHTML = data.available_dows.map(d => `
                    <option value="${d.dow}" ${d.dow === data.target_dow ? 'selected' : ''}>${d.dow} (${d.province})</option>
                `).join('');
            }

            // 3. Render 23 Modules Xiên
            const modCol2 = document.getElementById('xien-modules23-col2');
            const modCol3 = document.getElementById('xien-modules23-col3');
            if (modCol2 && data.modules23) {
                modCol2.innerHTML = (data.modules23.xien2 || []).map(x => renderXienCard(x)).join('') || '<div class="text-neutral-500 text-xs italic p-2">Không có xiên 2</div>';
            }
            if (modCol3 && data.modules23) {
                modCol3.innerHTML = (data.modules23.xien3 || []).map(x => renderXienCard(x)).join('') || '<div class="text-neutral-500 text-xs italic p-2">Không có xiên 3</div>';
            }

            // Khối xiên nhúng trong tab Phân Tích Cầu Ngắn Hạn (sec-analyzer)
            const analyzerGrid = document.getElementById('analyzer-xien-grid');
            if (analyzerGrid && data.modules23) {
                const sampleCards = [
                    ...(data.modules23.xien2 || []).slice(0, 2),
                    ...(data.modules23.xien3 || []).slice(0, 2)
                ];
                analyzerGrid.innerHTML = sampleCards.map(x => renderXienCard(x)).join('') || '<div class="col-span-full text-neutral-500 text-xs italic p-2">Đang tải gợi ý xiên...</div>';
            }

            // 4. Render Weekly Xiên
            const weekTitle = document.getElementById('xien-weekly-header-title');
            const weekDesc = document.getElementById('xien-weekly-header-desc');
            if (weekTitle && data.weekly) {
                weekTitle.innerText = `GỢI Ý XIÊN THEO CẦU ${data.weekly.dow.toUpperCase()} (${data.weekly.province.toUpperCase()})`;
            }
            if (weekDesc && data.weekly) {
                weekDesc.innerText = data.weekly.description;
            }

            const weekCol2 = document.getElementById('xien-weekly-col2');
            const weekCol3 = document.getElementById('xien-weekly-col3');
            if (weekCol2 && data.weekly) {
                weekCol2.innerHTML = (data.weekly.xien2 || []).map(x => renderXienCard(x)).join('') || '<div class="text-neutral-500 text-xs italic p-2">Không có xiên 2</div>';
            }
            if (weekCol3 && data.weekly) {
                weekCol3.innerHTML = (data.weekly.xien3 || []).map(x => renderXienCard(x)).join('') || '<div class="text-neutral-500 text-xs italic p-2">Không có xiên 3</div>';
            }

            // Khối xiên nhúng trong tab Cầu Theo Tuần (sec-weekly)
            const weeklyGrid = document.getElementById('weekly-xien-grid');
            if (weeklyGrid && data.weekly) {
                const sampleWeekly = [
                    ...(data.weekly.xien2 || []).slice(0, 2),
                    ...(data.weekly.xien3 || []).slice(0, 2)
                ];
                weeklyGrid.innerHTML = sampleWeekly.map(x => renderXienCard(x)).join('') || '<div class="col-span-full text-neutral-500 text-xs italic p-2">Đang tải gợi ý xiên...</div>';
            }

            // 5. Render Stats 60 Xiên
            const statsCol2 = document.getElementById('xien-stats60-col2');
            const statsCol3 = document.getElementById('xien-stats60-col3');
            if (statsCol2 && data.stats60) {
                statsCol2.innerHTML = (data.stats60.xien2 || []).map(x => renderXienCard(x)).join('') || '<div class="text-neutral-500 text-xs italic p-2">Không có xiên 2</div>';
            }
            if (statsCol3 && data.stats60) {
                statsCol3.innerHTML = (data.stats60.xien3 || []).map(x => renderXienCard(x)).join('') || '<div class="text-neutral-500 text-xs italic p-2">Không có xiên 3</div>';
            }

            // Khối bảng nhúng trong tab Thống Kê 60 Ngày (sec-stats)
            const sList2 = document.getElementById('stats-xien2-list');
            const sList3 = document.getElementById('stats-xien3-list');
            if (sList2 && data.stats60) {
                sList2.innerHTML = (data.stats60.xien2 || []).slice(0, 5).map(x => `
                    <div class="flex flex-wrap justify-between items-center p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-yellow-500/50 transition">
                        <div class="flex items-center gap-2">
                            <span onclick="viewXienOnKQXS(${JSON.stringify(x.numbers).replace(/"/g, '&quot;')})" class="font-mono font-black text-yellow-400 text-sm bg-black px-2.5 py-1 rounded border border-neutral-700 cursor-pointer hover:border-yellow-400 transition" title="Bấm để xem trên KQXS">
                                ${x.display}
                            </span>
                            <span class="text-xs text-neutral-400">Về <b class="text-emerald-400">${x.hits_60}</b> lần (${x.rate_pct}%)</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <button onclick="viewXienOnKQXS(${JSON.stringify(x.numbers).replace(/"/g, '&quot;')})" class="px-2 py-0.5 bg-red-700 hover:bg-red-600 text-white rounded text-[11px] font-bold transition">
                                <i class="fa-solid fa-bullseye"></i>
                            </button>
                            <button onclick="copyXienText('${x.display}')" class="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[11px] font-bold border border-neutral-700 transition">
                                <i class="fa-regular fa-copy"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
            }
            if (sList3 && data.stats60) {
                sList3.innerHTML = (data.stats60.xien3 || []).slice(0, 4).map(x => `
                    <div class="flex flex-wrap justify-between items-center p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-purple-500/50 transition">
                        <div class="flex items-center gap-2">
                            <span onclick="viewXienOnKQXS(${JSON.stringify(x.numbers).replace(/"/g, '&quot;')})" class="font-mono font-black text-purple-300 text-sm bg-black px-2.5 py-1 rounded border border-neutral-700 cursor-pointer hover:border-purple-400 transition" title="Bấm để xem trên KQXS">
                                ${x.display}
                            </span>
                            <span class="text-xs text-neutral-400">Về <b class="text-purple-400">${x.hits_60}</b> lần (${x.rate_pct}%)</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <button onclick="viewXienOnKQXS(${JSON.stringify(x.numbers).replace(/"/g, '&quot;')})" class="px-2 py-0.5 bg-red-700 hover:bg-red-600 text-white rounded text-[11px] font-bold transition">
                                <i class="fa-solid fa-bullseye"></i>
                            </button>
                            <button onclick="copyXienText('${x.display}')" class="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[11px] font-bold border border-neutral-700 transition">
                                <i class="fa-regular fa-copy"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        }

        function renderXienCard(xien) {
            const isX3 = xien.type === 'xien3';
            const borderClass = isX3 ? 'border-purple-700/60 hover:border-purple-400' : 'border-yellow-600/60 hover:border-yellow-400';
            const badgeBg = isX3 ? 'bg-purple-950 text-purple-300 border-purple-800' : 'bg-yellow-950 text-yellow-300 border-yellow-800';
            const numbersJson = JSON.stringify(xien.numbers).replace(/"/g, '&quot;');
            
            const numbersDisplay = xien.numbers.map(n => `
                <span onclick="switchTab('days10'); toggleHighlight('${n}')" class="px-3 py-1.5 rounded-lg bg-neutral-950 text-yellow-400 font-mono font-black text-2xl border border-yellow-500/40 shadow cursor-pointer hover:scale-110 hover:border-yellow-400 transition" title="Bấm để xem highlight số ${n} trên bảng kết quả">
                    ${n}
                </span>
            `).join('<span class="text-neutral-500 font-bold px-1.5 text-lg">+</span>');

            return `
                <div class="bg-neutral-900/90 rounded-2xl p-4 md:p-5 border-2 ${borderClass} shadow-xl space-y-3 flex flex-col justify-between transition hover:shadow-2xl">
                    <div>
                        <div class="flex flex-wrap justify-between items-start gap-2 mb-2">
                            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase font-mono border ${badgeBg} shadow">
                                ${xien.badge || (isX3 ? 'XIÊN 3' : 'XIÊN 2')}
                            </span>
                            <div class="flex items-center gap-1.5 text-xs bg-black px-2.5 py-0.5 rounded-full border border-neutral-800">
                                <span class="text-neutral-400">Điểm:</span>
                                <span class="font-black font-mono ${xien.score >= 90 ? 'text-emerald-400' : 'text-yellow-400'}">${xien.score}/100</span>
                            </div>
                        </div>

                        <!-- Cặp số to rõ rực rỡ -->
                        <div class="py-3 flex items-center justify-center gap-2 bg-black/80 rounded-xl border border-neutral-800 my-2 shadow-inner">
                            ${numbersDisplay}
                        </div>

                        <!-- Lời giải thích & bảo chứng cầu -->
                        <p class="text-xs text-neutral-300 leading-relaxed font-sans mt-2">
                            ${xien.reason}
                        </p>
                    </div>

                    <div class="pt-3 border-t border-neutral-800 flex flex-wrap justify-between items-center gap-2 text-xs">
                        <div class="text-[11px] text-neutral-400">
                            ${xien.hits_60 !== undefined ? `<i class="fa-solid fa-fire text-amber-400 mr-1"></i>Về cùng nhau <b>${xien.hits_60}</b> lần (60 kỳ)` : ''}
                            ${xien.dow_hits !== undefined ? ` • <b>${xien.dow_hits}</b> kỳ ${xien.dow}` : ''}
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="viewXienOnKQXS(${numbersJson})" class="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow" title="Xem vị trí xuất hiện trên bảng KQXS">
                                <i class="fa-solid fa-bullseye text-[11px]"></i> Xem Trên KQXS
                            </button>
                            <button onclick="copyXienText('${xien.display}')" class="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold rounded-lg text-xs border border-neutral-700 transition flex items-center gap-1" title="Sao chép bộ số này">
                                <i class="fa-regular fa-copy text-[11px]"></i> Chép
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        function filterXienSource(source) {
            currentXienFilter = source;
            document.querySelectorAll('.xfilter-btn').forEach(b => {
                b.classList.remove('bg-red-700', 'text-white', 'shadow');
                b.classList.add('bg-neutral-800', 'text-neutral-400');
            });
            const activeBtn = document.getElementById('xfilter-' + source);
            if (activeBtn) {
                activeBtn.classList.remove('bg-neutral-800', 'text-neutral-400');
                activeBtn.classList.add('bg-red-700', 'text-white', 'shadow');
            }

            const secMods = document.getElementById('xien-sec-modules23');
            const secWeekly = document.getElementById('xien-sec-weekly');
            const secStats = document.getElementById('xien-sec-stats60');
            const secCustom = document.getElementById('xien-sec-custom');
            const dowWrap = document.getElementById('xien-dow-select-wrap');

            if (source === 'all') {
                if (secMods) secMods.classList.remove('hidden');
                if (secWeekly) secWeekly.classList.remove('hidden');
                if (secStats) secStats.classList.remove('hidden');
                if (secCustom) secCustom.classList.remove('hidden');
                if (dowWrap) dowWrap.classList.remove('hidden');
            } else if (source === 'modules23') {
                if (secMods) secMods.classList.remove('hidden');
                if (secWeekly) secWeekly.classList.add('hidden');
                if (secStats) secStats.classList.add('hidden');
                if (secCustom) secCustom.classList.add('hidden');
                if (dowWrap) dowWrap.classList.add('hidden');
            } else if (source === 'weekly') {
                if (secMods) secMods.classList.add('hidden');
                if (secWeekly) secWeekly.classList.remove('hidden');
                if (secStats) secStats.classList.add('hidden');
                if (secCustom) secCustom.classList.add('hidden');
                if (dowWrap) dowWrap.classList.remove('hidden');
            } else if (source === 'stats60') {
                if (secMods) secMods.classList.add('hidden');
                if (secWeekly) secWeekly.classList.add('hidden');
                if (secStats) secStats.classList.remove('hidden');
                if (secCustom) secCustom.classList.add('hidden');
                if (dowWrap) dowWrap.classList.add('hidden');
            } else if (source === 'custom') {
                if (secMods) secMods.classList.add('hidden');
                if (secWeekly) secWeekly.classList.add('hidden');
                if (secStats) secStats.classList.add('hidden');
                if (secCustom) secCustom.classList.remove('hidden');
                if (dowWrap) dowWrap.classList.add('hidden');
            }
        }

        function changeWeeklyXienDow(dow) {
            currentXienDow = dow;
            loadXienData(true);
        }

        async function checkCustomXienInput() {
            const input = document.getElementById('customXienInput');
            const resultBox = document.getElementById('customXienResult');
            if (!input || !resultBox) return;

            const val = input.value.trim();
            if (!val) {
                alert("Vui lòng nhập 2 hoặc 3 cặp số loto để kiểm tra (ví dụ: 34, 43 hoặc 40 47 34).");
                return;
            }

            resultBox.classList.remove('hidden');
            resultBox.innerHTML = `
                <div class="p-6 bg-black rounded-xl border border-neutral-800 text-center text-neutral-400">
                    <i class="fa-solid fa-spinner fa-spin text-xl text-yellow-400 mb-2 block"></i>
                    <span>Đang rà soát ma trận 60 kỳ và đối chiếu 23 modules...</span>
                </div>
            `;

            try {
                const res = await fetch(`/api/check-xien?numbers=${encodeURIComponent(val)}`);
                const data = await res.json();
                if (data.status !== 'SUCCESS') {
                    resultBox.innerHTML = `
                        <div class="p-4 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-sm">
                            <i class="fa-solid fa-triangle-exclamation mr-2"></i> ${data.message}
                        </div>
                    `;
                    return;
                }

                const numbersJson = JSON.stringify(data.numbers).replace(/"/g, '&quot;');
                const verdictClass = data.score >= 80 ? 'text-emerald-400' : (data.score >= 60 ? 'text-yellow-400' : 'text-red-400');
                const verdictBadge = data.score >= 80 ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : (data.score >= 60 ? 'bg-yellow-950 text-yellow-400 border-yellow-800' : 'bg-red-950 text-red-400 border-red-800');

                resultBox.innerHTML = `
                    <div class="bg-black border-2 border-neutral-700 rounded-xl p-5 space-y-4 shadow-xl">
                        <div class="flex flex-wrap justify-between items-center gap-2 border-b border-neutral-800 pb-3">
                            <div class="flex items-center gap-2">
                                <span class="px-3 py-1 rounded text-xs font-black uppercase font-mono border ${verdictBadge}">
                                    ${data.type} • ${data.verdict}
                                </span>
                                <span class="text-xs text-neutral-400">Điểm tiềm năng: <b class="font-mono text-sm ${verdictClass}">${data.score}/100</b></span>
                            </div>
                            <div class="flex items-center gap-2">
                                <button onclick="viewXienOnKQXS(${numbersJson})" class="px-3 py-1 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg text-xs transition flex items-center gap-1 shadow">
                                    <i class="fa-solid fa-bullseye"></i> Xem trên KQXS
                                </button>
                                <button onclick="copyXienText('${data.display}')" class="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold rounded-lg text-xs border border-neutral-700 transition flex items-center gap-1">
                                    <i class="fa-regular fa-copy"></i> Chép
                                </button>
                            </div>
                        </div>

                        <!-- Các quả bóng số -->
                        <div class="flex items-center justify-center gap-2 py-3 bg-neutral-950 rounded-xl border border-neutral-800">
                            ${data.numbers.map(n => `
                                <span class="px-3.5 py-1.5 rounded-lg bg-black text-yellow-400 font-mono font-black text-2xl border border-yellow-500/50 shadow">
                                    ${n}
                                </span>
                            `).join('<span class="text-neutral-500 font-bold px-1">+</span>')}
                        </div>

                        <!-- Chi tiết chỉ số -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div class="bg-neutral-900 p-3 rounded-lg border border-neutral-800 space-y-1">
                                <span class="text-neutral-400 block font-semibold">Tần suất cùng về trong 60 kỳ:</span>
                                <span class="text-sm font-black text-white">${data.co_hits} lần (${data.rate_pct}%)</span>
                                ${data.co_dates.length > 0 ? `
                                    <div class="text-[11px] text-neutral-400 pt-1">
                                        Gần nhất: ${data.co_dates.slice(0, 3).map(d => `${d.day_of_week} ${d.date}`).join(', ')}
                                    </div>
                                ` : '<div class="text-[11px] text-neutral-500 italic">Chưa từng cùng nổ trong 60 kỳ này</div>'}
                            </div>

                            <div class="bg-neutral-900 p-3 rounded-lg border border-neutral-800 space-y-1">
                                <span class="text-neutral-400 block font-semibold">Số ngày chưa về (Lô Gan):</span>
                                <div class="flex flex-wrap gap-2 pt-1">
                                    ${data.numbers.map(n => {
                                        const g = data.gan_dict[n];
                                        const isGan = g >= 12;
                                        return `<span class="px-2 py-0.5 rounded font-mono text-[11px] font-bold ${isGan ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-neutral-800 text-neutral-200'}">Số ${n}: ${g === 0 ? 'Hôm qua vừa ra' : `${g} ngày chưa ra`}</span>`;
                                    }).join('')}
                                </div>
                            </div>
                        </div>

                        <!-- Cảnh báo nếu có -->
                        ${data.warnings && data.warnings.length > 0 ? `
                            <div class="p-3 bg-red-950/70 border border-red-800 rounded-lg text-xs text-red-300 space-y-1">
                                ${data.warnings.map(w => `<div><i class="fa-solid fa-triangle-exclamation mr-1.5 text-red-400"></i>${w}</div>`).join('')}
                            </div>
                        ` : ''}

                        <!-- Đánh giá & Khuyên dùng -->
                        <div class="p-3 bg-neutral-900 rounded-lg border border-neutral-800 text-xs text-neutral-300 space-y-1">
                            <span class="text-yellow-400 font-bold block">💡 Lời khuyên phân tích:</span>
                            <p class="leading-relaxed">${data.advice}</p>
                        </div>
                    </div>
                `;
            } catch(e) {
                console.error("Lỗi khi kiểm tra xiên:", e);
                resultBox.innerHTML = `<div class="p-4 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-sm">Có lỗi xảy ra khi kiểm tra bộ xiên.</div>`;
            }
        }

        function clearCustomXien() {
            const input = document.getElementById('customXienInput');
            const resultBox = document.getElementById('customXienResult');
            if (input) input.value = '';
            if (resultBox) {
                resultBox.innerHTML = '';
                resultBox.classList.add('hidden');
            }
        }

        function viewXienOnKQXS(numbers) {
            if (!numbers || numbers.length === 0) return;
            switchTab('days10');
            clearHighlightWithoutSummary();

            // Highlight các chip trong number picker grid
            numbers.forEach(p => {
                const activePicker = document.getElementById('picker-' + p);
                if (activePicker) {
                    activePicker.classList.remove('bg-neutral-900', 'text-neutral-200');
                    activePicker.classList.add('bg-yellow-400', 'text-black', 'ring-2', 'ring-yellow-300', 'scale-110');
                }
            });

            let matchedDrawsCount = 0;
            const matchedDrawDates = [];

            const drawCards = document.querySelectorAll('#draws-grid > div');
            drawCards.forEach(card => {
                const dateHeader = card.querySelector('h3');
                const dateMatch = dateHeader ? dateHeader.innerText.match(/(\d{2}\/\d{2}\/\d{4})/) : null;
                const dateStr = dateMatch ? dateMatch[1] : '';

                const cardTails = new Set();
                card.querySelectorAll('.loto-target, .loto-chip').forEach(el => {
                    const tail = el.dataset.tail || el.dataset.pair;
                    if (tail) cardTails.add(tail);
                    if (numbers.includes(tail)) {
                        el.classList.add('highlight-active');
                    }
                });

                const allHit = numbers.every(n => cardTails.has(n));
                if (allHit) {
                    matchedDrawsCount++;
                    if (dateStr) matchedDrawDates.push(dateStr);
                    card.classList.add('ring-4', 'ring-emerald-500', 'shadow-2xl');
                    let winBadge = card.querySelector('.xien-win-badge');
                    if (!winBadge) {
                        winBadge = document.createElement('div');
                        winBadge.className = 'xien-win-badge bg-gradient-to-r from-emerald-600 to-green-700 text-white font-black text-xs px-3 py-1.5 rounded-t-lg flex items-center justify-between shadow';
                        winBadge.innerHTML = `<span><i class="fa-solid fa-trophy mr-1 text-yellow-300"></i> TRÚNG XIÊN ${numbers.length}: <b>${numbers.join(' - ')}</b> CÙNG NỔ!</span> <span class="bg-black/40 px-2 py-0.5 rounded text-[10px]">${dateStr}</span>`;
                        card.prepend(winBadge);
                    }
                }
            });

            const summaryEl = document.getElementById('highlightSummary');
            if (summaryEl) {
                summaryEl.classList.remove('hidden');
                summaryEl.innerHTML = `🎯 Bộ Xiên <b>[${numbers.join(' - ')}]</b>: Đã cùng nổ <b>${matchedDrawsCount}</b> lần trong ${displayedCount} ngày ${matchedDrawDates.length > 0 ? `(${matchedDrawDates.join(', ')})` : '(chưa cùng về trong các ngày đang hiển thị)'}`;
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function copyXienText(text) {
            navigator.clipboard.writeText(text).then(() => {
                showToast(`Đã sao chép bộ số: <b>${text}</b> vào bộ nhớ tạm!`);
            }).catch(() => {
                showToast(`Bộ số: <b>${text}</b>`);
            });
        }

        function showToast(msg) {
            const toast = document.getElementById('toast-msg');
            const toastText = document.getElementById('toast-text');
            if (!toast) return;
            if (toastText) toastText.innerHTML = msg;
            toast.classList.remove('translate-y-20', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');
            setTimeout(() => {
                toast.classList.remove('translate-y-0', 'opacity-100');
                toast.classList.add('translate-y-20', 'opacity-0');
            }, 2600);
        }

        // =========================================================================
        // JAVASCRIPT CHO MODULE CẦU TỔNG NGÀY & BẢNG THỐNG KÊ KẾT QUẢ ĐÃ XẢY RA
        // =========================================================================
        let dateSumData = null;
        let currentDateSumFilter = 'all';

        async function loadDateSumData(force = false) {
            const pair1El = document.getElementById('dateSumPair1');
            const pair2El = document.getElementById('dateSumPair2');
            const formulaEl = document.getElementById('dateSumFormulaText');
            const tbody = document.getElementById('dateSumTableBody');

            if (!dateSumData || force) {
                if (tbody) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="8" class="p-8 text-center text-neutral-400">
                                <i class="fa-solid fa-spinner fa-spin text-2xl text-emerald-400 mb-2"></i>
                                <div>Đang tính toán cầu tổng ngày và thống kê lịch sử kết quả...</div>
                            </td>
                        </tr>
                    `;
                }

                try {
                    const res = await fetch('/api/date-sum-bridge');
                    const json = await res.json();
                    if (json.status !== 'SUCCESS') {
                        if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-red-400">${json.message || 'Lỗi tải dữ liệu'}</td></tr>`;
                        return;
                    }
                    dateSumData = json;
                } catch (err) {
                    if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-red-400">Lỗi kết nối máy chủ khi tải Cầu Tổng Ngày: ${err.message}</td></tr>`;
                    return;
                }
            }

            renderDateSumHeroCard();
            renderDateSumTable();
        }

        function renderDateSumHeroCard() {
            if (!dateSumData) return;
            const pred = dateSumData.today_prediction;
            const stats = dateSumData.stats;

            // Target date & pairs
            const targetDateText = document.getElementById('dateSumTargetDateText');
            if (targetDateText) {
                targetDateText.innerHTML = `Kỳ tiếp theo ngày: <b class="text-white font-mono">${pred.target_date_display} (${pred.target_dow})</b>`;
            }

            const p1El = document.getElementById('dateSumPair1');
            const p2El = document.getElementById('dateSumPair2');
            if (p1El) p1El.innerText = pred.pair;
            if (p2El) p2El.innerText = pred.pair_rev;

            const formulaEl = document.getElementById('dateSumFormulaText');
            if (formulaEl) {
                formulaEl.innerHTML = `${pred.formula} &rarr; 2 số cuối: <b class="text-yellow-400">${pred.pair}</b> (Lộn: <b class="text-yellow-400">${pred.pair_rev}</b>)`;
            }

            // Stats badges
            const winRateEl = document.getElementById('dateSumWinRate');
            const winRatioEl = document.getElementById('dateSumWinRatio');
            const totalHitsEl = document.getElementById('dateSumTotalHits');
            const deHitsEl = document.getElementById('dateSumDeHits');
            const maxStreakEl = document.getElementById('dateSumMaxStreak');

            if (winRateEl) winRateEl.innerText = `${stats.win_rate}%`;
            if (winRatioEl) winRatioEl.innerText = `Nổ ${stats.win_count}/${stats.total_tested} ngày`;
            if (totalHitsEl) totalHitsEl.innerText = `${stats.total_hits}`;
            if (deHitsEl) deHitsEl.innerText = `${stats.de_hits}`;
            if (maxStreakEl) maxStreakEl.innerText = `${stats.max_win_streak}`;

            // Count badges
            const countAll = document.getElementById('count-datesum-all');
            const countWin = document.getElementById('count-datesum-win');
            const countDe = document.getElementById('count-datesum-de');
            const countLose = document.getElementById('count-datesum-lose');

            if (countAll) countAll.innerText = stats.total_tested;
            if (countWin) countWin.innerText = stats.win_count;
            if (countDe) countDe.innerText = stats.de_hits;
            if (countLose) countLose.innerText = stats.lose_count;

            // Set default date input to today
            const input = document.getElementById('dateSumCustomInput');
            if (input && !input.value) {
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                input.value = `${yyyy}-${mm}-${dd}`;
            }
        }

        function filterDateSumTable(filter) {
            currentDateSumFilter = filter;
            ['all', 'win', 'de', 'lose'].forEach(f => {
                const btn = document.getElementById('btn-filter-datesum-' + f);
                if (btn) {
                    if (f === filter) {
                        btn.className = 'px-3 py-1.5 rounded-lg font-bold bg-emerald-600 text-white transition shadow';
                    } else {
                        btn.className = 'px-3 py-1.5 rounded-lg font-semibold text-neutral-400 hover:text-white transition';
                    }
                }
            });
            renderDateSumTable();
        }

        function renderDateSumTable() {
            if (!dateSumData || !dateSumData.history) return;
            const tbody = document.getElementById('dateSumTableBody');
            if (!tbody) return;

            let items = dateSumData.history;
            if (currentDateSumFilter === 'win') {
                items = items.filter(x => x.is_win);
            } else if (currentDateSumFilter === 'de') {
                items = items.filter(x => x.is_de);
            } else if (currentDateSumFilter === 'lose') {
                items = items.filter(x => !x.is_win);
            }

            if (items.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" class="p-8 text-center text-neutral-500 italic">
                            Không có kết quả nào phù hợp với bộ lọc hiện tại.
                        </td>
                    </tr>
                `;
                return;
            }

            let html = '';
            items.forEach((item, idx) => {
                const isWin = item.is_win;
                const isDe = item.is_de;

                let rowBg = idx % 2 === 0 ? 'bg-neutral-900/40' : 'bg-black/30';
                if (isDe) {
                    rowBg = 'bg-red-950/25 border-l-4 border-l-red-500';
                } else if (isWin) {
                    rowBg = 'bg-emerald-950/20 border-l-4 border-l-emerald-500';
                }

                // Pairs badges
                const pairChips = item.predicted.map(p => {
                    const hitInItem = item.matched_detail.find(m => m.number === p);
                    const isHit = Boolean(hitInItem);
                    const hitCount = hitInItem ? hitInItem.count : 0;
                    return `
                        <span onclick="switchTab('days10'); toggleHighlight('${p}')" 
                              class="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-black cursor-pointer transition ${isHit ? 'bg-yellow-400 text-black shadow-lg scale-105 ring-1 ring-yellow-300' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}"
                              title="Bấm để xem Highlight trên bảng KQXS">
                            ${p} ${hitCount > 1 ? `<span class="text-[9px] bg-red-600 text-white rounded px-1">${hitCount} nháy</span>` : ''}
                        </span>
                    `;
                }).join(' ');

                // Status badge
                let statusBadge = '';
                if (isDe) {
                    statusBadge = `<span class="inline-flex items-center gap-1 bg-red-600 text-white font-black text-[11px] px-2.5 py-0.5 rounded shadow"><i class="fa-solid fa-trophy text-yellow-300"></i> TRÚNG ĐỀ ĐB</span>`;
                } else if (isWin) {
                    statusBadge = `<span class="inline-flex items-center gap-1 bg-emerald-600 text-white font-bold text-[11px] px-2.5 py-0.5 rounded shadow"><i class="fa-solid fa-circle-check"></i> ĂN LOTO</span>`;
                } else {
                    statusBadge = `<span class="bg-neutral-800 text-neutral-400 font-semibold text-[11px] px-2 py-0.5 rounded">Trượt</span>`;
                }

                // Hits text
                let hitsHtml = `<span class="text-neutral-500 font-bold">0 nháy</span>`;
                if (item.hits > 0) {
                    hitsHtml = `<b class="text-yellow-400 text-sm">${item.hits} nháy</b>`;
                    if (item.matched_detail.length > 0) {
                        const hitDetails = item.matched_detail.map(m => `<span class="text-[10px] text-emerald-300 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-800">${m.number} (${m.count}x)</span>`).join(' ');
                        hitsHtml += `<div class="mt-0.5">${hitDetails}</div>`;
                    }
                }

                // Special prize formatting
                let deDisplay = `<span class="text-neutral-400 font-mono">${item.special_prize || '--'}</span>`;
                if (item.actual_de) {
                    const deNum = item.actual_de;
                    const prefix = item.special_prize.slice(0, -2);
                    if (isDe) {
                        deDisplay = `<span class="font-mono">${prefix}<b class="text-yellow-300 bg-red-600 px-1 py-0.5 rounded shadow">${deNum}</b></span>`;
                    } else {
                        deDisplay = `<span class="font-mono text-neutral-400">${prefix}<b class="text-red-400">${deNum}</b></span>`;
                    }
                }

                html += `
                    <tr class="${rowBg} hover:bg-neutral-800/60 transition">
                        <td class="p-3">
                            <div class="font-bold text-white text-xs">${item.prev_date}</div>
                            <div class="text-[11px] text-neutral-400 font-sans">${item.prev_dow}</div>
                        </td>
                        <td class="p-3">
                            <span class="text-emerald-400 font-mono font-bold text-xs bg-black/60 px-2 py-1 rounded border border-neutral-800">
                                ${item.formula}
                            </span>
                        </td>
                        <td class="p-3 text-center">
                            <div class="flex items-center justify-center gap-1.5">
                                ${pairChips}
                            </div>
                        </td>
                        <td class="p-3">
                            <div class="font-bold text-white text-xs">${item.curr_date}</div>
                            <div class="text-[11px] text-neutral-400 font-sans">${item.curr_dow}</div>
                        </td>
                        <td class="p-3 text-center">
                            ${deDisplay}
                        </td>
                        <td class="p-3 text-center">
                            ${statusBadge}
                        </td>
                        <td class="p-3 text-center">
                            ${hitsHtml}
                        </td>
                        <td class="p-3 text-right">
                            <button onclick="switchTab('days10'); toggleHighlight('${item.predicted[0]}')" 
                                    class="bg-neutral-800 hover:bg-yellow-500 hover:text-black text-neutral-300 text-[11px] font-bold px-2.5 py-1 rounded transition shadow">
                                <i class="fa-solid fa-magnifying-glass mr-1"></i>Xem
                            </button>
                        </td>
                    </tr>
                `;
            });

            tbody.innerHTML = html;
        }

        function calculateCustomDateSum() {
            const input = document.getElementById('dateSumCustomInput');
            const resBox = document.getElementById('customDateSumResult');
            const formulaText = document.getElementById('customDateSumFormula');
            const pairsText = document.getElementById('customDateSumPairs');

            if (!input || !input.value) {
                showToast("Vui lòng chọn một ngày để tính cầu.");
                return;
            }

            const parts = input.value.split('-');
            if (parts.length !== 3) return;

            const yyyy = parseInt(parts[0], 10);
            const mm = parseInt(parts[1], 10);
            const dd = parseInt(parts[2], 10);

            const total = dd + mm + yyyy;
            const p1 = String(total % 100).padStart(2, '0');
            const p2 = p1[1] + p1[0];

            if (resBox && formulaText && pairsText) {
                resBox.classList.remove('hidden');
                formulaText.innerHTML = `${String(dd).padStart(2, '0')} + ${String(mm).padStart(2, '0')} + ${yyyy} = <b>${total}</b>`;
                pairsText.innerHTML = `Song Thủ: <b class="text-yellow-400 bg-neutral-900 px-2 py-0.5 rounded border border-yellow-500/40 cursor-pointer" onclick="switchTab('days10'); toggleHighlight('${p1}')">${p1}</b> - <b class="text-yellow-400 bg-neutral-900 px-2 py-0.5 rounded border border-yellow-500/40 cursor-pointer" onclick="switchTab('days10'); toggleHighlight('${p2}')">${p2}</b> (Bấm để xem KQXS)`;
            }
        }

