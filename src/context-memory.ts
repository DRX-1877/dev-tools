import { z } from "zod";
import { promises as fs } from "fs";

// 上下文记录的数据结构
export interface ContextRecord {
  id: string;
  key: string; // 简短的缩略词/关键词
  title: string; // 标题
  content: string; // 完整的上下文内容
  category: string; // 分类
  tags: string[]; // 标签
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
  priority: number; // 优先级，用于排序
}

// 上下文记忆管理器
export class ContextMemory {
  private filePath: string;
  private contexts: Map<string, ContextRecord> = new Map();

  constructor(storagePath: string = "./context-memory.json") {
    this.filePath = storagePath;
  }

  // 初始化，从文件加载数据
  async initialize(): Promise<void> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      const records: ContextRecord[] = JSON.parse(data);
      this.contexts.clear();
      records.forEach(record => {
        this.contexts.set(record.id, record);
      });
    } catch (error) {
      // 文件不存在或为空，创建新的
      await this.saveToFile();
    }
  }

  // 保存到文件
  private async saveToFile(): Promise<void> {
    const records = Array.from(this.contexts.values());
    await fs.writeFile(this.filePath, JSON.stringify(records, null, 2));
  }

  // 添加新上下文
  async addContext(
    key: string, 
    title: string, 
    content: string, 
    category: string = "general", 
    tags: string[] = [], 
    priority: number = 1
  ): Promise<string> {
    const id = this.generateId();
    const record: ContextRecord = {
      id,
      key,
      title,
      content,
      category,
      tags,
      createdAt: new Date().toISOString(),
      usageCount: 0,
      priority
    };
    
    this.contexts.set(id, record);
    await this.saveToFile();
    return id;
  }

  // 根据关键词获取上下文
  async getContextByKey(key: string): Promise<ContextRecord | null> {
    const record = this.contexts.get(key);
    if (record) {
      // 更新使用次数和最后使用时间
      record.usageCount++;
      record.lastUsed = new Date().toISOString();
      await this.saveToFile();
    }
    return record || null;
  }

  // 根据ID获取上下文
  async getContextById(id: string): Promise<ContextRecord | null> {
    const record = this.contexts.get(id);
    if (record) {
      // 更新使用次数和最后使用时间
      record.usageCount++;
      record.lastUsed = new Date().toISOString();
      await this.saveToFile();
    }
    return record || null;
  }

  // 搜索上下文
  async searchContexts(query: string, limit: number = 10): Promise<ContextRecord[]> {
    const results: Array<{ record: ContextRecord; score: number }> = [];
    
    for (const record of this.contexts.values()) {
      let score = 0;
      
      // 关键词匹配（最高优先级）
      if (record.key.toLowerCase().includes(query.toLowerCase())) {
        score += 5;
      }
      
      // 标题匹配
      if (record.title.toLowerCase().includes(query.toLowerCase())) {
        score += 3;
      }
      
      // 内容匹配
      if (record.content.toLowerCase().includes(query.toLowerCase())) {
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
    
    // 按分数、优先级、使用次数排序
    return results
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.record.priority !== a.record.priority) return b.record.priority - a.record.priority;
        return b.record.usageCount - a.record.usageCount;
      })
      .slice(0, limit)
      .map(item => item.record);
  }

  // 按类别获取上下文
  async getContextsByCategory(category: string): Promise<ContextRecord[]> {
    return Array.from(this.contexts.values())
      .filter(record => record.category === category)
      .sort((a, b) => b.priority - a.priority || b.usageCount - a.usageCount);
  }

  // 获取最常用的上下文
  async getMostUsedContexts(limit: number = 10): Promise<ContextRecord[]> {
    return Array.from(this.contexts.values())
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  // 获取高优先级的上下文
  async getHighPriorityContexts(limit: number = 10): Promise<ContextRecord[]> {
    return Array.from(this.contexts.values())
      .filter(record => record.priority >= 3)
      .sort((a, b) => b.priority - a.priority || b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  // 获取最近添加的上下文
  async getRecentContexts(limit: number = 10): Promise<ContextRecord[]> {
    return Array.from(this.contexts.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // 更新上下文
  async updateContext(id: string, updates: Partial<ContextRecord>): Promise<boolean> {
    const record = this.contexts.get(id);
    if (!record) return false;
    
    Object.assign(record, updates);
    await this.saveToFile();
    return true;
  }

  // 删除上下文
  async deleteContext(id: string): Promise<boolean> {
    const deleted = this.contexts.delete(id);
    if (deleted) {
      await this.saveToFile();
    }
    return deleted;
  }

  // 获取所有类别
  async getCategories(): Promise<string[]> {
    const categories = new Set<string>();
    for (const record of this.contexts.values()) {
      categories.add(record.category);
    }
    return Array.from(categories).sort();
  }

  // 获取所有标签
  async getTags(): Promise<string[]> {
    const tags = new Set<string>();
    for (const record of this.contexts.values()) {
      record.tags.forEach(tag => tags.add(tag));
    }
    return Array.from(tags).sort();
  }

  // 获取所有关键词
  async getKeys(): Promise<string[]> {
    return Array.from(this.contexts.values()).map(record => record.key).sort();
  }

  // 获取统计信息
  async getStats(): Promise<{
    totalContexts: number;
    categories: number;
    tags: number;
    keys: number;
    mostUsedCategory: string;
    averageUsage: number;
    highPriorityCount: number;
  }> {
    const categories = await this.getCategories();
    const tags = await this.getTags();
    const keys = await this.getKeys();
    
    // 计算最常用类别
    const categoryUsage = new Map<string, number>();
    for (const record of this.contexts.values()) {
      categoryUsage.set(record.category, (categoryUsage.get(record.category) || 0) + record.usageCount);
    }
    
    const mostUsedCategory = Array.from(categoryUsage.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "none";
    
    const totalUsage = Array.from(this.contexts.values()).reduce((sum, record) => sum + record.usageCount, 0);
    const averageUsage = this.contexts.size > 0 ? totalUsage / this.contexts.size : 0;
    
    const highPriorityCount = Array.from(this.contexts.values()).filter(record => record.priority >= 3).length;
    
    return {
      totalContexts: this.contexts.size,
      categories: categories.length,
      tags: tags.length,
      keys: keys.length,
      mostUsedCategory,
      averageUsage: Math.round(averageUsage * 100) / 100,
      highPriorityCount
    };
  }

  // 生成唯一ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// 创建全局实例
export const contextMemory = new ContextMemory();
