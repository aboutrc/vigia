import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Scale } from 'lucide-react';
import { translations } from '../translations';

interface RightsProps {
  language?: 'en' | 'es';
}

const Rights = ({ language = 'en' }: RightsProps) => {
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const t = translations[language].rights;

  const sections = [
    {
      ...t.sections.constitution,
      content: t.sections.constitution.content
    },
    {
      ...t.sections.amendments,
      content: t.sections.amendments.content
    },
    {
      ...t.sections.iceHome,
      content: t.sections.iceHome.content
    },
    {
      ...t.sections.iceStreet,
      content: t.sections.iceStreet.content
    }
  ];

  const toggleSection = (index: number) => {
    setExpandedSection(current => current === index ? null : index);
  };

  const renderContent = (item: string) => {
    // Check if it's an amendment title or section header
    if ((item.includes('Amendment') || item.includes('Enmienda')) || 
        (item === "What to Do:" || item === "Qué Hacer:")) {
      return (
        <h3 className="text-lg font-bold text-gray-100 mt-4 mb-2">
          {item}
        </h3>
      );
    }
    
    // For bullet points, add indentation
    if (item.startsWith('•')) {
      return (
        <div className="ml-6">
          <span>{item}</span>
        </div>
      );
    }
    
    // For empty lines
    if (item === '') {
      return <div className="py-1"></div>;
    }
    
    // For regular content
    return (
      <div className="flex items-start">
        <span className="mr-2">•</span>
        <span>{item}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center space-x-2 text-gray-100 mb-6">
          <Scale size={24} />
          <h1 className="text-2xl font-semibold">{t.title}</h1>
        </div>

        {sections.map((section, index) => (
          <div
            key={index}
            className="bg-black/30 backdrop-blur-sm rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleSection(index)}
              className="w-full px-4 py-3 flex items-center justify-between text-gray-100 hover:bg-black/40 transition-colors"
            >
              <span className="font-medium">{section.title}</span>
              {expandedSection === index ? (
                <ChevronDown size={20} />
              ) : (
                <ChevronRight size={20} />
              )}
            </button>
            
            {expandedSection === index && (
              <div className="px-4 pb-4">
                <div className="space-y-2 text-gray-300">
                  {section.content.map((item, i) => (
                    <div key={i}>
                      {renderContent(item)}
                    </div>
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