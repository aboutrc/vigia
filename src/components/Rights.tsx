import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ArrowUpRight } from 'lucide-react';
import { translations } from '../translations';

interface RightsProps {
  language?: 'en' | 'es';
}

interface Section {
  title: string;
  content: string[];
  isCaseLaw?: boolean;
}

const Rights = ({ language = 'en' }: RightsProps) => {
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const t = translations[language].rights;

  const sections: Section[] = [
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
      
      // Skip empty lines
      if (!line) continue;

      // If line contains "v." and ends with a year in parentheses, it's a title
      if (line.includes('v.') && /\(\d{4}\)/.test(line)) {
        // If we have a previous case, save it
        if (currentCase.title) {
          cases.push({ ...currentCase });
        }
        // Start new case
        currentCase = {
          title: line,
          description: '',
          learnMore: ''
        };
      }
      // If line starts with "Learn more:" or "Más información:", it's a link
      else if (line.startsWith('Learn more:') || line.startsWith('Más información:')) {
        currentCase.learnMore = line.replace(line.startsWith('Learn more:') ? 'Learn more:' : 'Más información:', '').trim();
      }
      // Otherwise, it's part of the description
      else if (currentCase.title) {
        currentCase.description = line;
      }
    }

    // Add the last case
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
                {section.isCaseLaw ? (
                  renderCaseLawContent(section.content)
                ) : (
                  <div className="space-y-2">
                    {section.content.map((text, i) => (
                      <p key={i} className="text-gray-300">
                        {text}
                      </p>
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