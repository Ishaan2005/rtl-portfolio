//vlsi inputs are the system-bus side
module apb_top(
    input pclk,
    input presetn,
    input ptransfer,
    input pwrite_bus,
    input [31:0] paddr_bus,
    input [31:0] pwdata_bus
            );

 wire psel,penable,pwrite,pready; //slave determined based on paddr so it is not declared as a upper bus signal
 wire [31:0] paddr,pwdata,prdata;



master m1(.pclk(pclk),
          .presetn(presetn),
          .penable(penable),
          .psel(psel),
          .pready(pready),
          .pwrite(pwrite),
          .paddr(paddr),
          .pwdata(pwdata),
          .prdata(prdata),
          .ptransfer(ptransfer),
          .paddr_bus(paddr_bus),
          .pwdata_bus(pwdata_bus),
          .pwrite_bus(pwrite_bus)
          );

slave s1(.pclk(pclk),
         .presetn(presetn),
         .pwrite(pwrite),
         .psel(psel),
         .penable(penable),
         .pready(pready),
         .paddr(paddr),
         .pwdata(pwdata),
         .prdata(prdata)
         );

endmodule
