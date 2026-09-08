//@ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ⚠️  Removed: AI Gateway proxy rewrite to port 3010.
  // All /api/v1/ai/* routes are now handled DIRECTLY by Next.js route handlers
  // in src/app/api/v1/ai/chat/stream/route.ts — no external gateway needed.

  env: {
    // Inject API keys so they are always available server-side regardless of .env.local location
    GROQ_API_KEY: process.env.GROQ_API_KEY || '',
    NVIDIA_API_KEY_PRO: process.env.NVIDIA_API_KEY_PRO || '',
    NVIDIA_API_KEY_FLASH: process.env.NVIDIA_API_KEY_FLASH || '',
    XAI_API_KEY: process.env.XAI_API_KEY || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    DISABLE_LOCAL_RAG: process.env.DISABLE_LOCAL_RAG || 'false',
  },
};

module.exports = nextConfig;
