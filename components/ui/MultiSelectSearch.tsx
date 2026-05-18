'use client'

import { useState, useRef, useEffect } from 'react';

interface MultiSelectSearchProps {
  options: string[];
  selectedValues: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export default function MultiSelectSearch({ 
  options, 
  selectedValues, 
  onChange, 
  placeholder = 'Cari kelas...',
  label = 'Pilih Kelas'
}: MultiSelectSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-[10px] font-bold text-foreground/50 uppercase mb-1">{label}</label>
      
      {/* Search Input & Trigger */}
      <div 
        className={`flex flex-wrap gap-1.5 p-2 border rounded-xl transition-all cursor-text min-h-[42px]
          ${isOpen ? 'border-primary-500 ring-2 ring-primary-500/10' : 'border-border-custom bg-surface'}
        `}
        onClick={() => setIsOpen(true)}
      >
        {selectedValues.map(val => (
          <span 
            key={val} 
            className="flex items-center gap-1 bg-primary-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg"
          >
            {val}
            <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); onChange(val); }}
                className="hover:text-primary-200"
            >
                ×
            </button>
          </span>
        ))}
        
        {selectedValues.length === 0 && (
            <span className="text-xs text-foreground/30 p-1">{placeholder}</span>
        )}

        <div className="flex-1"></div>

        <div className="flex items-center pr-1 text-foreground/20">
            <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
        </div>
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-surface border border-border-custom rounded-xl shadow-2xl max-h-72 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Search Input Inside Dropdown */}
          <div className="p-2 border-b border-border-custom bg-foreground/[0.02]">
            <div className="relative">
                <input
                    autoFocus
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Ketik untuk mencari..."
                    className="w-full pl-8 pr-3 py-2 text-xs bg-surface border border-border-custom rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                />
                <svg className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
            </div>
          </div>

          <div className="overflow-y-auto p-1 grid grid-cols-1 gap-0.5 max-h-48">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onChange(opt)}
                  className={`flex items-center justify-between px-3 py-2 text-xs rounded-lg transition
                    ${selectedValues.includes(opt) 
                        ? 'bg-primary-500 text-white font-bold' 
                        : 'text-foreground hover:bg-foreground/5'
                    }
                  `}
                >
                  <span>{opt}</span>
                  {selectedValues.includes(opt) && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                      </svg>
                  )}
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-foreground/40 italic">
                Tidak ada kelas yang cocok.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
