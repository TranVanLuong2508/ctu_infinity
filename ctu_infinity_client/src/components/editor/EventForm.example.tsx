'use client';

import { useState } from 'react';
import TiptapEditor from './TiptapEditor';
import EditorViewer from './EditorViewer';

/**
 * VÍ DỤ: Form tạo sự kiện (như hoạt động hiến máu)
 * Component này minh họa cách sử dụng editor và lưu vào DB
 */
export default function EventFormExample() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState(''); // HTML content
    const [isSaving, setIsSaving] = useState(false);
    const [savedEvent, setSavedEvent] = useState<any>(null);

    const handleSave = async () => {
        setIsSaving(true);

        try {
            // 1. Chuẩn bị data để lưu vào database
            const eventData = {
                title: title,
                description: description, // Lưu HTML content
                createdAt: new Date().toISOString(),
            };

            // 2. Gọi API để lưu vào database
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventData),
            });

            const savedData = await response.json();

            // 3. Hiển thị kết quả
            setSavedEvent(savedData);
            alert('Đã lưu sự kiện thành công!');

            // Reset form
            setTitle('');
            setDescription('');
        } catch (error) {
            console.error('Lỗi khi lưu:', error);
            alert('Có lỗi xảy ra khi lưu sự kiện');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Tạo Sự Kiện Mới</h1>

            {/* FORM TẠO SỰ KIỆN */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên sự kiện
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="VD: Ngày hội hiến máu tình nguyện 2024"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mô tả chi tiết
                    </label>

                    {/* TIPTAP EDITOR */}
                    <TiptapEditor
                        placeholder="Nhập mô tả chi tiết về sự kiện, sử dụng AI để cải thiện nội dung..."
                        onChange={(htmlContent) => {
                            // Lưu HTML content vào state
                            setDescription(htmlContent);
                        }}
                    />
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleSave}
                        disabled={!title || !description || isSaving}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSaving ? 'Đang lưu...' : 'Lưu sự kiện'}
                    </button>

                    <button
                        onClick={() => {
                            setTitle('');
                            setDescription('');
                        }}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                        Hủy
                    </button>
                </div>
            </div>

            {/* PREVIEW: HIỂN THỊ NỘI DUNG ĐÃ LƯU */}
            {savedEvent && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-green-800 mb-4">
                        ✅ Sự kiện đã lưu thành công
                    </h2>

                    <div className="bg-white rounded-lg p-4 mb-4">
                        <h3 className="text-xl font-semibold mb-2">
                            {savedEvent.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Ngày tạo: {new Date(savedEvent.createdAt).toLocaleString('vi-VN')}
                        </p>

                        {/* SỬ DỤNG EDITORVIEWER ĐỂ HIỂN THỊ CONTENT */}
                        <EditorViewer content={savedEvent.description} />
                    </div>
                </div>
            )}

            {/* HƯỚNG DẪN */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mt-6">
                <h3 className="text-lg font-bold text-blue-900 mb-3">
                    📚 Hướng dẫn sử dụng
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Nhập tên sự kiện</li>
                    <li>Viết mô tả chi tiết trong editor (có thể dùng AI để cải thiện)</li>
                    <li>Click "Lưu sự kiện" - HTML content sẽ được lưu vào database</li>
                    <li>Khi hiển thị lại, dùng component <code className="bg-blue-100 px-2 py-1 rounded">EditorViewer</code></li>
                </ol>

                <div className="mt-4 p-4 bg-white rounded border border-blue-300">
                    <p className="font-semibold mb-2">📝 Dữ liệu lưu vào database:</p>
                    <pre className="text-sm overflow-x-auto">
                        {`{
  "title": "Ngày hội hiến máu...",
  "description": "<h1>Heading</h1><p>Content...</p>", // HTML
  "createdAt": "2024-01-04T..."
}`}
                    </pre>
                </div>
            </div>
        </div>
    );
}

/**
 * CẤU TRÚC DATABASE ĐỀ XUẤT:
 * 
 * Table: events
 * - id: string (primary key)
 * - title: string
 * - description: text (lưu HTML content)
 * - createdAt: datetime
 * - updatedAt: datetime
 * 
 * 
 * CÁCH SỬ DỤNG TRONG PROJECT:
 * 
 * 1. TẠO SỰ KIỆN (Admin page):
 *    <EventFormExample />
 * 
 * 2. HIỂN THỊ DANH SÁCH SỰ KIỆN (User page):
 *    {events.map(event => (
 *      <div key={event.id}>
 *        <h2>{event.title}</h2>
 *        <EditorViewer content={event.description} />
 *      </div>
 *    ))}
 * 
 * 3. CHI TIẾT SỰ KIỆN:
 *    <EditorViewer content={event.description} />
 */
