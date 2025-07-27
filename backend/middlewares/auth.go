package middlewares

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
	"github.com/samber/lo"

	"github.com/epifi/fi-mcp-lite/pkg"
)

var (
	loginRequiredJson = `{"status": "login_required","login_url": "%s","message": "Needs to login first by going to the login url.\nShow the login url as clickable link if client supports it. Otherwise display the URL for users to copy and paste into a browser. \nAsk users to come back and let you know once they are done with login in their browser"}`
)

type AuthMiddleware struct {
	sessionStore map[string]string
}

func NewAuthMiddleware() *AuthMiddleware {
	return &AuthMiddleware{
		sessionStore: make(map[string]string),
	}
}

func (m *AuthMiddleware) AuthMiddleware(next server.ToolHandlerFunc) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {

		clientSession := server.ClientSessionFromContext(ctx)
		if clientSession == nil {
			log.Println("Error: ClientSession not found in context.")
			loginUrl := m.getLoginUrl("unknown_session")
			return mcp.NewToolResultText(fmt.Sprintf(loginRequiredJson, loginUrl)), nil
		}
		sessionId := clientSession.SessionID()
		if sessionId == "" {
			log.Println("Error: Session ID is empty from ClientSession.")
			loginUrl := m.getLoginUrl("empty_session_id")
			return mcp.NewToolResultText(fmt.Sprintf(loginRequiredJson, loginUrl)), nil
		}

		phoneNumber, found := m.sessionStore[sessionId]
		if !found {
			log.Printf("Phone number not found for sessionId: %s. Attempting to use mcpUser from arguments.", sessionId)

			if req.Params.Arguments != nil {
				if argsMap, ok := req.Params.Arguments.(map[string]interface{}); ok {
					if mcpUser, ok := argsMap["mcpUser"].(string); ok && mcpUser != "" {
						phoneNumber = mcpUser
						log.Printf("Using mcpUser '%s' for sessionId '%s'. Adding to session store.", phoneNumber, sessionId)
						m.AddSession(sessionId, phoneNumber)
						found = true
					} else {
						log.Printf("mcpUser not found or empty in tool arguments for sessionId: %s.", sessionId)
					}
				} else {
					log.Printf("req.Params.Arguments is not a map[string]interface{} for sessionId: %s. Type: %T", sessionId, req.Params.Arguments)
				}
			}

			if !found {
				loginUrl := m.getLoginUrl(sessionId)
				return mcp.NewToolResultText(fmt.Sprintf(loginRequiredJson, loginUrl)), nil
			}
		}

		if !lo.Contains(pkg.GetAllowedMobileNumbers(), phoneNumber) {
			log.Printf("Phone number %s associated with sessionId %s is not allowed.", phoneNumber, sessionId)
			loginUrl := m.getLoginUrl(sessionId)
			return mcp.NewToolResultText(fmt.Sprintf(loginRequiredJson, loginUrl)), nil
		}
		ctx = context.WithValue(ctx, "phone_number", phoneNumber)
		toolName := req.Params.Name
		data, readErr := os.ReadFile("test_data_dir/" + phoneNumber + "/" + toolName + ".json")
		if readErr != nil {
			log.Println("error reading test data file", readErr)
			return mcp.NewToolResultError("error reading test data file"), nil
		}
		return mcp.NewToolResultText(string(data)), nil
	}
}

// GetLoginUrl fetches dynamic login url for given sessionId
func (m *AuthMiddleware) getLoginUrl(sessionId string) string {
	return fmt.Sprintf("http://localhost:%s/mockWebPage?sessionId=%s", pkg.GetPort(), sessionId)
}

func (m *AuthMiddleware) AddSession(sessionId, phoneNumber string) {
	m.sessionStore[sessionId] = phoneNumber
}

// package middlewares

// import (
// 	"context" // Still needed for json.Unmarshal
// 	"fmt"
// 	"log"
// 	"os"

// 	"github.com/mark3labs/mcp-go/mcp"
// 	"github.com/mark3labs/mcp-go/server"
// 	"github.com/samber/lo"

// 	"github.com/epifi/fi-mcp-lite/pkg"
// )

// var (
// 	loginRequiredJson = `{"status": "login_required", "login_url": "%s", "message": "Needs to login first by going to the login url."}`
// )

// type AuthMiddleware struct {
// 	sessionStore map[string]string
// }

// func NewAuthMiddleware() *AuthMiddleware {
// 	return &AuthMiddleware{
// 		sessionStore: make(map[string]string),
// 	}
// }

// // AuthMiddleware is a server.ToolHandlerFunc that authenticates requests based on session ID.
// func (m *AuthMiddleware) AuthMiddleware(next server.ToolHandlerFunc) server.ToolHandlerFunc {
// 	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
// clientSession := server.ClientSessionFromContext(ctx)
// if clientSession == nil {
// 	log.Println("Error: ClientSession not found in context.")
// 	loginUrl := m.getLoginUrl("unknown_session")
// 	return mcp.NewToolResultText(fmt.Sprintf(loginRequiredJson, loginUrl)), nil
// }
// sessionId := clientSession.SessionID()
// if sessionId == "" {
// 	log.Println("Error: Session ID is empty from ClientSession.")
// 	loginUrl := m.getLoginUrl("empty_session_id")
// 	return mcp.NewToolResultText(fmt.Sprintf(loginRequiredJson, loginUrl)), nil
// }

// 		phoneNumber, found := m.sessionStore[sessionId]
// 		if !found {
// 			log.Printf("Phone number not found for sessionId: %s. Attempting to use mcpUser from arguments.", sessionId)

// 			if req.Params.Arguments != nil {
// 				if argsMap, ok := req.Params.Arguments.(map[string]interface{}); ok {
// 					if mcpUser, ok := argsMap["mcpUser"].(string); ok && mcpUser != "" {
// 						phoneNumber = mcpUser
// 						log.Printf("Using mcpUser '%s' for sessionId '%s'. Adding to session store.", phoneNumber, sessionId)
// 						m.AddSession(sessionId, phoneNumber)
// 						found = true
// 					} else {
// 						log.Printf("mcpUser not found or empty in tool arguments for sessionId: %s.", sessionId)
// 					}
// 				} else {
// 					log.Printf("req.Params.Arguments is not a map[string]interface{} for sessionId: %s. Type: %T", sessionId, req.Params.Arguments)
// 				}
// 			}

// 			if !found {
// 				loginUrl := m.getLoginUrl(sessionId)
// 				return mcp.NewToolResultText(fmt.Sprintf(loginRequiredJson, loginUrl)), nil
// 			}
// 		}

// 		if !lo.Contains(pkg.GetAllowedMobileNumbers(), phoneNumber) {
// 			log.Printf("Phone number %s associated with sessionId %s is not allowed.", phoneNumber, sessionId)
// 			loginUrl := m.getLoginUrl(sessionId)
// 			return mcp.NewToolResultText(fmt.Sprintf(loginRequiredJson, loginUrl)), nil
// 		}

// 		ctx = context.WithValue(ctx, "phone_number", phoneNumber)
// 		toolName := req.Params.Name

// 		dataPath := fmt.Sprintf("test_data_dir/%s/%s.json", phoneNumber, toolName)
// 		data, readErr := os.ReadFile(dataPath)
// 		if readErr != nil {
// 			log.Printf("error reading test data file %s for phone %s: %v", dataPath, phoneNumber, readErr)
// 			return mcp.NewToolResultError("error reading test data file"), nil
// 		}

// 		// --- REVERTED TO NewToolResultText, BUT MARSHAL JSON FIRST ---
// 		// We already have 'data' which is the raw JSON bytes from the file.
// 		// Just convert it to a string.
// 		return mcp.NewToolResultText(string(data)), nil // <--- CHANGED THIS LINE BACK, but 'data' is already JSON bytes
// 		// --- END CRITICAL CHANGE ---
// 	}
// }

// // GetLoginUrl fetches dynamic login url for given sessionId
// func (m *AuthMiddleware) getLoginUrl(sessionId string) string {
// 	return fmt.Sprintf("http://localhost:%s/mockWebPage?sessionId=%s", pkg.GetPort(), sessionId)
// }

// // AddSession stores the mapping between a sessionId and a phoneNumber.
// func (m *AuthMiddleware) AddSession(sessionId, phoneNumber string) {
// 	m.sessionStore[sessionId] = phoneNumber
// 	log.Printf("Session added: sessionId=%s, phoneNumber=%s", sessionId, phoneNumber)
// }

// // RemoveSession can be added to invalidate sessions, e.g., on logout or timeout
// func (m *AuthMiddleware) RemoveSession(sessionId string) {
// 	delete(m.sessionStore, sessionId)
// 	log.Printf("Session removed: sessionId=%s", sessionId)
// }
