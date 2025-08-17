#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 启动MCP服务器
const serverProcess = spawn('node', [join(__dirname, 'dist', 'server.js')], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let requestId = 1;

// 发送JSON-RPC请求
function sendRequest(method, params = {}) {
  const request = {
    jsonrpc: "2.0",
    id: requestId++,
    method: method,
    params: params
  };
  
  console.log(`发送请求: ${JSON.stringify(request, null, 2)}`);
  serverProcess.stdin.write(JSON.stringify(request) + '\n');
}

// 处理服务器响应
serverProcess.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    try {
      const response = JSON.parse(line);
      console.log(`收到响应: ${JSON.stringify(response, null, 2)}`);
      
      if (response.error) {
        console.error(`错误: ${response.error.message}`);
      }
    } catch (error) {
      console.error(`解析响应失败: ${error.message}`);
      console.error(`原始数据: ${line}`);
    }
  }
});

// 处理服务器错误输出
serverProcess.stderr.on('data', (data) => {
  console.error(`服务器错误: ${data.toString()}`);
});

// 处理服务器退出
serverProcess.on('close', (code) => {
  console.log(`服务器进程退出，代码: ${code}`);
});

// 等待服务器启动
setTimeout(() => {
  console.log('\n=== 测试工具列表获取 ===');
  
  // 测试1: 获取工具列表
  sendRequest('tools/list');
  
  // 测试2: 测试hello_world工具
  setTimeout(() => {
    console.log('\n=== 测试hello_world工具 ===');
    sendRequest('tools/call', {
      name: 'hello_world',
      arguments: {
        name: 'Test User'
      }
    });
  }, 1000);
  
  // 测试3: 测试calculate工具
  setTimeout(() => {
    console.log('\n=== 测试calculate工具 ===');
    sendRequest('tools/call', {
      name: 'calculate',
      arguments: {
        operation: 'add',
        a: 5,
        b: 3
      }
    });
  }, 2000);
  
  // 测试4: 测试file_info工具
  setTimeout(() => {
    console.log('\n=== 测试file_info工具 ===');
    sendRequest('tools/call', {
      name: 'file_info',
      arguments: {
        path: './package.json'
      }
    });
  }, 3000);
  
  // 测试5: 测试add_command工具
  setTimeout(() => {
    console.log('\n=== 测试add_command工具 ===');
    sendRequest('tools/call', {
      name: 'add_command',
      arguments: {
        command: 'npm install',
        description: '安装项目依赖',
        category: 'npm',
        tags: ['install', 'dependencies']
      }
    });
  }, 4000);
  
  // 测试6: 测试add_context工具
  setTimeout(() => {
    console.log('\n=== 测试add_context工具 ===');
    sendRequest('tools/call', {
      name: 'add_context',
      arguments: {
        key: 'test-key',
        title: '测试上下文',
        content: '这是一个测试上下文内容',
        category: 'test',
        tags: ['test', 'example']
      }
    });
  }, 5000);
  
  // 测试7: 测试smart_save工具
  setTimeout(() => {
    console.log('\n=== 测试smart_save工具 ===');
    sendRequest('tools/call', {
      name: 'smart_save',
      arguments: {
        content: '这是一个TypeScript项目，使用了MCP协议。',
        suggestedCategory: 'typescript',
        suggestedTags: ['typescript', 'mcp']
      }
    });
  }, 6000);
  
  // 结束测试
  setTimeout(() => {
    console.log('\n=== 测试完成，关闭服务器 ===');
    serverProcess.kill();
  }, 7000);
  
}, 1000);
