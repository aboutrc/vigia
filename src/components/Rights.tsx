import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { translations } from '../translations';
import ElevenLabsWidget from './ElevenLabsWidget';

interface RightsProps {
  language?: 'en' | 'es';
}

const Rights = ({ language = 'en' }: RightsProps) => {
  const [expandedSection, setExpandedSection] = useState<number | null>(0); // Set to 0 to auto-expand Tia Maria
  const t = translations[language].rights;

  const sections = [
    {
      title: language === 'es' ? 'Tía María - Asistente de IA' : 'Tia Maria - AI Assistant',
      content: ['']
    },
    {
      title: t.sections.constitution.title,
      content: t.sections.constitution.content
    },
    {
      title: t.sections.amendments.title,
      content: t.sections.amendments.content
    },
    {
      title: t.sections.iceHome.title,
      content: t.sections.iceHome.content
    },
    {
      title: t.sections.iceStreet.title,
      content: t.sections.iceStreet.content
    },
    {
      title: t.sections.caseLaw.title,
      content: t.sections.caseLaw.content,
      isCaseLaw: true
    }
  ];

  const toggleSection = (index: number) => {
    setExpandedSection(current => current === index ? null : index);
  };

  const renderCaseLawContent = (content: string[]) => {
    const cases = [];
    let currentCase = {
      title: '',
      description: '',
      learnMore: ''
    };

    for (let i = 0; i < content.length; i++) {
      const line = content[i].trim();
      
      if (!line) continue;

      if (line.includes('v.') && /\(\d{4}\)/.test(line)) {
        if (currentCase.title) {
          cases.push({ ...currentCase });
        }
        currentCase = {
          title: line,
          description: '',
          learnMore: ''
        };
      }
      else if (line.startsWith('Learn more:') || line.startsWith('Más información:')) {
        currentCase.learnMore = line.replace(line.startsWith('Learn more:') ? 'Learn more:' : 'Más información:', '').trim();
      }
      else if (currentCase.title) {
        currentCase.description = line;
      }
    }

    if (currentCase.title) {
      cases.push(currentCase);
    }

    return (
      <div className="space-y-6">
        {cases.map((caseItem, index) => (
          <div key={index} className="space-y-2">
            <h3 className="CaseLaw_Emphasis">
              {caseItem.title}
            </h3>
            <p className="text-gray-300">
              {caseItem.description}
            </p>
            {caseItem.learnMore && (
              <a
                href={caseItem.learnMore}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1.5 text-sm font-medium"
              >
                {language === 'es' ? 'Más información' : 'Learn more'}
                <ArrowUpRight size={16} />
              </a>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-4">
        {sections.map((section, index) => (
          <div
            key={index}
            className="bg-black/40 backdrop-blur-sm rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleSection(index)}
              className="w-full px-6 py-4 flex items-center justify-between text-white hover:bg-black/50 transition-colors"
            >
              <span className="text-xl font-bold">{section.title}</span>
              {expandedSection === index ? (
                <ChevronDown size={24} />
              ) : (
                <ChevronRight size={24} />
              )}
            </button>
            
            {expandedSection === index && (
              <div className="px-6 pb-6">
                {index === 0 ? (
                  <>
                    <p className="text-gray-300 mb-6">
                      {language === 'es' 
                        ? 'Ahora puedes tener una conversación con la IA y hacer cualquier pregunta que tengas sobre tus derechos y ICE. Esta IA utiliza información del sitio web de la ACLU para asegurarse de que tengas la información más precisa posible.'
                        : 'You can now have a conversation with AI and ask any questions you may have about your rights and ICE. This AI is using information from the ACLU website to make sure you have the most accurate information possible.'
                      }
                    </p>
                    <div className="h-[500px]">
                      <ElevenLabsWidget />
                    </div>
                  </>
                ) : section.isCaseLaw ? (
                  renderCaseLawContent(section.content)
                ) : (
                  <div className="space-y-4">
                    {section.content.map((text, i) => (
                      <div key={i} className="text-gray-300">
                        {text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Rights;