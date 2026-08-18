`timescale 1ns / 1ps
// ============================================================================
// Module Name: slave_one & slave_two
// Description: AMBA APB3 Slave Devices (Memory / Peripheral Interface)
// Project: AMBA APB3 Protocol Design and Verification
// Author: Ishaan Bhimajiyani
// ============================================================================

module slave_one (
    input  wire        clk,
    input  wire        reset,
    input  wire        psel1,
    input  wire        penable,
    input  wire        pwrite,
    input  wire [31:0] pwdata,
    input  wire [31:0] paddr,
    output reg         pready,
    output reg  [31:0] prdata
);

    reg [31:0] data1;

    always @(*) begin
        pready = 1'b1;
        prdata = 32'b0;
        if (psel1 && penable && ~pwrite) begin
            prdata = data1;
        end
    end

    always @(posedge clk or posedge reset) begin
        if (reset) begin
            data1 <= 32'b0;
        end else if (psel1 && penable && pwrite) begin
            data1 <= pwdata;
        end
    end

endmodule

module slave_two (
    input  wire        clk,
    input  wire        reset,
    input  wire        psel2,
    input  wire        penable,
    input  wire        pwrite,
    input  wire [31:0] pwdata,
    input  wire [31:0] paddr,
    output reg         pready,
    output reg  [31:0] prdata
);

    reg [31:0] data2;

    always @(*) begin
        pready = 1'b1;
        prdata = 32'b0;
        if (psel2 && penable && ~pwrite) begin
            prdata = data2;
        end
    end

    always @(posedge clk or posedge reset) begin
        if (reset) begin
            data2 <= 32'b0;
        end else if (psel2 && penable && pwrite) begin
            data2 <= pwdata;
        end
    end

endmodule
