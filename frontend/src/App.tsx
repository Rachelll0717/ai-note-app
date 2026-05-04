import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

interface Note {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  tags: string[];
  created_at: string;
}

const API_URL = 'http://localhost:3001/api';

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [creating, setCreating] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  // 获取所有笔记
  const fetchNotes = async () => {
    try {
      const response = await axios.get(`${API_URL}/notes`);
      setNotes(response.data);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  };

  // 创建新笔记
  const createNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setCreating(true);
    try {
      const response = await axios.post(`${API_URL}/notes`, {
        title: newTitle,
        content: newContent,
      });
      setNotes([response.data, ...notes]);
      setNewTitle('');
      setNewContent('');
    } catch (error) {
      console.error('Failed to create note:', error);
      alert('创建失败，请重试');
    } finally {
      setCreating(false);
    }
  };

  // 手动重新生成 AI 内容
  const regenerateAI = async (id: string) => {
    setGeneratingId(id);
    try {
      const response = await axios.post(`${API_URL}/notes/${id}/regenerate`);
      setNotes(notes.map(note => 
        note.id === id ? response.data : note
      ));
    } catch (error) {
      console.error('Regenerate failed:', error);
      alert('重新生成失败');
    } finally {
      setGeneratingId(null);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="app">
      <h1>🤖 AI 笔记助手</h1>
      
      <form onSubmit={createNote} className="note-form">
        <input
          type="text"
          placeholder="标题"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          disabled={creating}
        />
        <textarea
          placeholder="内容（写完后保存，AI 会自动生成摘要和标签）"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          rows={4}
          disabled={creating}
        />
        <button type="submit" disabled={creating}>
          {creating ? 'AI 分析中...' : '创建笔记'}
        </button>
      </form>

      <div className="notes-list">
        {notes.length === 0 ? (
          <p>暂无笔记，创建第一篇吧 ✨</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="note-card">
              <h3>{note.title}</h3>
              <p className="note-content">{note.content.substring(0, 150)}...</p>
              
              {/* AI 生成的内容展示 */}
              <div className="ai-section">
                {note.summary && (
                  <div className="summary">
                    📝 <strong>AI 摘要：</strong> {note.summary}
                  </div>
                )}
                {note.tags && note.tags.length > 0 && (
                  <div className="tags">
                    🏷️ <strong>标签：</strong>
                    {note.tags.map((tag, i) => (
                      <span key={i} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="note-footer">
                <small>{new Date(note.created_at).toLocaleString()}</small>
                <button 
                  className="regenerate-btn"
                  onClick={() => regenerateAI(note.id)}
                  disabled={generatingId === note.id}
                >
                  {generatingId === note.id ? '生成中...' : '🔄 重新生成'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;