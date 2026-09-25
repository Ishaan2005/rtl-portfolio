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


