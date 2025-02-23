import React, { useState, useEffect } from 'react';

interface BlueSkyEmbedProps {
  url: string;
}

const BlueSkyEmbed = ({ url }: BlueSkyEmbedProps) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const match = url.match(/https:\/\/bsky\.app\/profile\/([^\/]+)\/post\/([a-zA-Z0-9]+)/);
  
  if (!match) {
    return (
      <div className="w-full max-w-lg mx-auto my-4 p-4 bg-red-900/20 rounded-lg text-red-200">
        Invalid Bluesky URL format
      </div>
    );
  }

  const [_, handle, postId] = match;
  const embedUrl = `https://staging.bsky.app/profile/${handle}/post/${postId}/embed`;

  return (
    <div className="w-full max-w-lg mx-auto my-4">
      <div className="relative bg-gray-800/50 rounded-xl overflow-hidden shadow-lg">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
            <div className="text-blue-400 text-sm animate-pulse">Loading Bluesky post...</div>
          </div>
        )}
        <iframe
          src={embedUrl}
          className="w-full min-h-[300px] bg-transparent"
          onError={() => setError(true)}
          onLoad={() => setLoading(false)}
          frameBorder="0"
          scrolling="no"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        />
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900/20 backdrop-blur-sm">
            <div className="text-red-200 text-sm">Failed to load Bluesky post</div>
          </div>
        )}
      </div>
      <div className="mt-2 text-right">
        <a 
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          View on Bluesky
        </a>
      </div>
    </div>
  );
};

export default BlueSkyEmbed;