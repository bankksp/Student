import React from 'react';
import { NewsItem } from '../types.ts';
import { NewsCard } from './NewsCard.tsx';
import { Newspaper } from 'lucide-react';

interface NewsPageProps {
  newsItems: NewsItem[];
  onNavigate: (path: string) => void;
}

export const NewsPage: React.FC<NewsPageProps> = ({ newsItems, onNavigate }) => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
          <Newspaper className="w-8 h-8 text-blue-600" />
          ข่าวสารและประกาศทั้งหมด
        </h2>
        <p className="text-gray-500 mt-2">ติดตามข่าวสารล่าสุดและประกาศสำคัญจากทางโรงเรียน</p>
      </div>
      
      {newsItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsItems.map(news => (
            <NewsCard key={news.id} news={news} onNavigate={onNavigate} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border">
            <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4"/>
            <h3 className="text-xl font-semibold text-gray-700">ยังไม่มีข่าวสาร</h3>
            <p className="text-gray-500 mt-2">ขณะนี้ยังไม่มีข่าวสารหรือประกาศใหม่</p>
        </div>
      )}
    </div>
  );
};