#!/usr/bin/env node

import { spawn } from 'child_process';

// 启动MCP服务器
const server = spawn('node', ['dist/server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// 测试消息
const testMessages = [
  // 初始化消息
  {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {}
      },
      clientInfo: {
        name: "test-client",
        version: "1.0.0"
      }
    }
  },
  // 列出工具
  {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list"
  },
  // 调用hello_world工具
  {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "hello_world",
      arguments: {
        name: "World"
      }
    }
  },
  // 调用calculate工具
  {
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "calculate",
      arguments: {
        operation: "add",
        a: 5,
        b: 3
      }
    }
  },
  // 测试除法
  {
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call",
    params: {
      name: "calculate",
      arguments: {
        operation: "divide",
        a: 10,
        b: 2
      }
    }
  },
  // 测试文件信息
  {
    jsonrpc: "2.0",
    id: 6,
    method: "tools/call",
    params: {
      name: "file_info",
      arguments: {
        path: "package.json"
      }
    }
  }
];

let messageIndex = 0;

// 处理服务器输出
server.stdout.on('data', (data) => {
  const response = data.toString().trim();
  console.log('服务器响应:', response);
  
  // 发送下一个测试消息
  if (messageIndex < testMessages.length) {
    const message = testMessages[messageIndex];
    console.log('发送消息:', JSON.stringify(message));
    server.stdin.write(JSON.stringify(message) + '\n');
    messageIndex++;
  } else {
    // 测试完成，关闭服务器
    setTimeout(() => {
      server.kill();
      process.exit(0);
    }, 1000);
  }
});

// 处理错误
server.stderr.on('data', (data) => {
  console.log('服务器错误:', data.toString());
});

server.on('close', (code) => {
  console.log(`服务器进程退出，代码: ${code}`);
});

// 发送第一个消息
setTimeout(() => {
  const message = testMessages[messageIndex];
  console.log('发送消息:', JSON.stringify(message));
  server.stdin.write(JSON.stringify(message) + '\n');
  messageIndex++;
}, 100);
