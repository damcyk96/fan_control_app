FROM oven/bun:1.0

# Install openssl for certificate generation
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package.json first for better caching
COPY package.json ./

# Install dependencies (without --frozen-lockfile flag)
RUN bun install

# Copy the rest of the application code
COPY . .

# Generate HTTPS certificates if they don't exist
RUN if [ ! -f ./certs/cert.pem ]; then \
    mkdir -p certs && \
    openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj '/CN=localhost'; \
    fi

EXPOSE 3000

CMD ["bun", "run", "start"]