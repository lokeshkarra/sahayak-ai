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



export class McpClient {
    private sessionId: string;
    private mcpUser: string | null; // Property to store the mcp-user (phone number)

    constructor() {
        if (typeof window !== "undefined") {
            const storedSessionId = sessionStorage.getItem('mcp-session-id');
            this.sessionId = storedSessionId || `mcp-session-${crypto.randomUUID()}`;
            sessionStorage.setItem('mcp-session-id', this.sessionId);

            // Retrieve mcp-user from sessionStorage
            this.mcpUser = sessionStorage.getItem('mcp-user');
            if (!this.mcpUser) {
                 console.warn("mcp-user not found in sessionStorage. Please ensure it's set for mock data retrieval. It should be set after successful login on /mockWebPage.");
                 // In a real app, you'd likely force a redirect to login here if mcp-user is essential
            } else {
                console.log("mcp-user found in sessionStorage:", this.mcpUser);
            }
        } else {
            // For server-side rendering contexts (if applicable), generate a session ID
            this.sessionId = `mcp-session-${crypto.randomUUID()}`;
            this.mcpUser = null; // No window, so no mcp-user from sessionStorage
        }
    }

    async callTool(toolName: string, args: Record<string, any> = {}): Promise<any> {
        console.log(`Calling tool: ${toolName} with session: ${this.sessionId}`);

        // Include mcpUser in the arguments sent to the backend
        // This is crucial for your Go backend to find the phone number
        const combinedArgs = { ...args, mcpUser: this.mcpUser };

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
                        arguments: combinedArgs, // <--- Ensure this is `combinedArgs`
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
                console.log("two conditions executed");
                console.log(JSON.parse(data.result.content[0].text));
                return JSON.parse(data.result.content[0].text);
            }
            console.log("data : ", data.result);
            return data.result;

        } catch (error) {
            console.error('Failed to call MCP tool:', error);
            // This is a good place to add user-facing error handling.
            // For now, we'll re-throw to be handled by the caller.
            throw error;
        }
    }
}