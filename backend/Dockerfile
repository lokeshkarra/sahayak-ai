# --- Build stage ---
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install git and ca-certificates for Go modules
RUN apk add --no-cache git ca-certificates

# Copy go mod files and download dependencies
COPY go.mod go.sum ./
RUN go mod tidy

# Copy the rest of the source code
COPY . .

# Build the Go binary
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

# --- Run stage ---
FROM alpine:latest

WORKDIR /app

# Install ca-certificates for HTTPS
RUN apk add --no-cache ca-certificates

# Copy static files and test data if present
COPY --from=builder /app/static ./static
COPY --from=builder /app/test_data_dir ./test_data_dir

# Copy the built binary
COPY --from=builder /app/server .

# Expose the port (change if needed)
EXPOSE 8080

# Set environment variable for port (default 8080, can be overridden)
ENV FI_MCP_PORT=8080

# Run the server
CMD ["./server"]