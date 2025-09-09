FROM golang:1.23.4-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o main .

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app

# Create non-root user with host user ID to avoid permission issues
ARG USER_ID=1001
ARG GROUP_ID=1001
RUN addgroup -g ${GROUP_ID} -S worker && \
    adduser -S worker -u ${USER_ID}

COPY --from=builder /app/main .

RUN mkdir -p tmp

# Change ownership of the working directory
RUN chown -R worker:worker /app

# Switch to non-root user  
USER worker

EXPOSE 1234

CMD ["./main"]