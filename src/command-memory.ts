import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";

// 命令记录的数据结构
export interface CommandRecord {
  id: string;
  command: string;
  description: string;
  category: string;
  tags: string[];
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
  context?: string; // 生成命令时的上下文
}

// 命令记忆管理器
export class CommandMemory {
  private filePath: string;
  private commands: Map<string, CommandRecord> = new Map();

  constructor(storagePath: string = "./command-memory.json") {
    this.filePath = storagePath;
  }

  // 初始化，从文件加载数据
  async initialize(): Promise<void> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      const records: CommandRecord[] = JSON.parse(data);
      this.commands.clear();
      records.forEach(record => {
        this.commands.set(record.id, record);
      });
    } catch (error) {
      // 文件不存在或为空，创建新的
      await this.saveToFile();
    }
  }

  // 保存到文件
  private async saveToFile(): Promise<void> {
    const records = Array.from(this.commands.values());
    await fs.writeFile(this.filePath, JSON.stringify(records, null, 2));
  }

  // 添加新命令
  async addCommand(command: string, description: string, category: string = "general", tags: string[] = [], context?: string): Promise<string> {
    const id = this.generateId();
    const record: CommandRecord = {
      id,
      command,
      description,
      category,
      tags,
      createdAt: new Date().toISOString(),
      usageCount: 0,
      context
    };
    
    this.commands.set(id, record);
    await this.saveToFile();
    return id;
  }

  // 根据ID获取命令
  async getCommand(id: string): Promise<CommandRecord | null> {
    const record = this.commands.get(id);
    if (record) {
      // 更新使用次数和最后使用时间
      record.usageCount++;
      record.lastUsed = new Date().toISOString();
      await this.saveToFile();
    }
    return record || null;
  }

  // 搜索命令
  async searchCommands(query: string, limit: number = 10): Promise<CommandRecord[]> {
    const results: Array<{ record: CommandRecord; score: number }> = [];
    
    for (const record of this.commands.values()) {
      let score = 0;
      
      // 命令内容匹配
      if (record.command.toLowerCase().includes(query.toLowerCase())) {
        score += 3;
      }
      
      // 描述匹配
      if (record.description.toLowerCase().includes(query.toLowerCase())) {
        score += 2;
      }
      
      // 标签匹配
      if (record.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))) {
        score += 1;
      }
      
      // 类别匹配
      if (record.category.toLowerCase().includes(query.toLowerCase())) {
        score += 1;
      }
      
      if (score > 0) {
        results.push({ record, score });
      }
    }
    
    // 按分数排序，然后按使用次数排序
    return results
      .sort((a, b) => b.score - a.score || b.record.usageCount - a.record.usageCount)
      .slice(0, limit)
      .map(item => item.record);
  }

  // 按类别获取命令
  async getCommandsByCategory(category: string): Promise<CommandRecord[]> {
    return Array.from(this.commands.values())
      .filter(record => record.category === category)
      .sort((a, b) => b.usageCount - a.usageCount);
  }

  // 获取最常用的命令
  async getMostUsedCommands(limit: number = 10): Promise<CommandRecord[]> {
    return Array.from(this.commands.values())
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  // 获取最近添加的命令
  async getRecentCommands(limit: number = 10): Promise<CommandRecord[]> {
    return Array.from(this.commands.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // 更新命令
  async updateCommand(id: string, updates: Partial<CommandRecord>): Promise<boolean> {
    const record = this.commands.get(id);
    if (!record) return false;
    
    Object.assign(record, updates);
    await this.saveToFile();
    return true;
  }

  // 删除命令
  async deleteCommand(id: string): Promise<boolean> {
    const deleted = this.commands.delete(id);
    if (deleted) {
      await this.saveToFile();
    }
    return deleted;
  }

  // 获取所有类别
  async getCategories(): Promise<string[]> {
    const categories = new Set<string>();
    for (const record of this.commands.values()) {
      categories.add(record.category);
    }
    return Array.from(categories).sort();
  }

  // 获取所有标签
  async getTags(): Promise<string[]> {
    const tags = new Set<string>();
    for (const record of this.commands.values()) {
      record.tags.forEach(tag => tags.add(tag));
    }
    return Array.from(tags).sort();
  }

  // 获取统计信息
  async getStats(): Promise<{
    totalCommands: number;
    categories: number;
    tags: number;
    mostUsedCategory: string;
    averageUsage: number;
  }> {
    const categories = await this.getCategories();
    const tags = await this.getTags();
    
    // 计算最常用类别
    const categoryUsage = new Map<string, number>();
    for (const record of this.commands.values()) {
      categoryUsage.set(record.category, (categoryUsage.get(record.category) || 0) + record.usageCount);
    }
    
    const mostUsedCategory = Array.from(categoryUsage.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "none";
    
    const totalUsage = Array.from(this.commands.values()).reduce((sum, record) => sum + record.usageCount, 0);
    const averageUsage = this.commands.size > 0 ? totalUsage / this.commands.size : 0;
    
    return {
      totalCommands: this.commands.size,
      categories: categories.length,
      tags: tags.length,
      mostUsedCategory,
      averageUsage: Math.round(averageUsage * 100) / 100
    };
  }

  // 生成唯一ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// 创建全局实例
export const commandMemory = new CommandMemory();
