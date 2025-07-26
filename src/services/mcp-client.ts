// // A simple client for interacting with the fi-mcp-dev server.
// // In a real application, this would be much more robust, handling errors,
// // session persistence, and the full JSON-RPC spec.

// const MCP_SERVER_URL = 'http://localhost:8080/mcp/stream';
// let sessionId = `mcp-session-${crypto.randomUUID()}`;

// interface McpResponse {
//     jsonrpc: string;
//     id: number;
//     result?: {
//         content: { type: string; text: string; }[];
//     };
//     error?: {
//         code: number;
//         message: string;
//         data: {
//             login_url: string;
//         }
//     }
// }

// /**
//  * A client for interacting with the Fi Money Mock MCP Server.
//  */
// export class McpClient {
//     private sessionId: string;

//     constructor() {
//         // In a real app, you would persist and retrieve this session ID
//         this.sessionId = `mcp-session-${crypto.randomUUID()}`;
//     }

//     /**
//      * Calls a tool on the MCP server.
//      * @param toolName The name of the tool to call (e.g., 'fetch_net_worth').
//      * @param args The arguments for the tool.
//      * @returns The parsed JSON response from the tool.
//      */
//     async callTool(toolName: string, args: Record<string, any> = {}): Promise<any> {
//         console.log(`Calling tool: ${toolName} with session: ${this.sessionId}`);
        
//         try {
//             const response = await fetch(MCP_SERVER_URL, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Mcp-Session-Id': this.sessionId,
//                 },
//                 body: JSON.stringify({
//                     jsonrpc: '2.0',
//                     id: 1,
//                     method: 'tools/call',
//                     params: {
//                         name: toolName,
//                         arguments: args,
//                     },
//                 }),
//             });

//             if (!response.ok) {
//                 throw new Error(`HTTP error! status: ${response.status}`);
//             }

//             const data: McpResponse = await response.json();

//             if (data.error) {
//                 // Handle the case where the session is invalid and a login is required.
//                 if (data.error.data?.login_url) {
//                     const loginUrl = `${data.error.data.login_url}&sessionId=${this.sessionId}`;
//                     console.warn(`MCP session invalid. Please log in: ${loginUrl}`);
//                     // In a real app, you would redirect the user to this URL
//                     // or open it in a popup.
//                     throw new Error(`Session expired. Please log in again. URL: ${loginUrl}`);
//                 }
//                 throw new Error(`MCP Error: ${data.error.message}`);
//             }
            
//             if (data.result && data.result.content[0]?.text) {
//                 // The actual tool response is a JSON string within the 'text' field.
//                 return JSON.parse(data.result.content[0].text);
//             }

//             return data.result;

//         } catch (error) {
//             console.error('Failed to call MCP tool:', error);
//             // This is a good place to add user-facing error handling.
//             // For now, we'll re-throw to be handled by the caller.
//             throw error;
//         }
//     }
// }


// A simple client for interacting with the fi-mcp-dev server.
// In a real application, this would be much more robust, handling errors,
// session persistence, and the full JSON-RPC spec.

// All requests are proxied through our own API route to avoid CORS issues.
const MCP_API_PROXY_URL = '/api/mcp';

interface McpResponse {
    jsonrpc: string;
    id: number;
    result?: {
        content: { type: string; text: string; }[];
    };
    error?: {
        code: number;
        message: string;
        data: {
            login_url: string;
        }
    }
}

/**
 * A client for interacting with the Fi Money Mock MCP Server.
 */
export class McpClient {
    private sessionId: string;

    constructor() {
        if (typeof window !== "undefined") {
            const storedSessionId = sessionStorage.getItem('mcp-session-id');
            this.sessionId = storedSessionId || `mcp-session-${crypto.randomUUID()}`;
            sessionStorage.setItem('mcp-session-id', this.sessionId);
        } else {
            this.sessionId = `mcp-session-${crypto.randomUUID()}`;
        }
    }

    /**
     * Calls a tool on the MCP server via the Next.js API proxy.
     * @param toolName The name of the tool to call (e.g., 'fetch_net_worth').
     * @param args The arguments for the tool.
     * @returns The parsed JSON response from the tool.
     */
    async callTool(toolName: string, args: Record<string, any> = {}): Promise<any> {
        console.log(`Calling tool: ${toolName} with session: ${this.sessionId}`);
        
        try {
            const response = await fetch(MCP_API_PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mcpSessionId: this.sessionId,
                    method: 'tools/call',
                    params: {
                        name: toolName,
                        arguments: args,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: McpResponse = await response.json();

            if (data.error) {
                // Handle the case where the session is invalid and a login is required.
                if (data.error.data?.login_url) {
                    const loginUrl = `${data.error.data.login_url}&sessionId=${this.sessionId}`;
                    console.warn(`MCP session invalid. Please log in: ${loginUrl}`);
                    // In a real app, you would redirect the user to this URL
                    // or open it in a popup.
                    alert(`Your session has expired. Please log in by visiting this URL in a new tab:\n\n${loginUrl}\n\nAfter logging in, refresh this page.`);
                    throw new Error(`Session expired. Please log in again.`);
                }
                throw new Error(`MCP Error: ${data.error.message}`);
            }
            
            if (data.result && data.result.content[0]?.text) {
                // The actual tool response is a JSON string within the 'text' field.
                return JSON.parse(data.result.content[0].text);
            }

            return data.result;

        } catch (error) {
            console.error('Failed to call MCP tool:', error);
            // This is a good place to add user-facing error handling.
            // For now, we'll re-throw to be handled by the caller.
            throw error;
        }
    }
}
