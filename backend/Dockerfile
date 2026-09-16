FROM node:20-alpine

WORKDIR /app

# Install dependencies first (for caching)
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy application code
COPY . .

# Create directories for persistent data
RUN mkdir -p data uploads && chown -R node:node data uploads

# Use non-root user for security
USER node

# Expose backend port
EXPOSE 3000

CMD ["npm", "start"]
