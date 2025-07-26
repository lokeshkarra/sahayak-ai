// This file acts as a proxy to the fi-mcp-dev server.
// It's a workaround for CORS issues when calling from the browser.
// The client-side code will call this API route, which then forwards
// the request to the actual MCP server from the backend.

import { NextRequest, NextResponse } from 'next/server';

const MCP_SERVER_URL = 'http://localhost:8080/mcp/stream';

export async function POST(req: NextRequest) {
  try {
    const { mcpSessionId, method, params } = await req.json();

    if (!mcpSessionId || !method || !params) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const mcpResponse = await fetch(MCP_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Mcp-Session-Id': mcpSessionId,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1, // Using a static ID is fine for this proxy
        method: method,
        params: params,
      }),
    });

    const data = await mcpResponse.json();
    return NextResponse.json(data, { status: mcpResponse.status });
    
  } catch (error) {
    console.error('MCP Proxy Error:', error);
    if (error instanceof Error && (error as any).code === 'ECONNREFUSED') {
       return NextResponse.json({ 
         error: 'Could not connect to the MCP server. Please ensure it is running on http://localhost:8080.' 
        }, { status: 502 }); // Bad Gateway
    }
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
