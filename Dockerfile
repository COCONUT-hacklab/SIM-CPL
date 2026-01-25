# =========================
# STAGE 1: Build
# =========================
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install git (kadang dibutuhkan go mod)
RUN apk add --no-cache git

# Copy go mod & sum dulu (biar cache efisien)
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -o simcpl-api ./cmd/api

# =========================
# STAGE 2: Runtime
# =========================
FROM alpine:3.20

WORKDIR /app

# Install ca-certificates (penting untuk HTTPS call)
RUN apk add --no-cache ca-certificates

# Copy binary dari builder
COPY --from=builder /app/simcpl-api .

# Expose port aplikasi
EXPOSE 8001

# Run
CMD ["./simcpl-api"]
