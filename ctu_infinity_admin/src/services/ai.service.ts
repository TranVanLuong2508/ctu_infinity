export interface AIGenerateRequest {
  prompt: string;
  context?: string;
  /** Nội dung AI đã tạo trước đó. Khi có, AI sẽ chỉnh sửa nội dung này thay vì tạo mới. */
  previousContent?: string;
}

const SYSTEM_PROMPT = `Bạn là trợ lý viết nội dung tiếng Việt cho Trường Đại học Cần Thơ (CTU).
Nhiệm vụ: Tạo mô tả sự kiện hoặc thông báo bằng định dạng Markdown.

QUY TẮC BẮT BUỘC:
1. Nếu có thông tin sự kiện được cung cấp trong context thì phải đưa đầy đủ vào nội dung.
2. Không bỏ sót các trường như tên sự kiện, địa điểm, thời gian, hạn đăng ký, ban tổ chức, học kỳ, năm học nếu đã được cung cấp.
3. Nếu user đang yêu cầu chỉnh sửa, hãy giữ lại các phần không bị yêu cầu thay đổi.
4. Trình bày rõ ràng bằng heading, bullet list và bold khi cần thiết.
5. KHÔNG được viết tắt, bỏ chữ hoặc thay đổi từ trong nội dung gốc. Giữ nguyên từng chữ cái của các thông tin đã có.
6. Viết đầy đủ dấu câu, không rút gọn bất kỳ từ nào.
7. Nếu cần thêm nội dung mới, viết hoàn chỉnh không thiếu chữ.`;

export const aiService = {
  async generateDescription(
    request: AIGenerateRequest,
    onChunk: (chunk: string) => void,
  ): Promise<void> {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const userContent = request.context
      ? `${request.prompt}\n\n${request.context}`
      : request.prompt;

    // Multi-turn khi refine: AI "nhớ" nội dung nó đã tạo → chỉnh sửa thay vì viết lại
    const messages = request.previousContent
      ? [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'assistant', content: request.previousContent },
          { role: 'user', content: userContent },
        ]
      : [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to call OpenAI API');
    }

    if (!response.body) {
      throw new Error('No response body from OpenAI');
    }

    // Parse SSE stream — collect all deltas first, then join to avoid partial UTF-8 corruption
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete lines only; keep incomplete last line in buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            onChunk(fullText); // emit accumulated text so far
          }
        } catch {
          // skip malformed lines
        }
      }
    }

    // Flush any remaining buffered line
    if (buffer.startsWith('data: ')) {
      const data = buffer.slice(6).trim();
      if (data !== '[DONE]') {
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) onChunk(fullText + delta);
        } catch {
          // ignore
        }
      }
    }
  },
};
