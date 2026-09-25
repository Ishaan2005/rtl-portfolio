module Dut_tb;
reg pclk,presetn,ptransfer,pwrite_bus;
reg[31:0] paddr_bus,pwdata_bus;
vlsi v1(.pclk(pclk),.presetn(presetn),.ptransfer(ptransfer),.pwrite_bus(pwrite_bus),.paddr_bus(paddr_bus),.pwdata_bus(pwdata_bus));
initial pclk = 0;

always
        #5 pclk = ~pclk;

initial begin
    $dumpfile("vlsi.vcd");
    $dumpvars(0,Dut_tb);
    ptransfer  = 0;pwrite_bus = 0;paddr_bus  = 0;pwdata_bus = 0 ;

$display("+------+--------+-----------+--------+----------+------+---------+----------+----------+--------");
$display("| Time | Preset | Ptransfer | Pwrite |  Paddr   | Psel | Penable |  Pwdata  |  Prdata  | Pready |");
$display("+------+--------+-----------+--------+----------+------+---------+----------+----------+--------");

$monitor("| %4t | %6b | %9b | %6b | %8h | %4b | %7b | %8h | %8h |",
         $time, presetn, ptransfer, v1.pwrite, v1.paddr,
         v1.psel, v1.penable, v1.pwdata, v1.prdata,v1.pready);

@(posedge pclk)

    presetn = 1'b0;
        #4 presetn = 1'b1; //as active-low reset;
        #12 paddr_bus = 32'h1111_1111;ptransfer = 1'b1;pwdata_bus = 32'h1234_5678;pwrite_bus = 1'b1;
        #24 ptransfer = 1'b0;
    #40 ptransfer = 1'b1;pwrite_bus = 1'b0;paddr_bus = 32'h1111_1111;
    #55 ptransfer = 1'b0;
    #70 $finish;
end
endmodule
