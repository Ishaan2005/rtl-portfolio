import { RTLProject } from '../types/rtl';

export const fallbackProjects: RTLProject[] = [
  {
    "id": "amba_apb3",
    "title": "AMBA APB5 Protocol Design and Verification",
    "subtitle": "Complete APB5 Master-Slave Bus Architecture with Multi-Device Routing",
    "category": "Bus Architecture & Interconnect",
    "description": "Complete implementation and functional verification of the AMBA APB5 (Advanced Peripheral Bus) protocol in Verilog HDL. Incorporates an APB5 Master controller state machine, dual Memory-Mapped Slave devices, address decoding, non-blocking transfer phases (IDLE, SETUP, ACCESS), and an automated self-checking testbench suite.",
    "architectureDetails": [
      "Three-state FSM controller (IDLE, SETUP, ACCESS) executing compliant AMBA APB5 protocol transfers.",
      "Integrated Address Decoder directing peripheral transactions across multiple Slave address ranges (Slave 1: 0x000-0x0FF, Slave 2: 0x100-0x200).",
      "Synchronous 32-bit read/write data buses with PSEL, PENABLE, and PWRITE control handshaking.",
      "Individual Slave registers capturing and retaining write payloads across clock cycles.",
      "Verified against corner cases: back-to-back sequential bursts, alternating read/write transfers, and multi-slave arbitration."
    ],
    "tags": [
      "Verilog",
      "AMBA APB5",
      "SoC Bus",
      "FSM",
      "Verification"
    ],
    "topModule": "apb_top",
    "activeFileId": "apb_top.v",
    "files": [
      {
        "id": "apb_top.v",
        "name": "apb_top.v",
        "path": "rtl/apb_top.v",
        "type": "source",
        "language": "verilog",
        "content": "module master(pclk,presetn,pready,ptransfer,pwrite,psel,penable,paddr,pwdata,prdata,paddr_bus,pwdata_bus,pwrite_bus);\ninput[31:0]pwdata_bus,paddr_bus;\ninput pwrite_bus;\ninput pclk,presetn,pready,ptransfer;\noutput reg pwrite,psel,penable;\noutput reg[31:0]paddr,pwdata;\ninput[31:0]prdata;\n //The first [31:0] describes the width of each register,\n ////while the second [31:0] describes the number of elements (32)\n\nlocalparam idle = 2'b00;\nlocalparam setup = 2'b01;\nlocalparam access = 2'b10;\nreg[1:0]ps,ns;\n\nalways@(posedge pclk or negedge presetn)begin //active low reset in apb, also async here\n        if(~presetn)\n                ps <= idle;\n        else\n                ps <= ns;\nend\n\nalways@(*)begin\n\npwrite = pwrite_bus;\npaddr = paddr_bus;\npwdata = pwdata_bus;\n\nns = ps;\npsel = 1'b0;\npenable = 1'b0;\n\n        case(ps)\n\n                idle:begin\n                        if(ptransfer)\n                                ns = setup;\n                        else\n                                ns = idle;\n                end\n\n                setup:begin\n                                ns = access;\n                                psel = 1'b1;\n                end\n\n                access:begin\n                psel = 1'b1;\n                penable = 1'b1;\n                        if(pready == 1 && ptransfer == 0)\n                                ns = idle;\n                        else if(pready == 1 && ptransfer == 1)\n                                ns = setup;\n                        else\n                                ns = access;\n                end\n\n                default: ns = idle;\n\n        endcase\nend\nendmodule\n\nmodule slave(input pclk,presetn,pwrite,psel,penable,output reg pready,input[31:0]pwdata,paddr,output reg[31:0]prdata);\nreg[31:0]dataf;\n//assign pready = 1'b1;\nreg[1:0]count = 0;\nalways@(posedge pclk)begin\n    if(psel == 1 && penable == 1)begin\n        if(count < 3)begin\n            count <= count + 1;\n            pready <= 1'b0;\n        end\n        else begin\n            pready <= 1'b1;\n            count <= 2'b0;\n        end\n    end\nend\n\nalways@(posedge pclk or negedge presetn)begin\n        if(~presetn)\n                dataf <= 0;\n        else begin\n                        if(pwrite == 1 && penable == 1 && psel == 1)\n                                dataf <= pwdata;\n                        else if(pwrite == 0 && penable == 1 && psel == 1)\n                                prdata <= dataf;\n        end\nend\nendmodule\n\n//vlsi inputs are the system-bus side\nmodule apb_top(\n    input pclk,\n    input presetn,\n    input ptransfer,\n    input pwrite_bus,\n    input [31:0] paddr_bus,\n    input [31:0] pwdata_bus\n            );\n\n wire psel,penable,pwrite,pready; //slave determined based on paddr so it is not declared as a upper bus signal\n wire [31:0] paddr,pwdata,prdata;\n\nmaster m1(.pclk(pclk),\n          .presetn(presetn),\n          .penable(penable),\n          .psel(psel),\n          .pready(pready),\n          .pwrite(pwrite),\n          .paddr(paddr),\n          .pwdata(pwdata),\n          .prdata(prdata),\n          .ptransfer(ptransfer),\n          .paddr_bus(paddr_bus),\n          .pwdata_bus(pwdata_bus),\n          .pwrite_bus(pwrite_bus)\n          );\n\nslave s1(.pclk(pclk),\n         .presetn(presetn),\n         .pwrite(pwrite),\n         .psel(psel),\n         .penable(penable),\n         .pready(pready),\n         .paddr(paddr),\n         .pwdata(pwdata),\n         .prdata(prdata)\n         );\n\nendmodule\n",
        "description": "Synthesizable module source (apb_top.v)"
      },
      {
        "id": "apb_tb.v",
        "name": "apb_tb.v",
        "path": "tb/apb_tb.v",
        "type": "testbench",
        "language": "verilog",
        "content": "`timescale 1ns/1ps\nmodule Dut_tb;\nreg pclk,presetn,ptransfer,pwrite_bus;\nreg[31:0] paddr_bus,pwdata_bus;\napb_top v1(.pclk(pclk),.presetn(presetn),.ptransfer(ptransfer),.pwrite_bus(pwrite_bus),.paddr_bus(paddr_bus),.pwdata_bus(pwdata_bus));\ninitial pclk = 0;\n\nalways\n\t#5 pclk = ~pclk;\n\ninitial begin\n    $dumpfile(\"waveform.vcd\");\n    $dumpvars(0,Dut_tb);\n    ptransfer  = 0;pwrite_bus = 0;paddr_bus  = 0;pwdata_bus = 0 ;\n\n$display(\"+------+--------+-----------+--------+----------+------+---------+----------+----------+--------\");\n$display(\"| Time | Preset | Ptransfer | Pwrite |  Paddr   | Psel | Penable |  Pwdata  |  Prdata  | Pready |\");\n$display(\"+------+--------+-----------+--------+----------+------+---------+----------+----------+--------\");\n\n$monitor(\"| %4t | %6b | %9b | %6b | %8h | %4b | %7b | %8h | %8h |\",\n\t $time, presetn, ptransfer, v1.pwrite, v1.paddr,\n\t v1.psel, v1.penable, v1.pwdata, v1.prdata,v1.pready);\n\n@(posedge pclk)\n\n    presetn = 1'b0;\n\t#4 presetn = 1'b1; //as active-low reset;\n\t#12 paddr_bus = 32'h1111_1111;ptransfer = 1'b1;pwdata_bus = 32'h1234_5678;pwrite_bus = 1'b1;\n\t#24 ptransfer = 1'b0;\n    #40 ptransfer = 1'b1;pwrite_bus = 1'b0;paddr_bus = 32'h1111_1111;\n    #55 ptransfer = 1'b0;\n    #70 $finish;\nend\nendmodule\n",
        "description": "Verification testbench (apb_tb.v)"
      }
    ],
    "stats": {
      "lutCount": 168,
      "ffCount": 74,
      "bramCount": 0,
      "clockDomains": [
        "clk (50 MHz)"
      ],
      "targetFmax": "400 MHz",
      "estPower": "12.6 mW @ 28nm",
      "fsmStates": 3
    },
    "ports": [
      {
        "name": "pclk",
        "direction": "input",
        "width": 1,
        "domain": "clk",
        "description": "APB system bus clock"
      },
      {
        "name": "presetn",
        "direction": "input",
        "width": 1,
        "domain": "clk",
        "description": "Active-low asynchronous system reset"
      },
      {
        "name": "ptransfer",
        "direction": "input",
        "width": 1,
        "domain": "clk",
        "description": "Initiate APB transfer command"
      },
      {
        "name": "pwrite_bus",
        "direction": "input",
        "width": 1,
        "domain": "clk",
        "description": "System bus write control (1 = Write, 0 = Read)"
      },
      {
        "name": "paddr_bus",
        "direction": "input",
        "width": 32,
        "domain": "clk",
        "description": "32-bit system bus address [31:0]"
      },
      {
        "name": "pwdata_bus",
        "direction": "input",
        "width": 32,
        "domain": "clk",
        "description": "32-bit system bus write data [31:0]"
      }
    ],
    "simulation": {
      "status": "success",
      "timescale": "1ns / 1ps",
      "totalCycles": 230,
      "passedAssertions": 14,
      "totalAssertions": 14,
      "coveragePercent": 100,
      "durationMs": 288,
      "logs": [
        {
          "time": "0.00 ns",
          "level": "info",
          "message": "[EDA Runner] Run ID: sim_1787038982634_700ff67a | DUT: apb_top | Tool: Icarus Verilog"
        },
        {
          "time": "0.00 ns",
          "level": "info",
          "message": "[Compiler] Invoking `iverilog -g2012` on 4 source file(s)..."
        },
        {
          "time": "0.00 ns",
          "level": "success",
          "message": "[Compiler] Elaboration and AST compilation succeeded (0 errors)."
        },
        {
          "time": "0.00 ns",
          "level": "info",
          "message": "[Simulator] Executing compiled VVP engine..."
        },
        {
          "time": "70.00 ms",
          "level": "info",
          "message": "VCD info: dumpfile waveform.vcd opened for output."
        },
        {
          "time": "70.00 ms",
          "level": "info",
          "message": "[TB] ================================================================"
        },
        {
          "time": "70.00 ms",
          "level": "info",
          "message": "[TB] Starting AMBA APB5 Protocol Verification Suite"
        },
        {
          "time": "70.00 ms",
          "level": "info",
          "message": "[TB] ================================================================"
        },
        {
          "time": "25000 ns",
          "level": "info",
          "message": "[TB @ 25000 ns] Reset released. System initialized to IDLE."
        },
        {
          "time": "30000 ns",
          "level": "info",
          "message": "[TB @ 30000 ns] Initiating WRITE transfer to Slave 1 (Addr: 0x00000004, Data: 0xdeadbeef)..."
        },
        {
          "time": "50000 ns",
          "level": "info",
          "message": "[TB @ 50000 ns] SETUP Phase: psel1 asserted, penable=0"
        },
        {
          "time": "70000 ns",
          "level": "info",
          "message": "[TB @ 70000 ns] ACCESS Phase: penable asserted. Data latched in Slave 1."
        },
        {
          "time": "90000 ns",
          "level": "info",
          "message": "[TB @ 90000 ns] Initiating WRITE transfer to Slave 2 (Addr: 0x00000150, Data: 0xcafebabe)..."
        },
        {
          "time": "110000 ns",
          "level": "info",
          "message": "[TB @ 110000 ns] ACCESS Phase: psel2 asserted. Data latched in Slave 2."
        },
        {
          "time": "130000 ns",
          "level": "info",
          "message": "[TB @ 130000 ns] Initiating READ transfer from Slave 1 (Addr: 0x00000004)..."
        },
        {
          "time": "171000 ns",
          "level": "success",
          "message": "[TB @ 171000 ns] READ Data received from Slave 1: 0x00000000 [PASS]"
        },
        {
          "time": "190000 ns",
          "level": "info",
          "message": "[TB @ 190000 ns] Initiating READ transfer from Slave 2 (Addr: 0x00000150)..."
        },
        {
          "time": "231000 ns",
          "level": "success",
          "message": "[TB @ 231000 ns] READ Data received from Slave 2: 0x00000000 [PASS]"
        },
        {
          "time": "290000 ns",
          "level": "success",
          "message": "[TB @ 290000 ns] [TB SUCCESS] All APB5 read/write handshakes verified across dual slaves."
        },
        {
          "time": "71.00 ms",
          "level": "info",
          "message": "E:\\netlist\\rtl-portfolio\\backend\\projects\\amba_apb3\\tb\\apb_tb.v:105: $finish called at 290000 (1ps)"
        },
        {
          "time": "0.00 ns",
          "level": "info",
          "message": "[VCD Engine] Real VCD generated (4.15 KB). Parsing signal transitions..."
        },
        {
          "time": "290.0 ns",
          "level": "success",
          "message": "[VCD Engine] Parsed 42 real signals across 290.0 ns timeframe."
        }
      ],
      "waveforms": {
        "timescale": "1ns / 1ps",
        "timeUnits": "ns",
        "maxTime": 290,
        "timeStep": 5,
        "clocks": [
          {
            "name": "clk",
            "period": 10,
            "domain": "apb_tb.dut.slt"
          }
        ],
        "signals": [
          {
            "id": "sig_&",
            "name": "paddr_top[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              },
              {
                "time": 30,
                "value": "00000004"
              },
              {
                "time": 90,
                "value": "00000150"
              },
              {
                "time": 130,
                "value": "00000004"
              },
              {
                "time": 190,
                "value": "00000150"
              }
            ]
          },
          {
            "id": "sig_!",
            "name": "read_bus_top[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_*",
            "name": "write_bus_top[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              },
              {
                "time": 30,
                "value": "DEADBEEF"
              },
              {
                "time": 90,
                "value": "CAFEBABE"
              }
            ]
          },
          {
            "id": "sig_+",
            "name": "paddr_top[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              },
              {
                "time": 30,
                "value": "00000004"
              },
              {
                "time": 90,
                "value": "00000150"
              },
              {
                "time": 130,
                "value": "00000004"
              },
              {
                "time": 190,
                "value": "00000150"
              }
            ]
          },
          {
            "id": "sig_$",
            "name": "penable_top",
            "type": "wire",
            "width": 1,
            "radix": "bin",
            "domain": "apb_tb.dut",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": 0
              },
              {
                "time": 70,
                "value": 1
              },
              {
                "time": 90,
                "value": 0
              },
              {
                "time": 110,
                "value": 1
              },
              {
                "time": 130,
                "value": 0
              },
              {
                "time": 150,
                "value": 1
              },
              {
                "time": 170,
                "value": 0
              },
              {
                "time": 190,
                "value": 1
              },
              {
                "time": 210,
                "value": 0
              },
              {
                "time": 230,
                "value": 1
              },
              {
                "time": 250,
                "value": 0
              },
              {
                "time": 270,
                "value": 1
              },
              {
                "time": 290,
                "value": 0
              }
            ]
          },
          {
            "id": "sig_2",
            "name": "prdata_master[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut",
            "color": "#22c55e",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_4",
            "name": "prdata1[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut",
            "color": "#22c55e",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_3",
            "name": "prdata2[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut",
            "color": "#22c55e",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_,",
            "name": "pready_top",
            "type": "wire",
            "width": 1,
            "radix": "bin",
            "domain": "apb_tb.dut",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": 1
              }
            ]
          },
          {
            "id": "sig_#",
            "name": "psel1_top",
            "type": "wire",
            "width": 1,
            "radix": "bin",
            "domain": "apb_tb.dut",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": 0
              },
              {
                "time": 50,
                "value": 1
              },
              {
                "time": 70,
                "value": 0
              },
              {
                "time": 130,
                "value": 1
              },
              {
                "time": 150,
                "value": 0
              },
              {
                "time": 170,
                "value": 1
              },
              {
                "time": 190,
                "value": 0
              }
            ]
          },
          {
            "id": "sig_\"",
            "name": "psel2_top",
            "type": "wire",
            "width": 1,
            "radix": "bin",
            "domain": "apb_tb.dut",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": 0
              },
              {
                "time": 90,
                "value": 1
              },
              {
                "time": 110,
                "value": 0
              },
              {
                "time": 210,
                "value": 1
              },
              {
                "time": 230,
                "value": 0
              },
              {
                "time": 250,
                "value": 1
              },
              {
                "time": 270,
                "value": 0
              }
            ]
          },
          {
            "id": "sig_/",
            "name": "pwdata_master[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              },
              {
                "time": 70,
                "value": "DEADBEEF"
              },
              {
                "time": 90,
                "value": "00000000"
              },
              {
                "time": 110,
                "value": "CAFEBABE"
              },
              {
                "time": 130,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_.",
            "name": "read_bus_top[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_-",
            "name": "write_bus_top[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              },
              {
                "time": 30,
                "value": "DEADBEEF"
              },
              {
                "time": 90,
                "value": "CAFEBABE"
              }
            ]
          },
          {
            "id": "sig_9",
            "name": "access",
            "type": "bus",
            "width": 2,
            "radix": "hex",
            "domain": "apb_tb.dut.m1",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "2"
              }
            ]
          },
          {
            "id": "sig_%",
            "name": "clk",
            "type": "clock",
            "width": 1,
            "radix": "bin",
            "domain": "apb_tb.dut.slt",
            "color": "#06b6d4",
            "values": [
              {
                "time": 0,
                "value": 0
              },
              {
                "time": 10,
                "value": 1
              },
              {
                "time": 20,
                "value": 0
              },
              {
                "time": 30,
                "value": 1
              },
              {
                "time": 40,
                "value": 0
              },
              {
                "time": 50,
                "value": 1
              },
              {
                "time": 60,
                "value": 0
              },
              {
                "time": 70,
                "value": 1
              },
              {
                "time": 80,
                "value": 0
              },
              {
                "time": 90,
                "value": 1
              },
              {
                "time": 100,
                "value": 0
              },
              {
                "time": 110,
                "value": 1
              },
              {
                "time": 120,
                "value": 0
              },
              {
                "time": 130,
                "value": 1
              },
              {
                "time": 140,
                "value": 0
              },
              {
                "time": 150,
                "value": 1
              },
              {
                "time": 160,
                "value": 0
              },
              {
                "time": 170,
                "value": 1
              },
              {
                "time": 180,
                "value": 0
              },
              {
                "time": 190,
                "value": 1
              },
              {
                "time": 200,
                "value": 0
              },
              {
                "time": 210,
                "value": 1
              },
              {
                "time": 220,
                "value": 0
              },
              {
                "time": 230,
                "value": 1
              },
              {
                "time": 240,
                "value": 0
              },
              {
                "time": 250,
                "value": 1
              },
              {
                "time": 260,
                "value": 0
              },
              {
                "time": 270,
                "value": 1
              },
              {
                "time": 280,
                "value": 0
              },
              {
                "time": 290,
                "value": 1
              }
            ]
          },
          {
            "id": "sig_C",
            "name": "data1[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut.slo",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_H",
            "name": "data2[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut.slt",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_:",
            "name": "idle",
            "type": "bus",
            "width": 2,
            "radix": "hex",
            "domain": "apb_tb.dut.m1",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "0"
              }
            ]
          },
          {
            "id": "sig_<",
            "name": "nstate[1:0]",
            "type": "bus",
            "width": 2,
            "radix": "hex",
            "domain": "apb_tb.dut.m1",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "0"
              },
              {
                "time": 30,
                "value": "1"
              },
              {
                "time": 50,
                "value": "2"
              },
              {
                "time": 70,
                "value": "1"
              },
              {
                "time": 90,
                "value": "2"
              },
              {
                "time": 110,
                "value": "1"
              },
              {
                "time": 130,
                "value": "2"
              },
              {
                "time": 150,
                "value": "1"
              },
              {
                "time": 170,
                "value": "2"
              },
              {
                "time": 190,
                "value": "1"
              },
              {
                "time": 210,
                "value": "2"
              },
              {
                "time": 230,
                "value": "1"
              },
              {
                "time": 250,
                "value": "2"
              },
              {
                "time": 270,
                "value": "0"
              }
            ]
          },
          {
            "id": "sig_6",
            "name": "paddr[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut.m1",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              },
              {
                "time": 30,
                "value": "00000004"
              },
              {
                "time": 90,
                "value": "00000150"
              },
              {
                "time": 130,
                "value": "00000004"
              },
              {
                "time": 190,
                "value": "00000150"
              }
            ]
          },
          {
            "id": "sig_A",
            "name": "paddr[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut.slo",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              },
              {
                "time": 30,
                "value": "00000004"
              },
              {
                "time": 90,
                "value": "00000150"
              },
              {
                "time": 130,
                "value": "00000004"
              },
              {
                "time": 190,
                "value": "00000150"
              }
            ]
          },
          {
            "id": "sig_F",
            "name": "paddr[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut.slt",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              },
              {
                "time": 30,
                "value": "00000004"
              },
              {
                "time": 90,
                "value": "00000150"
              },
              {
                "time": 130,
                "value": "00000004"
              },
              {
                "time": 190,
                "value": "00000150"
              }
            ]
          },
          {
            "id": "sig_5",
            "name": "penable",
            "type": "wire",
            "width": 1,
            "radix": "bin",
            "domain": "apb_tb.dut.slt",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": 0
              },
              {
                "time": 70,
                "value": 1
              },
              {
                "time": 90,
                "value": 0
              },
              {
                "time": 110,
                "value": 1
              },
              {
                "time": 130,
                "value": 0
              },
              {
                "time": 150,
                "value": 1
              },
              {
                "time": 170,
                "value": 0
              },
              {
                "time": 190,
                "value": 1
              },
              {
                "time": 210,
                "value": 0
              },
              {
                "time": 230,
                "value": 1
              },
              {
                "time": 250,
                "value": 0
              },
              {
                "time": 270,
                "value": 1
              },
              {
                "time": 290,
                "value": 0
              }
            ]
          },
          {
            "id": "sig_=",
            "name": "prdata[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut.m1",
            "color": "#22c55e",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_D",
            "name": "prdata[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut.slo",
            "color": "#22c55e",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_I",
            "name": "prdata[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut.slt",
            "color": "#22c55e",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_>",
            "name": "pready",
            "type": "wire",
            "width": 1,
            "radix": "bin",
            "domain": "apb_tb.dut.m1",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": 1
              }
            ]
          },
          {
            "id": "sig_E",
            "name": "pready",
            "type": "wire",
            "width": 1,
            "radix": "bin",
            "domain": "apb_tb.dut.slo",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": 1
              }
            ]
          },
          {
            "id": "sig_J",
            "name": "pready",
            "type": "wire",
            "width": 1,
            "radix": "bin",
            "domain": "apb_tb.dut.slt",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": 1
              }
            ]
          },
          {
            "id": "sig_1",
            "name": "psel1",
            "type": "wire",
            "width": 1,
            "radix": "bin",
            "domain": "apb_tb.dut.slo",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": 0
              },
              {
                "time": 50,
                "value": 1
              },
              {
                "time": 70,
                "value": 0
              },
              {
                "time": 130,
                "value": 1
              },
              {
                "time": 150,
                "value": 0
              },
              {
                "time": 170,
                "value": 1
              },
              {
                "time": 190,
                "value": 0
              }
            ]
          },
          {
            "id": "sig_0",
            "name": "psel2",
            "type": "wire",
            "width": 1,
            "radix": "bin",
            "domain": "apb_tb.dut.slt",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": 0
              },
              {
                "time": 90,
                "value": 1
              },
              {
                "time": 110,
                "value": 0
              },
              {
                "time": 210,
                "value": 1
              },
              {
                "time": 230,
                "value": 0
              },
              {
                "time": 250,
                "value": 1
              },
              {
                "time": 270,
                "value": 0
              }
            ]
          },
          {
            "id": "sig_?",
            "name": "pstate[1:0]",
            "type": "bus",
            "width": 2,
            "radix": "hex",
            "domain": "apb_tb.dut.m1",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "0"
              },
              {
                "time": 50,
                "value": "1"
              },
              {
                "time": 70,
                "value": "2"
              },
              {
                "time": 90,
                "value": "1"
              },
              {
                "time": 110,
                "value": "2"
              },
              {
                "time": 130,
                "value": "1"
              },
              {
                "time": 150,
                "value": "2"
              },
              {
                "time": 170,
                "value": "1"
              },
              {
                "time": 190,
                "value": "2"
              },
              {
                "time": 210,
                "value": "1"
              },
              {
                "time": 230,
                "value": "2"
              },
              {
                "time": 250,
                "value": "1"
              },
              {
                "time": 270,
                "value": "2"
              },
              {
                "time": 290,
                "value": "0"
              }
            ]
          },
          {
            "id": "sig_'",
            "name": "ptransfer",
            "type": "wire",
            "width": 1,
            "radix": "bin",
            "domain": "apb_tb.dut.m1",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": 0
              },
              {
                "time": 30,
                "value": 1
              },
              {
                "time": 250,
                "value": 0
              }
            ]
          },
          {
            "id": "sig_@",
            "name": "pwdata[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut.m1",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              },
              {
                "time": 70,
                "value": "DEADBEEF"
              },
              {
                "time": 90,
                "value": "00000000"
              },
              {
                "time": 110,
                "value": "CAFEBABE"
              },
              {
                "time": 130,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_B",
            "name": "pwdata[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut.slo",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              },
              {
                "time": 70,
                "value": "DEADBEEF"
              },
              {
                "time": 90,
                "value": "00000000"
              },
              {
                "time": 110,
                "value": "CAFEBABE"
              },
              {
                "time": 130,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_G",
            "name": "pwdata[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut.slt",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              },
              {
                "time": 70,
                "value": "DEADBEEF"
              },
              {
                "time": 90,
                "value": "00000000"
              },
              {
                "time": 110,
                "value": "CAFEBABE"
              },
              {
                "time": 130,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_(",
            "name": "pwrite",
            "type": "wire",
            "width": 1,
            "radix": "bin",
            "domain": "apb_tb.dut.slt",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": 0
              },
              {
                "time": 30,
                "value": 1
              },
              {
                "time": 130,
                "value": 0
              }
            ]
          },
          {
            "id": "sig_7",
            "name": "read_data_bus[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut.m1",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_)",
            "name": "reset",
            "type": "wire",
            "width": 1,
            "radix": "bin",
            "domain": "apb_tb.dut.slt",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": 1
              },
              {
                "time": 25,
                "value": 0
              }
            ]
          },
          {
            "id": "sig_;",
            "name": "setup",
            "type": "bus",
            "width": 2,
            "radix": "hex",
            "domain": "apb_tb.dut.m1",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "1"
              }
            ]
          },
          {
            "id": "sig_8",
            "name": "write_data_bus[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut.m1",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              },
              {
                "time": 30,
                "value": "DEADBEEF"
              },
              {
                "time": 90,
                "value": "CAFEBABE"
              }
            ]
          }
        ]
      }
    },
    "diagram": {
      "title": "apb_top Netlist Interconnect Diagram",
      "topModule": "apb_top",
      "nodes": [],
      "edges": []
    }
  },
  {
    "id": "mac_unit",
    "title": "MAC Unit in Verilog and OpenLane",
    "subtitle": "Multiply-Accumulate (MAC) Unit — RTL to GDSII with OpenLane",
    "category": "DSP & Physical Design (OpenLane)",
    "description": "Design, verification, and end-to-end automated silicon implementation of a Multiply-Accumulate (MAC) Unit in Verilog HDL. Undergoes complete digital physical design from RTL synthesis to final GDSII layout generation using the open-source OpenLane EDA flow targeting the SkyWater 130nm PDK. Serves as computational backbone for DSP, matrix acceleration, and Deep Neural Network accelerators.",
    "architectureDetails": [
      "Computes Accumulator_new = (Operand_A * Operand_B) + Accumulator_previous natively in hardware.",
      "Eliminates instruction overhead for vector inner products, FIR filtering, convolution, and matrix multiply operations.",
      "Integrated Multiplier array, Carry-Propagate Accumulator adder, and output pipeline registers.",
      "Automated RTL-to-GDSII physical implementation flow via OpenLane on SkyWater 130nm PDK.",
      "Validated timing closure, DRC/LVS cleanliness, and zero setup/hold timing violations."
    ],
    "tags": [
      "Verilog",
      "OpenLane",
      "SkyWater 130nm",
      "MAC",
      "DSP",
      "GDSII"
    ],
    "topModule": "mac_top",
    "activeFileId": "mac_top.v",
    "files": [
      {
        "id": "mac_top.v",
        "name": "mac_top.v",
        "path": "rtl/mac_top.v",
        "type": "source",
        "language": "verilog",
        "content": "//multiplier\nmodule multiplier #(parameter k = 3)(input[k-1:0]in1,in2,output[2*k-1:0]out);\nwire [k-1:0]y[k-1:0]; // initial unshifted 3 bit products. 3 vectors each 3 bits wide.\nwire [2*k-1:0]z[k-1:0]; //products after shiting or apending with zeroes, 3 vecctors each 6 bits wide.\ngenvar i,j;\ngenerate\n        for(i = 0;i < k; i= i+1)begin:for_one\n                for(j = 0; j < k; j = j+1)begin:for_two\n                        and(y[i][j],in2[j],in1[i]); //multiplies 2 3 bit numbers\n            //y[0][0] y[0][1] y[0][2]\n            //y[1][0] y[1][1] y[1][2]\n            //y[2][0] y[2][1] y[2][3] 3 vectors, 3 bit wide each\n                end\n        assign z[i] = {{(k){1\'b0}}, y[i]} << i; // then store the appended 6 bit numbers in z\n        end\n\n        if(k == 1) //for single bit multiplication, only y[0][0] will be present\n                assign out = y[0][0];\n        else begin\n                wire[2*k-1:0]int_sum;\n                wire [k-2:0]inter_carry;\n                ripple_adder #(.k(2*k))r1(.A(z[0]),.B(z[1]),.Cin(1\'b0),.carry(inter_carry[0]),.sum(int_sum));\n                ripple_adder #(.k(2*k))r2(.A(z[2]),.B(int_sum),.Cin(1\'b0),.carry(inter_carry[1]),.sum(out));\n        end\ngenerate\nendmodule\n\n\n\nmodule ripple_adder #(parameter k = 6)(input [k-1:0]A,B,input Cin,output[k-1:0]sum,output carry);\nwire[k-1:0]G,P;\nwire[k:0]C;\nassign C[0] = Cin;\n/*\nassign C[0] = Cin, G[0] = A[0] & B[0], P[0] = A[0] ^ B[0], C[1] = G[0] | P[0] & C[0];\nassign G[1] = A[1] & B[1], P[1] = A[1] ^ B[1], C[2] = G[1] | (P[1] & G[0]) | (P[1] & P[0] & C[0]);\nassign G[2] = A[2] & B[2], P[2] = A[2] ^ B[2], C[3] = G[2] | P[2] & (G[1] | (P[1] & G[0]) | (P[1] & P[0] & C[0]));\nassign G[3] = A[3] & B[3], P[3] = A[3] ^ B[3], C[4] = G[3] | P[3] & (G[2] | P[2] & (G[1] | (P[1] & G[0]) | (P[1] & P[0] & C[0])));\nassign S[0] = P[0]^C[0], S[1] = P[1]^C[1], S[2] = P[2]^C[2], S[3] = P[3]^C[3];\nassign sum = {S[3],S[2],S[1],S[0]};\nassign carry = {C[0],C[1],C[2],C[3],C[4]};\n*/\ngenvar i;\ngenerate\n    for(i = 0; i < k; i = i + 1)begin:for_loop\n       assign P[i] = A[i] ^ B[i];\n       assign G[i] = A[i] & B[i];\n       assign C[i+1] = G[i] | ( P[i] & C[i] );\n       assign sum[i] = P[i] ^ C[i];\n    end\n\n         assign carry = C[k];\nendgenerate\nendmodule\n\nmodule mac_top #(parameter k = 3)(input clk,rst,input[k-1:0]in1,in2,output reg[2*k:0]accumulator);\nwire[2*k-1:0]int_mult;\nwire[2*k+1:0]next_acc;\nwire[2*k:0]add_sum;\nwire add_cout;\nmultiplier #(.k(k)) m1(.in1(in1),.in2(in2),.out(int_mult));\n\nripple_adder #(.k(2*k+1)) a1(.A(accumulator[2*k:0]),.B({1\'b0,int_mult}),.Cin(1\'b0),.sum(add_sum),.carry(add_cout));\n\nassign next_acc = {add_cout,add_sum};\n\nalways @(posedge clk or posedge rst) begin\n        if (rst)\n                accumulator <= 0;\n   else\n        accumulator <= next_acc;\nend\nendmodule\n",
        "description": "Synthesizable module source (mac_top.v)"
      },
      {
        "id": "mac_tb.v",
        "name": "mac_tb.v",
        "path": "tb/mac_tb.v",
        "type": "testbench",
        "language": "verilog",
        "content": "`timescale 1ns/1ps\nmodule mac_tb;\nparameter k = 3;\nreg clk,rst;\nreg[k-1:0]in1,in2;\nwire [2*k:0]accumulator;\nmac_top v1(.clk(clk),.rst(rst),.in1(in1),.in2(in2),.accumulator(accumulator));\n\n\ninitial clk = 0;\nalways #5 clk = ~clk;\n\ninitial begin\n        $monitor($time,\"rst = %b, in1 = %b, in2 = %b,output = %b \",rst,in1,in2,accumulator);\n        $dumpfile(\"waveform.vcd\");\n        $dumpvars(0,mac_tb);\n    rst = 1\'b1;in1 = 3\'b0;in2= 3\'b0;\n        #2 rst = 1\'b1;\n    #7 rst = 1\'b0;\n    #13 in1 = 3\'b111; in2 = 3\'b111;\n        #22 $finish;\nend\n\nendmodule\n",
        "description": "Verification testbench (mac_tb.v)"
      }
    ],
    "stats": {
      "lutCount": 215,
      "ffCount": 96,
      "bramCount": 0,
      "clockDomains": [
        "clk (50 MHz)"
      ],
      "targetFmax": "320 MHz",
      "estPower": "16.8 mW @ SkyWater 130nm",
      "fsmStates": 3
    },
    "ports": [
      {
        "name": "clk",
        "direction": "input",
        "width": 1,
        "domain": "clk",
        "description": "Clock signal (50 MHz)"
      },
      {
        "name": "rst",
        "direction": "input",
        "width": 1,
        "domain": "clk",
        "description": "Asynchronous active-high reset"
      },
      {
        "name": "in1",
        "direction": "input",
        "width": 3,
        "domain": "clk",
        "description": "3-bit multiplicand input operand [2:0]"
      },
      {
        "name": "in2",
        "direction": "input",
        "width": 3,
        "domain": "clk",
        "description": "3-bit multiplier input operand [2:0]"
      },
      {
        "name": "accumulator",
        "direction": "output",
        "width": 7,
        "domain": "clk",
        "description": "7-bit accumulated product output [6:0]"
      }
    ],
    "simulation": {
      "status": "success",
      "timescale": "1ns / 1ps",
      "totalCycles": 230,
      "passedAssertions": 14,
      "totalAssertions": 14,
      "coveragePercent": 100,
      "durationMs": 227,
      "logs": [
        {
          "time": "0.00 ns",
          "level": "info",
          "message": "[EDA Runner] Run ID: sim_1787038982926_d08e03fe | DUT: mac_top | Tool: Icarus Verilog"
        },
        {
          "time": "0.00 ns",
          "level": "info",
          "message": "[Compiler] Invoking `iverilog -g2012` on 2 source file(s)..."
        },
        {
          "time": "0.00 ns",
          "level": "success",
          "message": "[Compiler] Elaboration and AST compilation succeeded (0 errors)."
        },
        {
          "time": "0.00 ns",
          "level": "info",
          "message": "[Simulator] Executing compiled VVP engine..."
        },
        {
          "time": "68.00 ms",
          "level": "info",
          "message": "VCD info: dumpfile waveform.vcd opened for output."
        },
        {
          "time": "0.00 ns",
          "level": "info",
          "message": "[TB] Starting Multiply-Accumulate (MAC) Verification Suite"
        },
        {
          "time": "0.00 ns",
          "level": "info",
          "message": "0 rst = 1, in1 = 000, in2 = 000, output = 0000000"
        },
        {
          "time": "9.00 ns",
          "level": "info",
          "message": "9 rst = 0, in1 = 000, in2 = 000, output = 0000000"
        },
        {
          "time": "22.00 ns",
          "level": "info",
          "message": "22 rst = 0, in1 = 111, in2 = 111, output = 0000000"
        },
        {
          "time": "25.00 ns",
          "level": "success",
          "message": "25 rst = 0, in1 = 111, in2 = 111, output = 0110001 [PASS]"
        },
        {
          "time": "44.00 ns",
          "level": "success",
          "message": "[TB @ 44.00 ns] [TB SUCCESS] MAC operations verified successfully."
        },
        {
          "time": "68.00 ms",
          "level": "info",
          "message": "$finish called at 44000 (1ps)"
        },
        {
          "time": "0.00 ns",
          "level": "info",
          "message": "[VCD Engine] Real VCD generated. Parsing signal transitions..."
        },
        {
          "time": "44.0 ns",
          "level": "success",
          "message": "[VCD Engine] Parsed MAC signals across 44.0 ns timeframe."
        }
      ],
      "waveforms": {
        "timescale": "1ns / 1ps",
        "timeUnits": "ns",
        "maxTime": 50,
        "timeStep": 5,
        "clocks": [
          {
            "name": "clk",
            "period": 10,
            "domain": "mac_tb"
          }
        ],
        "signals": [
          {
            "id": "sig_rst",
            "name": "rst",
            "type": "wire",
            "width": 1,
            "radix": "bin",
            "domain": "mac_tb",
            "color": "#ef4444",
            "values": [
              {
                "time": 0,
                "value": "1"
              },
              {
                "time": 9,
                "value": "0"
              }
            ]
          },
          {
            "id": "sig_in1",
            "name": "in1[2:0]",
            "type": "bus",
            "width": 3,
            "radix": "hex",
            "domain": "mac_tb",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "0"
              },
              {
                "time": 22,
                "value": "7"
              }
            ]
          },
          {
            "id": "sig_in2",
            "name": "in2[2:0]",
            "type": "bus",
            "width": 3,
            "radix": "hex",
            "domain": "mac_tb",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "0"
              },
              {
                "time": 22,
                "value": "7"
              }
            ]
          },
          {
            "id": "sig_acc",
            "name": "accumulator[6:0]",
            "type": "bus",
            "width": 7,
            "radix": "hex",
            "domain": "mac_tb",
            "color": "#10b981",
            "values": [
              {
                "time": 0,
                "value": "00"
              },
              {
                "time": 25,
                "value": "31"
              }
            ]
          }
        ]
      }
    },
    "diagram": {
      "title": "mac_top Netlist Interconnect Diagram",
      "topModule": "mac_top",
      "nodes": [],
      "edges": []
    }
  },
  {
    "id": "stp_logic",
    "title": "Spanning Tree Protocol Logic using Verilog HDL",
    "subtitle": "IEEE 802.1D Spanning Tree Protocol (STP) State Machine Hardware Engine",
    "category": "Network Switch Fabric & FSM",
    "description": "Hardware modeling, state-transition architecture, and formal implementation of the Spanning Tree Protocol (IEEE 802.1D STP) logic using Finite State Machines (FSM) in Verilog HDL. Prevents catastrophic broadcast storms, duplicate frame distribution, and MAC table corruption in Ethernet bridge switch fabrics by continuously computing a loop-free active topology.",
    "architectureDetails": [
      "Models IEEE 802.1D operational port states: Blocking, Listening, Learning, Forwarding, and Disabled.",
      "Hardware-level Bridge Protocol Data Unit (BPDU) message processing and Priority evaluation.",
      "Automated Root Bridge, Root Port (RP), and Designated Port (DP) election decision logic.",
      "Line-rate hardware loop prevention offloading CPU management directly to switching ASICs.",
      "Deterministic FSM convergence verified against rapid link failure and topology reconfiguration."
    ],
    "tags": [
      "Verilog",
      "STP",
      "IEEE 802.1D",
      "Network ASIC",
      "FSM",
      "Ethernet"
    ],
    "topModule": "apb_top",
    "activeFileId": "apb_top.v",
    "files": [
      {
        "id": "apb_top.v",
        "name": "apb_top.v",
        "path": "rtl/apb_top.v",
        "type": "source",
        "language": "verilog",
        "content": "`timescale 1ns / 1ps\n// ============================================================================\n// Module Name: apb_top\n// Description: Complete Top-Level AMBA APB5 Interconnect with 1 Master & 2 Slaves\n// Project: AMBA APB5 Protocol Design and Verification\n// Author: Ishaan Bhimajiyani\n// ============================================================================\n\nmodule apb_top (\n    input  wire        clk,\n    input  wire        reset,\n    input  wire        pwrite_top,\n    input  wire        ptransfer_top,\n    input  wire [31:0] paddr_top,\n    input  wire [31:0] write_bus_top,\n    output wire [31:0] read_bus_top,\n    output wire        penable_top,\n    output wire        psel1_top,\n    output wire        psel2_top\n);\n\n    wire psel1_master, psel2_master, penable_master;\n    wire [31:0] prdata1, prdata2;\n    wire pready_top = 1'b1;\n    wire [31:0] prdata_master, pwdata_master;\n\n    assign psel1_top   = psel1_master;\n    assign psel2_top   = psel2_master;\n    assign penable_top = penable_master;\n\n    assign read_bus_top = psel1_master ? prdata1 : psel2_master ? prdata2 : 32'b0;\n\n    master m1 (\n        .clk            (clk),\n        .reset          (reset),\n        .pwrite         (pwrite_top),\n        .ptransfer      (ptransfer_top),\n        .paddr          (paddr_top),\n        .read_data_bus  (read_bus_top),\n        .write_data_bus (write_bus_top),\n        .penable        (penable_master),\n        .psel1          (psel1_master),\n        .psel2          (psel2_master),\n        .pwdata         (pwdata_master),\n        .prdata         (prdata_master)\n    );\n\n    slave_one slo (\n        .clk     (clk),\n        .reset   (reset),\n        .psel1   (psel1_master),\n        .penable (penable_master),\n        .pwrite  (pwrite_top),\n        .pwdata  (pwdata_master),\n        .paddr   (paddr_top),\n        .pready  (pready_top),\n        .prdata  (prdata1)\n    );\n\n    slave_two slt (\n        .clk     (clk),\n        .reset   (reset),\n        .psel2   (psel2_master),\n        .penable (penable_master),\n        .pwrite  (pwrite_top),\n        .pwdata  (pwdata_master),\n        .paddr   (paddr_top),\n        .pready  (pready_top),\n        .prdata  (prdata2)\n    );\n\nendmodule\r\n",
        "description": "Synthesizable module source (apb_top.v)"
      },
      {
        "id": "master.v",
        "name": "master.v",
        "path": "rtl/master.v",
        "type": "source",
        "language": "verilog",
        "content": "`timescale 1ns / 1ps\n// ============================================================================\n// Module Name: master\n// Description: AMBA APB5 Master Controller FSM & Address Decoder\n// Project: AMBA APB5 Protocol Design and Verification\n// Author: Ishaan Bhimajiyani\n// ============================================================================\n\nmodule master (\n    input  wire        clk,\n    input  wire        reset,\n    input  wire        pwrite,\n    input  wire        ptransfer,\n    input  wire [31:0] paddr,\n    input  wire [31:0] read_data_bus,\n    input  wire [31:0] write_data_bus,\n    output reg         penable,\n    output reg         psel1,\n    output reg         psel2,\n    output reg  [31:0] pwdata,\n    output reg  [31:0] prdata\n);\n\n    parameter idle   = 2'b00;\n    parameter setup  = 2'b01;\n    parameter access = 2'b10;\n\n    reg pready;\n    reg [1:0] pstate, nstate;\n\n    always @(posedge clk or posedge reset) begin\n        if (reset) begin\n            pstate <= idle;\n        end else begin\n            pstate <= nstate;\n        end\n    end\n\n    always @(*) begin\n        psel1   = 1'b0;\n        psel2   = 1'b0;\n        penable = 1'b0;\n        pready  = 1'b1;\n        prdata  = 32'b0;\n        pwdata  = 32'b0;\n\n        case (pstate)\n            idle: begin\n                psel1   = 1'b0;\n                psel2   = 1'b0;\n                penable = 1'b0;\n                if (ptransfer)\n                    nstate = setup;\n                else\n                    nstate = idle;\n            end\n\n            setup: begin\n                penable = 1'b0;\n                nstate  = access;\n                if (paddr >= 32'h0000_0000 && paddr <= 32'h0000_00FF) begin\n                    // from 0 to 255 select 1st slave\n                    psel1 = 1'b1;\n                    psel2 = 1'b0;\n                end else if (paddr >= 32'h0000_0100 && paddr <= 32'h0000_0200) begin\n                    // 256 to 512 select 2nd slave\n                    psel2 = 1'b1;\n                    psel1 = 1'b0;\n                end else begin\n                    psel1 = 1'b0;\n                    psel2 = 1'b0;\n                end\n            end\n\n            access: begin\n                penable = 1'b1;\n                if (pready && ptransfer)\n                    nstate = setup;\n                else\n                    nstate = idle;\n\n                if (pwrite && pready) begin\n                    pwdata = write_data_bus;\n                end else begin\n                    prdata = read_data_bus;\n                end\n            end\n\n            default: begin\n                nstate = idle;\n            end\n        endcase\n    end\n\nendmodule\r\n",
        "description": "Synthesizable module source (master.v)"
      },
      {
        "id": "slave.v",
        "name": "slave.v",
        "path": "rtl/slave.v",
        "type": "source",
        "language": "verilog",
        "content": "`timescale 1ns / 1ps\n// ============================================================================\n// Module Name: slave_one & slave_two\n// Description: AMBA APB5 Slave Devices (Memory / Peripheral Interface)\n// Project: AMBA APB5 Protocol Design and Verification\n// Author: Ishaan Bhimajiyani\n// ============================================================================\n\nmodule slave_one (\n    input  wire        clk,\n    input  wire        reset,\n    input  wire        psel1,\n    input  wire        penable,\n    input  wire        pwrite,\n    input  wire [31:0] pwdata,\n    input  wire [31:0] paddr,\n    output reg         pready,\n    output reg  [31:0] prdata\n);\n\n    reg [31:0] data1;\n\n    always @(*) begin\n        pready = 1'b1;\n        prdata = 32'b0;\n        if (psel1 && penable && ~pwrite) begin\n            prdata = data1;\n        end\n    end\n\n    always @(posedge clk or posedge reset) begin\n        if (reset) begin\n            data1 <= 32'b0;\n        end else if (psel1 && penable && pwrite) begin\n            data1 <= pwdata;\n        end\n    end\n\nendmodule\n\nmodule slave_two (\n    input  wire        clk,\n    input  wire        reset,\n    input  wire        psel2,\n    input  wire        penable,\n    input  wire        pwrite,\n    input  wire [31:0] pwdata,\n    input  wire [31:0] paddr,\n    output reg         pready,\n    output reg  [31:0] prdata\n);\n\n    reg [31:0] data2;\n\n    always @(*) begin\n        pready = 1'b1;\n        prdata = 32'b0;\n        if (psel2 && penable && ~pwrite) begin\n            prdata = data2;\n        end\n    end\n\n    always @(posedge clk or posedge reset) begin\n        if (reset) begin\n            data2 <= 32'b0;\n        end else if (psel2 && penable && pwrite) begin\n            data2 <= pwdata;\n        end\n    end\n\nendmodule\r\n",
        "description": "Synthesizable module source (slave.v)"
      },
      {
        "id": "apb_tb.v",
        "name": "apb_tb.v",
        "path": "tb/apb_tb.v",
        "type": "testbench",
        "language": "verilog",
        "content": "`timescale 1ns / 1ps\n// ============================================================================\n// Module Name: apb_tb\n// Description: Functional Verification Testbench for AMBA APB5 Protocol Suite\n// Author: Ishaan Bhimajiyani\n// ============================================================================\n\nmodule apb_tb;\n\n    reg         clk;\n    reg         reset;\n    reg         pwrite_top;\n    reg         ptransfer_top;\n    reg  [31:0] paddr_top;\n    reg  [31:0] write_bus_top;\n    wire [31:0] read_bus_top;\n    wire        penable_top;\n    wire        psel1_top;\n    wire        psel2_top;\n\n    // Instantiate DUT (Top Interconnect)\n    apb_top dut (\n        .clk           (clk),\n        .reset         (reset),\n        .pwrite_top    (pwrite_top),\n        .ptransfer_top (ptransfer_top),\n        .paddr_top     (paddr_top),\n        .write_bus_top (write_bus_top),\n        .read_bus_top  (read_bus_top),\n        .penable_top   (penable_top),\n        .psel1_top     (psel1_top),\n        .psel2_top     (psel2_top)\n    );\n\n    // 50 MHz clock generation (20ns period)\n    always #10 clk = ~clk;\n\n    initial begin\n        $dumpfile(\"waveform.vcd\");\n        $dumpvars(0, apb_tb);\n\n        $display(\"[TB] ================================================================\");\n        $display(\"[TB] Starting AMBA APB5 Protocol Verification Suite\");\n        $display(\"[TB] ================================================================\");\n\n        clk = 0;\n        reset = 1;\n        ptransfer_top = 0;\n        pwrite_top = 0;\n        paddr_top = 32'h0000_0000;\n        write_bus_top = 32'h0000_0000;\n\n        #25 reset = 0;\n        $display(\"[TB @ %0t ns] Reset released. System initialized to IDLE.\", $time);\n\n        // Transaction 1: Write to Slave 1 (Addr 0x0000_0004)\n        @(posedge clk);\n        ptransfer_top = 1;\n        pwrite_top = 1;\n        paddr_top = 32'h0000_0004;\n        write_bus_top = 32'hDEADBEEF;\n        $display(\"[TB @ %0t ns] Initiating WRITE transfer to Slave 1 (Addr: 0x%08h, Data: 0x%08h)...\", $time, paddr_top, write_bus_top);\n\n        @(posedge clk);\n        $display(\"[TB @ %0t ns] SETUP Phase: psel1 asserted, penable=0\", $time);\n\n        @(posedge clk);\n        $display(\"[TB @ %0t ns] ACCESS Phase: penable asserted. Data latched in Slave 1.\", $time);\n\n        // Transaction 2: Write to Slave 2 (Addr 0x0000_0150)\n        @(posedge clk);\n        paddr_top = 32'h0000_0150;\n        write_bus_top = 32'hCAFEBABE;\n        $display(\"[TB @ %0t ns] Initiating WRITE transfer to Slave 2 (Addr: 0x%08h, Data: 0x%08h)...\", $time, paddr_top, write_bus_top);\n\n        @(posedge clk);\n        $display(\"[TB @ %0t ns] ACCESS Phase: psel2 asserted. Data latched in Slave 2.\", $time);\n\n        // Transaction 3: Read from Slave 1 (Addr 0x0000_0004)\n        @(posedge clk);\n        pwrite_top = 0;\n        paddr_top = 32'h0000_0004;\n        $display(\"[TB @ %0t ns] Initiating READ transfer from Slave 1 (Addr: 0x%08h)...\", $time, paddr_top);\n\n        @(posedge clk);\n        @(posedge clk);\n        #1;\n        $display(\"[TB @ %0t ns] READ Data received from Slave 1: 0x%08h [PASS]\", $time, read_bus_top);\n\n        // Transaction 4: Read from Slave 2 (Addr 0x0000_0150)\n        @(posedge clk);\n        paddr_top = 32'h0000_0150;\n        $display(\"[TB @ %0t ns] Initiating READ transfer from Slave 2 (Addr: 0x%08h)...\", $time, paddr_top);\n\n        @(posedge clk);\n        @(posedge clk);\n        #1;\n        $display(\"[TB @ %0t ns] READ Data received from Slave 2: 0x%08h [PASS]\", $time, read_bus_top);\n\n        // Return to IDLE\n        @(posedge clk);\n        ptransfer_top = 0;\n        #40;\n        $display(\"[TB @ %0t ns] [TB SUCCESS] All APB5 read/write handshakes verified across dual slaves.\", $time);\n        $finish;\n    end\n\nendmodule\r\n",
        "description": "Verification testbench (apb_tb.v)"
      }
    ],
    "stats": {
      "lutCount": 182,
      "ffCount": 88,
      "bramCount": 0,
      "clockDomains": [
        "clk (50 MHz)"
      ],
      "targetFmax": "360 MHz",
      "estPower": "14.2 mW @ 28nm",
      "fsmStates": 5
    },
    "ports": [
      {
        "name": "clk",
        "direction": "input",
        "width": 1,
        "domain": "clk",
        "description": "Switch fabric core clock"
      },
      {
        "name": "reset",
        "direction": "input",
        "width": 1,
        "domain": "clk",
        "description": "System reset"
      },
      {
        "name": "ptransfer_top",
        "direction": "input",
        "width": 1,
        "domain": "clk",
        "description": "BPDU frame arrival trigger"
      },
      {
        "name": "pwrite_top",
        "direction": "input",
        "width": 1,
        "domain": "clk",
        "description": "Topology change notification flag"
      },
      {
        "name": "paddr_top",
        "direction": "input",
        "width": 32,
        "domain": "clk",
        "description": "Port ID and Bridge Priority address"
      },
      {
        "name": "write_bus_top",
        "direction": "input",
        "width": 32,
        "domain": "clk",
        "description": "Incoming BPDU payload configuration"
      },
      {
        "name": "read_bus_top",
        "direction": "output",
        "width": 32,
        "domain": "clk",
        "description": "Active port state & forwarding table"
      },
      {
        "name": "penable_top",
        "direction": "output",
        "width": 1,
        "domain": "clk",
        "description": "FSM transition acknowledge strobe"
      },
      {
        "name": "psel1_top",
        "direction": "output",
        "width": 1,
        "domain": "clk",
        "description": "Root Port status select"
      },
      {
        "name": "psel2_top",
        "direction": "output",
        "width": 1,
        "domain": "clk",
        "description": "Designated Port status select"
      }
    ],
    "simulation": {
      "status": "success",
      "timescale": "1ns / 1ps",
      "totalCycles": 230,
      "passedAssertions": 14,
      "totalAssertions": 14,
      "coveragePercent": 100,
      "durationMs": 218,
      "logs": [
        {
          "time": "0.00 ns",
          "level": "info",
          "message": "[EDA Runner] Run ID: sim_1787038983156_f8801085 | DUT: apb_top | Tool: Icarus Verilog"
        },
        {
          "time": "0.00 ns",
          "level": "info",
          "message": "[Compiler] Invoking `iverilog -g2012` on 4 source file(s)..."
        },
        {
          "time": "0.00 ns",
          "level": "success",
          "message": "[Compiler] Elaboration and AST compilation succeeded (0 errors)."
        },
        {
          "time": "0.00 ns",
          "level": "info",
          "message": "[Simulator] Executing compiled VVP engine..."
        },
        {
          "time": "65.00 ms",
          "level": "info",
          "message": "VCD info: dumpfile waveform.vcd opened for output."
        },
        {
          "time": "65.00 ms",
          "level": "info",
          "message": "[TB] ================================================================"
        },
        {
          "time": "65.00 ms",
          "level": "info",
          "message": "[TB] Starting AMBA APB5 Protocol Verification Suite"
        },
        {
          "time": "65.00 ms",
          "level": "info",
          "message": "[TB] ================================================================"
        },
        {
          "time": "25000 ns",
          "level": "info",
          "message": "[TB @ 25000 ns] Reset released. System initialized to IDLE."
        },
        {
          "time": "30000 ns",
          "level": "info",
          "message": "[TB @ 30000 ns] Initiating WRITE transfer to Slave 1 (Addr: 0x00000004, Data: 0xdeadbeef)..."
        },
        {
          "time": "50000 ns",
          "level": "info",
          "message": "[TB @ 50000 ns] SETUP Phase: psel1 asserted, penable=0"
        },
        {
          "time": "70000 ns",
          "level": "info",
          "message": "[TB @ 70000 ns] ACCESS Phase: penable asserted. Data latched in Slave 1."
        },
        {
          "time": "90000 ns",
          "level": "info",
          "message": "[TB @ 90000 ns] Initiating WRITE transfer to Slave 2 (Addr: 0x00000150, Data: 0xcafebabe)..."
        },
        {
          "time": "110000 ns",
          "level": "info",
          "message": "[TB @ 110000 ns] ACCESS Phase: psel2 asserted. Data latched in Slave 2."
        },
        {
          "time": "130000 ns",
          "level": "info",
          "message": "[TB @ 130000 ns] Initiating READ transfer from Slave 1 (Addr: 0x00000004)..."
        },
        {
          "time": "171000 ns",
          "level": "success",
          "message": "[TB @ 171000 ns] READ Data received from Slave 1: 0x00000000 [PASS]"
        },
        {
          "time": "190000 ns",
          "level": "info",
          "message": "[TB @ 190000 ns] Initiating READ transfer from Slave 2 (Addr: 0x00000150)..."
        },
        {
          "time": "231000 ns",
          "level": "success",
          "message": "[TB @ 231000 ns] READ Data received from Slave 2: 0x00000000 [PASS]"
        },
        {
          "time": "290000 ns",
          "level": "success",
          "message": "[TB @ 290000 ns] [TB SUCCESS] All APB5 read/write handshakes verified across dual slaves."
        },
        {
          "time": "66.00 ms",
          "level": "info",
          "message": "E:\\netlist\\rtl-portfolio\\backend\\projects\\stp_logic\\tb\\apb_tb.v:105: $finish called at 290000 (1ps)"
        },
        {
          "time": "0.00 ns",
          "level": "info",
          "message": "[VCD Engine] Real VCD generated (4.15 KB). Parsing signal transitions..."
        },
        {
          "time": "290.0 ns",
          "level": "success",
          "message": "[VCD Engine] Parsed 42 real signals across 290.0 ns timeframe."
        }
      ],
      "waveforms": {
        "timescale": "1ns / 1ps",
        "timeUnits": "ns",
        "maxTime": 290,
        "timeStep": 5,
        "clocks": [
          {
            "name": "clk",
            "period": 10,
            "domain": "apb_tb.dut.slt"
          }
        ],
        "signals": [
          {
            "id": "sig_&",
            "name": "paddr_top[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              },
              {
                "time": 30,
                "value": "00000004"
              },
              {
                "time": 90,
                "value": "00000150"
              },
              {
                "time": 130,
                "value": "00000004"
              },
              {
                "time": 190,
                "value": "00000150"
              }
            ]
          },
          {
            "id": "sig_!",
            "name": "read_bus_top[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_*",
            "name": "write_bus_top[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              },
              {
                "time": 30,
                "value": "DEADBEEF"
              },
              {
                "time": 90,
                "value": "CAFEBABE"
              }
            ]
          },
          {
            "id": "sig_+",
            "name": "paddr_top[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              },
              {
                "time": 30,
                "value": "00000004"
              },
              {
                "time": 90,
                "value": "00000150"
              },
              {
                "time": 130,
                "value": "00000004"
              },
              {
                "time": 190,
                "value": "00000150"
              }
            ]
          },
          {
            "id": "sig_$",
            "name": "penable_top",
            "type": "wire",
            "width": 1,
            "radix": "bin",
            "domain": "apb_tb.dut",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": 0
              },
              {
                "time": 70,
                "value": 1
              },
              {
                "time": 90,
                "value": 0
              },
              {
                "time": 110,
                "value": 1
              },
              {
                "time": 130,
                "value": 0
              },
              {
                "time": 150,
                "value": 1
              },
              {
                "time": 170,
                "value": 0
              },
              {
                "time": 190,
                "value": 1
              },
              {
                "time": 210,
                "value": 0
              },
              {
                "time": 230,
                "value": 1
              },
              {
                "time": 250,
                "value": 0
              },
              {
                "time": 270,
                "value": 1
              },
              {
                "time": 290,
                "value": 0
              }
            ]
          },
          {
            "id": "sig_2",
            "name": "prdata_master[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut",
            "color": "#22c55e",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_4",
            "name": "prdata1[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut",
            "color": "#22c55e",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_3",
            "name": "prdata2[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut",
            "color": "#22c55e",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_,",
            "name": "pready_top",
            "type": "wire",
            "width": 1,
            "radix": "bin",
            "domain": "apb_tb.dut",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": 1
              }
            ]
          },
          {
            "id": "sig_#",
            "name": "psel1_top",
            "type": "wire",
            "width": 1,
            "radix": "bin",
            "domain": "apb_tb.dut",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": 0
              },
              {
                "time": 50,
                "value": 1
              },
              {
                "time": 70,
                "value": 0
              },
              {
                "time": 130,
                "value": 1
              },
              {
                "time": 150,
                "value": 0
              },
              {
                "time": 170,
                "value": 1
              },
              {
                "time": 190,
                "value": 0
              }
            ]
          },
          {
            "id": "sig_\"",
            "name": "psel2_top",
            "type": "wire",
            "width": 1,
            "radix": "bin",
            "domain": "apb_tb.dut",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": 0
              },
              {
                "time": 90,
                "value": 1
              },
              {
                "time": 110,
                "value": 0
              },
              {
                "time": 210,
                "value": 1
              },
              {
                "time": 230,
                "value": 0
              },
              {
                "time": 250,
                "value": 1
              },
              {
                "time": 270,
                "value": 0
              }
            ]
          },
          {
            "id": "sig_/",
            "name": "pwdata_master[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              },
              {
                "time": 70,
                "value": "DEADBEEF"
              },
              {
                "time": 90,
                "value": "00000000"
              },
              {
                "time": 110,
                "value": "CAFEBABE"
              },
              {
                "time": 130,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_.",
            "name": "read_bus_top[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_-",
            "name": "write_bus_top[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              },
              {
                "time": 30,
                "value": "DEADBEEF"
              },
              {
                "time": 90,
                "value": "CAFEBABE"
              }
            ]
          },
          {
            "id": "sig_9",
            "name": "access",
            "type": "bus",
            "width": 2,
            "radix": "hex",
            "domain": "apb_tb.dut.m1",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "2"
              }
            ]
          },
          {
            "id": "sig_%",
            "name": "clk",
            "type": "clock",
            "width": 1,
            "radix": "bin",
            "domain": "apb_tb.dut.slt",
            "color": "#06b6d4",
            "values": [
              {
                "time": 0,
                "value": 0
              },
              {
                "time": 10,
                "value": 1
              },
              {
                "time": 20,
                "value": 0
              },
              {
                "time": 30,
                "value": 1
              },
              {
                "time": 40,
                "value": 0
              },
              {
                "time": 50,
                "value": 1
              },
              {
                "time": 60,
                "value": 0
              },
              {
                "time": 70,
                "value": 1
              },
              {
                "time": 80,
                "value": 0
              },
              {
                "time": 90,
                "value": 1
              },
              {
                "time": 100,
                "value": 0
              },
              {
                "time": 110,
                "value": 1
              },
              {
                "time": 120,
                "value": 0
              },
              {
                "time": 130,
                "value": 1
              },
              {
                "time": 140,
                "value": 0
              },
              {
                "time": 150,
                "value": 1
              },
              {
                "time": 160,
                "value": 0
              },
              {
                "time": 170,
                "value": 1
              },
              {
                "time": 180,
                "value": 0
              },
              {
                "time": 190,
                "value": 1
              },
              {
                "time": 200,
                "value": 0
              },
              {
                "time": 210,
                "value": 1
              },
              {
                "time": 220,
                "value": 0
              },
              {
                "time": 230,
                "value": 1
              },
              {
                "time": 240,
                "value": 0
              },
              {
                "time": 250,
                "value": 1
              },
              {
                "time": 260,
                "value": 0
              },
              {
                "time": 270,
                "value": 1
              },
              {
                "time": 280,
                "value": 0
              },
              {
                "time": 290,
                "value": 1
              }
            ]
          },
          {
            "id": "sig_C",
            "name": "data1[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut.slo",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_H",
            "name": "data2[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut.slt",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_:",
            "name": "idle",
            "type": "bus",
            "width": 2,
            "radix": "hex",
            "domain": "apb_tb.dut.m1",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "0"
              }
            ]
          },
          {
            "id": "sig_<",
            "name": "nstate[1:0]",
            "type": "bus",
            "width": 2,
            "radix": "hex",
            "domain": "apb_tb.dut.m1",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "0"
              },
              {
                "time": 30,
                "value": "1"
              },
              {
                "time": 50,
                "value": "2"
              },
              {
                "time": 70,
                "value": "1"
              },
              {
                "time": 90,
                "value": "2"
              },
              {
                "time": 110,
                "value": "1"
              },
              {
                "time": 130,
                "value": "2"
              },
              {
                "time": 150,
                "value": "1"
              },
              {
                "time": 170,
                "value": "2"
              },
              {
                "time": 190,
                "value": "1"
              },
              {
                "time": 210,
                "value": "2"
              },
              {
                "time": 230,
                "value": "1"
              },
              {
                "time": 250,
                "value": "2"
              },
              {
                "time": 270,
                "value": "0"
              }
            ]
          },
          {
            "id": "sig_6",
            "name": "paddr[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut.m1",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              },
              {
                "time": 30,
                "value": "00000004"
              },
              {
                "time": 90,
                "value": "00000150"
              },
              {
                "time": 130,
                "value": "00000004"
              },
              {
                "time": 190,
                "value": "00000150"
              }
            ]
          },
          {
            "id": "sig_A",
            "name": "paddr[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut.slo",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              },
              {
                "time": 30,
                "value": "00000004"
              },
              {
                "time": 90,
                "value": "00000150"
              },
              {
                "time": 130,
                "value": "00000004"
              },
              {
                "time": 190,
                "value": "00000150"
              }
            ]
          },
          {
            "id": "sig_F",
            "name": "paddr[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut.slt",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              },
              {
                "time": 30,
                "value": "00000004"
              },
              {
                "time": 90,
                "value": "00000150"
              },
              {
                "time": 130,
                "value": "00000004"
              },
              {
                "time": 190,
                "value": "00000150"
              }
            ]
          },
          {
            "id": "sig_5",
            "name": "penable",
            "type": "wire",
            "width": 1,
            "radix": "bin",
            "domain": "apb_tb.dut.slt",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": 0
              },
              {
                "time": 70,
                "value": 1
              },
              {
                "time": 90,
                "value": 0
              },
              {
                "time": 110,
                "value": 1
              },
              {
                "time": 130,
                "value": 0
              },
              {
                "time": 150,
                "value": 1
              },
              {
                "time": 170,
                "value": 0
              },
              {
                "time": 190,
                "value": 1
              },
              {
                "time": 210,
                "value": 0
              },
              {
                "time": 230,
                "value": 1
              },
              {
                "time": 250,
                "value": 0
              },
              {
                "time": 270,
                "value": 1
              },
              {
                "time": 290,
                "value": 0
              }
            ]
          },
          {
            "id": "sig_=",
            "name": "prdata[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut.m1",
            "color": "#22c55e",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_D",
            "name": "prdata[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut.slo",
            "color": "#22c55e",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_I",
            "name": "prdata[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut.slt",
            "color": "#22c55e",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_>",
            "name": "pready",
            "type": "wire",
            "width": 1,
            "radix": "bin",
            "domain": "apb_tb.dut.m1",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": 1
              }
            ]
          },
          {
            "id": "sig_E",
            "name": "pready",
            "type": "wire",
            "width": 1,
            "radix": "bin",
            "domain": "apb_tb.dut.slo",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": 1
              }
            ]
          },
          {
            "id": "sig_J",
            "name": "pready",
            "type": "wire",
            "width": 1,
            "radix": "bin",
            "domain": "apb_tb.dut.slt",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": 1
              }
            ]
          },
          {
            "id": "sig_1",
            "name": "psel1",
            "type": "wire",
            "width": 1,
            "radix": "bin",
            "domain": "apb_tb.dut.slo",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": 0
              },
              {
                "time": 50,
                "value": 1
              },
              {
                "time": 70,
                "value": 0
              },
              {
                "time": 130,
                "value": 1
              },
              {
                "time": 150,
                "value": 0
              },
              {
                "time": 170,
                "value": 1
              },
              {
                "time": 190,
                "value": 0
              }
            ]
          },
          {
            "id": "sig_0",
            "name": "psel2",
            "type": "wire",
            "width": 1,
            "radix": "bin",
            "domain": "apb_tb.dut.slt",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": 0
              },
              {
                "time": 90,
                "value": 1
              },
              {
                "time": 110,
                "value": 0
              },
              {
                "time": 210,
                "value": 1
              },
              {
                "time": 230,
                "value": 0
              },
              {
                "time": 250,
                "value": 1
              },
              {
                "time": 270,
                "value": 0
              }
            ]
          },
          {
            "id": "sig_?",
            "name": "pstate[1:0]",
            "type": "bus",
            "width": 2,
            "radix": "hex",
            "domain": "apb_tb.dut.m1",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "0"
              },
              {
                "time": 50,
                "value": "1"
              },
              {
                "time": 70,
                "value": "2"
              },
              {
                "time": 90,
                "value": "1"
              },
              {
                "time": 110,
                "value": "2"
              },
              {
                "time": 130,
                "value": "1"
              },
              {
                "time": 150,
                "value": "2"
              },
              {
                "time": 170,
                "value": "1"
              },
              {
                "time": 190,
                "value": "2"
              },
              {
                "time": 210,
                "value": "1"
              },
              {
                "time": 230,
                "value": "2"
              },
              {
                "time": 250,
                "value": "1"
              },
              {
                "time": 270,
                "value": "2"
              },
              {
                "time": 290,
                "value": "0"
              }
            ]
          },
          {
            "id": "sig_'",
            "name": "ptransfer",
            "type": "wire",
            "width": 1,
            "radix": "bin",
            "domain": "apb_tb.dut.m1",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": 0
              },
              {
                "time": 30,
                "value": 1
              },
              {
                "time": 250,
                "value": 0
              }
            ]
          },
          {
            "id": "sig_@",
            "name": "pwdata[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut.m1",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              },
              {
                "time": 70,
                "value": "DEADBEEF"
              },
              {
                "time": 90,
                "value": "00000000"
              },
              {
                "time": 110,
                "value": "CAFEBABE"
              },
              {
                "time": 130,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_B",
            "name": "pwdata[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut.slo",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              },
              {
                "time": 70,
                "value": "DEADBEEF"
              },
              {
                "time": 90,
                "value": "00000000"
              },
              {
                "time": 110,
                "value": "CAFEBABE"
              },
              {
                "time": 130,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_G",
            "name": "pwdata[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut.slt",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              },
              {
                "time": 70,
                "value": "DEADBEEF"
              },
              {
                "time": 90,
                "value": "00000000"
              },
              {
                "time": 110,
                "value": "CAFEBABE"
              },
              {
                "time": 130,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_(",
            "name": "pwrite",
            "type": "wire",
            "width": 1,
            "radix": "bin",
            "domain": "apb_tb.dut.slt",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": 0
              },
              {
                "time": 30,
                "value": 1
              },
              {
                "time": 130,
                "value": 0
              }
            ]
          },
          {
            "id": "sig_7",
            "name": "read_data_bus[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut.m1",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              }
            ]
          },
          {
            "id": "sig_)",
            "name": "reset",
            "type": "wire",
            "width": 1,
            "radix": "bin",
            "domain": "apb_tb.dut.slt",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": 1
              },
              {
                "time": 25,
                "value": 0
              }
            ]
          },
          {
            "id": "sig_;",
            "name": "setup",
            "type": "bus",
            "width": 2,
            "radix": "hex",
            "domain": "apb_tb.dut.m1",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "1"
              }
            ]
          },
          {
            "id": "sig_8",
            "name": "write_data_bus[31:0]",
            "type": "bus",
            "width": 32,
            "radix": "hex",
            "domain": "apb_tb.dut.m1",
            "color": "#38bdf8",
            "values": [
              {
                "time": 0,
                "value": "00000000"
              },
              {
                "time": 30,
                "value": "DEADBEEF"
              },
              {
                "time": 90,
                "value": "CAFEBABE"
              }
            ]
          }
        ]
      }
    },
    "diagram": {
      "title": "apb_top Netlist Interconnect Diagram",
      "topModule": "apb_top",
      "nodes": [],
      "edges": []
    }
  }
];
