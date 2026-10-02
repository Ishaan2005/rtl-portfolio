//multiplier
module multiplier #(parameter k = 3)(input[k-1:0]in1,in2,output[2*k-1:0]out);
wire [k-1:0]y[k-1:0]; // initial unshifted 3 bit products. 3 vectors each 3 bits wide.
wire [2*k-1:0]z[k-1:0]; //products after shiting or apending with zeroes, 3 vecctors each 6 bits wide.
genvar i,j;
generate
        for(i = 0;i < k; i= i+1)begin:for_one
                for(j = 0; j < k; j = j+1)begin:for_two
                        and(y[i][j],in2[j],in1[i]); //multiplies 2 3 bit numbers
            //y[0][0] y[0][1] y[0][2]
            //y[1][0] y[1][1] y[1][2]
            //y[2][0] y[2][1] y[2][3] 3 vectors, 3 bit wide each
                end
        assign z[i] = {{(k){1'b0}}, y[i]} << i; // then store the appended 6 bit numbers in z
        end

        if(k == 1) //for single bit multiplication, only y[0][0] will be present
                assign out = y[0][0];
        else begin
                wire[2*k-1:0]int_sum;
                wire [k-2:0]inter_carry;
                ripple_adder #(.k(2*k))r1(.A(z[0]),.B(z[1]),.Cin(1'b0),.carry(inter_carry[0]),.sum(int_sum));
                ripple_adder #(.k(2*k))r2(.A(z[2]),.B(int_sum),.Cin(1'b0),.carry(inter_carry[1]),.sum(out));
        end
endgenerate
endmodule



module ripple_adder #(parameter k = 6)(input [k-1:0]A,B,input Cin,output[k-1:0]sum,output carry);
wire[k-1:0]G,P;
wire[k:0]C;
assign C[0] = Cin;
/*
assign C[0] = Cin, G[0] = A[0] & B[0], P[0] = A[0] ^ B[0], C[1] = G[0] | P[0] & C[0];
assign G[1] = A[1] & B[1], P[1] = A[1] ^ B[1], C[2] = G[1] | (P[1] & G[0]) | (P[1] & P[0] & C[0]);
assign G[2] = A[2] & B[2], P[2] = A[2] ^ B[2], C[3] = G[2] | P[2] & (G[1] | (P[1] & G[0]) | (P[1] & P[0] & C[0]));
assign G[3] = A[3] & B[3], P[3] = A[3] ^ B[3], C[4] = G[3] | P[3] & (G[2] | P[2] & (G[1] | (P[1] & G[0]) | (P[1] & P[0] & C[0])));
assign S[0] = P[0]^C[0], S[1] = P[1]^C[1], S[2] = P[2]^C[2], S[3] = P[3]^C[3];
assign sum = {S[3],S[2],S[1],S[0]};
assign carry = {C[0],C[1],C[2],C[3],C[4]};
*/
genvar i;
generate
    for(i = 0; i < k; i = i + 1)begin:for_loop
       assign P[i] = A[i] ^ B[i];
       assign G[i] = A[i] & B[i];
       assign C[i+1] = G[i] | ( P[i] & C[i] );
       assign sum[i] = P[i] ^ C[i];
    end

         assign carry = C[k];
endgenerate
endmodule

module mac_top #(parameter k = 3)(input clk,rst,input[k-1:0]in1,in2,output reg[2*k:0]accumulator);
wire[2*k-1:0]int_mult;
wire[2*k+1:0]next_acc;
wire[2*k:0]add_sum;
wire add_cout;
multiplier #(.k(k)) m1(.in1(in1),.in2(in2),.out(int_mult));

ripple_adder #(.k(2*k+1)) a1(.A(accumulator[2*k:0]),.B({1'b0,int_mult}),.Cin(1'b0),.sum(add_sum),.carry(add_cout));

assign next_acc = {add_cout,add_sum};

always @(posedge clk or posedge rst) begin
        if (rst)
                accumulator <= 0;
   else
        accumulator <= next_acc;
end
endmodule
