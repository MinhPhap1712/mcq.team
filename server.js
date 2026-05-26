const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const cors = require('cors');

const app = express();

// Cho phép giao diện (Vercel) kết nối và tương tác với Server (Render)
app.use(cors());
app.use(express.json());

// Cấu hình multer để đọc file Excel trực tiếp từ bộ nhớ tạm, không lưu rác vào ổ đĩa
const upload = multer({ storage: multer.memoryStorage() });

// 📦 BỘ NHỚ TẠM TOÀN CỤC: Giúp lưu trữ danh sách câu hỏi vĩnh viễn trên server cho đến khi bạn up file mới
let globalQuestionsList = [];

// ==========================================
// 🛠️ API 1: NHẬN FILE EXCEL TỪ ADMIN VÀ LƯU VÀO HỆ THỐNG
// ==========================================
app.post('/api/upload-excel', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Vui lòng chọn một file Excel!' });
        }

        // Đọc dữ liệu thô từ file Excel vừa tải lên
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0]; // Lấy trang tính đầu tiên
        const worksheet = workbook.Sheets[sheetName];
        const rawData = xlsx.utils.sheet_to_json(worksheet);

        if (rawData.length === 0) {
            return res.status(400).json({ success: false, error: 'File Excel trống hoặc sai định dạng!' });
        }

        // Chuẩn hóa dữ liệu thô từ Excel thành cấu trúc JSON chuẩn của hệ thống
        globalQuestionsList = rawData.map((item, index) => ({
            id: index + 1,
            question: item.question || 'Câu hỏi trống',
            options: {
                a: item.a ? String(item.a).trim() : '',
                b: item.b ? String(item.b).trim() : '',
                c: item.c ? String(item.c).trim() : '',
                d: item.d ? String(item.d).trim() : ''
            },
            // Chuyển đáp án đúng thành chữ thường (ví dụ: 'A' -> 'a') để so sánh chính xác
            answer: String(item.answer || '').toLowerCase().trim(),
            media: item.media || null
        }));

        console.log(`[Hệ thống] Đã nạp thành công bộ đề mới với ${globalQuestionsList.length} câu hỏi.`);
        
        return res.json({ 
            success: true, 
            message: 'Tải và lưu câu hỏi lên server thành công!', 
            total: globalQuestionsList.length 
        });

    } catch (error) {
        console.error('Lỗi xử lý file:', error);
        return res.status(500).json({ success: false, error: 'Lỗi xử lý file Excel: ' + error.message });
    }
});

// ==========================================
// 🌐 API 2: TRẢ CÂU HỎI VỀ CHO NGƯỜI LÀM BÀI (KHÔNG CẦN UP FILE)
// ==========================================
app.get('/api/get-questions', (req, res) => {
    // Trả về danh sách câu hỏi đang lưu trong bộ nhớ tạm
    return res.json({ 
        success: true, 
        questions: globalQuestionsList 
    });
});

// Khởi chạy server trên cổng của hệ thống Render cung cấp (Mặc định là 3000 nếu chạy local)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server đang hoạt động ổn định trên cổng: ${PORT}`);
});
