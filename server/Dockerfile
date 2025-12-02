FROM node:18-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm install -D typescript @types/node @types/express && \
    npm run build && \
    npm prune --production

# Create volume mount point for persistent config
VOLUME ["/app/config"]

# Expose HTTP port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Default command - start the server
CMD ["node", "dist/index.js"]
