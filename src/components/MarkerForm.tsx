import React, { useState } from 'react';
import { MarkerFormData, MarkerCategory } from '../types';
import { translations } from '../translations';

interface MarkerFormProps {
  initialData?: MarkerFormData;
  onSubmit: (data: MarkerFormData) => Promise<void>;
  onCancel: () => void;
  language?: 'en' | 'es';
  isSaving?: boolean;
}

const categories: MarkerCategory[] = ['ice', 'police'];

export default function MarkerForm({ initialData, onSubmit, onCancel, language = 'en', isSaving = false }: MarkerFormProps) {
  const [formData, setFormData] = useState<MarkerFormData>({
    category: initialData?.category || 'ice'
  });

  const t = translations[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSaving) return;
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-lg shadow-lg" onClick={e => e.stopPropagation()}>
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          {t.markerForm.category}
        </label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value as MarkerCategory })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          disabled={isSaving}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {t.categories[category]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
          disabled={isSaving}
        >
          {t.markerForm.cancel}
        </button>
        <button
          type="submit"
          className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
            isSaving 
              ? 'bg-blue-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          disabled={isSaving}
        >
          {isSaving ? t.markerForm.saving : t.markerForm.save}
        </button>
      </div>
    </form>
  );
}