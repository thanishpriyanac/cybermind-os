import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    models: [
      { id: 'auto', name: 'Auto (Smart Router)', provider: 'CyberMind Router' },
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
      { id: 'deepseek-ai/deepseek-v4-flash', name: 'DeepSeek V4 Flash', provider: 'DeepSeek' },
      { id: 'deepseek-ai/deepseek-v4-pro', name: 'DeepSeek V4 Pro', provider: 'DeepSeek' },
      { id: 'grok-2-1212', name: 'Grok 2', provider: 'xAI' },
      { id: 'llama3.1', name: 'Local Llama 3.1', provider: 'Ollama' },
      { id: 'qwen2.5-coder', name: 'Local Qwen 2.5', provider: 'Ollama' },
    ],
  });
}
