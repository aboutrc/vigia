import React, { useEffect } from 'react';

const ElevenLabsWidget = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://elevenlabs.io/convai-widget/index.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="w-full h-full bg-black/30 rounded-lg overflow-hidden">
      <style>
        {`
          elevenlabs-convai {
            position: static !important;
            width: 100% !important;
            height: 100% !important;
            display: block !important;
          }
          .convai-chat-button {
            left: 50% !important;
            transform: translateX(-50%) !important;
            right: auto !important;
          }
        `}
      </style>
      <elevenlabs-convai 
        agent-id="nPjA5PlVWxRd7L1Ypou4"
      ></elevenlabs-convai>
    </div>
  );
};

export default ElevenLabsWidget;