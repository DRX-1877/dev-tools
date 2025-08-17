#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { commandMemory } from "./command-memory.js";
import { contextMemory } from "./context-memory.js";

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

// 命令记忆工具的参数模式
const AddCommandArgsSchema = z.object({
  command: z.string().describe("要保存的命令"),
  description: z.string().describe("命令描述"),
  category: z.string().optional().describe("命令类别"),
  tags: z.array(z.string()).optional().describe("命令标签"),
  context: z.string().optional().describe("生成命令的上下文"),
});

const SearchCommandsArgsSchema = z.object({
  query: z.string().describe("搜索关键词"),
  limit: z.number().optional().describe("返回结果数量限制"),
});

const GetCommandArgsSchema = z.object({
  id: z.string().describe("命令ID"),
});

const GetCommandsByCategoryArgsSchema = z.object({
  category: z.string().describe("类别名称"),
});

const UpdateCommandArgsSchema = z.object({
  id: z.string().describe("命令ID"),
  command: z.string().optional().describe("新命令"),
  description: z.string().optional().describe("新描述"),
  category: z.string().optional().describe("新类别"),
  tags: z.array(z.string()).optional().describe("新标签"),
});

const DeleteCommandArgsSchema = z.object({
  id: z.string().describe("命令ID"),
});

// 上下文记忆工具的参数模式
const AddContextArgsSchema = z.object({
  key: z.string().describe("简短的缩略词/关键词"),
  title: z.string().describe("上下文标题"),
  content: z.string().describe("完整的上下文内容"),
  category: z.string().optional().describe("分类"),
  tags: z.array(z.string()).optional().describe("标签"),
  priority: z.number().optional().describe("优先级 (1-5)"),
});

const GetContextByKeyArgsSchema = z.object({
  key: z.string().describe("关键词"),
});

const GetContextByIdArgsSchema = z.object({
  id: z.string().describe("上下文ID"),
});

const SearchContextsArgsSchema = z.object({
  query: z.string().describe("搜索关键词"),
  limit: z.number().optional().describe("返回结果数量限制"),
});

const GetContextsByCategoryArgsSchema = z.object({
  category: z.string().describe("类别名称"),
});

const UpdateContextArgsSchema = z.object({
  id: z.string().describe("上下文ID"),
  key: z.string().optional().describe("新关键词"),
  title: z.string().optional().describe("新标题"),
  content: z.string().optional().describe("新内容"),
  category: z.string().optional().describe("新类别"),
  tags: z.array(z.string()).optional().describe("新标签"),
  priority: z.number().optional().describe("新优先级"),
});

const DeleteContextArgsSchema = z.object({
  id: z.string().describe("上下文ID"),
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
  {
    name: "add_command",
    description: "保存AI生成的命令到记忆中",
    inputSchema: AddCommandArgsSchema,
  },
  {
    name: "search_commands",
    description: "搜索之前保存的命令",
    inputSchema: SearchCommandsArgsSchema,
  },
  {
    name: "get_command",
    description: "根据ID获取特定命令",
    inputSchema: GetCommandArgsSchema,
  },
  {
    name: "get_commands_by_category",
    description: "获取指定类别的所有命令",
    inputSchema: GetCommandsByCategoryArgsSchema,
  },
  {
    name: "get_most_used_commands",
    description: "获取最常用的命令",
    inputSchema: z.object({
      limit: z.number().optional().describe("返回结果数量限制"),
    }),
  },
  {
    name: "get_recent_commands",
    description: "获取最近添加的命令",
    inputSchema: z.object({
      limit: z.number().optional().describe("返回结果数量限制"),
    }),
  },
  {
    name: "get_command_categories",
    description: "获取所有命令类别",
    inputSchema: z.object({}),
  },
  {
    name: "get_command_stats",
    description: "获取命令记忆统计信息",
    inputSchema: z.object({}),
  },
  {
    name: "update_command",
    description: "更新已保存的命令",
    inputSchema: UpdateCommandArgsSchema,
  },
  {
    name: "delete_command",
    description: "删除已保存的命令",
    inputSchema: DeleteCommandArgsSchema,
  },
  // 上下文记忆工具
  {
    name: "add_context",
    description: "保存常用的上下文信息",
    inputSchema: AddContextArgsSchema,
  },
  {
    name: "get_context_by_key",
    description: "根据关键词快速获取上下文",
    inputSchema: GetContextByKeyArgsSchema,
  },
  {
    name: "get_context_by_id",
    description: "根据ID获取上下文",
    inputSchema: GetContextByIdArgsSchema,
  },
  {
    name: "search_contexts",
    description: "搜索上下文信息",
    inputSchema: SearchContextsArgsSchema,
  },
  {
    name: "get_contexts_by_category",
    description: "获取指定类别的所有上下文",
    inputSchema: GetContextsByCategoryArgsSchema,
  },
  {
    name: "get_most_used_contexts",
    description: "获取最常用的上下文",
    inputSchema: z.object({
      limit: z.number().optional().describe("返回结果数量限制"),
    }),
  },
  {
    name: "get_high_priority_contexts",
    description: "获取高优先级的上下文",
    inputSchema: z.object({
      limit: z.number().optional().describe("返回结果数量限制"),
    }),
  },
  {
    name: "get_recent_contexts",
    description: "获取最近添加的上下文",
    inputSchema: z.object({
      limit: z.number().optional().describe("返回结果数量限制"),
    }),
  },
  {
    name: "get_context_categories",
    description: "获取所有上下文类别",
    inputSchema: z.object({}),
  },
  {
    name: "get_context_keys",
    description: "获取所有可用的关键词",
    inputSchema: z.object({}),
  },
  {
    name: "get_context_stats",
    description: "获取上下文记忆统计信息",
    inputSchema: z.object({}),
  },
  {
    name: "update_context",
    description: "更新已保存的上下文",
    inputSchema: UpdateContextArgsSchema,
  },
  {
    name: "delete_context",
    description: "删除已保存的上下文",
    inputSchema: DeleteContextArgsSchema,
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

      // 命令记忆工具
      case "add_command": {
        const { command, description, category = "general", tags = [], context } = AddCommandArgsSchema.parse(args);
        const id = await commandMemory.addCommand(command, description, category, tags, context);
        return {
          content: [
            {
              type: "text",
              text: `命令已保存！ID: ${id}\n命令: ${command}\n描述: ${description}\n类别: ${category}\n标签: ${tags.join(", ")}`,
            },
          ],
        };
      }

      case "search_commands": {
        const { query, limit = 10 } = SearchCommandsArgsSchema.parse(args);
        const commands = await commandMemory.searchCommands(query, limit);
        if (commands.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `没有找到匹配 "${query}" 的命令。`,
              },
            ],
          };
        }
        
        const results = commands.map(cmd => 
          `ID: ${cmd.id}\n命令: ${cmd.command}\n描述: ${cmd.description}\n类别: ${cmd.category}\n使用次数: ${cmd.usageCount}\n---`
        ).join("\n");
        
        return {
          content: [
            {
              type: "text",
              text: `找到 ${commands.length} 个匹配的命令：\n\n${results}`,
            },
          ],
        };
      }

      case "get_command": {
        const { id } = GetCommandArgsSchema.parse(args);
        const command = await commandMemory.getCommand(id);
        if (!command) {
          return {
            content: [
              {
                type: "text",
                text: `未找到ID为 "${id}" 的命令。`,
              },
            ],
          };
        }
        
        return {
          content: [
            {
              type: "text",
              text: `命令详情：\nID: ${command.id}\n命令: ${command.command}\n描述: ${command.description}\n类别: ${command.category}\n标签: ${command.tags.join(", ")}\n创建时间: ${command.createdAt}\n使用次数: ${command.usageCount}\n${command.context ? `上下文: ${command.context}` : ""}`,
            },
          ],
        };
      }

      case "get_commands_by_category": {
        const { category } = GetCommandsByCategoryArgsSchema.parse(args);
        const commands = await commandMemory.getCommandsByCategory(category);
        if (commands.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `类别 "${category}" 中没有命令。`,
              },
            ],
          };
        }
        
        const results = commands.map(cmd => 
          `ID: ${cmd.id}\n命令: ${cmd.command}\n描述: ${cmd.description}\n使用次数: ${cmd.usageCount}\n---`
        ).join("\n");
        
        return {
          content: [
            {
              type: "text",
              text: `类别 "${category}" 中的命令 (${commands.length} 个)：\n\n${results}`,
            },
          ],
        };
      }

      case "get_most_used_commands": {
        const limit = (args as any).limit || 10;
        const commands = await commandMemory.getMostUsedCommands(limit);
        if (commands.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "还没有保存任何命令。",
              },
            ],
          };
        }
        
        const results = commands.map(cmd => 
          `ID: ${cmd.id}\n命令: ${cmd.command}\n描述: ${cmd.description}\n使用次数: ${cmd.usageCount}\n---`
        ).join("\n");
        
        return {
          content: [
            {
              type: "text",
              text: `最常用的命令 (${commands.length} 个)：\n\n${results}`,
            },
          ],
        };
      }

      case "get_recent_commands": {
        const limit = (args as any).limit || 10;
        const commands = await commandMemory.getRecentCommands(limit);
        if (commands.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "还没有保存任何命令。",
              },
            ],
          };
        }
        
        const results = commands.map(cmd => 
          `ID: ${cmd.id}\n命令: ${cmd.command}\n描述: ${cmd.description}\n创建时间: ${cmd.createdAt}\n---`
        ).join("\n");
        
        return {
          content: [
            {
              type: "text",
              text: `最近添加的命令 (${commands.length} 个)：\n\n${results}`,
            },
          ],
        };
      }

      case "get_command_categories": {
        const categories = await commandMemory.getCategories();
        if (categories.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "还没有任何命令类别。",
              },
            ],
          };
        }
        
        return {
          content: [
            {
              type: "text",
              text: `所有命令类别 (${categories.length} 个)：\n${categories.join("\n")}`,
            },
          ],
        };
      }

      case "get_command_stats": {
        const stats = await commandMemory.getStats();
        return {
          content: [
            {
              type: "text",
              text: `命令记忆统计信息：\n总命令数: ${stats.totalCommands}\n类别数: ${stats.categories}\n标签数: ${stats.tags}\n最常用类别: ${stats.mostUsedCategory}\n平均使用次数: ${stats.averageUsage}`,
            },
          ],
        };
      }

      case "update_command": {
        const { id, ...updates } = UpdateCommandArgsSchema.parse(args);
        const success = await commandMemory.updateCommand(id, updates);
        if (!success) {
          return {
            content: [
              {
                type: "text",
                text: `未找到ID为 "${id}" 的命令。`,
              },
            ],
          };
        }
        
        return {
          content: [
            {
              type: "text",
              text: `命令 "${id}" 已更新成功！`,
            },
          ],
        };
      }

      case "delete_command": {
        const { id } = DeleteCommandArgsSchema.parse(args);
        const success = await commandMemory.deleteCommand(id);
        if (!success) {
          return {
            content: [
              {
                type: "text",
                text: `未找到ID为 "${id}" 的命令。`,
              },
            ],
          };
        }
        
        return {
          content: [
            {
              type: "text",
              text: `命令 "${id}" 已删除成功！`,
            },
          ],
        };
      }

      // 上下文记忆工具
      case "add_context": {
        const { key, title, content, category = "general", tags = [], priority = 1 } = AddContextArgsSchema.parse(args);
        const id = await contextMemory.addContext(key, title, content, category, tags, priority);
        return {
          content: [
            {
              type: "text",
              text: `上下文已保存！ID: ${id}\n关键词: ${key}\n标题: ${title}\n类别: ${category}\n优先级: ${priority}\n标签: ${tags.join(", ")}`,
            },
          ],
        };
      }

      case "get_context_by_key": {
        const { key } = GetContextByKeyArgsSchema.parse(args);
        const context = await contextMemory.getContextByKey(key);
        if (!context) {
          return {
            content: [
              {
                type: "text",
                text: `未找到关键词为 "${key}" 的上下文。`,
              },
            ],
          };
        }
        
        return {
          content: [
            {
              type: "text",
              text: `上下文信息：\n关键词: ${context.key}\n标题: ${context.title}\n内容: ${context.content}\n类别: ${context.category}\n优先级: ${context.priority}\n标签: ${context.tags.join(", ")}\n使用次数: ${context.usageCount}`,
            },
          ],
        };
      }

      case "get_context_by_id": {
        const { id } = GetContextByIdArgsSchema.parse(args);
        const context = await contextMemory.getContextById(id);
        if (!context) {
          return {
            content: [
              {
                type: "text",
                text: `未找到ID为 "${id}" 的上下文。`,
              },
            ],
          };
        }
        
        return {
          content: [
            {
              type: "text",
              text: `上下文详情：\nID: ${context.id}\n关键词: ${context.key}\n标题: ${context.title}\n内容: ${context.content}\n类别: ${context.category}\n优先级: ${context.priority}\n标签: ${context.tags.join(", ")}\n创建时间: ${context.createdAt}\n使用次数: ${context.usageCount}`,
            },
          ],
        };
      }

      case "search_contexts": {
        const { query, limit = 10 } = SearchContextsArgsSchema.parse(args);
        const contexts = await contextMemory.searchContexts(query, limit);
        if (contexts.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `没有找到匹配 "${query}" 的上下文。`,
              },
            ],
          };
        }
        
        const results = contexts.map(ctx => 
          `关键词: ${ctx.key}\n标题: ${ctx.title}\n类别: ${ctx.category}\n优先级: ${ctx.priority}\n使用次数: ${ctx.usageCount}\n---`
        ).join("\n");
        
        return {
          content: [
            {
              type: "text",
              text: `找到 ${contexts.length} 个匹配的上下文：\n\n${results}`,
            },
          ],
        };
      }

      case "get_contexts_by_category": {
        const { category } = GetContextsByCategoryArgsSchema.parse(args);
        const contexts = await contextMemory.getContextsByCategory(category);
        if (contexts.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `类别 "${category}" 中没有上下文。`,
              },
            ],
          };
        }
        
        const results = contexts.map(ctx => 
          `关键词: ${ctx.key}\n标题: ${ctx.title}\n优先级: ${ctx.priority}\n使用次数: ${ctx.usageCount}\n---`
        ).join("\n");
        
        return {
          content: [
            {
              type: "text",
              text: `类别 "${category}" 中的上下文 (${contexts.length} 个)：\n\n${results}`,
            },
          ],
        };
      }

      case "get_most_used_contexts": {
        const limit = (args as any).limit || 10;
        const contexts = await contextMemory.getMostUsedContexts(limit);
        if (contexts.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "还没有保存任何上下文。",
              },
            ],
          };
        }
        
        const results = contexts.map(ctx => 
          `关键词: ${ctx.key}\n标题: ${ctx.title}\n类别: ${ctx.category}\n使用次数: ${ctx.usageCount}\n---`
        ).join("\n");
        
        return {
          content: [
            {
              type: "text",
              text: `最常用的上下文 (${contexts.length} 个)：\n\n${results}`,
            },
          ],
        };
      }

      case "get_high_priority_contexts": {
        const limit = (args as any).limit || 10;
        const contexts = await contextMemory.getHighPriorityContexts(limit);
        if (contexts.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "没有高优先级的上下文。",
              },
            ],
          };
        }
        
        const results = contexts.map(ctx => 
          `关键词: ${ctx.key}\n标题: ${ctx.title}\n类别: ${ctx.category}\n优先级: ${ctx.priority}\n使用次数: ${ctx.usageCount}\n---`
        ).join("\n");
        
        return {
          content: [
            {
              type: "text",
              text: `高优先级的上下文 (${contexts.length} 个)：\n\n${results}`,
            },
          ],
        };
      }

      case "get_recent_contexts": {
        const limit = (args as any).limit || 10;
        const contexts = await contextMemory.getRecentContexts(limit);
        if (contexts.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "还没有保存任何上下文。",
              },
            ],
          };
        }
        
        const results = contexts.map(ctx => 
          `关键词: ${ctx.key}\n标题: ${ctx.title}\n创建时间: ${ctx.createdAt}\n---`
        ).join("\n");
        
        return {
          content: [
            {
              type: "text",
              text: `最近添加的上下文 (${contexts.length} 个)：\n\n${results}`,
            },
          ],
        };
      }

      case "get_context_categories": {
        const categories = await contextMemory.getCategories();
        if (categories.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "还没有任何上下文类别。",
              },
            ],
          };
        }
        
        return {
          content: [
            {
              type: "text",
              text: `所有上下文类别 (${categories.length} 个)：\n${categories.join("\n")}`,
            },
          ],
        };
      }

      case "get_context_keys": {
        const keys = await contextMemory.getKeys();
        if (keys.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "还没有保存任何上下文。",
              },
            ],
          };
        }
        
        return {
          content: [
            {
              type: "text",
              text: `所有可用的关键词 (${keys.length} 个)：\n${keys.join("\n")}`,
            },
          ],
        };
      }

      case "get_context_stats": {
        const stats = await contextMemory.getStats();
        return {
          content: [
            {
              type: "text",
              text: `上下文记忆统计信息：\n总上下文数: ${stats.totalContexts}\n类别数: ${stats.categories}\n标签数: ${stats.tags}\n关键词数: ${stats.keys}\n最常用类别: ${stats.mostUsedCategory}\n平均使用次数: ${stats.averageUsage}\n高优先级数量: ${stats.highPriorityCount}`,
            },
          ],
        };
      }

      case "update_context": {
        const { id, ...updates } = UpdateContextArgsSchema.parse(args);
        const success = await contextMemory.updateContext(id, updates);
        if (!success) {
          return {
            content: [
              {
                type: "text",
                text: `未找到ID为 "${id}" 的上下文。`,
              },
            ],
          };
        }
        
        return {
          content: [
            {
              type: "text",
              text: `上下文 "${id}" 已更新成功！`,
            },
          ],
        };
      }

      case "delete_context": {
        const { id } = DeleteContextArgsSchema.parse(args);
        const success = await contextMemory.deleteContext(id);
        if (!success) {
          return {
            content: [
              {
                type: "text",
                text: `未找到ID为 "${id}" 的上下文。`,
              },
            ],
          };
        }
        
        return {
          content: [
            {
              type: "text",
              text: `上下文 "${id}" 已删除成功！`,
            },
          ],
        };
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
  // 初始化命令记忆和上下文记忆
  await commandMemory.initialize();
  await contextMemory.initialize();
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP服务器已启动");
}

main().catch((error) => {
  console.error("服务器启动失败:", error);
  process.exit(1);
});
