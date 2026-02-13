import React, { useState } from 'react';
import { Student } from '../types.ts';
import { Search, ShieldCheck, XCircle } from 'lucide-react';

interface EvaluationAuthProps {
  students: Student[];
  onNavigate: (path: string) => void;
}

export const EvaluationAuth: React.FC<EvaluationAuthProps> = ({ students, onNavigate }) => {
  const [nationalId, setNationalId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedId = nationalId.trim();

    if (!trimmedId || trimmedId.length !== 13 || !/^\d+$/.test(trimmedId)) {
        setError('กรุณากรอกเลขบัตรประชาชน 13 หลักให้ถูกต้อง');
        return;
    }

    const student = students.find(s => s.nationalId === trimmedId);
    if (student) {
      onNavigate(`evaluate?id=${trimmedId}`);
    } else {
      setError('ไม่พบข้อมูลนักเรียนที่ลงทะเบียนในระบบ กรุณาตรวจสอบเลขบัตรประชาชน');
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 animate-fade-in">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <div className="text-center mb-8">
          <ShieldCheck className="w-16 h-16 mx-auto text-blue-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">เข้าสู่หน้าประเมินนักเรียน</h2>
          <p className="text-gray-500 mt-2">เพื่อความเป็นส่วนตัว กรุณากรอกเลขบัตรประจำตัวประชาชน 13 หลักของนักเรียนเพื่อดำเนินการต่อ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" 
            maxLength={13} 
            placeholder="เลขบัตรประชาชน 13 หลัก" 
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-lg text-center tracking-widest" 
            value={nationalId} 
            onChange={(e) => setNationalId(e.target.value)} 
          />
          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
          >
            <Search className="w-5 h-5" /> 
            ดำเนินการต่อ
          </button>
        </form>

        {error && (
            <div className="mt-6 bg-red-50 p-4 rounded-lg flex items-center gap-3 text-sm text-red-700 border border-red-100 animate-fade-in-fast">
                <XCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
            </div>
        )}
      </div>
    </div>
  );
};
