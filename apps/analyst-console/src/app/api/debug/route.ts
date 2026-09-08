export const dynamic = 'force-dynamic';

export async function GET() {
  const keys = {
    GROQ_API_KEY: process.env.GROQ_API_KEY ? `✅ SET (starts: ${process.env.GROQ_API_KEY.slice(0, 8)}...)` : '❌ MISSING',
    NVIDIA_API_KEY_PRO: process.env.NVIDIA_API_KEY_PRO ? `✅ SET (starts: ${process.env.NVIDIA_API_KEY_PRO.slice(0, 10)}...)` : '❌ MISSING',
    NVIDIA_API_KEY_FLASH: process.env.NVIDIA_API_KEY_FLASH ? `✅ SET (starts: ${process.env.NVIDIA_API_KEY_FLASH.slice(0, 10)}...)` : '❌ MISSING',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? `✅ SET (starts: ${process.env.GEMINI_API_KEY.slice(0, 8)}...)` : '❌ MISSING',
    XAI_API_KEY: process.env.XAI_API_KEY ? `✅ SET (starts: ${process.env.XAI_API_KEY.slice(0, 8)}...)` : '❌ MISSING',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? `✅ SET (starts: ${process.env.OPENAI_API_KEY.slice(0, 8)}...)` : '❌ MISSING',
    DISABLE_LOCAL_RAG: process.env.DISABLE_LOCAL_RAG || '❌ NOT SET',
  };

  const activeProviders = Object.entries(keys).filter(([, v]) => v.startsWith('✅')).length;

  return Response.json({
    status: activeProviders > 0 ? '🟢 API Keys Loaded' : '🔴 No API Keys — will use Local SOC RAG',
    activeProviders,
    node_env: process.env.NODE_ENV,
    cwd: process.cwd(),
    keys,
    message: activeProviders > 0
      ? 'Cloud AI providers are available and will be used for responses.'
      : 'No cloud API keys detected. ALL responses will come from Local SOC RAG Engine.',
  });
}
