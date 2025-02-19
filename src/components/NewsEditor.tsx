import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Trash2, 
  Plus, 
  AlertTriangle,
  Bold,
  Italic,
  Link,
  Youtube,
  List,
  ListOrdered,
  LogOut,
  Cloud,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { translateToSpanish } from '../lib/openai';
import { useNavigate } from 'react-router-dom';

interface BlueSkyPostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (handle: string, postId: string) => void;
}

const BlueSkyPostDialog = ({ isOpen, onClose, onSubmit }: BlueSkyPostDialogProps) => {
  const [handle, setHandle] = useState('');
  const [postId, setPostId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(handle, postId);
    setHandle('');
    setPostId('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Insert BlueSky Post</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Handle (e.g., username.bsky.social)
            </label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
              placeholder="username.bsky.social"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Post ID
            </label>
            <input
              type="text"
              value={postId}
              onChange={(e) => setPostId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
              placeholder="3kgskutnmpu2j"
              required
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Insert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface NewsItem {
  id: string;
  date: string;
  title: {
    en: string;
    es: string;
  };
  content: {
    en: string;
    es: string;
  };
  order: number;
}

interface FormatButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
}

const FormatButton = ({ icon, label, onClick, isActive }: FormatButtonProps) => (
  <button
    onClick={onClick}
    className={`p-2 rounded-lg hover:bg-gray-700 transition-colors ${
      isActive ? 'bg-gray-700 text-blue-400' : 'text-gray-300'
    }`}
    title={label}
  >
    {icon}
  </button>
);

const MAX_NEWS_ITEMS = 8;

const NewsEditor = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedTextarea, setSelectedTextarea] = useState<HTMLTextAreaElement | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const navigate = useNavigate();
  const [showBlueSkyDialog, setShowBlueSkyDialog] = useState(false);

  useEffect(() => {
    fetchNewsItems();
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (err) {
      console.error('Sign out error:', err);
      setError('Failed to sign out');
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleBlueSkyPost = (handle: string, postId: string) => {
    const url = `https://bsky.app/profile/${handle}/post/${postId}`;
    insertFormat('bluesky', url);
    setShowBlueSkyDialog(false);
  };

  const insertFormat = (format: string, placeholder?: string) => {
    if (!selectedTextarea) return;

    const start = selectedTextarea.selectionStart;
    const end = selectedTextarea.selectionEnd;
    const text = selectedTextarea.value;
    const selection = text.substring(start, end);

    let replacement = '';
    switch (format) {
      case 'twitter':
        replacement = `\nhttps://twitter.com/username/status/123456789\n`;
        break;
      case 'bluesky':
        replacement = `\n${placeholder}\n`;
        break;
      case 'bold':
        replacement = `**${selection || 'bold text'}**`;
        break;
      case 'italic':
        replacement = `*${selection || 'italic text'}*`;
        break;
      case 'link':
        replacement = `[${selection || 'link text'}](https://)`;
        break;
      case 'youtube':
        replacement = `\nhttps://youtu.be/${placeholder || 'video-id'}\n`;
        break;
      case 'ul':
        replacement = selection
          ? selection.split('\n').map(line => `- ${line}`).join('\n')
          : '- List item';
        break;
      case 'ol':
        replacement = selection
          ? selection.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n')
          : '1. List item';
        break;
    }

    const newText = text.substring(0, start) + replacement + text.substring(end);
    const newCursorPosition = start + replacement.length;

    // Update the textarea
    selectedTextarea.value = newText;
    selectedTextarea.focus();
    selectedTextarea.setSelectionRange(newCursorPosition, newCursorPosition);

    // Update the state
    const index = parseInt(selectedTextarea.dataset.index || '0');
    const lang = selectedTextarea.dataset.lang as 'en' | 'es';
    updateNewsItem(index, 'content.' + lang, newText);
  };

  const insertYouTubeVideo = () => {
    const videoId = prompt('Enter YouTube video ID (e.g., dQw4w9WgXcQ):');
    if (videoId) {
      insertFormat('youtube', videoId.trim());
    }
  };

  const insertVimeoVideo = () => {
    const videoId = prompt('Enter Vimeo video ID (e.g., 123456789):');
    if (videoId) {
      const url = `https://vimeo.com/${videoId.trim()}`;
      if (!selectedTextarea) return;

      const start = selectedTextarea.selectionStart;
      const end = selectedTextarea.selectionEnd;
      const text = selectedTextarea.value;

      const newText = text.substring(0, start) + '\n' + url + '\n' + text.substring(end);
      const newCursorPosition = start + url.length + 2;

      // Update the textarea
      selectedTextarea.value = newText;
      selectedTextarea.focus();
      selectedTextarea.setSelectionRange(newCursorPosition, newCursorPosition);

      // Update the state
      const index = parseInt(selectedTextarea.dataset.index || '0');
      const lang = selectedTextarea.dataset.lang as 'en' | 'es';
      updateNewsItem(index, 'content.' + lang, newText);
    }
  };

  const fetchNewsItems = async () => {
    try {
      const { data, error } = await supabase
        .from('news_items')
        .select('*')
        .order('order', { ascending: true });

      if (error) throw error;

      setNewsItems(data || []);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to load news items');
    }
  };

  const addNewsItem = () => {
    if (newsItems.length >= MAX_NEWS_ITEMS) {
      setError('Maximum number of news items reached');
      return;
    }

    const newItem: NewsItem = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      title: { en: '', es: '' },
      content: { en: '', es: '' },
      order: newsItems.length
    };

    setNewsItems([...newsItems, newItem]);
  };

  const updateNewsItem = (index: number, field: string, value: any) => {
    const updatedItems = [...newsItems];
    const item = { ...updatedItems[index] };

    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      (item as any)[parent] = {
        ...(item as any)[parent],
        [child]: value
      };
    } else {
      (item as any)[field] = value;
    }

    updatedItems[index] = item;
    setNewsItems(updatedItems);
  };

  const saveNewsItems = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate content before saving
      const hasEmptyFields = newsItems.some(item => 
        !item.date || 
        !item.title.en || 
        !item.content.en
      );

      if (hasEmptyFields) {
        throw new Error('Please fill in all required English fields (date, title, and content)');
      }
      
      // Save each item individually to ensure proper error handling
      for (const item of newsItems) {
        const { error } = await supabase
        .from('news_items')
        .upsert(item, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

        if (error) {
          console.error('Error saving item:', error);
          throw new Error(`Failed to save item: ${error.message}`);
        }
      }
      
      showSuccess('All news items saved successfully');
      
      // Refresh the list to ensure we have the latest data
      await fetchNewsItems();
    } catch (err) {
      console.error('Error saving news:', err);
      setError(err instanceof Error ? err.message : 'Failed to save news items');
    } finally {
      setSaving(false);
    }
  };

  const removeNewsItem = (index: number) => {
    if (window.confirm('Are you sure you want to delete this news item? This action cannot be undone.')) {
      const itemToDelete = newsItems[index];
      setSaving(true);
      
      // Delete from database first
      supabase
        .from('news_items')
        .delete()
        .eq('id', itemToDelete.id)
        .then(({ error }) => {
          if (error) {
            console.error('Error deleting news item:', error);
            setError(`Failed to delete news item: ${error.message}`);
            return;
          }

          // Update local state after successful deletion
          const updatedItems = newsItems.filter((_, i) => i !== index);
          // Update order for remaining items
          updatedItems.forEach((item, i) => {
            updateNewsItem(i, 'order', i);
          });
          setNewsItems(updatedItems);
          showSuccess('News item deleted successfully');
        })
        .finally(() => {
          setSaving(false);
        });
    }
  };

  const translateNewsItem = async (index: number) => {
    try {
      setTranslating(true);
      setError(null);

      // Translate title
      const translatedTitle = await translateToSpanish(newsItems[index].title.en);
      updateNewsItem(index, 'title.es', translatedTitle);

      // Translate content
      const translatedContent = await translateToSpanish(newsItems[index].content.en);
      updateNewsItem(index, 'content.es', translatedContent);

      showSuccess('Translation completed successfully');
    } catch (err) {
      console.error('Translation error:', err);
      setError('Translation failed. Please try again.');
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">News Editor</h1>
          <div className="flex gap-4">
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center gap-2 text-gray-300"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
            <button
              onClick={addNewsItem}
              disabled={newsItems.length >= MAX_NEWS_ITEMS || saving}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                newsItems.length >= MAX_NEWS_ITEMS
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              <Plus size={20} />
              <span>Add Item</span>
            </button>
            <button
              onClick={saveNewsItems}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
            >
              <Save size={20} />
              <span>{saving ? 'Saving...' : 'Save All'}</span>
            </button>
          </div>
        </div>

        {successMessage && (
          <div className="bg-green-900/50 text-green-100 px-4 py-3 rounded-lg mb-6 flex items-center gap-2 animate-fade-in">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>{successMessage}</span>
          </div>
        )}


        {error && (
          <div className="bg-red-900/50 text-red-100 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertTriangle size={20} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-6">
          {newsItems.map((item, index) => (
            <div
              key={item.id}
              className="bg-black/40 backdrop-blur-sm rounded-lg p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-white">
                  News Item {index + 1}
                </h3>
                <button
                  onClick={() => removeNewsItem(index)}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={item.date}
                    onChange={(e) => updateNewsItem(index, 'date', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Title (English)
                    </label>
                    <input
                      type="text"
                      value={item.title.en}
                      onChange={(e) => updateNewsItem(index, 'title.en', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Title (Spanish)
                    </label>
                    <input
                      type="text"
                      value={item.title.es}
                      onChange={(e) => updateNewsItem(index, 'title.es', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Content (English)
                    </label>
                    <div className="mb-2 flex gap-1 bg-gray-800 p-1 rounded-lg">
                      <FormatButton
                        icon={<Bold size={20} />}
                        label="Bold"
                        onClick={() => insertFormat('bold')}
                      />
                      <FormatButton
                        icon={<Italic size={20} />}
                        label="Italic"
                        onClick={() => insertFormat('italic')}
                      />
                      <FormatButton
                        icon={<Link size={20} />}
                        label="Link"
                        onClick={() => insertFormat('link')}
                      />
                      <FormatButton
                        icon={<Youtube size={20} />}
                        label="YouTube Video"
                        onClick={insertYouTubeVideo}
                      />
                      <button
                        onClick={() => insertFormat('twitter')}
                        className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300"
                        title="Insert Twitter/X Post"
                      >
                        𝕏
                      </button>
                      <button
                        onClick={() => setShowBlueSkyDialog(true)}
                        className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300"
                        title="Insert BlueSky Post"
                      >
                        <Cloud size={20} />
                      </button>
                      <button
                        onClick={insertVimeoVideo}
                        className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300"
                        title="Insert Vimeo Video"
                      >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                          <path d="M23.9765 6.4168c-.105 2.338-1.739 5.5429-4.894 9.6088-3.2679 4.247-6.0258 6.3699-8.2898 6.3699-1.409 0-2.578-1.294-3.553-3.881l-1.9179-7.1138c-.719-2.584-1.488-3.878-2.312-3.878-.179 0-.806.378-1.881 1.132l-1.125-1.449c1.177-1.035 2.3469-2.07 3.506-3.105 1.578-1.367 2.764-2.085 3.553-2.155 1.875-.179 3.023 1.095 3.449 3.825.466 2.937.789 4.7649.977 5.4849.5389 2.454 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.8679 3.434-5.7568 6.7619-5.6368 2.4729.06 3.6279 1.664 3.4929 4.7969z"/>
                        </svg>
                      </button>
                      <FormatButton
                        icon={<List size={20} />}
                        label="Bullet List"
                        onClick={() => insertFormat('ul')}
                      />
                      <FormatButton
                        icon={<ListOrdered size={20} />}
                        label="Numbered List"
                        onClick={() => insertFormat('ol')}
                      />
                    </div>
                    <textarea
                      value={item.content.en}
                      onChange={(e) => {
                        updateNewsItem(index, 'content.en', e.target.value);
                      }}
                      onFocus={(e) => setSelectedTextarea(e.target)}
                      data-index={index}
                      data-lang="en"
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 resize-none"
                      placeholder="Supports text, formatting, images, and YouTube links"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Content (Spanish)
                    </label>
                    <div className="mb-2 flex gap-1 bg-gray-800 p-1 rounded-lg">
                      <FormatButton
                        icon={<Bold size={20} />}
                        label="Negrita"
                        onClick={() => insertFormat('bold')}
                      />
                      <FormatButton
                        icon={<Italic size={20} />}
                        label="Cursiva"
                        onClick={() => insertFormat('italic')}
                      />
                      <FormatButton
                        icon={<Link size={20} />}
                        label="Enlace"
                        onClick={() => insertFormat('link')}
                      />
                      <FormatButton
                        icon={<Youtube size={20} />}
                        label="Video de YouTube"
                        onClick={insertYouTubeVideo}
                      />
                      <button
                        onClick={() => insertFormat('twitter')}
                        className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300"
                        title="Insertar Post de Twitter/X"
                      >
                        𝕏
                      </button>
                      <button
                        onClick={() => setShowBlueSkyDialog(true)}
                        className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300"
                        title="Insertar Post de BlueSky"
                      >
                        <Cloud size={20} />
                      </button>
                      <button
                        onClick={insertVimeoVideo}
                        className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300"
                        title="Insertar Video de Vimeo"
                      >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                          <path d="M23.9765 6.4168c-.105 2.338-1.739 5.5429-4.894 9.6088-3.2679 4.247-6.0258 6.3699-8.2898 6.3699-1.409 0-2.578-1.294-3.553-3.881l-1.9179-7.1138c-.719-2.584-1.488-3.878-2.312-3.878-.179 0-.806.378-1.881 1.132l-1.125-1.449c1.177-1.035 2.3469-2.07 3.506-3.105 1.578-1.367 2.764-2.085 3.553-2.155 1.875-.179 3.023 1.095 3.449 3.825.466 2.937.789 4.7649.977 5.4849.5389 2.454 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.8679 3.434-5.7568 6.7619-5.6368 2.4729.06 3.6279 1.664 3.4929 4.7969z"/>
                        </svg>
                      </button>
                      <FormatButton
                        icon={<List size={20} />}
                        label="Lista con viñetas"
                        onClick={() => insertFormat('ul')}
                      />
                      <FormatButton
                        icon={<ListOrdered size={20} />}
                        label="Lista numerada"
                        onClick={() => insertFormat('ol')}
                      />
                    </div>
                    <textarea
                      value={item.content.es}
                      onChange={(e) => {
                        updateNewsItem(index, 'content.es', e.target.value);
                      }}
                      onFocus={(e) => setSelectedTextarea(e.target)}
                      data-index={index}
                      data-lang="es"
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 resize-none"
                      placeholder="Admite texto, formato, imágenes y enlaces de YouTube"
                    />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <button
                      onClick={() => translateNewsItem(index)}
                      disabled={translating || !item.title.en || !item.content.en}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                        translating || !item.title.en || !item.content.en
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {translating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Translating...</span>
                        </>
                      ) : (
                        <span>Translate to Spanish</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {newsItems.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              No news items. Click "Add Item" to create one.
            </div>
          )}
        </div>

        <BlueSkyPostDialog
          isOpen={showBlueSkyDialog}
          onClose={() => setShowBlueSkyDialog(false)}
          onSubmit={handleBlueSkyPost}
        />
      </div>
    </div>
  );
};

export default NewsEditor;