import React, { useState, useEffect, useRef } from 'react';
import { translations } from '../translations';
import { supabase } from '../lib/supabase';
import { AlertTriangle, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { createRoot } from 'react-dom/client';
import DOMPurify from 'dompurify';
import { InstagramEmbed, TwitterEmbed } from 'react-social-media-embed';
import BlueSkyEmbed from './BlueSkyEmbed';

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
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const rootsRef = useRef<Map<string, Root>>(new Map());
  const retryTimeoutRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Clean up channel subscription
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [channel]);

  const processContent = (content: string) => {
    // Convert markdown-style formatting to HTML
    let processed = content
      // Convert paragraphs
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+?)$/gm, function(match) {
        // Don't wrap if it's already a HTML tag or list item
        if (match.startsWith('<') || match.startsWith('-') || match.startsWith('1.')) {
          return match;
        }
        return `<p>${match}</p>`;
      })
      // Convert Twitter/X embeds
      .replace(
        /https:\/\/(twitter|x)\.com\/(\w+)\/status\/(\d+)/g,
        '<div class="twitter-container" data-twitter-url="$&"></div>'
      )
      // Convert Instagram embeds
      .replace(
        /https:\/\/(?:www\.)?instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/g,
        '<div class="instagram-container" data-instagram-url="$&"></div>'
      )
      // Convert BlueSky embeds
      .replace(
        /https:\/\/bsky\.app\/profile\/([^\/]+)\/post\/([a-zA-Z0-9]+)/g,
        '<div class="bluesky-container" data-bsky-url="$&"></div>'
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
      // Convert image markdown to HTML
      .replace(/!\[\]\((.*?)\)/g, (match, url) => {
        // Handle Supabase storage URLs
        const encodedUrl = url.replace(/\s+/g, '').trim();
        return `<img 
          src="${encodedUrl}" 
          alt="" 
          class="w-full h-auto rounded-lg shadow-lg my-4 transition-opacity duration-300 bg-black/30" 
          loading="lazy" 
          crossorigin="anonymous"
          onload="this.style.opacity='1'; this.style.minHeight='auto';" 
          onerror="this.classList.add('error'); console.error('Failed to load:', this.src);" 
          style="opacity: 0; min-height: 300px;"
        />`;
      })
      // Convert sections
      .replace(/^## (.*?)$/gm, '<h2 class="text-xl font-bold text-white mt-6 mb-4">$1</h2>')
      .replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-bold text-white mb-6">$1</h1>')
      // Convert unordered lists
      .replace(/^- (.*)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul class="list-disc pl-6 space-y-1 my-4">$&</ul>')
      // Convert ordered lists
      .replace(/^\d+\. (.*)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul class="list-decimal pl-6 space-y-1 my-4">$&</ul>');

    return processed;
  };

  const toggleItem = (id: string) => {
    setExpandedItems(current =>
      current.includes(id)
        ? current.filter(itemId => itemId !== id)
        : [...current, id]
    );
  };

  useEffect(() => {
    fetchNewsItems();
  }, []);

  // Add real-time subscription for news updates
  useEffect(() => {
    const newChannel = supabase
      .channel('news_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'news_items'
        },
        async (payload) => {
          if (payload.eventType === 'DELETE') {
            // Remove deleted item from state
            setNewsItems(prev => prev.filter(item => item.id !== payload.old.id));
            // Remove from expanded items if needed
            setExpandedItems(prev => prev.filter(id => id !== payload.old.id));
          } else {
            // Fetch all items for other changes
            await fetchNewsItems();
          }
        }
      )
      .subscribe();

    setChannel(newChannel);

    return () => {
      if (newChannel) {
        supabase.removeChannel(newChannel);
      }
    };
  }, []);

  useEffect(() => {
    // Cleanup function to unmount all roots
    const cleanup = () => {
      if (mountedRef.current) {
        rootsRef.current.forEach((root) => {
          try {
            root.unmount();
          } catch (err) {
            console.error('Error unmounting root:', err);
          }
        });
        rootsRef.current.clear();
      }
    };

    // Process social media embeds
    const bskyContainers = document.querySelectorAll('.bluesky-container');
    const twitterContainers = document.querySelectorAll('.twitter-container');
    
    // Clean up existing roots first
    cleanup();
    
    // Handle Bluesky embeds
    bskyContainers.forEach(container => {
      const url = container.getAttribute('data-bsky-url'); 
      if (url) {
        const root = createRoot(container);
        rootsRef.current.set(url, root);
        root.render(<BlueSkyEmbed url={url} />);
      }
    });

    // Handle Twitter embeds
    twitterContainers.forEach(container => {
      const url = container.getAttribute('data-twitter-url');
      if (url && isValidTwitterUrl(url)) {
        const root = createRoot(container);
        rootsRef.current.set(url, root);
        try {
          root.render(
            <TwitterEmbed url={url} width="100%" />
          );
        } catch (err) {
          console.error('Twitter embed error:', err);
          root.render(
            <div className="embed-error">
              Failed to load tweet. The tweet may be private or no longer available.
            </div>
          );
        }
      }
    });

    // Handle Instagram embeds using react-social-media-embed
    document.querySelectorAll('.instagram-container').forEach(container => {
      const url = container.getAttribute('data-instagram-url');
      if (url && isValidInstagramUrl(url)) {
        const root = createRoot(container);
        rootsRef.current.set(url, root);
        try {
          root.render(
            <InstagramEmbed url={url} width="100%" />
          );
        } catch (err) {
          console.error('Instagram embed error:', err);
          root.render(
            <div className="embed-error">
              Failed to load Instagram post. The post may be private or no longer available.
            </div>
          );
        }
      } else if (url) {
        const root = createRoot(container);
        rootsRef.current.set(url, root);
        root.render(
          <div className="embed-error">
            Invalid Instagram URL format. Please check the URL and try again.
          </div>
        );
      }
    });

    // Cleanup when component unmounts or content changes
    return cleanup;
  }, [expandedItems]);

  const isValidInstagramUrl = (url: string): boolean => {
    try {
      const instagramRegex = /^https:\/\/(?:www\.)?instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)\/?/;
      return instagramRegex.test(url);
    } catch {
      return false;
    }
  };

  const isValidTwitterUrl = (url: string): boolean => {
    try {
      const twitterRegex = /^https:\/\/(twitter|x)\.com\/\w+\/status\/\d+/;
      return twitterRegex.test(url);
    } catch {
      return false;
    }
  };

  useEffect(() => {
    // Load Twitter widgets after content updates
    if (window.twttr && window.twttr.widgets) {
      window.twttr.widgets.load();
    }
  }, [newsItems]);

  const fetchNewsItems = async () => {
    try {
      if (!supabase) {
        setIsConnecting(true);
        throw new Error('Supabase client not initialized');
      }

      setIsConnecting(true);
      const { data, error } = await supabase
        .from('news_items')
        .select('*')
        .order('order', { ascending: true })
        .order('date', { ascending: false });

      if (error) throw error;
      if (!mountedRef.current) return;
      
      setNewsItems(data || []);
      setError(null);
      setIsConnecting(false);
    } catch (err) {
      console.error('Error fetching news:', err);
      
      if (!mountedRef.current) return;
      
      setError(language === 'es' 
        ? 'Error al cargar las noticias'
        : 'Error loading news');
      
      // Retry after 5 seconds
      if (retryTimeoutRef.current) {
        window.clearTimeout(retryTimeoutRef.current);
      }
      if (mountedRef.current) {
        retryTimeoutRef.current = window.setTimeout(fetchNewsItems, 5000);
      }
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
    }
  };

  // Cleanup retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        window.clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {isConnecting && (
          <div className="text-center text-gray-400 py-8">
            {language === 'es' 
              ? 'Conectando a la base de datos...' 
              : 'Connecting to database...'}
          </div>
        )}

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
              max-width: 600px;
              margin: 2rem auto;
              display: block;
            }
            .twitter-container {
              width: 100%;
              max-width: 600px;
              margin: 1.5rem auto;
              min-height: 200px;
              border-radius: 0.5rem;
              background: rgba(0,0,0,0.1);
            }
            .twitter-container iframe {
              border-radius: 0.5rem !important;
              width: 100% !important;
              max-width: 100% !important;
            }
            .instagram-container {
              width: 100%;
              max-width: 550px;
              margin: 1.5rem auto;
              min-height: 600px;
              border-radius: 0.5rem;
              background: rgba(0,0,0,0.1);
            }
            .instagram-container iframe {
              border-radius: 0.5rem !important;
              width: 100% !important;
              max-width: 100% !important;
            }
            .embed-error {
              padding: 1rem;
              background: rgba(255,0,0,0.1);
              border-radius: 0.75rem;
              color: #ff6b6b;
              text-align: center;
              margin: 1rem 0;
              font-size: 0.875rem;
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
            .news-content img {
              max-width: 100%;
              height: auto;
              border-radius: 1rem;
              margin: 2rem auto;
              display: block;
              box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5);
              transition: opacity 0.3s ease;
            }
            .news-content img.error {
              opacity: 0.5;
              background-color: rgba(255, 0, 0, 0.1);
            }
            .vimeo-icon {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 24px;
              height: 24px;
              background-color: #00ADEF;
              border-radius: 50%;
              margin-right: 0.5rem;
            }
            .vimeo-icon span {
              color: white;
              font-weight: bold;
              font-size: 14px;
              line-height: 1;
            }
            .news-content p {
              margin: 1rem 0;
              line-height: 1.75;
            }
            .news-content h1, .news-content h2 {
              margin-top: 2rem;
              margin-bottom: 1rem;
              font-weight: 600;
            }
            .news-content h1 {
              font-size: 1.875rem;
              line-height: 2.25rem;
            }
            .news-content h2 {
              font-size: 1.5rem;
              line-height: 2rem;
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
              key={item.id}
              className="bg-black/40 backdrop-blur-sm rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-black/50 transition-colors"
              >
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">
                    {language === 'es' ? item.title.es : item.title.en}
                  </h2>
                  <div className="text-gray-400 text-sm mt-1">
                  {new Date(item.date).toLocaleDateString(
                    language === 'es' ? 'es-ES' : 'en-US',
                    { 
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }
                  )}
                  </div>
                </div>
                {expandedItems.includes(item.id) ? (
                  <ChevronDown size={20} className="text-gray-400" />
                ) : (
                  <ChevronRight size={20} className="text-gray-400" />
                )}
              </button>
              {expandedItems.includes(item.id) && <div className="px-6 pb-6">
                <div 
                  className="text-gray-300 news-content"
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(processContent(
                      language === 'es' ? item.content.es : item.content.en),
                      {
                        ADD_TAGS: ['iframe', 'img'],
                        ADD_ATTR: [
                          'allow', 
                          'allowfullscreen', 
                          'frameborder', 
                          'scrolling',
                          'src',
                          'alt',
                          'loading',
                          'class',
                          'crossorigin'
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
              </div>}
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