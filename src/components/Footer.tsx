import React from 'react';
import FooterLeftMsg from './FooterLeftMsg';
import FooterRightBtn from './FooterRightBtn';
import { useLanguage } from '../hooks/useLanguage';

const Footer = () => {
  const { language } = useLanguage();

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-gray-800">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <FooterLeftMsg />
        <FooterRightBtn />
      </div>
    </footer>
  );
};

export default Footer;