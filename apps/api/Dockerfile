FROM golang:1.23.4-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o main .

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app

COPY --from=builder /app/main .

RUN mkdir -p tmp

# Change ownership of the working directory including tmp
RUN chown -R worker:worker /app

# Ensure tmp directory has write permissions
RUN chmod 755 /app/tmp

# Switch to non-root user  
USER worker

EXPOSE 1234

CMD ["./main"]