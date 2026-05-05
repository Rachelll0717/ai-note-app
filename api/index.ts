import express from 'express';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const app = express();

app.use(express.json());

// 初始化 Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// 初始化硅基流动
const siliconflow = new OpenAI({
  apiKey: process.env.SILICONFLOW_API_KEY,
  baseURL: 'https://api.siliconflow.cn/v1',
});

// AI 生成函数
async function generateAISummaryAndTags(content: string) {
  const prompt = `...`;  // 和之前一样

  try {
    const response = await siliconflow.chat.completions.create({
      model: 'Qwen/Qwen2.5-7B-Instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const resultText = response.choices[0]?.message?.content || '';
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return { summary: "无法生成摘要", tags: [] };
  } catch (error) {
    return { summary: "AI 服务暂不可用", tags: [] };
  }
}

// API 路由
app.get('/api/notes', async (req, res) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error });
  res.json(data);
});

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
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// 其他路由同理（更新、删除、重新生成）

export default app;