module master(pclk,presetn,pready,ptransfer,pwrite,psel,penable,paddr,pwdata,prdata,paddr_bus,pwdata_bus,pwrite_bus);
input[31:0]pwdata_bus,paddr_bus;
input pwrite_bus;
input pclk,presetn,pready,ptransfer;
output reg pwrite,psel,penable;
output reg[31:0]paddr,pwdata;
input[31:0]prdata;
 //The first [31:0] describes the width of each register,
 ////while the second [31:0] describes the number of elements (32)

localparam idle = 2'b00;
localparam setup = 2'b01;
localparam access = 2'b10;
reg[1:0]ps,ns;

always@(posedge pclk or negedge presetn)begin //active low reset in apb, also async here
        if(~presetn)
                ps <= idle;
        else
                ps <= ns;
end

always@(*)begin

pwrite = pwrite_bus;
paddr = paddr_bus;
pwdata = pwdata_bus;

ns = ps;
psel = 1'b0;
penable = 1'b0;

        case(ps)

                idle:begin
                        if(ptransfer)
                                ns = setup;
                        else
                                ns = idle;
                end

                setup:begin
                                ns = access;
                                psel = 1'b1;
                end

                access:begin
                psel = 1'b1;
                penable = 1'b1;
                        if(pready == 1 && ptransfer == 0)
                                ns = idle;
                        else if(pready == 1 && ptransfer == 1)
                                ns = setup;
                        else
                                ns = access;
                end

                default: ns = idle;

        endcase
end
endmodule

module slave(input pclk,presetn,pwrite,psel,penable,output reg pready,input[31:0]pwdata,paddr,output reg[31:0]prdata);
reg[31:0]dataf;
//assign pready = 1'b1;
reg[1:0]count = 0;
always@(posedge pclk)begin
    if(psel == 1 && penable == 1)begin
        if(count < 3)begin
            count <= count + 1;
            pready <= 1'b0;
        end
        else begin
            pready <= 1'b1;
            count <= 2'b0;
        end
    end
end

always@(posedge pclk or negedge presetn)begin
        if(~presetn)
                dataf <= 0;
        else begin
                        if(pwrite == 1 && penable == 1 && psel == 1)
                                dataf <= pwdata;
                        else if(pwrite == 0 && penable == 1 && psel == 1)
                                prdata <= dataf;
        end
end
endmodule







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
