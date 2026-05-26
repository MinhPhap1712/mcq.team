const express = require('express');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');

const app = express();
app.use(cors());
app.use(express.json());

// Cấu hình lưu trữ file Excel vào bộ nhớ tạm thời
const upload = multer({ storage: multer.memoryStorage() });

// Đường dẫn API nhận file Excel từ giao diện gửi lên
app.post('/api/upload-excel', upload.single('file'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Vui lòng chọn file Excel!' });

        // Đọc file Excel từ bộ nhớ
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0]; // Lấy sheet đầu tiên trong file
        const worksheet = workbook.Sheets[sheetName];
        
        // Chuyển đổi dữ liệu trong sheet thành mảng JSON để lập trình xử lý được
        const rawData = xlsx.utils.sheet_to_json(worksheet);

        // Chuẩn hóa và quét qua từng hàng dữ liệu
        const questions = rawData.map((row, index) => ({
            id: index + 1,
            question: row.question || row['Câu hỏi'],
            options: {
                a: row.a || row['A'],
                b: row.b || row['B'],
                c: row.c || row['C'],
                d: row.d || row['D']
            },
            answer: (row.answer || row['Đáp án'] || '').toLowerCase().trim(), // chuyển về chữ thường như a, b, c, d
            media: row.media || row['Hình ảnh/Video'] || null
        }));

        // Trả kết quả câu hỏi sạch về cho giao diện hiển thị
        res.json({ success: true, questions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Đã xảy ra lỗi trong quá trình đọc file Excel.' });
    }
});

// Khởi chạy server ở cổng 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy trên cổng: ${PORT}`);
});