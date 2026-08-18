`timescale 1ns / 1ps
// ============================================================================
// Module Name: apb_top
// Description: Complete Top-Level AMBA APB3 Interconnect with 1 Master & 2 Slaves
// Project: AMBA APB3 Protocol Design and Verification
// Author: Ishaan Bhimajiyani
// ============================================================================

module apb_top (
    input  wire        clk,
    input  wire        reset,
    input  wire        pwrite_top,
    input  wire        ptransfer_top,
    input  wire [31:0] paddr_top,
    input  wire [31:0] write_bus_top,
    output wire [31:0] read_bus_top,
    output wire        penable_top,
    output wire        psel1_top,
    output wire        psel2_top
);

    wire psel1_master, psel2_master, penable_master;
    wire [31:0] prdata1, prdata2;
    wire pready_top = 1'b1;
    wire [31:0] prdata_master, pwdata_master;

    assign psel1_top   = psel1_master;
    assign psel2_top   = psel2_master;
    assign penable_top = penable_master;

    assign read_bus_top = psel1_master ? prdata1 : psel2_master ? prdata2 : 32'b0;

    master m1 (
        .clk            (clk),
        .reset          (reset),
        .pwrite         (pwrite_top),
        .ptransfer      (ptransfer_top),
        .paddr          (paddr_top),
        .read_data_bus  (read_bus_top),
        .write_data_bus (write_bus_top),
        .penable        (penable_master),
        .psel1          (psel1_master),
        .psel2          (psel2_master),
        .pwdata         (pwdata_master),
        .prdata         (prdata_master)
    );

    slave_one slo (
        .clk     (clk),
        .reset   (reset),
        .psel1   (psel1_master),
        .penable (penable_master),
        .pwrite  (pwrite_top),
        .pwdata  (pwdata_master),
        .paddr   (paddr_top),
        .pready  (pready_top),
        .prdata  (prdata1)
    );

    slave_two slt (
        .clk     (clk),
        .reset   (reset),
        .psel2   (psel2_master),
        .penable (penable_master),
        .pwrite  (pwrite_top),
        .pwdata  (pwdata_master),
        .paddr   (paddr_top),
        .pready  (pready_top),
        .prdata  (prdata2)
    );

endmodule
