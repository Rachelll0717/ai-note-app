import express from 'express';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const app = express();
app.use(express.json());

// 初始化 Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}
const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

// 初始化硅基流动
const siliconflowApiKey = process.env.SILICONFLOW_API_KEY;
if (!siliconflowApiKey) {
  console.error('Missing SILICONFLOW_API_KEY environment variable');
}
const siliconflow = new OpenAI({
  apiKey: siliconflowApiKey,
  baseURL: 'https://api.siliconflow.cn/v1',
});

// AI 生成函数
async function generateAISummaryAndTags(content: string) {
  const prompt = `
你是一个笔记助手。请分析以下笔记内容，完成两件事：
1. 用一句话总结笔记的核心内容（不超过30个字）
2. 生成3-5个关键词作为标签

请严格按照以下 JSON 格式返回，不要有其他内容：
{
  "summary": "一句话总结",
  "tags": ["标签1", "标签2", "标签3"]
}

笔记内容：
${content}
`;

  try {
    const response = await siliconflow.chat.completions.create({
      model: 'Qwen/Qwen2.5-7B-Instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const resultText = response.choices[0]?.message?.content || '';
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { summary: "无法解析AI响应", tags: [] };
  } catch (error) {
    console.error("AI 调用失败:", error);
    return { summary: "AI 服务暂不可用", tags: [] };
  }
}

// ========== API 路由 ==========

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// 获取所有笔记
app.get('/api/notes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('获取笔记失败:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// 创建笔记
app.post('/api/notes', async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    const { summary, tags } = await generateAISummaryAndTags(content);
    const { data, error } = await supabase
      .from('notes')
      .insert([{ title, content, summary, tags }])
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('创建笔记失败:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// 更新笔记
app.put('/api/notes/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;

  try {
    const { summary, tags } = await generateAISummaryAndTags(content);
    const { data, error } = await supabase
      .from('notes')
      .update({ title, content, summary, tags, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('更新笔记失败:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// 删除笔记
app.delete('/api/notes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('删除笔记失败:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// 重新生成 AI
app.post('/api/notes/:id/regenerate', async (req, res) => {
  const { id } = req.params;
  try {
    const { data: note, error: fetchError } = await supabase
      .from('notes')
      .select('content')
      .eq('id', id)
      .single();
    if (fetchError) throw fetchError;
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    const { summary, tags } = await generateAISummaryAndTags(note.content);
    const { data, error } = await supabase
      .from('notes')
      .update({ summary, tags, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('重新生成失败:', error);
    res.status(500).json({ error: 'Failed to regenerate' });
  }
});

// Vercel handler 导出

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置超时
  req.setTimeout(30000);
  res.setTimeout(30000);
  
  try {
    await app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}