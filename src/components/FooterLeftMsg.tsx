import React from 'react';
import { useLanguage } from '../hooks/useLanguage';

const FooterLeftMsg = () => {
  const { language } = useLanguage();

  const message = language === 'es' 
    ? (
      <>
        Este sitio web es <span className="text-yellow-400">gratuito</span>, <span className="text-yellow-400">anónimo</span> y <span className="text-yellow-400">no necesitas iniciar sesión</span>. Si <span className="text-yellow-400">deseas</span> apoyarme y mi trabajo, puedes comprarme un café.
      </>
    )
    : (
      <>
        This website is <span className="text-yellow-400">free to use</span>, <span className="text-yellow-400">anonymous</span>, and you <span className="text-yellow-400">don't need to sign in</span>. If you feel like you <span className="text-yellow-400">want</span> to support me and the work, you can buy me a coffee.
      </>
    );

  return (
    <div className="flex-1 overflow-hidden whitespace-nowrap">
      <div className="animate-scroll inline-block">
        <p className="text-gray-300 text-sm">
          {message}
        </p>
      </div>
    </div>
  );
};

export default FooterLeftMsg;