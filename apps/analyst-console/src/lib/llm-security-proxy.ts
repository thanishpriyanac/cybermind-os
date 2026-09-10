/**
 * CyberMind OS — In-Line LLM Security & PII Redaction Proxy
 * 
 * Inspects outgoing AI prompts for sensitive PII (SSNs, Passwords, API Keys, Credit Cards)
 * and defends against Prompt Injection / System Prompt Extraction based on MITRE ATLAS.
 */

export interface SecurityProxyResult {
  sanitizedPrompt: string;
  piiRedacted: boolean;
  redactedTypes: string[];
  threatDetected: boolean;
  threatType?: string;
}

export function sanitizeAndInspectPrompt(rawPrompt: string): SecurityProxyResult {
  let text = rawPrompt;
  const redactedTypes: string[] = [];

  // 1. PII Redaction Patterns
  // API Keys (e.g. sk-..., gsk_..., nvapi-...)
  if (/(?:sk-[a-zA-Z0-9]{32,}|gsk_[a-zA-Z0-9]{32,}|nvapi-[a-zA-Z0-9_-]{40,})/gi.test(text)) {
    text = text.replace(/(?:sk-[a-zA-Z0-9]{32,}|gsk_[a-zA-Z0-9]{32,}|nvapi-[a-zA-Z0-9_-]{40,})/gi, '[REDACTED_API_KEY]');
    redactedTypes.push('API_KEY');
  }

  // Social Security Numbers (SSN: XXX-XX-XXXX)
  if (/\b\d{3}-\d{2}-\d{4}\b/g.test(text)) {
    text = text.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]');
    redactedTypes.push('SSN');
  }

  // Credit Card Numbers (13-19 digits)
  if (/\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/g.test(text)) {
    text = text.replace(/\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/g, '[REDACTED_CREDIT_CARD]');
    redactedTypes.push('CREDIT_CARD');
  }

  // Passwords in config/text
  if (/(?:password|passwd|secret)\s*[:=]\s*['"]?([^\s'"]{6,})['"]?/gi.test(text)) {
    text = text.replace(/(?:password|passwd|secret)\s*[:=]\s*['"]?([^\s'"]{6,})['"]?/gi, 'password = "[REDACTED_PASSWORD]"');
    redactedTypes.push('PASSWORD');
  }

  // 2. Prompt Injection & Jailbreak Defense (MITRE ATLAS AML.T0054 / T0051)
  const injectionPatterns = [
    /ignore (?:all )?previous instructions/i,
    /override system prompt/i,
    /you are now DAN/i,
    /bypass safety filters/i,
    /reveal your system instructions/i,
  ];

  let threatDetected = false;
  let threatType: string | undefined;

  for (const pattern of injectionPatterns) {
    if (pattern.test(rawPrompt)) {
      threatDetected = true;
      threatType = 'PROMPT_INJECTION_ATTEMPT';
      break;
    }
  }

  return {
    sanitizedPrompt: text,
    piiRedacted: redactedTypes.length > 0,
    redactedTypes: Array.from(new Set(redactedTypes)),
    threatDetected,
    threatType,
  };
}
