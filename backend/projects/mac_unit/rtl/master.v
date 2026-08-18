`timescale 1ns / 1ps
// ============================================================================
// Module Name: master
// Description: AMBA APB3 Master Controller FSM & Address Decoder
// Project: AMBA APB3 Protocol Design and Verification
// Author: Ishaan Bhimajiyani
// ============================================================================

module master (
    input  wire        clk,
    input  wire        reset,
    input  wire        pwrite,
    input  wire        ptransfer,
    input  wire [31:0] paddr,
    input  wire [31:0] read_data_bus,
    input  wire [31:0] write_data_bus,
    output reg         penable,
    output reg         psel1,
    output reg         psel2,
    output reg  [31:0] pwdata,
    output reg  [31:0] prdata
);

    parameter idle   = 2'b00;
    parameter setup  = 2'b01;
    parameter access = 2'b10;

    reg pready;
    reg [1:0] pstate, nstate;

    always @(posedge clk or posedge reset) begin
        if (reset) begin
            pstate <= idle;
        end else begin
            pstate <= nstate;
        end
    end

    always @(*) begin
        psel1   = 1'b0;
        psel2   = 1'b0;
        penable = 1'b0;
        pready  = 1'b1;
        prdata  = 32'b0;
        pwdata  = 32'b0;

        case (pstate)
            idle: begin
                psel1   = 1'b0;
                psel2   = 1'b0;
                penable = 1'b0;
                if (ptransfer)
                    nstate = setup;
                else
                    nstate = idle;
            end

            setup: begin
                penable = 1'b0;
                nstate  = access;
                if (paddr >= 32'h0000_0000 && paddr <= 32'h0000_00FF) begin
                    // from 0 to 255 select 1st slave
                    psel1 = 1'b1;
                    psel2 = 1'b0;
                end else if (paddr >= 32'h0000_0100 && paddr <= 32'h0000_0200) begin
                    // 256 to 512 select 2nd slave
                    psel2 = 1'b1;
                    psel1 = 1'b0;
                end else begin
                    psel1 = 1'b0;
                    psel2 = 1'b0;
                end
            end

            access: begin
                penable = 1'b1;
                if (pready && ptransfer)
                    nstate = setup;
                else
                    nstate = idle;

                if (pwrite && pready) begin
                    pwdata = write_data_bus;
                end else begin
                    prdata = read_data_bus;
                end
            end

            default: begin
                nstate = idle;
            end
        endcase
    end

endmodule
