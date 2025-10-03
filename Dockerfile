# Stage 1: Build the React application
# We use a specific version of Node for reproducibility.
FROM node:20-alpine AS build

# Set the working directory inside the container.
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker layer caching.
# This way, dependencies are only re-installed if these files change.
COPY package*.json ./

# Install project dependencies.
RUN npm install

# Copy the rest of the application's source code.
COPY . .

# Build the application for production.
# This command compiles TypeScript, bundles the code, and creates static files in the /app/dist directory.
RUN npm run build

# Stage 2: Serve the application with Nginx
# We use a lightweight Nginx image for a small final image size.
FROM nginx:1.27-alpine

# Copy the build output (the static files) from the build stage to the Nginx server directory.
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the custom Nginx configuration file.
# This will be created in the next step and is crucial for a Single Page Application (SPA).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 to allow traffic to the web server.
EXPOSE 80

# The command to start Nginx when the container launches.
CMD ["nginx", "-g", "daemon off;"]