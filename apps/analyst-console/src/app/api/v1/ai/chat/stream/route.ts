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
//  Priority order: Gemini → OpenAI → Anthropic → Groq → Offline
// ═══════════════════════════════════════════════════════════════════════════════

const PROVIDERS = {
  gemini: {
    name: 'Google Gemini',
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
    model: 'gemini-2.0-flash',
  },
  openai: {
    name: 'OpenAI GPT-4o',
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4o-mini',
  },
  anthropic: {
    name: 'Anthropic Claude',
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: 'claude-3-haiku-20240307',
  },
  groq: {
    name: 'Groq LLaMA',
    apiKey: process.env.GROQ_API_KEY || '',
    model: 'llama3-70b-8192',
  },
} as const;

type ProviderKey = keyof typeof PROVIDERS;

// ═══════════════════════════════════════════════════════════════════════════════
//  CYBERMIND SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are CYBERMIND Copilot, an elite autonomous Cybersecurity Intelligence Analyst AI embedded in the CyberMind OS SOC platform.

Your primary functions:
- Answer ANY cybersecurity question with expert precision (threat intel, malware analysis, network forensics, SIEM, SOAR, pentest, compliance, CVEs, vendor products, etc.)
- Provide factually accurate, context-aware answers — NEVER give generic placeholder responses
- When asked about specific products/technologies (e.g. Zscaler ZIA, CrowdStrike Falcon, Splunk, Elastic, Sentinel, Palo Alto, etc.) give correct, detailed explanations
- Analyze uploaded files: PCAPs, Sigma rules, configs, logs, CSV, EVTX files
- Map threats to MITRE ATT&CK framework with precision (technique IDs, tactics, sub-techniques)
- Generate working Sigma/YARA/Suricata detection rules on request
- Provide SIEM query translations: Splunk SPL, Elastic EQL, Microsoft Sentinel KQL
- Explain vulnerabilities (CVEs), exploits, and mitigation steps clearly

Tone: Professional, precise, security-focused.
Format: Always use Markdown — headers, code blocks, bullet points, tables where appropriate.

IMPORTANT: Give REAL, ACCURATE answers. Never fabricate threat data or make up IPs/hashes. If uncertain, say so clearly. Do NOT return generic "moderate risk" responses when a specific factual question is asked.`;

// ═══════════════════════════════════════════════════════════════════════════════
//  RATE LIMIT / ERROR DETECTION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function isRateLimitError(status: number, body: string): boolean {
  if (status === 429) return true;
  if (status === 503) return true;
  const b = body.toLowerCase();
  return (
    b.includes('quota') ||
    b.includes('rate_limit') ||
    b.includes('rate limit') ||
    b.includes('too many requests') ||
    b.includes('overloaded') ||
    b.includes('resource_exhausted')
  );
}

function isAuthError(status: number): boolean {
  return status === 401 || status === 403;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  GEMINI — streaming SSE via REST
// ═══════════════════════════════════════════════════════════════════════════════

async function* streamGemini(
  userMessage: string,
  history: Array<{ role: string; content: string }>,
  attachments: FileAttachment[]
): AsyncGenerator<string> {
  const { apiKey, model } = PROVIDERS.gemini;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  for (const msg of history.slice(-10)) {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    });
  }

  let currentMessage = buildUserMessage(userMessage, attachments);
  contents.push({ role: 'user', parts: [{ text: currentMessage }] });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens: 2048 },
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
    throw { status: response.status, body: errText, provider: 'gemini' };
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
//  OPENAI — streaming SSE via REST
// ═══════════════════════════════════════════════════════════════════════════════

async function* streamOpenAI(
  userMessage: string,
  history: Array<{ role: string; content: string }>,
  attachments: FileAttachment[]
): AsyncGenerator<string> {
  const { apiKey, model } = PROVIDERS.openai;

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-10).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
    { role: 'user', content: buildUserMessage(userMessage, attachments) },
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, stream: true, max_tokens: 2048, temperature: 0.7 }),
  });

  if (!response.ok || !response.body) {
    const errText = await response.text().catch(() => '');
    throw { status: response.status, body: errText, provider: 'openai' };
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
        } catch { /* skip */ }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ANTHROPIC CLAUDE — streaming SSE via REST
// ═══════════════════════════════════════════════════════════════════════════════

async function* streamAnthropic(
  userMessage: string,
  history: Array<{ role: string; content: string }>,
  attachments: FileAttachment[]
): AsyncGenerator<string> {
  const { apiKey, model } = PROVIDERS.anthropic;

  const messages = [
    ...history.slice(-10).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
    { role: 'user', content: buildUserMessage(userMessage, attachments) },
  ];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      system: SYSTEM_PROMPT,
      messages,
      max_tokens: 2048,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    const errText = await response.text().catch(() => '');
    throw { status: response.status, body: errText, provider: 'anthropic' };
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
          if (parsed.type === 'content_block_delta') {
            const text = parsed?.delta?.text ?? '';
            if (text) yield text;
          }
        } catch { /* skip */ }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  GROQ — OpenAI-compatible endpoint (streaming)
// ═══════════════════════════════════════════════════════════════════════════════

async function* streamGroq(
  userMessage: string,
  history: Array<{ role: string; content: string }>,
  attachments: FileAttachment[]
): AsyncGenerator<string> {
  const { apiKey, model } = PROVIDERS.groq;

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-10).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
    { role: 'user', content: buildUserMessage(userMessage, attachments) },
  ];

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, stream: true, max_tokens: 2048, temperature: 0.7 }),
  });

  if (!response.ok || !response.body) {
    const errText = await response.text().catch(() => '');
    throw { status: response.status, body: errText, provider: 'groq' };
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
        } catch { /* skip */ }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PROVIDER REGISTRY — ordered fallback chain
// ═══════════════════════════════════════════════════════════════════════════════

const PROVIDER_CHAIN: Array<{
  key: ProviderKey;
  stream: (msg: string, hist: Array<{ role: string; content: string }>, att: FileAttachment[]) => AsyncGenerator<string>;
}> = [
  { key: 'gemini', stream: streamGemini },
  { key: 'openai', stream: streamOpenAI },
  { key: 'anthropic', stream: streamAnthropic },
  { key: 'groq', stream: streamGroq },
];

// ═══════════════════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function buildUserMessage(userMessage: string, attachments: FileAttachment[]): string {
  if (!attachments || attachments.length === 0) return userMessage;
  const file = attachments[0];
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  let msg = `User uploaded file: "${file.name}" (${(file.size / 1024).toFixed(1)} KB, type: ${ext})\n\n`;
  if (file.preview) {
    msg += `File preview:\n\`\`\`\n${file.preview.slice(0, 4000)}\n\`\`\`\n\n`;
  }
  msg += `User question: ${userMessage}`;
  return msg;
}

function getAvailableProviders(): typeof PROVIDER_CHAIN {
  return PROVIDER_CHAIN.filter((p) => !!PROVIDERS[p.key].apiKey);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN POST HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { conversationId, message, modelKey = 'auto', attachments = [] } = body;

    const userMessageContent = message || (attachments.length > 0 ? `Analyze uploaded file: ${attachments[0].name}` : 'Hello');
    const activeConversationId = conversationId || `conv-${Date.now()}`;
    const tenantId = request.headers.get('x-tenant-id') || 'cybermind-master-tenant';
    const userId = request.headers.get('x-user-id') || 'admin@cybermind.local';

    // ── 1. Try backend AI Gateway first (fastest if running) ────────────────
    const backendEndpoints = [
      process.env.AI_GATEWAY_URL ? `${process.env.AI_GATEWAY_URL}/chat/stream` : null,
      'http://127.0.0.1:3010/api/v1/ai/chat/stream',
      'http://127.0.0.1:3002/api/v1/ai/chat/stream',
    ].filter(Boolean) as string[];

    for (const endpoint of backendEndpoints) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 1200);
        const res = await fetch(endpoint, {
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
            headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', 'Connection': 'keep-alive' },
          });
        }
      } catch { /* offline */ }
    }

    // ── 2. Store user message & get history ─────────────────────────────────
    copilotStore.addMessage(
      activeConversationId,
      { role: 'user', content: userMessageContent, metadata: attachments.length > 0 ? { attachments } : undefined },
      {
        titleIfFirst: attachments.length > 0 ? `Analysis: ${attachments[0].name}` : userMessageContent.slice(0, 60),
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

    // ── 3. Build SSE response with smart provider fallback chain ────────────
    const encoder = new TextEncoder();
    const availableProviders = getAvailableProviders();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: object) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

        // Always emit conversation ID first
        send({ type: 'conversation_id', conversationId: activeConversationId });

        let fullText = '';
        let usedProvider = 'offline';
        let success = false;

        // Try each provider in order
        for (const provider of availableProviders) {
          const providerInfo = PROVIDERS[provider.key];
          try {
            // Notify frontend which provider is being used
            send({ type: 'provider_switch', provider: providerInfo.name, model: providerInfo.model });

            for await (const chunk of provider.stream(userMessageContent, history, attachments)) {
              fullText += chunk;
              send({ delta: chunk, done: false, provider: providerInfo.name });
            }

            usedProvider = providerInfo.name;
            success = true;
            break; // Done — no need to try next provider

          } catch (err: unknown) {
            const e = err as { status?: number; body?: string; provider?: string };
            const status = e?.status ?? 0;
            const body = e?.body ?? '';

            console.error(`[CYBERMIND] Provider ${provider.key} failed — status ${status}:`, body.slice(0, 200));

            // Decide whether to skip to next provider or stop
            if (isRateLimitError(status, body)) {
              // Rate limited → try next provider automatically
              send({
                type: 'provider_switch',
                reason: `${providerInfo.name} rate limit reached — switching to next provider...`,
                fromProvider: providerInfo.name,
              });
              continue;
            }

            if (isAuthError(status)) {
              // Bad API key → try next provider
              send({
                type: 'provider_switch',
                reason: `${providerInfo.name} auth error (invalid key) — switching to next provider...`,
                fromProvider: providerInfo.name,
              });
              continue;
            }

            // Other error (network, server error) → also try next
            send({
              type: 'provider_switch',
              reason: `${providerInfo.name} unavailable — switching to next provider...`,
              fromProvider: providerInfo.name,
            });
            continue;
          }
        }

        // ── All providers exhausted → offline message ──
        if (!success) {
          const noProviderMsg = availableProviders.length === 0
            ? `### ⚠️ No AI Provider Configured\n\nTo enable intelligent responses, add at least one API key to your environment:\n\n\`\`\`env\n# /apps/analyst-console/.env.local\nGEMINI_API_KEY=your_key_here      # Free at aistudio.google.com\nOPENAI_API_KEY=your_key_here      # platform.openai.com\nANTHROPIC_API_KEY=your_key_here   # console.anthropic.com\nGROQ_API_KEY=your_key_here        # console.groq.com (free)\n\`\`\`\n\nRestart the server after setting keys.`
            : `### ⚠️ All AI Providers Temporarily Unavailable\n\nThe following providers were tried but all returned rate limit or errors:\n${availableProviders.map((p) => `- **${PROVIDERS[p.key].name}** (${PROVIDERS[p.key].model})`).join('\n')}\n\nPlease try again in a few moments. Rate limits usually reset within 60 seconds.`;

          fullText = noProviderMsg;
          for (const word of noProviderMsg.split(/(\s+)/)) {
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
