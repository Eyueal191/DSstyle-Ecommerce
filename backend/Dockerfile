# Official MongoDB 7.0 as base (guarantees native mongod & mongosh)
FROM mongo:7.0

# Set environment variables
ENV NODE_ENV=production \
    PORT=3040 \
    MONGO_URI=mongodb://127.0.0.1:27017/Db_for_dsstyle

# Install Node.js 20 LTS & curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependency definition files first
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Ensure storage directories and entrypoint script have proper permissions
RUN mkdir -p /data/db uploads/products uploads/userProfiles && \
    chmod +x docker-entrypoint.sh

# Expose backend port (3040) and MongoDB port (27017)
EXPOSE 3040 27017

# Healthcheck testing backend endpoint
HEALTHCHECK --interval=20s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:8080/health || curl -f http://localhost:3040/health || exit 1

# Start MongoDB and run Express (no automatic seeding; see docker-entrypoint.sh)
ENTRYPOINT ["/app/docker-entrypoint.sh"]
