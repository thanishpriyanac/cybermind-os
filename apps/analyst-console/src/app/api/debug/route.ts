export const dynamic = 'force-dynamic';

async function testProvider(name: string, url: string, headers: Record<string, string>, body: object) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const text = await res.text().catch(() => '');
    return {
      provider: name,
      status: res.status,
      ok: res.ok,
      result: res.ok ? '✅ WORKING' : `❌ FAILED — HTTP ${res.status}`,
      error: res.ok ? null : text.slice(0, 300),
    };
  } catch (err: any) {
    clearTimeout(timeout);
    return {
      provider: name,
      status: 0,
      ok: false,
      result: err.name === 'AbortError' ? '❌ TIMEOUT (8s) — Server cannot reach this API' : `❌ ERROR — ${err.message}`,
      error: err.message,
    };
  }
}

export async function GET() {
  const groqKey = process.env.GROQ_API_KEY || '';
  const nvidiaProKey = process.env.NVIDIA_API_KEY_PRO || '';
  const xaiKey = process.env.XAI_API_KEY || '';
  const openaiKey = process.env.OPENAI_API_KEY || '';

  const simpleMsg = [
    { role: 'system', content: 'You are a test assistant.' },
    { role: 'user', content: 'Reply with just: OK' },
  ];

  const results = await Promise.all([
    groqKey
      ? testProvider('Groq Llama 3.3 70B', 'https://api.groq.com/openai/v1/chat/completions',
          { Authorization: `Bearer ${groqKey}` },
          { model: 'llama3-70b-8192', messages: simpleMsg, max_tokens: 5 })
      : Promise.resolve({ provider: 'Groq', status: 0, ok: false, result: '⚠️ KEY NOT SET', error: null }),

    nvidiaProKey
      ? testProvider('NVIDIA DeepSeek R1', 'https://integrate.api.nvidia.com/v1/chat/completions',
          { Authorization: `Bearer ${nvidiaProKey}` },
          { model: 'meta/llama-3.3-70b-instruct', messages: simpleMsg, max_tokens: 5, stream: false })
      : Promise.resolve({ provider: 'NVIDIA Pro', status: 0, ok: false, result: '⚠️ KEY NOT SET', error: null }),

    xaiKey
      ? testProvider('xAI Grok', 'https://api.x.ai/v1/chat/completions',
          { Authorization: `Bearer ${xaiKey}` },
          { model: 'grok-2-1212', messages: simpleMsg, max_tokens: 5 })
      : Promise.resolve({ provider: 'xAI', status: 0, ok: false, result: '⚠️ KEY NOT SET', error: null }),

    openaiKey
      ? testProvider('OpenAI GPT-4o-mini', 'https://api.openai.com/v1/chat/completions',
          { Authorization: `Bearer ${openaiKey}` },
          { model: 'gpt-4o-mini', messages: simpleMsg, max_tokens: 5 })
      : Promise.resolve({ provider: 'OpenAI', status: 0, ok: false, result: '⚠️ KEY NOT SET', error: null }),
  ]);

  const working = results.filter(r => r.ok).length;

  return Response.json({
    summary: working > 0
      ? `🟢 ${working}/${results.length} providers working — Cloud AI is active`
      : `🔴 0/${results.length} providers working — All failing, RAG will answer`,
    results,
    cwd: process.cwd(),
    timestamp: new Date().toISOString(),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
