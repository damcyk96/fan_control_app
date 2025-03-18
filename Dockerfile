FROM oven/bun:1.0

WORKDIR /app

# Copy package.json first for better caching
COPY package.json ./

# Install dependencies
RUN bun install

# Copy the rest of the application code
COPY . .

EXPOSE 3000

CMD ["bun", "run", "start"]