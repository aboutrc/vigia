import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, 
  Trash2, 
  GripVertical,
  Plus, 
  AlertTriangle,
  Bold,
  Italic,
  Link,
  Youtube,
  Instagram,
  List,
  ListOrdered,
  LogOut,
  Cloud,
  X,
  Image as ImageIcon,
  Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { translateToSpanish } from '../lib/openai';
import { useNavigate } from 'react-router-dom';

interface ImageUrlDialogProps {
  isOpen: boolean; 
  onClose: () => void;
  onSubmit: (url: string) => void;
}

const ImageUrlDialog = ({ isOpen, onClose, onSubmit }: ImageUrlDialogProps) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const urlObj = new URL(url);
      onSubmit(url);
      onClose();
      setUrl('');
      setError(null);
    } catch (err) {
      setError('Please enter a valid image URL');
      return;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Add Image</h3>
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
              Image URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
              placeholder="https://example.com/image.jpg"
            />
            <p className="mt-1 text-sm text-gray-500 space-y-1">
              <span className="block">Enter a direct link to an image from:</span>
              <span className="block pl-4">• Unsplash (copy image address)</span>
              <span className="block pl-4">• GitHub raw content</span>
              <span className="block pl-4">• Any direct image URL (.jpg, .png, etc.)</span>
            </p>
          </div>

          {error && (
            <div className="bg-red-900/50 text-red-100 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertTriangle size={20} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!url}
              className={`px-4 py-2 rounded-lg ${
                !url ? 'bg-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              Add Image
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const newsItemsRef = useRef<NewsItem[]>([]);
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement }>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedTextarea, setSelectedTextarea] = useState<HTMLTextAreaElement | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const navigate = useNavigate();
  const [showBlueSkyDialog, setShowBlueSkyDialog] = useState(false);
  const [showImageUrlDialog, setShowImageUrlDialog] = useState(false);

  const handleImageClick = () => {
    if (!selectedTextarea) return;
    setShowImageUrlDialog(true);
  };

  const handleImageUrl = (url: string) => {
    if (!selectedTextarea) return;
    
    const imageMarkdown = `\n![](${url})\n`;
    const currentValue = selectedTextarea.value;
    const selectionStart = selectedTextarea.selectionStart || currentValue.length;
    const newValue = 
      currentValue.slice(0, selectionStart) + 
      imageMarkdown + 
      currentValue.slice(selectionStart);

    selectedTextarea.value = newValue;
    updateNewsItem(
      newsItems.findIndex(item => {
        const textareaId = `${item.id}-${selectedTextarea.id.includes('-es') ? 'es' : 'en'}`;
        return textareaId === selectedTextarea.id;
      }),
      'content',
      selectedTextarea.id.includes('-es') ? 'es' : 'en',
      newValue
    );
    selectedTextarea.focus();
    selectedTextarea.selectionStart = selectionStart + imageMarkdown.length;
    selectedTextarea.selectionEnd = selectedTextarea.selectionStart;
  };

  useEffect(() => {
    fetchNewsItems();
  }, []);

  useEffect(() => {
    newsItemsRef.current = JSON.parse(JSON.stringify(newsItems));
  }, [newsItems]);

  const updateNewsItem = (index: number, field: string, subfield: 'en' | 'es', value: string) => {
    const newItems = [...newsItems];
    if (field === 'title') {
      newItems[index].title[subfield] = value;
    } else if (field === 'content') {
      newItems[index].content[subfield] = value;
    }
    setNewsItems(newItems);
  };

  const fetchNewsItems = async () => {
    try {
      const { data, error } = await supabase
        .from('news_items')
        .select('*')
        .order('order', { ascending: true })
        .order('date', { ascending: false });

      if (error) throw error;
      const items = data || [];
      setNewsItems(items);
      newsItemsRef.current = items;
      // Clear deleted items set when fetching fresh data
      setDeletedIds(new Set());
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to load news items');
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
    } catch (err) {
      console.error('Error signing out:', err);
      setError('Failed to sign out');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Delete items that were marked for deletion
      if (deletedIds.size > 0) {
        const { error: deleteError } = await supabase
          .from('news_items')
          .delete()
          .in('id', Array.from(deletedIds));

        if (deleteError) throw deleteError;
      }

      // Use the ref to ensure we have the latest state
      const itemsToSave = newsItemsRef.current
        .filter(item => !deletedIds.has(item.id))
        .map(item => ({
          ...item,
          content: {
            en: item.content.en || '',
            es: item.content.es || ''
          },
          title: {
            en: item.title.en || '',
            es: item.title.es || ''
          }
        }));

      const { error } = await supabase
        .from('news_items')
        .upsert(itemsToSave);

      if (error) throw error;

      setSuccessMessage('Changes saved successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Refresh the news items to get the latest state
      await fetchNewsItems();
    } catch (err) {
      console.error('Error saving news:', err);
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">News Editor</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                saving
                  ? 'bg-green-600/50 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {saving ? (
                <>
                  <Cloud size={20} className="animate-bounce" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 text-red-100 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-900/50 text-green-100 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <Check size={20} className="flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="space-y-6">
          {newsItems
            .filter(item => !deletedIds.has(item.id))
            .map((item, index) => (
            <div
              key={item.id}
              className="bg-black/40 backdrop-blur-sm rounded-lg p-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <GripVertical
                  size={20}
                  className="text-gray-500 cursor-move"
                />
                <button
                  onClick={() => {
                    setDeletedIds(prev => new Set([...prev, item.id]));
                    const newItems = [...newsItems];
                    newItems.splice(index, 1);
                    setNewsItems(newItems);
                  }}
                  className="p-2 text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    English Title
                  </label>
                  <input
                    type="text"
                    value={item.title.en}
                    onChange={(e) => {
                      updateNewsItem(index, 'title', 'en', e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Spanish Title
                  </label>
                  <input
                    type="text"
                    value={item.title.es}
                    onChange={(e) => {
                      updateNewsItem(index, 'title', 'es', e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    English Content
                  </label>
                  <div className="flex gap-2 mb-2">
                    <FormatButton
                      icon={<Bold size={16} />}
                      label="Bold"
                      onClick={() => {/* Add formatting */}}
                    />
                    <FormatButton
                      icon={<Italic size={16} />}
                      label="Italic"
                      onClick={() => {/* Add formatting */}}
                    />
                    <FormatButton
                      icon={<Link size={16} />}
                      label="Link"
                      onClick={() => {/* Add formatting */}}
                    />
                    <FormatButton
                      icon={<ImageIcon size={16} />}
                      label="Image"
                      onClick={handleImageClick}
                    />
                    <FormatButton
                      icon={<Youtube size={16} />}
                      label="YouTube"
                      onClick={() => {/* Add formatting */}}
                    />
                    <FormatButton
                      icon={<Instagram size={16} />}
                      label="Instagram"
                      onClick={() => {
                        if (!selectedTextarea) return;
                        const url = prompt('Enter Instagram post/reel URL (e.g., https://www.instagram.com/p/ABC123/)');
                        if (!url) return;
                        
                        try {
                          const urlObj = new URL(url);
                          if (!urlObj.hostname.includes('instagram.com')) {
                            throw new Error('Not an Instagram URL');
                          }
                          
                          const currentValue = selectedTextarea.value;
                          const selectionStart = selectedTextarea.selectionStart || currentValue.length;
                          const newValue = 
                            currentValue.slice(0, selectionStart) + 
                            `\n${url}\n` + 
                            currentValue.slice(selectionStart);
                          
                          selectedTextarea.value = newValue;
                          updateNewsItem(
                            newsItems.findIndex(item => {
                              const textareaId = `${item.id}-${selectedTextarea.id.includes('-es') ? 'es' : 'en'}`;
                              return textareaId === selectedTextarea.id;
                            }),
                            'content',
                            selectedTextarea.id.includes('-es') ? 'es' : 'en',
                            newValue
                          );
                          selectedTextarea.focus();
                          selectedTextarea.selectionStart = selectionStart + url.length + 2;
                          selectedTextarea.selectionEnd = selectedTextarea.selectionStart;
                        } catch (err) {
                          alert('Please enter a valid Instagram URL');
                        }
                      }}
                    />
                    <FormatButton
                      icon={<List size={16} />}
                      label="Bullet List"
                      onClick={() => {/* Add formatting */}}
                    />
                    <FormatButton
                      icon={<ListOrdered size={16} />}
                      label="Numbered List"
                      onClick={() => {/* Add formatting */}}
                    />
                  </div>
                  <textarea
                    value={item.content.en}
                    onChange={(e) => {
                      updateNewsItem(index, 'content', 'en', e.target.value);
                    }}
                    ref={(el) => {
                      if (el) textareaRefs.current[`${item.id}-en`] = el;
                    }}
                    onFocus={(e) => {
                      setSelectedTextarea(e.target);
                    }}
                    className="w-full h-64 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Spanish Content
                  </label>
                  <div className="flex gap-2 mb-2">
                    <FormatButton
                      icon={<Bold size={16} />}
                      label="Bold"
                      onClick={() => {/* Add formatting */}}
                    />
                    <FormatButton
                      icon={<Italic size={16} />}
                      label="Italic"
                      onClick={() => {/* Add formatting */}}
                    />
                    <FormatButton
                      icon={<Link size={16} />}
                      label="Link"
                      onClick={() => {/* Add formatting */}}
                    />
                    <FormatButton
                      icon={<ImageIcon size={16} />}
                      label="Image"
                      onClick={handleImageClick}
                    />
                    <FormatButton
                      icon={<Youtube size={16} />}
                      label="YouTube"
                      onClick={() => {/* Add formatting */}}
                    />
                    <FormatButton
                      icon={<Instagram size={16} />}
                      label="Instagram"
                      onClick={() => {
                        if (!selectedTextarea) return;
                        const url = prompt('Enter Instagram post/reel URL (e.g., https://www.instagram.com/p/ABC123/)');
                        if (!url) return;
                        
                        try {
                          const urlObj = new URL(url);
                          if (!urlObj.hostname.includes('instagram.com')) {
                            throw new Error('Not an Instagram URL');
                          }
                          
                          const currentValue = selectedTextarea.value;
                          const selectionStart = selectedTextarea.selectionStart || currentValue.length;
                          const newValue = 
                            currentValue.slice(0, selectionStart) + 
                            `\n${url}\n` + 
                            currentValue.slice(selectionStart);
                          
                          selectedTextarea.value = newValue;
                          updateNewsItem(
                            newsItems.findIndex(item => {
                              const textareaId = `${item.id}-${selectedTextarea.id.includes('-es') ? 'es' : 'en'}`;
                              return textareaId === selectedTextarea.id;
                            }),
                            'content',
                            selectedTextarea.id.includes('-es') ? 'es' : 'en',
                            newValue
                          );
                          selectedTextarea.focus();
                          selectedTextarea.selectionStart = selectionStart + url.length + 2;
                          selectedTextarea.selectionEnd = selectedTextarea.selectionStart;
                        } catch (err) {
                          alert('Please enter a valid Instagram URL');
                        }
                      }}
                    />
                    <FormatButton
                      icon={<List size={16} />}
                      label="Bullet List"
                      onClick={() => {/* Add formatting */}}
                    />
                    <FormatButton
                      icon={<ListOrdered size={16} />}
                      label="Numbered List"
                      onClick={() => {/* Add formatting */}}
                    />
                  </div>
                  <textarea
                    value={item.content.es}
                    onChange={(e) => {
                      updateNewsItem(index, 'content', 'es', e.target.value);
                    }}
                    ref={(el) => {
                      if (el) textareaRefs.current[`${item.id}-es`] = el;
                    }}
                    onFocus={(e) => {
                      setSelectedTextarea(e.target);
                    }}
                    className="w-full h-64 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 font-mono"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {newsItems.length < MAX_NEWS_ITEMS && (
          <button
            onClick={() => {
              setNewsItems([
                ...newsItems,
                {
                  id: crypto.randomUUID(),
                  date: new Date().toISOString().split('T')[0],
                  title: { en: '', es: '' },
                  content: { en: '', es: '' },
                  order: newsItems.length
                }
              ]);
            }}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            <span>Add News Item</span>
          </button>
        )}
      </div>

      <ImageUrlDialog
        isOpen={showImageUrlDialog}
        onClose={() => setShowImageUrlDialog(false)}
        onSubmit={handleImageUrl}
      />

      <BlueSkyPostDialog
        isOpen={showBlueSkyDialog}
        onClose={() => setShowBlueSkyDialog(false)}
        onSubmit={(handle, postId) => {
          if (!selectedTextarea) return;
          const url = `https://bsky.app/profile/${handle}/post/${postId}`;
          const currentValue = selectedTextarea.value;
          const selectionStart = selectedTextarea.selectionStart || currentValue.length;
          const newValue = 
            currentValue.slice(0, selectionStart) + 
            url + 
            currentValue.slice(selectionStart);
          
          selectedTextarea.value = newValue;
          selectedTextarea.focus();
          selectedTextarea.selectionStart = selectionStart + url.length;
          selectedTextarea.selectionEnd = selectedTextarea.selectionStart;
        }}
      />
    </div>
  );
}

export default NewsEditor;