// src/app/api/websocket/token/route.ts
export async function GET() {
  try {
    const res = await fetch('https://socket.eldor.kz/websocket-token', {
      headers: {
        'Authorization': `Bearer ${process.env.API_TOKEN}`
      }
    });
    
    if (!res.ok) throw new Error('Failed to get WebSocket token');
    
    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: 'Failed to get WebSocket token' }, { status: 500 });
  }
}