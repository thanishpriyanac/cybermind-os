export const runtime = 'nodejs';
export async function GET(request: Request) {
    return new Response('Hello, from API!')
  }
  