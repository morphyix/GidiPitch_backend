# Use the official Puppeteer-specific base image, which includes a stable
# version of Node.js and all required dependencies for headless Chrome.
FROM ghcr.io/puppeteer/puppeteer:23.10.0

# Set working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json to the work directory
# This allows Docker to cache the npm install layer
COPY package*.json ./

# Install project dependencies
RUN npm install --omit=dev

# Copy the rest of the application source code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]