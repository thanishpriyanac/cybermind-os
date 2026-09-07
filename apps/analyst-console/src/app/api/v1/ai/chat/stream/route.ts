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
//  Priority: NVIDIA DeepSeek Pro → Gemini 3.6 Flash → Groq → NVIDIA DeepSeek Flash → Offline
// ═══════════════════════════════════════════════════════════════════════════════

const PROVIDERS = {
  nvidia_pro: {
    name: 'DeepSeek V4 Pro (NVIDIA)',
    apiKey: process.env.NVIDIA_API_KEY_PRO || '',
    model: 'deepseek-ai/deepseek-v4-pro-0813',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    style: 'openai',
  },
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

const SYSTEM_PROMPT = `You are CYBERMIND Copilot, an elite autonomous Cybersecurity Intelligence Analyst AI embedded in the CyberMind OS SOC platform.

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

// ═══════════════════════════════════════════════════════════════════════════════
//  ERROR CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

function shouldFallback(status: number, body: string): boolean {
  if ([429, 503, 502, 500].includes(status)) return true;
  if (status === 401 || status === 403) return true; // bad key → try next
  const b = body.toLowerCase();
  return (
    b.includes('quota') ||
    b.includes('rate_limit') ||
    b.includes('rate limit') ||
    b.includes('too many requests') ||
    b.includes('overloaded') ||
    b.includes('resource_exhausted') ||
    b.includes('capacity') ||
    b.includes('unavailable')
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  OPENAI-COMPATIBLE STREAMING (NVIDIA NIM / xAI / OpenAI / Groq)
// ═══════════════════════════════════════════════════════════════════════════════

async function* streamOpenAICompat(
  provider: ProviderConfig,
  userMessage: string,
  history: Array<{ role: string; content: string }>,
  attachments: FileAttachment[]
): AsyncGenerator<string> {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-10).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
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

  // NVIDIA-specific: disable thinking mode for faster responses
  if (provider.baseUrl.includes('nvidia')) {
    body.extra_body = { chat_template_kwargs: { thinking: false } };
  }

  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify(body),
  });

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
}

// ═══════════════════════════════════════════════════════════════════════════════
//  GEMINI STREAMING (REST SSE)
// ═══════════════════════════════════════════════════════════════════════════════

async function* streamGemini(
  provider: ProviderConfig,
  userMessage: string,
  history: Array<{ role: string; content: string }>,
  attachments: FileAttachment[]
): AsyncGenerator<string> {
  const url = `${provider.baseUrl}/v1beta/models/${provider.model}:streamGenerateContent?alt=sse`;

  const contents = [
    ...history.slice(-10).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: buildUserMessage(userMessage, attachments) }] },
  ];

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
  });

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
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PROVIDER DISPATCH — pick stream function based on style
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

// ═══════════════════════════════════════════════════════════════════════════════
//  HELPER — build user message (with file context if attached)
// ═══════════════════════════════════════════════════════════════════════════════

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
//  MAIN POST HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { conversationId, message, modelKey = 'auto', attachments = [] } = body;

    const userMessageContent =
      message || (attachments.length > 0 ? `Analyze uploaded file: ${attachments[0].name}` : 'Hello');
    const activeConversationId = conversationId || `conv-${Date.now()}`;
    const tenantId = request.headers.get('x-tenant-id') || 'cybermind-master-tenant';
    const userId = request.headers.get('x-user-id') || 'admin@cybermind.local';

    // ── 1. Try backend AI Gateway ONLY if process.env.AI_GATEWAY_URL is explicitly set
    if (process.env.AI_GATEWAY_URL) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 1200);
        const res = await fetch(`${process.env.AI_GATEWAY_URL}/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': tenantId,
            'x-user-id': userId,
            Authorization: request.headers.get('authorization') || '',
          },
          body: JSON.stringify({ conversationId: activeConversationId, message: userMessageContent, modelKey, attachments }),
          signal: ctrl.signal,
        });
        clearTimeout(t);
        if (res.ok && res.body) {
          return new Response(res.body, {
            headers: {
              'Content-Type': 'text/event-stream; charset=utf-8',
              'Cache-Control': 'no-cache, no-transform',
              'Connection': 'keep-alive',
            },
          });
        }
      } catch { /* fallback to local streaming engine */ }
    }

    // ── 2. Store user message & get conversation history ─────────────────────
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

    const conv = copilotStore.getConversation(activeConversationId);
    const history = (conv?.messages || [])
      .slice(0, -1)
      .map((m: { role: string; content: string }) => ({ role: m.role, content: m.content }));

    // ── 3. Build ordered provider chain (only those with API keys) ────────────
    const providerOrder: ProviderKey[] = [
      'nvidia_pro', 'gemini', 'groq', 'nvidia_flash', 'xai', 'openai',
    ];
    const availableProviders = providerOrder.filter((k) => !!PROVIDERS[k].apiKey);

    const encoder = new TextEncoder();

    // ── 4. SSE stream with auto-fallback ─────────────────────────────────────
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: object) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

        // Always emit conversation ID first so frontend binds immediately
        send({ type: 'conversation_id', conversationId: activeConversationId });

        let fullText = '';
        let usedProvider = 'offline';
        let success = false;

        for (const key of availableProviders) {
          const provider = PROVIDERS[key];
          try {
            // Notify frontend which model is active
            send({ type: 'provider_info', provider: provider.name, model: provider.model });

            for await (const chunk of streamProvider(provider, userMessageContent, history, attachments)) {
              fullText += chunk;
              send({ delta: chunk, done: false, provider: provider.name });
            }

            usedProvider = provider.name;
            success = true;
            break; // ✅ Success — stop trying

          } catch (err: unknown) {
            const e = err as { status?: number; body?: string };
            const status = e?.status ?? 0;
            const errBody = e?.body ?? '';

            console.error(`[CYBERMIND] ${provider.name} failed (${status}):`, errBody.slice(0, 150));

            if (shouldFallback(status, errBody)) {
              const reason =
                status === 429
                  ? `${provider.name} rate limit reached`
                  : status === 401 || status === 403
                  ? `${provider.name} auth error`
                  : `${provider.name} unavailable (${status})`;

              send({ type: 'provider_switch', reason: `${reason} — switching to next provider...` });
              continue; // try next
            }
            // Unexpected error → still try next
            send({ type: 'provider_switch', reason: `${provider.name} error — switching...` });
            continue;
          }
        }

        // ── All providers exhausted ───────────────────────────────────────────
        if (!success) {
          const errMsg = availableProviders.length === 0
            ? `### ⚠️ No AI Provider Configured\n\nAdd at least one API key to \`.env.local\` and restart the server.\n\n**Supported providers:**\n- \`NVIDIA_API_KEY_PRO\` — NVIDIA NIM DeepSeek V4 Pro\n- \`XAI_API_KEY\` — xAI Grok\n- \`OPENAI_API_KEY\` — OpenAI GPT-4o\n- \`NVIDIA_API_KEY_FLASH\` — NVIDIA NIM DeepSeek V4 Flash\n- \`GEMINI_API_KEY\` — Google Gemini (free)\n- \`GROQ_API_KEY\` — Groq LLaMA-3 (free)`
            : `### ⚠️ All AI Providers Temporarily Unavailable\n\nAll ${availableProviders.length} configured providers hit rate limits or errors:\n${availableProviders.map((k) => `- **${PROVIDERS[k].name}** (\`${PROVIDERS[k].model}\`)`).join('\n')}\n\nPlease try again in a moment. Rate limits typically reset within 60 seconds.`;

          fullText = errMsg;
          for (const word of errMsg.split(/(\s+)/)) {
            send({ delta: word, done: false });
            await new Promise((r) => setTimeout(r, 8));
          }
        }

        // Persist assistant response
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
