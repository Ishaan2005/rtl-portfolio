FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# Install system packages + EDA tools + Node.js
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    iverilog \
    yosys \
    verilator \
    make \
    git \
    python3 \
    python3-pip \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Verify installed tools
RUN node --version && \
    npm --version && \
    iverilog -V && \
    yosys -V && \
    verilator --version

WORKDIR /app

# Copy backend package files first for Docker cache
COPY backend/package*.json ./backend/

WORKDIR /app/backend

RUN npm ci

# Copy backend source/project files
COPY backend/ ./

# Compile TypeScript
RUN npm run build

# Render commonly uses PORT=10000 unless otherwise configured
EXPOSE 10000

CMD ["npm", "start"]
