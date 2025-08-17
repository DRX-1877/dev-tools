#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// 创建MCP服务器
const server = new Server(
  {
    name: "dev-tools-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 定义工具的参数模式
const HelloWorldArgsSchema = z.object({
  name: z.string().describe("要问候的人名"),
});

const CalculateArgsSchema = z.object({
  operation: z.enum(["add", "subtract", "multiply", "divide"]).describe("运算类型"),
  a: z.number().describe("第一个数字"),
  b: z.number().describe("第二个数字"),
});

const FileInfoArgsSchema = z.object({
  path: z.string().describe("文件路径"),
});

// 定义工具列表
const tools = [
  {
    name: "hello_world",
    description: "一个简单的问候工具",
    inputSchema: HelloWorldArgsSchema,
  },
  {
    name: "calculate",
    description: "简单的计算器",
    inputSchema: CalculateArgsSchema,
  },
  {
    name: "file_info",
    description: "获取文件信息",
    inputSchema: FileInfoArgsSchema,
  },
];

// 处理工具列表请求
server.setRequestHandler(
  z.object({
    method: z.literal("tools/list"),
  }),
  async () => {
    return {
      tools,
    };
  }
);

// 处理工具调用请求
server.setRequestHandler(
  z.object({
    method: z.literal("tools/call"),
    params: z.object({
      name: z.string(),
      arguments: z.record(z.unknown()),
    }),
  }),
  async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "hello_world": {
        const { name: userName } = HelloWorldArgsSchema.parse(args);
        return {
          content: [
            {
              type: "text",
              text: `Hello, ${userName}! 欢迎使用MCP服务器！`,
            },
          ],
        };
      }

      case "calculate": {
        const { operation, a, b } = CalculateArgsSchema.parse(args);
        let result: number;

        switch (operation) {
          case "add":
            result = a + b;
            break;
          case "subtract":
            result = a - b;
            break;
          case "multiply":
            result = a * b;
            break;
          case "divide":
            if (b === 0) {
              return {
                content: [
                  {
                    type: "text",
                    text: "错误：除数不能为零",
                  },
                ],
              };
            }
            result = a / b;
            break;
          default:
            return {
              content: [
                {
                  type: "text",
                  text: `不支持的运算: ${operation}`,
                },
              ],
            };
        }

        return {
          content: [
            {
              type: "text",
              text: `${a} ${operation} ${b} = ${result}`,
            },
          ],
        };
      }

      case "file_info": {
        const { path } = FileInfoArgsSchema.parse(args);
        const fs = await import("fs/promises");
        
        try {
          const stats = await fs.stat(path);
          return {
            content: [
              {
                type: "text",
                text: `文件路径: ${path}\n大小: ${stats.size} 字节\n创建时间: ${stats.birthtime}\n修改时间: ${stats.mtime}\n是否为文件: ${stats.isFile()}\n是否为目录: ${stats.isDirectory()}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `获取文件信息失败: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: `未知工具: ${name}`,
            },
          ],
        };
    }
  }
);

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP服务器已启动");
}

main().catch((error) => {
  console.error("服务器启动失败:", error);
  process.exit(1);
});
