

import React, { useState } from 'react';
import { NewsItem } from '../types.ts';
import { Calendar, ArrowRight, Download, Newspaper } from 'lucide-react';

interface NewsCardProps {
  news: NewsItem;
  onNavigate: (path: string) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({ news, onNavigate }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all flex flex-col h-full group transform hover:-translate-y-1">
      <div className="relative aspect-[16/9] bg-gray-200 overflow-hidden">
        {news.videoUrl ? (
          <iframe
            className="w-full h-full"
            src={news.videoUrl}
            title={news.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        ) : news.imageUrls && news.imageUrls.length > 0 && !imgError ? (
          <img 
            src={news.imageUrls[0]} 
            alt={news.title} 
            referrerPolicy="no-referrer" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
            onError={() => setImgError(true)}
          />
        ) : (
           <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <Newspaper className="w-16 h-16 text-gray-300"/>
           </div>
        )}
        {news.type === 'announcement' && (
          <span className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-md">
            ประกาศ
          </span>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-2 text-gray-400 text-xs mb-3">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(news.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <h3 className="text-gray-800 font-semibold text-lg leading-tight mb-2 group-hover:text-blue-600 cursor-pointer transition-colors flex-1" onClick={() => onNavigate(`news-detail?id=${news.id}`)}>
          {news.title}
        </h3>
        <p className="text-gray-500 text-sm line-clamp-2 mb-4">
          {news.content}
        </p>
        <div className="flex items-center justify-between mt-auto pt-2">
          <button onClick={() => onNavigate(`news-detail?id=${news.id}`)} className="text-blue-600 text-sm font-semibold flex items-center gap-1.5 hover:gap-2 transition-all self-start">
            อ่านเพิ่มเติม <ArrowRight className="w-4 h-4" />
          </button>
          {news.fileUrl && (
              <a href={news.fileUrl} download={news.fileName} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors border border-green-100">
                  <Download className="w-4 h-4" />
                  {news.fileName || 'ดาวน์โหลด'}
              </a>
          )}
        </div>
      </div>
    </div>
  );
};
