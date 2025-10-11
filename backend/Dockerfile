# Use the official Node.js image as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json files to the container
COPY package*.json ./

# Install ALL dependencies (including devDependencies) for build
RUN npm install --force

# Copy the rest of the application code to the container
COPY . .

# Set permissions for scripts
RUN chmod +x /app/wait-for-it.sh
RUN chmod +x /app/entrypoint.sh

# Generate Prisma client
RUN npx prisma generate

# Build the TypeScript application
RUN npm run build

# Set environment variables
ENV CI=true
ENV NODE_PATH=/app/node_modules
ENV TS_NODE_PROJECT=tsconfig.json
ENV TS_NODE_TRANSPILE_ONLY=true

# Expose the port your app runs on
EXPOSE 5002

# Set the entrypoint to the script
ENTRYPOINT ["/app/entrypoint.sh"]