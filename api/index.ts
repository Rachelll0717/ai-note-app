import express from 'express';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// 懒加载的客户端（避免顶层初始化阻塞）
let supabase: any = null;
let siliconflow: any = null;

function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  }
  return supabase;
}

function getSiliconflow() {
  if (!siliconflow) {
    siliconflow = new OpenAI({
      apiKey: process.env.SILICONFLOW_API_KEY,
      baseURL: 'https://api.siliconflow.cn/v1',
    });
  }
  return siliconflow;
}

const app = express();
app.use(express.json());

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
    const client = getSiliconflow();
    const response = await client.chat.completions.create({
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

// ========== 路由 ==========

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

app.get('/api/notes', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

app.post('/api/notes', async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    const supabase = getSupabase();
    const { summary, tags } = await generateAISummaryAndTags(content);
    const { data, error } = await supabase
      .from('notes')
      .insert([{ title, content, summary, tags }])
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create note' });
  }
});

app.put('/api/notes/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;

  try {
    const supabase = getSupabase();
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
    res.status(500).json({ error: 'Failed to update note' });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

app.post('/api/notes/:id/regenerate', async (req, res) => {
  const { id } = req.params;
  try {
    const supabase = getSupabase();
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
    res.status(500).json({ error: 'Failed to regenerate' });
  }
});

// Vercel handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}