import React from 'react';
import { useLanguage } from '../hooks/useLanguage';

const FooterLeftMsg = () => {
  const { language } = useLanguage();

  const message = language === 'es' 
    ? "Este sitio web es gratuito, anónimo y no necesitas iniciar sesión. Si deseas apoyarme y mi trabajo, puedes comprarme un café."
    : "This website is free to use, anonymous, and you don't need to sign in. If you feel like you want to support me and the work, you can buy me a coffee.";

  return (
    <div className="flex-1 overflow-hidden whitespace-nowrap">
      <div className="animate-scroll inline-block">
        <p className="text-gray-300 text-xs">
          {message}
        </p>
      </div>
    </div>
  );
};

export default FooterLeftMsg;