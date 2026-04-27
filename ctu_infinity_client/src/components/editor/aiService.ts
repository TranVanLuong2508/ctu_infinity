import { AIAction } from './types';

export async function callAI(
    prompt: string,
    action: AIAction,
    context?: string,
    onStream?: (chunk: string) => void
): Promise<string> {
    try {
        const response = await fetch('/event-demo/api/ai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt,
                action,
                context,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to get AI response');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        if (!reader) {
            throw new Error('No response body');
        }

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            fullContent += chunk;

            if (onStream) {
                onStream(chunk);
            }
        }

        return fullContent;
    } catch (error) {
        console.error('AI Service Error:', error);
        throw error;
    }
}
