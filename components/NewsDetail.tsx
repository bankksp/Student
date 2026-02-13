

import React, { useState } from 'react';
import { NewsItem } from '../types.ts';
import { ArrowLeft, Calendar, Download, FileText, Video, Image as ImageIcon, XCircle } from 'lucide-react';

interface NewsDetailProps {
  newsItem?: NewsItem;
  onNavigate: (path: string) => void;
}

export const NewsDetail: React.FC<NewsDetailProps> = ({ newsItem, onNavigate }) => {
  const [imgError, setImgError] = useState(false);

  if (!newsItem) {
    return (
      <div className="text-center py-20 max-w-lg mx-auto bg-white p-8 rounded-2xl border">
        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">ไม่พบข่าวที่ต้องการ</h2>
        <p className="text-gray-500 mt-2">ข่าวที่คุณกำลังค้นหาอาจถูกลบหรือไม่มีอยู่จริง</p>
        <button 
          onClick={() => onNavigate('news')} 
          className="mt-6 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับไปหน้าข่าวสารทั้งหมด
        </button>
      </div>
    );
  }

  const hasMedia = newsItem.videoUrl || (newsItem.imageUrls && newsItem.imageUrls.length > 0);

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
      <div className="p-4 md:p-6">
        <button 
          onClick={() => onNavigate('news')} 
          className="mb-6 text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับไปหน้ารวมข่าวสาร
        </button>
      </div>

      {hasMedia && (
        <div className="aspect-video bg-gray-900 flex items-center justify-center">
          {newsItem.videoUrl ? (
            <iframe
              className="w-full h-full"
              src={newsItem.videoUrl}
              title={newsItem.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
             !imgError ? (
                <img 
                  src={newsItem.imageUrls[0]} 
                  alt={newsItem.title} 
                  referrerPolicy="no-referrer" 
                  className="w-full h-full object-contain" 
                  onError={() => setImgError(true)}
                />
             ) : (
                <div className="flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon className="w-16 h-16 opacity-50 mb-2"/>
                    <p>ไม่สามารถโหลดรูปภาพได้</p>
                </div>
             )
          )}
        </div>
      )}

      <div className="p-6 md:p-10 space-y-6">
        {newsItem.type === 'announcement' && (
          <span className="bg-red-100 text-red-800 text-sm font-bold px-3 py-1 rounded-full">
            ประกาศ
          </span>
        )}
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
          {newsItem.title}
        </h1>
        <div className="flex items-center gap-2 text-gray-500">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-medium">
            เผยแพร่เมื่อ: {new Date(newsItem.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
          <p>{newsItem.content}</p>
        </div>
        
        {newsItem.imageUrls && newsItem.imageUrls.length > 1 && (
          <div className="pt-6 border-t">
            <h3 className="text-xl font-bold text-gray-800 mb-4">รูปภาพเพิ่มเติม</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {newsItem.imageUrls.slice(1).map((url, index) => (
                <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg group bg-gray-100 relative h-32 md:h-48">
                  <img 
                    src={url} 
                    alt={`${newsItem.title} photo ${index + 2}`} 
                    referrerPolicy="no-referrer" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                        e.currentTarget.parentElement!.innerHTML = '<span class="text-xs text-gray-400">Image Error</span>';
                    }}
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {newsItem.fileUrl && (
          <div className="pt-6 border-t">
             <a 
               href={newsItem.fileUrl} 
               download={newsItem.fileName}
               target="_blank" 
               rel="noopener noreferrer"
               className="inline-flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-green-600/20 transition-all transform hover:-translate-y-1"
             >
                <Download className="w-5 h-5" />
                <span>{newsItem.fileName || 'ดาวน์โหลดเอกสารแนบ'}</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
