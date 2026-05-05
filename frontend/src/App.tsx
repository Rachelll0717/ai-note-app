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
  updated_at: string;
}

const API_URL = 'https://ai-note-app-production.up.railway.app';

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [creating, setCreating] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  // 编辑相关 state
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [updating, setUpdating] = useState(false);

  // 获取所有笔记
  const fetchNotes = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notes`);
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
      const response = await axios.post(`${API_URL}/api/notes`, {
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
      const response = await axios.post(`${API_URL}/api/notes/${id}/regenerate`);
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

  // 删除笔记
  const deleteNote = async (id: string) => {
    if (!confirm('确定删除这篇笔记吗？')) return;
    
    try {
      await axios.delete(`${API_URL}/api/notes/${id}`);
      setNotes(notes.filter(note => note.id !== id));
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  // 开始编辑
  const startEdit = (note: Note) => {
    setEditingNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  // 保存编辑
  const saveEdit = async () => {
    if (!editingNote) return;
    if (!editTitle.trim() || !editContent.trim()) return;
    
    setUpdating(true);
    try {
      const response = await axios.put(`${API_URL}/api/notes/${editingNote.id}`, {
        title: editTitle,
        content: editContent,
      });
      setNotes(notes.map(note => 
        note.id === editingNote.id ? response.data : note
      ));
      setEditingNote(null);
      setEditTitle('');
      setEditContent('');
    } catch (error) {
      console.error('更新失败:', error);
      alert('更新失败');
    } finally {
      setUpdating(false);
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingNote(null);
    setEditTitle('');
    setEditContent('');
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
                <small>
                  创建: {new Date(note.created_at).toLocaleString()}
                  {note.updated_at !== note.created_at && ` | 更新: ${new Date(note.updated_at).toLocaleString()}`}
                </small>
                <div className="note-actions">
                  <button className="edit-btn" onClick={() => startEdit(note)}>✏️ 编辑</button>
                  <button className="delete-btn" onClick={() => deleteNote(note.id)}>🗑️ 删除</button>
                  <button 
                    className="regenerate-btn"
                    onClick={() => regenerateAI(note.id)}
                    disabled={generatingId === note.id}
                  >
                    {generatingId === note.id ? '生成中...' : '🔄 重新生成'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 编辑弹窗 */}
      {editingNote && (
        <div className="modal-overlay" onClick={cancelEdit}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>编辑笔记</h2>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="标题"
            />
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={8}
              placeholder="内容"
            />
            <div className="modal-buttons">
              <button onClick={cancelEdit}>取消</button>
              <button onClick={saveEdit} disabled={updating}>
                {updating ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;