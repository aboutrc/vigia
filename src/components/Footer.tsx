import React from 'react';
import { Coffee } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-gray-800">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex-1 overflow-hidden whitespace-nowrap">
          <div className="animate-scroll inline-block">
            <p className="text-gray-300 text-sm">
              This website is <span className="text-yellow-400">free to use</span>, <span className="text-yellow-400">anonymous</span>, and you <span className="text-yellow-400">don't need to sign in</span>. If you feel like you <span className="text-yellow-400">want</span> to support me and the work, you can buy me a coffee.
            </p>
          </div>
        </div>
        <a
          href="https://buymeacoffee.com/aboutrc"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFDD00] text-black rounded-md hover:bg-[#FFDD00]/90 transition-colors"
        >
          <Coffee size={16} />
          <span className="text-xs font-medium">Buy me a coffee</span>
        </a>
      </div>
    </footer>
  );
};

export default Footer;