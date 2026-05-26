const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// 📦 Cấu hình để phục vụ file giao diện index.html nằm chung một thư mục
app.use(express.static(path.join(__dirname)));

const upload = multer({ storage: multer.memoryStorage() });
let globalQuestionsList = [];

// API 1: Nhận file Excel
app.post('/api/upload-excel', upload.single('file'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'Vui lòng chọn một file Excel!' });

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = xlsx.utils.sheet_to_json(worksheet);

        if (rawData.length === 0) return res.status(400).json({ success: false, error: 'File Excel trống!' });

        globalQuestionsList = rawData.map((item, index) => ({
            id: index + 1,
            question: item.question || 'Câu hỏi trống',
            options: {
                a: item.a ? String(item.a).trim() : '',
                b: item.b ? String(item.b).trim() : '',
                c: item.c ? String(item.c).trim() : '',
                d: item.d ? String(item.d).trim() : ''
            },
            answer: String(item.answer || '').toLowerCase().trim(),
            media: item.media || null
        }));

        return res.json({ success: true, message: 'Thành công!', total: globalQuestionsList.length });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

// API 2: Lấy câu hỏi
app.get('/api/get-questions', (req, res) => {
    return res.json({ success: true, questions: globalQuestionsList });
});

// Giao diện chính: Khi ai đó vào link Render, nó tự động mở file index.html lên luôn
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server chạy tại cổng: ${PORT}`);
});
