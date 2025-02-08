import React from 'react';
import { Coffee } from 'lucide-react';

const FooterRightBtn = () => {
  return (
    <a
      href="https://buymeacoffee.com/aboutrc"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFDD00] text-black rounded-md hover:bg-[#FFDD00]/90 transition-colors"
    >
      <Coffee size={16} />
      <span className="text-xs font-medium">Buy me a coffee</span>
    </a>
  );
};

export default FooterRightBtn;