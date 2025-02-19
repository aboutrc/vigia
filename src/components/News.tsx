import React from 'react';
import { useState, useEffect } from 'react';
import { translations } from '../translations';
import { supabase } from '../lib/supabase';
import { AlertTriangle, Copy, Check } from 'lucide-react';
import DOMPurify from 'dompurify';

interface ShareButtonsProps {
  title: string;
  language: 'en' | 'es';
}

const ShareButtons = ({ title, language }: ShareButtonsProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(
      `${title}\n\n${window.location.href}`
    )}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 transition-colors rounded-lg text-white text-sm"
      >
        {copied ? (
          <Check size={16} className="text-green-400" />
        ) : (
          <Copy size={16} />
        )}
        <span>{language === 'es' ? 'Copiar enlace' : 'Copy link'}</span>
      </button>
      
      <button
        onClick={handleWhatsAppShare}
        className="flex items-center gap-2 px-3 py-1.5 bg-[#25D366] hover:bg-[#128C7E] transition-colors rounded-lg text-white text-sm"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span>{language === 'es' ? 'Compartir' : 'Share'}</span>
      </button>
    </div>
  );
};
interface NewsProps {
  language?: 'en' | 'es';
}

interface NewsItem {
  date: string;
  title: {
    en: string;
    es: string;
  };
  content: {
    en: string;
    es: string;
  };
}

const News = ({ language = 'en' }: NewsProps) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const processContent = (content: string) => {
    // Convert markdown-style formatting to HTML
    let processed = content
      // Convert Twitter/X embeds
      .replace(
        /https:\/\/(twitter|x)\.com\/(\w+)\/status\/(\d+)/g,
        '<div class="social-embed twitter-embed"><div class="embed-loading">Loading tweet...</div><blockquote class="twitter-tweet"><a href="$&"></a></blockquote></div>'
      )
      // Convert BlueSky embeds
      .replace(
        /https:\/\/bsky\.app\/profile\/([^\/]+)\/post\/([a-zA-Z0-9]+)/g,
        '<div class="social-embed bluesky-embed"><iframe src="https://bsky.app/embed/$1/post/$2" style="width:100%;height:300px;border:none;background:transparent" frameborder="0" scrolling="no" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" sandbox="allow-scripts allow-same-origin allow-popups" onerror="this.outerHTML=\'<div class=\\\'embed-error\\\'>Bluesky embed failed to load</div>\'"></iframe></div>'
      )
      // Convert YouTube URLs to embedded iframes
      .replace(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g,
        '<div class="video-container"><iframe width="100%" height="315" src="https://www.youtube.com/embed/$1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>'
      )
      // Convert Vimeo URLs to embedded iframes
      .replace(/(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/)([0-9]+)/g,
        '<div class="video-container"><iframe src="https://player.vimeo.com/video/$1" width="100%" height="315" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>'
      )
      // Convert bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Convert links
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300">$1</a>')
      // Convert unordered lists
      .replace(/^- (.*)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul class="list-disc pl-6 space-y-1 my-4">$&</ul>')
      // Convert ordered lists
      .replace(/^\d+\. (.*)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul class="list-decimal pl-6 space-y-1 my-4">$&</ul>');

    return processed;
  };

  useEffect(() => {
    fetchNewsItems();
  }, []);

  // Add real-time subscription for news updates
  useEffect(() => {
    const channel = supabase
      .channel('news_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'news_items'
      }, (payload) => {
        console.log('News item changed:', payload);
        fetchNewsItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    // Load Twitter widgets after content updates
    if (window.twttr && window.twttr.widgets) {
      window.twttr.widgets.load();
    }
  }, [newsItems]);

  const fetchNewsItems = async () => {
    try {
      const { data, error } = await supabase
        .from('news_items')
        .select('*')
        .order('order', { ascending: true })
        .order('date', { ascending: false });

      if (error) throw error;
      setNewsItems(data || []);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError(language === 'es' 
        ? 'Error al cargar las noticias'
        : 'Error loading news');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <style>
          {`
            .video-container {
              position: relative;
              padding-bottom: 56.25%;
              height: 0;
              overflow: hidden;
              margin: 1rem 0;
            }
            .video-container iframe {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
            }
            .news-content iframe {
              border-radius: 0.5rem;
              margin: 1rem 0;
            }
            .news-content .social-embed {
              width: 100%;
              max-width: 550px;
              margin: 1rem auto;
              display: block;
            }
            .embed-error {
              padding: 1rem;
              background: rgba(255,0,0,0.1);
              border-radius: 0.5rem;
              color: #ff6b6b;
              text-align: center;
            }
            .twitter-embed {
              min-height: 300px;
              display: flex;
              justify-content: center;
              align-items: center;
              background: rgba(0,0,0,0.1);
              border-radius: 0.5rem;
              margin: 1rem 0;
            }
            .embed-loading {
              padding: 1rem;
              color: #888;
              text-align: center;
            }
            .news-content .bluesky-embed {
              width: 100%;
              min-height: 300px;
              border: none;
              background-color: transparent;
              margin: 1rem auto;
              border-radius: 0.5rem;
              overflow: hidden;
            }
          `}
        </style>

        {/* Twitter embed script */}
        <script async src="https://platform.twitter.com/widgets.js"></script>

        {loading && (
          <div className="text-center text-gray-400 py-8">
            {language === 'es' ? 'Cargando...' : 'Loading...'}
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 text-red-100 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-6">
          {newsItems.map((item, index) => (
            <div 
              key={index}
              className="bg-black/40 backdrop-blur-sm rounded-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="text-gray-400 text-sm mb-2">
                  {new Date(item.date).toLocaleDateString(
                    language === 'es' ? 'es-ES' : 'en-US',
                    { 
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }
                  )}
                </div>
                <h2 className="text-xl font-bold text-white mb-4">
                  {language === 'es' ? item.title.es : item.title.en}
                </h2>
                <div 
                  className="text-gray-300 news-content"
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(processContent(
                      language === 'es' ? item.content.es : item.content.en),
                      {
                        ADD_TAGS: ['iframe'],
                        ADD_ATTR: [
                          'allow', 
                          'allowfullscreen', 
                          'frameborder', 
                          'scrolling'
                        ]
                      }
                    )
                  }}
                />
                <div className="mt-4 flex justify-end space-x-2">
                  <ShareButtons
                    title={language === 'es' ? item.title.es : item.title.en}
                    language={language}
                  />
                </div>
              </div>
            </div>
          ))}

          {!loading && newsItems.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              {language === 'es' 
                ? 'No hay noticias disponibles'
                : 'No news available'}
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-400 mb-4">
            This is a project built by Rafael "RC" Concepcion - If you want to read what inspired this, read it at my blog: <a href="http://aboutrc.com/?p=7682" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">aboutrc.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default News;