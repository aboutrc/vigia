import React from 'react';
import { translations } from '../translations';
import { AlertTriangle } from 'lucide-react';

interface NewsProps {
  language?: 'en' | 'es';
}

const News = ({ language = 'en' }: NewsProps) => {
  const t = translations[language];

  const newsItems = [
    {
      date: '2025-02-13',
      title: {
        en: 'Important Update: New Features Added',
        es: 'Actualización Importante: Nuevas Funciones Añadidas'
      },
      content: {
        en: 'We\'ve added new features to help keep our community informed and safe. The map now includes reliability scores for markers and a new confirmation system.',
        es: 'Hemos agregado nuevas funciones para ayudar a mantener a nuestra comunidad informada y segura. El mapa ahora incluye puntajes de confiabilidad para los marcadores y un nuevo sistema de confirmación.'
      }
    },
    {
      date: '2025-02-12',
      title: {
        en: 'Community Guidelines Update',
        es: 'Actualización de las Pautas Comunitarias'
      },
      content: {
        en: 'Please remember to only report actual sightings and verify information before posting. Our strength lies in accurate, reliable information sharing.',
        es: 'Por favor recuerde reportar solo avistamientos reales y verificar la información antes de publicar. Nuestra fortaleza radica en compartir información precisa y confiable.'
      }
    },
    {
      date: '2025-02-11',
      title: {
        en: 'Know Your Rights: New Resources Available',
        es: 'Conozca Sus Derechos: Nuevos Recursos Disponibles'
      },
      content: {
        en: 'We\'ve updated our Rights section with new information and resources. Stay informed about your constitutional protections.',
        es: 'Hemos actualizado nuestra sección de Derechos con nueva información y recursos. Manténgase informado sobre sus protecciones constitucionales.'
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-yellow-600/20 backdrop-blur-sm rounded-lg p-4 mb-8 flex items-start gap-3">
          <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-yellow-200 text-sm">
            {language === 'es' 
              ? 'La información proporcionada aquí es solo para fines informativos. Siempre verifique la información con fuentes oficiales.'
              : 'Information provided here is for informational purposes only. Always verify information with official sources.'}
          </div>
        </div>

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
                <p className="text-gray-300">
                  {language === 'es' ? item.content.es : item.content.en}
                </p>
              </div>
            </div>
          ))}
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