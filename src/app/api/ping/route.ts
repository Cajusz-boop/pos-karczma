export const runtime = "edge";

export async function GET() {
  return new Response("pong", {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
