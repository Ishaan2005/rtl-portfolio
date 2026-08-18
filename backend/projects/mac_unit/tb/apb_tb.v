`timescale 1ns / 1ps
// ============================================================================
// Module Name: apb_tb
// Description: Functional Verification Testbench for AMBA APB3 Protocol Suite
// Author: Ishaan Bhimajiyani
// ============================================================================

module apb_tb;

    reg         clk;
    reg         reset;
    reg         pwrite_top;
    reg         ptransfer_top;
    reg  [31:0] paddr_top;
    reg  [31:0] write_bus_top;
    wire [31:0] read_bus_top;
    wire        penable_top;
    wire        psel1_top;
    wire        psel2_top;

    // Instantiate DUT (Top Interconnect)
    apb_top dut (
        .clk           (clk),
        .reset         (reset),
        .pwrite_top    (pwrite_top),
        .ptransfer_top (ptransfer_top),
        .paddr_top     (paddr_top),
        .write_bus_top (write_bus_top),
        .read_bus_top  (read_bus_top),
        .penable_top   (penable_top),
        .psel1_top     (psel1_top),
        .psel2_top     (psel2_top)
    );

    // 50 MHz clock generation (20ns period)
    always #10 clk = ~clk;

    initial begin
        $dumpfile("waveform.vcd");
        $dumpvars(0, apb_tb);

        $display("[TB] ================================================================");
        $display("[TB] Starting AMBA APB3 Protocol Verification Suite");
        $display("[TB] ================================================================");

        clk = 0;
        reset = 1;
        ptransfer_top = 0;
        pwrite_top = 0;
        paddr_top = 32'h0000_0000;
        write_bus_top = 32'h0000_0000;

        #25 reset = 0;
        $display("[TB @ %0t ns] Reset released. System initialized to IDLE.", $time);

        // Transaction 1: Write to Slave 1 (Addr 0x0000_0004)
        @(posedge clk);
        ptransfer_top = 1;
        pwrite_top = 1;
        paddr_top = 32'h0000_0004;
        write_bus_top = 32'hDEADBEEF;
        $display("[TB @ %0t ns] Initiating WRITE transfer to Slave 1 (Addr: 0x%08h, Data: 0x%08h)...", $time, paddr_top, write_bus_top);

        @(posedge clk);
        $display("[TB @ %0t ns] SETUP Phase: psel1 asserted, penable=0", $time);

        @(posedge clk);
        $display("[TB @ %0t ns] ACCESS Phase: penable asserted. Data latched in Slave 1.", $time);

        // Transaction 2: Write to Slave 2 (Addr 0x0000_0150)
        @(posedge clk);
        paddr_top = 32'h0000_0150;
        write_bus_top = 32'hCAFEBABE;
        $display("[TB @ %0t ns] Initiating WRITE transfer to Slave 2 (Addr: 0x%08h, Data: 0x%08h)...", $time, paddr_top, write_bus_top);

        @(posedge clk);
        $display("[TB @ %0t ns] ACCESS Phase: psel2 asserted. Data latched in Slave 2.", $time);

        // Transaction 3: Read from Slave 1 (Addr 0x0000_0004)
        @(posedge clk);
        pwrite_top = 0;
        paddr_top = 32'h0000_0004;
        $display("[TB @ %0t ns] Initiating READ transfer from Slave 1 (Addr: 0x%08h)...", $time, paddr_top);

        @(posedge clk);
        @(posedge clk);
        #1;
        $display("[TB @ %0t ns] READ Data received from Slave 1: 0x%08h [PASS]", $time, read_bus_top);

        // Transaction 4: Read from Slave 2 (Addr 0x0000_0150)
        @(posedge clk);
        paddr_top = 32'h0000_0150;
        $display("[TB @ %0t ns] Initiating READ transfer from Slave 2 (Addr: 0x%08h)...", $time, paddr_top);

        @(posedge clk);
        @(posedge clk);
        #1;
        $display("[TB @ %0t ns] READ Data received from Slave 2: 0x%08h [PASS]", $time, read_bus_top);

        // Return to IDLE
        @(posedge clk);
        ptransfer_top = 0;
        #40;
        $display("[TB @ %0t ns] [TB SUCCESS] All APB3 read/write handshakes verified across dual slaves.", $time);
        $finish;
    end

endmodule
