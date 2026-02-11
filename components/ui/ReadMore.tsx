'use client'

import { useState } from 'react';

export default function ReadMore({ text, limit = 50 }: { text: string, limit?: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  if (text.length <= limit) {
    return <span className="text-gray-600 break-words">{text}</span>;
  }

  return (
    <div className="text-gray-600 leading-relaxed">
      <span className="break-words">
        {isExpanded ? text : `${text.substring(0, limit)}...`}
      </span>
      <button
        onClick={(e) => {
          e.preventDefault();
          setIsExpanded(!isExpanded);
        }}
        className="inline-block ml-1 text-blue-600 hover:underline font-bold text-[10px] whitespace-nowrap"
      >
        {isExpanded ? 'Tutup' : 'Baca Lebih'}
      </button>
    </div>
  );
}