import { copilotStore } from '@/lib/copilot-store';

export const dynamic = 'force-dynamic';

interface FileAttachment {
  name: string;
  size: number;
  type?: string;
  preview?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  AI PROVIDER CONFIGURATION
//  Priority Order: Gemini 3.6 Flash → Groq → NVIDIA DeepSeek Pro → NVIDIA DeepSeek Flash
// ═══════════════════════════════════════════════════════════════════════════════

const PROVIDERS = {
  gemini: {
    name: 'Google Gemini 3.6 Flash',
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
    model: 'gemini-3.6-flash',
    baseUrl: 'https://generativelanguage.googleapis.com',
    style: 'gemini',
  },
  groq: {
    name: 'Groq (GPT-OSS 120B)',
    apiKey: process.env.GROQ_API_KEY || '',
    model: 'openai/gpt-oss-120b',
    baseUrl: 'https://api.groq.com/openai/v1',
    style: 'openai',
  },
  nvidia_pro: {
    name: 'DeepSeek V4 Pro (NVIDIA)',
    apiKey: process.env.NVIDIA_API_KEY_PRO || '',
    model: 'deepseek-ai/deepseek-v4-pro-0813',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    style: 'openai',
  },
  nvidia_flash: {
    name: 'DeepSeek V4 Flash (NVIDIA)',
    apiKey: process.env.NVIDIA_API_KEY_FLASH || '',
    model: 'deepseek-ai/deepseek-v4-flash-0731',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    style: 'openai',
  },
  xai: {
    name: 'xAI Grok',
    apiKey: process.env.XAI_API_KEY || '',
    model: 'grok-beta',
    baseUrl: 'https://api.x.ai/v1',
    style: 'openai',
  },
  openai: {
    name: 'OpenAI GPT-4o-mini',
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
    style: 'openai',
  },
} as const;

type ProviderKey = keyof typeof PROVIDERS;
type ProviderConfig = (typeof PROVIDERS)[ProviderKey];

// ═══════════════════════════════════════════════════════════════════════════════
//  CYBERMIND SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are CYBERMIND AI, an elite autonomous Cybersecurity Intelligence Analyst AI embedded in the CyberMind OS SOC platform.

Your capabilities:
- Answer ANY cybersecurity question with expert-level precision (threat intel, malware analysis, network forensics, SIEM, SOAR, pentest, compliance, CVEs, vendor products)
- Provide factually accurate answers — NEVER give generic placeholder responses
- When asked about specific products/technologies (Zscaler ZIA/ZPA, CrowdStrike Falcon, Splunk, Elastic, Sentinel, Palo Alto, FortiGate, etc.) give correct, detailed explanations
- Analyze uploaded files: PCAPs, Sigma rules, configs, logs, CSV, EVTX
- Map threats to MITRE ATT&CK framework with precise technique IDs
- Generate working Sigma/YARA/Suricata/KQL/SPL/EQL detection rules on request
- Explain vulnerabilities (CVEs), exploits, and mitigations with technical depth

Tone: Professional, precise, security-focused.
Format: Always use Markdown — headers, code blocks, bullet points, tables where appropriate.
CRITICAL: Give REAL, ACCURATE answers. Never fabricate data. Do NOT return generic responses.`;

function shouldFallback(status: number, body: string): boolean {
  return true; // Always failover to next provider on ANY error
}

// ═══════════════════════════════════════════════════════════════════════════════
//  OPENAI-COMPATIBLE STREAMING (Groq, NVIDIA NIM, xAI, OpenAI)
// ═══════════════════════════════════════════════════════════════════════════════

async function* streamOpenAICompat(
  provider: ProviderConfig,
  userMessage: string,
  history: Array<{ role: string; content: string }>,
  attachments: FileAttachment[]
): AsyncGenerator<string> {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: buildUserMessage(userMessage, attachments) },
  ];

  const body: Record<string, unknown> = {
    model: provider.model,
    messages,
    stream: true,
    max_tokens: 4096,
    temperature: 0.7,
    top_p: 0.95,
  };

  if (provider.baseUrl.includes('nvidia')) {
    body.extra_body = { chat_template_kwargs: { thinking: false } };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok || !response.body) {
      const errText = await response.text().catch(() => '');
      throw { status: response.status, body: errText, provider: provider.name };
    }

    const reader = response.body.getReader();
    const dec = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += dec.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.slice(5).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const text = parsed?.choices?.[0]?.delta?.content ?? '';
            if (text) yield text;
          } catch { /* skip malformed */ }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw { status: 504, body: 'Request timed out after 6s', provider: provider.name };
    }
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  GEMINI STREAMING (REST SSE with Alternating Role Sanitization)
// ═══════════════════════════════════════════════════════════════════════════════

async function* streamGemini(
  provider: ProviderConfig,
  userMessage: string,
  history: Array<{ role: string; content: string }>,
  attachments: FileAttachment[]
): AsyncGenerator<string> {
  const url = `${provider.baseUrl}/v1beta/models/${provider.model}:streamGenerateContent?alt=sse`;

  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
  let lastRole = '';

  for (const m of history.slice(-8)) {
    if (!m.content || !m.content.trim()) continue;
    const role: 'user' | 'model' = m.role === 'assistant' ? 'model' : 'user';
    if (role !== lastRole) {
      contents.push({ role, parts: [{ text: m.content }] });
      lastRole = role;
    }
  }

  if (lastRole === 'user' && contents.length > 0) {
    contents.pop();
  }

  contents.push({ role: 'user', parts: [{ text: buildUserMessage(userMessage, attachments) }] });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': provider.apiKey },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens: 4096 },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok || !response.body) {
      const errText = await response.text().catch(() => '');
      throw { status: response.status, body: errText, provider: provider.name };
    }

    const reader = response.body.getReader();
    const dec = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += dec.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.slice(5).trim();
          if (!jsonStr) continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            if (text) yield text;
          } catch { /* skip */ }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw { status: 504, body: 'Request timed out after 6s', provider: provider.name };
    }
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PROVIDER DISPATCH
// ═══════════════════════════════════════════════════════════════════════════════

function streamProvider(
  provider: ProviderConfig,
  userMessage: string,
  history: Array<{ role: string; content: string }>,
  attachments: FileAttachment[]
): AsyncGenerator<string> {
  if (provider.style === 'gemini') {
    return streamGemini(provider, userMessage, history, attachments);
  }
  return streamOpenAICompat(provider, userMessage, history, attachments);
}

function buildUserMessage(userMessage: string, attachments: FileAttachment[]): string {
  if (!attachments || attachments.length === 0) return userMessage;
  const file = attachments[0];
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  let msg = `User uploaded file: "${file.name}" (${(file.size / 1024).toFixed(1)} KB, type: ${ext})\n\n`;
  if (file.preview) {
    msg += `File content preview:\n\`\`\`\n${file.preview.slice(0, 4000)}\n\`\`\`\n\n`;
  }
  msg += `User question: ${userMessage}`;
  return msg;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  POST HANDLER — SSE Streaming Response
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { conversationId, message, modelKey, attachments = [] } = body;

    const userMessageContent =
      message || (attachments.length > 0 ? `Analyze uploaded file: ${attachments[0].name}` : 'Hello');
    const activeConversationId = conversationId || `conv-${Date.now()}`;
    const tenantId = request.headers.get('x-tenant-id') || 'cybermind-master-tenant';
    const userId = request.headers.get('x-user-id') || 'admin@cybermind.local';

    // ── 1. Store user message & get conversation history ─────────────────────
    copilotStore.addMessage(
      activeConversationId,
      {
        role: 'user',
        content: userMessageContent,
        metadata: attachments.length > 0 ? { attachments } : undefined,
      },
      {
        titleIfFirst: attachments.length > 0
          ? `Analysis: ${attachments[0].name}`
          : userMessageContent.slice(0, 60),
        model: 'Auto (Smart Router)',
        modelKey,
        tenantId,
        userId,
      }
    );

    const conv = copilotStore.getConversation(activeConversationId, tenantId, userId);
    const history = (conv?.messages || [])
      .slice(0, -1)
      .map((m: { role: string; content: string }) => ({ role: m.role, content: m.content }));

    // ── 2. Build ordered provider chain (Gemini 3.6 Flash & Groq first) ─────────
    const providerOrder: ProviderKey[] = [
      'gemini', 'groq', 'nvidia_pro', 'nvidia_flash', 'xai', 'openai',
    ];
    const availableProviders = providerOrder.filter((k) => !!PROVIDERS[k].apiKey);

    const encoder = new TextEncoder();

    // ── 3. SSE stream with auto-fallback ─────────────────────────────────────
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: object) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

        send({ type: 'conversation_id', conversationId: activeConversationId });

        let fullText = '';
        let usedProvider = 'offline';
        let success = false;

        for (const key of availableProviders) {
          const provider = PROVIDERS[key];
          try {
            send({ type: 'provider_info', provider: provider.name, model: provider.model });

            for await (const chunk of streamProvider(provider, userMessageContent, history, attachments)) {
              fullText += chunk;
              send({ delta: chunk, done: false, provider: provider.name });
            }

            usedProvider = provider.name;
            success = true;
            break; // Success!

          } catch (err: unknown) {
            const e = err as { status?: number; body?: string };
            const status = e?.status ?? 0;
            const errBody = e?.body ?? '';

            console.error(`[CYBERMIND] ${provider.name} failed (${status}):`, errBody.slice(0, 150));

            send({ type: 'provider_switch', reason: `${provider.name} unavailable — switching to next provider...` });
            continue;
          }
        }

        // ── Fallback output if all providers fail ─────────────────────────────
        if (!success) {
          const errMsg = `### ⚠️ All AI Providers Temporarily Unavailable\n\nPlease try again in a moment.`;

          fullText = errMsg;
          for (const word of errMsg.split(/(\s+)/)) {
            send({ delta: word, done: false });
            await new Promise((r) => setTimeout(r, 8));
          }
        }

        if (fullText) {
          copilotStore.addMessage(activeConversationId, {
            role: 'assistant',
            content: fullText,
            metadata: { model: usedProvider, provider: usedProvider },
          });
        }

        send({ done: true, type: 'done', metadata: { provider: usedProvider } });
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Streaming failure';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
