FROM node:20

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy all code
COPY . .

# Build TypeScript
RUN npm run build

# Expose backend port
EXPOSE 8000

# Start server
CMD ["node", "dist/server.js"]
