# Use Node.js 20 LTS
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first for caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all backend files
COPY . .

# Build TypeScript
RUN npm run build

# Expose backend port
EXPOSE 4000

# Start backend server
CMD ["npm", "start"]
