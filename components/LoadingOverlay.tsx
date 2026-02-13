import React from 'react';
import { Loader2, CloudUpload } from 'lucide-react';

interface LoadingOverlayProps {
  isOpen: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isOpen, message = "กำลังอัปโหลดข้อมูล กรุณารอสักครู่..." }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-sm animate-fade-in">
      <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-5 max-w-sm w-full mx-4 text-center border border-gray-100 transform scale-100 transition-transform">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20"></div>
          <div className="relative bg-gradient-to-tr from-blue-50 to-blue-100 p-5 rounded-full shadow-inner">
            <CloudUpload className="w-12 h-12 text-blue-600 animate-bounce" />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-gray-800">กำลังดำเนินการ</h3>
          <p className="text-gray-500 font-medium animate-pulse">{message}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-4 py-2 rounded-full mt-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>ห้ามปิดหน้าต่างนี้</span>
        </div>
      </div>
    </div>
  );
};