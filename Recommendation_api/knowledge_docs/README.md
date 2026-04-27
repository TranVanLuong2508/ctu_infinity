# Thư mục tài liệu RAG – CTU Infinity Chatbot

Đặt các file tài liệu quy chế điểm rèn luyện vào thư mục này để nạp vào ChromaDB.

## Định dạng được hỗ trợ
- `.txt` — văn bản thuần túy
- `.md` — markdown

## File PDF/DOCX
Nếu tài liệu gốc dạng PDF hoặc DOCX, hãy copy-paste nội dung ra file `.txt` trước,
sau đó đặt vào thư mục này và chạy ingest script.

## Cách đặt tên file
Nên đặt tên có ý nghĩa để dễ trace trong kết quả RAG:
- `quy_che_drl_2024.txt`
- `tieu_chi_danh_gia_drl.txt`
- `huong_dan_tinh_diem.txt`

## Sau khi thêm tài liệu
Chạy lại ingest script để cập nhật ChromaDB:
```
python scripts/ingest.py
```
