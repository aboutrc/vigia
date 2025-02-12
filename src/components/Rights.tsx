import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { translations } from '../translations';

interface RightsProps {
  language?: 'en' | 'es';
}

const Rights = ({ language = 'en' }: RightsProps) => {
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const t = translations[language].rights;

  const sections = [
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
    }
  ];

  const toggleSection = (index: number) => {
    setExpandedSection(current => current === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
        {sections.map((section, index) => (
          <div
            key={index}
            className="bg-black/40 backdrop-blur-sm rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleSection(index)}
              className="w-full px-4 py-3 flex items-center justify-between text-white hover:bg-black/50 transition-colors"
            >
              <span className="text-base font-medium">{section.title}</span>
              {expandedSection === index ? (
                <ChevronDown size={20} />
              ) : (
                <ChevronRight size={20} />
              )}
            </button>
            
            {expandedSection === index && (
              <div className="px-4 pb-4">
                <div className="space-y-2">
                  {section.content.map((text, i) => (
                    <p key={i} className="text-gray-300">
                      {text}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Rights;