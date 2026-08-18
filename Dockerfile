FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# Basic packages + RTL/EDA tools
RUN apt-get update && apt-get install -y \
    iverilog \
    yosys \
    gtkwave \
    verilator \
    make \
    git \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Check installations
RUN iverilog -V && \
    yosys -V && \
    verilator --version

WORKDIR /workspace

CMD ["/bin/bash"]
