# Dev Tools MCP Server

这是一个使用TypeScript编写的MCP（Model Context Protocol）服务器示例。

## 功能

这个MCP服务器提供了以下工具：

1. **hello_world** - 简单的问候工具
   - 参数：`name` (string) - 要问候的人名

2. **calculate** - 简单的计算器
   - 参数：
     - `operation` (string) - 运算类型：add, subtract, multiply, divide
     - `a` (number) - 第一个数字
     - `b` (number) - 第二个数字

3. **file_info** - 获取文件信息
   - 参数：`path` (string) - 文件路径

### 命令记忆工具

4. **add_command** - 保存AI生成的命令到记忆中
   - 参数：
     - `command` (string) - 要保存的命令
     - `description` (string) - 命令描述
     - `category` (string, 可选) - 命令类别
     - `tags` (string[], 可选) - 命令标签
     - `context` (string, 可选) - 生成命令的上下文

5. **search_commands** - 搜索之前保存的命令
   - 参数：
     - `query` (string) - 搜索关键词
     - `limit` (number, 可选) - 返回结果数量限制

6. **get_command** - 根据ID获取特定命令
   - 参数：`id` (string) - 命令ID

7. **get_commands_by_category** - 获取指定类别的所有命令
   - 参数：`category` (string) - 类别名称

8. **get_most_used_commands** - 获取最常用的命令
   - 参数：`limit` (number, 可选) - 返回结果数量限制

9. **get_recent_commands** - 获取最近添加的命令
   - 参数：`limit` (number, 可选) - 返回结果数量限制

10. **get_command_categories** - 获取所有命令类别
    - 参数：无

11. **get_command_stats** - 获取命令记忆统计信息
    - 参数：无

12. **update_command** - 更新已保存的命令
    - 参数：
      - `id` (string) - 命令ID
      - `command` (string, 可选) - 新命令
      - `description` (string, 可选) - 新描述
      - `category` (string, 可选) - 新类别
      - `tags` (string[], 可选) - 新标签

13. **delete_command** - 删除已保存的命令
    - 参数：`id` (string) - 命令ID

## 安装和运行

### 1. 安装依赖
```bash
npm install
```

### 2. 构建项目
```bash
npm run build
```

### 3. 运行服务器
```bash
npm start
```

### 开发模式运行
```bash
npm run dev
```

## 测试

项目包含一个测试文件 `test-mcp.js`，用于验证MCP服务器的功能：

```bash
node test-mcp.js
```

测试会验证：
- 服务器初始化
- 工具列表获取
- hello_world 工具调用
- calculate 工具的各种运算
- file_info 工具的文件信息获取
- 命令记忆工具的完整功能（添加、搜索、统计等）

## 与AI模型集成

要将此MCP服务器与支持MCP的AI模型集成，你需要在AI模型的配置文件中添加此服务器。

### 示例配置（Claude Desktop）
在Claude Desktop的配置文件中添加：

```json
{
  "mcpServers": {
    "dev-tools": {
      "command": "node",
      "args": ["/path/to/your/dev-tools/dist/server.js"],
      "env": {}
    }
  }
}
```

### 示例配置（Cursor）
在Cursor的MCP配置中添加：

```json
{
  "mcpServers": {
    "dev-tools": {
      "command": "node",
      "args": ["/path/to/your/dev-tools/dist/server.js"]
    }
  }
}
```

## 开发

### 项目结构
```
dev-tools/
├── src/
│   ├── server.ts          # MCP服务器主文件
│   └── command-memory.ts  # 命令记忆管理器
├── dist/                  # 编译后的JavaScript文件
├── command-memory.json    # 命令记忆数据文件
├── test-mcp.js           # 测试文件
├── package.json
├── tsconfig.json
└── README.md
```

### 添加新工具

1. 在 `src/server.ts` 中定义新的参数模式：
```typescript
const NewToolArgsSchema = z.object({
  // 定义参数
});
```

2. 在 `tools` 数组中添加新工具：
```typescript
{
  name: "new_tool",
  description: "工具描述",
  inputSchema: NewToolArgsSchema,
}
```

3. 在 `CallToolRequest` 处理函数中添加新的case：
```typescript
case "new_tool": {
  const args = NewToolArgsSchema.parse(request.params.arguments);
  // 实现工具逻辑
  return {
    content: [
      {
        type: "text",
        text: "结果",
      },
    ],
  };
}
```

4. 在 `test-mcp.js` 中添加测试用例：
```javascript
{
  jsonrpc: "2.0",
  id: 7,
  method: "tools/call",
  params: {
    name: "new_tool",
    arguments: {
      // 测试参数
    }
  }
}
```

## 许可证

ISC
