#!/binbin/bash

# ==============================================================================
# AI Resume Tailor - Installation Script
# ==============================================================================
#
# This script automates the setup and launch of the AI Resume Tailor application
# using Docker. It will build the Docker image and run it as a container.
#
# Prerequisites:
#   - Docker must be installed and running on your system.
#
# What this script does:
#   1. Defines the application's name and port.
#   2. Checks if the Docker daemon is running.
#   3. Stops and removes any old container with the same name to prevent conflicts.
#   4. Builds a new Docker image for the application.
#   5. Starts a new container from the image.
#   6. Prints a success message with the URL to access the application.
#
# How to run:
#   1. Open your terminal.
#   2. Make the script executable by running: chmod +x install.sh
#   3. Run the script: ./install.sh
#
# ==============================================================================

# --- Configuration ---
# The name for your Docker container and image.
# You can change this if you want, but the default is fine.
APP_NAME="ai-resume-tailor"

# The port on your local machine that will be used to access the application.
# If this port is already in use, you can change it to another one (e.g., 8081).
LOCAL_PORT=8080

# The port the application runs on inside the Docker container (do not change this).
CONTAINER_PORT=80

# --- Style Definitions (for pretty output) ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Script Start ---
echo -e "${BLUE}Starting the AI Resume Tailor installation...${NC}"

# 1. Check if Docker is running
# =================================
echo -e "\n${YELLOW}[Step 1/5] Checking if Docker is running...${NC}"
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}Error: Docker does not seem to be running.${NC}"
  echo "Please start Docker Desktop and try again."
  exit 1
fi
echo -e "${GREEN}Docker is running.${NC}"

# 2. Stop and remove any existing container
# ==========================================
echo -e "\n${YELLOW}[Step 2/5] Checking for and removing any old versions of the application...${NC}"
# We use 'docker ps -a' to check for containers that are running or stopped.
if [ "$(docker ps -a -q -f name=^/${APP_NAME}$)" ]; then
  echo "Found an old container. Stopping and removing it..."
  docker stop ${APP_NAME} > /dev/null
  docker rm ${APP_NAME} > /dev/null
  echo -e "${GREEN}Old container removed.${NC}"
else
  echo -e "${GREEN}No old container found. Good to go.${NC}"
fi

# 3. Build the Docker image
# ===========================
echo -e "\n${YELLOW}[Step 3/5] Building the application's Docker image...${NC}"
echo "This might take a few moments, especially on the first run."
docker build -t ${APP_NAME} .
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Docker image build failed.${NC}"
    echo "Please check for errors in the output above."
    exit 1
fi
echo -e "${GREEN}Docker image built successfully.${NC}"

# 4. Run the Docker container
# ===========================
echo -e "\n${YELLOW}[Step 4/5] Starting the application container...${NC}"
# We run the container in "detached" mode (-d) so it runs in the background.
# We map the local port to the container's port.
docker run -d -p ${LOCAL_PORT}:${CONTAINER_PORT} --name ${APP_NAME} ${APP_NAME}
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to start the Docker container.${NC}"
    exit 1
fi
echo -e "${GREEN}Container started successfully.${NC}"

# 5. Success!
# =================
echo -e "\n${YELLOW}[Step 5/5] All done!${NC}"
echo -e "\n${GREEN}=====================================================${NC}"
echo -e "${GREEN}  AI Resume Tailor is now running! 🎉"
echo -e "${GREEN}=====================================================${NC}"
echo -e "\nYou can access the application in your web browser at:"
echo -e "  ${BLUE}http://localhost:${LOCAL_PORT}${NC}"
echo -e "\nTo stop the application, open your terminal and run:"
echo -e "  ${YELLOW}docker stop ${APP_NAME}${NC}\n"

exit 0