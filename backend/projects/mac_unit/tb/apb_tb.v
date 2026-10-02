`timescale 1ns/1ps
module mac_tb;
parameter k = 3;
reg clk,rst;
reg[k-1:0]in1,in2;
wire [2*k:0]accumulator;
mac_top v1(.clk(clk),.rst(rst),.in1(in1),.in2(in2),.accumulator(accumulator));


initial clk = 0;
always #5 clk = ~clk;

initial begin
        $monitor($time,"rst = %b, in1 = %b, in2 = %b,output = %b ",rst,in1,in2,accumulator);
        $dumpfile("waveform.vcd");
        $dumpvars(0,mac_tb);
    rst = 1'b1;in1 = 3'b0;in2= 3'b0;
        #2 rst = 1'b1;
        //#5 in1 = 3'b0;in2 = 2'b0;
    #7 rst = 1'b0;
    #13 in1 = 3'b111; in2 = 3'b111;
    //#5 in1 = 3'b111; in2 = 3'b011;
    //#5 in1 = 3'b111; in2 = 3'b011;
    //#5 in1 = 3'b100; in2 = 3'b101;
    //#5 in1 = 3'b111; in2 = 3'b111;
        #22 $finish;
end

endmodule
