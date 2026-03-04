

import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { Users, UserCheck, School, Newspaper, Award, X, FileText, ListChecks, Upload, MonitorCheck, BookOpen, AlertCircle, CalendarDays, ArrowRight, HeartHandshake, ShieldCheck, Wrench, BarChartHorizontal, ClipboardEdit, ScanSearch, Megaphone, FileSearch, UserMinus, GraduationCap } from 'lucide-react';
import { CHART_DATA } from '../constants.tsx';
import { NewsItem, Student } from '../types.ts';
import { NewsCard } from './NewsCard.tsx';

interface DashboardProps {
  onApplyClick: () => void;
  onNavigate: (path: string) => void;
  newsItems: NewsItem[];
  students: Student[];
}

const StatCard = ({ title, value, icon: Icon, iconBgColor, iconTextColor }: any) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-all hover:border-blue-100 transform hover:-translate-y-1">
    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${iconBgColor}`}>
      <Icon className={`w-7 h-7 ${iconTextColor}`} />
    </div>
    <div>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      <h3 className="text-gray-500 font-medium">{title}</h3>
    </div>
  </div>
);

const RegulationModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  const steps = [
    {
      icon: ListChecks,
      title: "1. กรอกข้อมูลใบสมัคร",
      desc: "กรอกข้อมูลประวัตินักเรียน ข้อมูลผู้ปกครอง และข้อมูลการศึกษาเดิมให้ครบถ้วนผ่านระบบออนไลน์",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: Upload,
      title: "2. อัปโหลดเอกสาร",
      desc: "แนบไฟล์รูปถ่ายนักเรียน สำเนาทะเบียนบ้าน สูติบัตร และเอกสารอื่นๆ ที่จำเป็น (รองรับไฟล์รูปภาพ)",
      color: "bg-indigo-100 text-indigo-600"
    },
    {
      icon: MonitorCheck,
      title: "3. รอตรวจสอบสถานะ",
      desc: "เจ้าหน้าที่จะทำการตรวจสอบข้อมูล ท่านสามารถเข้ามาตรวจสอบสถานะการสมัครได้ที่เมนู 'ตรวจสอบสถานะ'",
      color: "bg-orange-100 text-orange-600"
    },
    {
      icon: School,
      title: "4. รายงานตัว",
      desc: "เมื่อผ่านการคัดเลือก ให้พิมพ์ใบสมัครและนำเอกสารตัวจริงมารายงานตัวที่โรงเรียนตามวันเวลาที่กำหนด",
      color: "bg-green-100 text-green-600"
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
             <div className="bg-blue-100 p-2 rounded-lg"><BookOpen className="w-6 h-6 text-blue-600"/></div>
             <div>
               <h3 className="text-xl font-bold text-gray-800">ระเบียบการและขั้นตอนการรับสมัคร</h3>
               <p className="text-sm text-gray-500">ปีการศึกษา 2569</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6 text-gray-400"/></button>
        </div>
        
        <div className="p-6 md:p-8 space-y-8">
          {/* Steps Section */}
          <section>
            <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">1</span>
              ขั้นตอนการใช้งานระบบ
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((step, index) => (
                <div key={index} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all bg-gray-50/50">
                  <div className={`w-12 h-12 rounded-lg ${step.color} flex items-center justify-center mb-4`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <h5 className="font-bold text-gray-800 mb-2">{step.title}</h5>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Documents Section */}
          <section>
             <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">2</span>
              เอกสารหลักฐานที่ต้องใช้
            </h4>
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8">
                {[
                  "รูปถ่ายหน้าตรง ชุดนักเรียน ขนาด 1.5 นิ้ว",
                  "สำเนาสูติบัตร (ใบเกิด)",
                  "สำเนาทะเบียนบ้าน (นักเรียน, บิดา, มารดา)",
                  "สำเนาบัตรประจำตัวประชาชน (นักเรียน, บิดา, มารดา)",
                  "สำเนาสมุดประจำตัวคนพิการ (ถ้ามี)",
                  "หลักฐานการศึกษาเดิม (ปพ.1 / ปพ.7)"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-start gap-3 mt-4 text-sm text-amber-700 bg-amber-50 p-4 rounded-lg border border-amber-100">
               <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
               <p>เอกสารที่เป็นสำเนา กรุณารับรองสำเนาถูกต้องทุกฉบับ และอัปโหลดไฟล์เป็น .jpg หรือ .png เท่านั้น</p>
            </div>
          </section>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t flex justify-end">
          <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">รับทราบ</button>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ onApplyClick, onNavigate, newsItems, students }) => {
  const [isRegulationOpen, setIsRegulationOpen] = useState(false);
  const totalApplicants = students.length;
  const approvedApplicants = students.filter(s => s.status === 'approved').length;
  const incompleteApplicants = students.filter(s => s.status === 'incomplete').length;
  const pendingApplicants = students.filter(s => s.status === 'pending').length;
  const rejectedApplicants = students.filter(s => s.status === 'rejected').length;

  // Group by grade level
  const gradeLevels = [
    'ประถมศึกษาปีที่ 1', 'ประถมศึกษาปีที่ 2', 'ประถมศึกษาปีที่ 3', 
    'ประถมศึกษาปีที่ 4', 'ประถมศึกษาปีที่ 5', 'ประถมศึกษาปีที่ 6',
    'มัธยมศึกษาปีที่ 1', 'มัธยมศึกษาปีที่ 2', 'มัธยมศึกษาปีที่ 3',
    'มัธยมศึกษาปีที่ 4', 'มัธยมศึกษาปีที่ 5', 'มัธยมศึกษาปีที่ 6'
  ];

  const gradeData = gradeLevels.map(level => ({
    name: level.replace('ประถมศึกษาปีที่ ', 'ป.').replace('มัธยมศึกษาปีที่ ', 'ม.'),
    fullName: level,
    count: students.filter(s => s.applyLevel === level).length
  })).filter(d => d.count >= 0); // Keep all for consistent chart or filter d.count > 0

  const pieData = [
    { name: 'สมัครผ่าน', value: approvedApplicants, fill: '#22c55e' }, // green
    { name: 'รอตรวจสอบ', value: pendingApplicants, fill: '#eab308' }, // yellow
    { name: 'เอกสารไม่ครบ', value: incompleteApplicants, fill: '#f97316' }, // orange
    { name: 'ไม่ผ่าน', value: rejectedApplicants, fill: '#ef4444' } // red
  ].filter(d => d.value > 0);
  
  const totalForPie = students.length;
  const piePercentage = pieData.map(p => ({
    ...p,
    percent: totalForPie > 0 ? Math.round((p.value / totalForPie) * 100) : 0 
  }));

  const highlights = [
    { title: 'ครูผู้เชี่ยวชาญและเอาใจใส่', description: 'ทีมครูและบุคลากรของเรามีความเชี่ยวชาญและทุ่มเทในการดูแลนักเรียนแต่ละคนอย่างใกล้ชิด', icon: HeartHandshake, color: 'bg-rose-100 text-rose-600' },
    { title: 'สภาพแวดล้อมปลอดภัยและอบอุ่น', description: 'เราสร้างบรรยากาศที่ปลอดภัยเหมือนบ้าน เพื่อให้นักเรียนเรียนรู้และเติบโตอย่างมีความสุข', icon: ShieldCheck, color: 'bg-sky-100 text-sky-600' },
    { title: 'มุ่งเน้นทักษะชีวิตและอาชีพ', description: 'หลักสูตรของเราเน้นการพัฒนาทักษะที่จำเป็นสำหรับการใช้ชีวิตและการประกอบอาชีพในอนาคต', icon: Wrench, color: 'bg-amber-100 text-amber-600' }
  ];

  return (
    <div className="space-y-16 md:space-y-24">
      <RegulationModal isOpen={isRegulationOpen} onClose={() => setIsRegulationOpen(false)} />
      
      {/* Hero Section */}
       <section 
        className="relative bg-blue-50 text-center py-20 px-4 sm:py-28 rounded-3xl overflow-hidden"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2070')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-blue-50 via-blue-50/80 to-transparent"></div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="flex justify-center mb-6">
            <img src="https://img2.pic.in.th/channels4_profile-removebg-preview.png" alt="School Logo" className="w-24 h-24 drop-shadow-lg" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-4 drop-shadow-sm">
            เปิดรับสมัครนักเรียน ปีการศึกษา 2569
          </h1>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-700 mb-8">
            โรงเรียนกาฬสินธุ์ปัญญานุกูล
          </h2>
          <p className="text-gray-600 mb-10 max-w-2xl mx-auto">
            ร่วมเป็นส่วนหนึ่งกับเราในการสร้างอนาคตที่สดใสให้กับบุตรหลานของท่าน
            สมัครเรียนผ่านระบบออนไลน์ได้แล้ววันนี้
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={onApplyClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all transform hover:scale-105 flex items-center justify-center gap-2 text-lg"
            >
              <UserCheck className="w-6 h-6" />
              สมัครเรียนออนไลน์
            </button>
            <button 
              onClick={() => setIsRegulationOpen(true)}
              className="bg-white hover:bg-gray-50 text-blue-700 border border-gray-200 px-8 py-4 rounded-xl font-bold shadow-md transition-all transform hover:scale-105 flex items-center justify-center gap-2 text-lg"
            >
              <FileText className="w-6 h-6" />
              ดูระเบียบการ
            </button>
          </div>
        </div>
      </section>
      
      {/* Welcome & Timeline Section */}
      <section className="bg-slate-100 p-6 md:p-10 rounded-3xl">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-3 space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 tracking-tight leading-tight">
              ยินดีต้อนรับสู่โรงเรียน<br />กาฬสินธุ์ปัญญานุกูล
            </h2>
            <p className="text-gray-600 leading-relaxed">
              เรามุ่งมั่นที่จะมอบการศึกษาที่มีคุณภาพและสภาพแวดล้อมที่อบอุ่น ปลอดภัย เพื่อส่งเสริมการเรียนรู้และพัฒนาศักยภาพของนักเรียนที่มีความต้องการพิเศษอย่างเต็มศักยภาพ ให้พวกเขาเติบโตอย่างมีความสุขและพึ่งพาตนเองได้ในสังคม
            </p>
            <p className="text-gray-700 font-semibold pt-2">
              - ผู้อำนวยการโรงเรียนกาฬสินธุ์ปัญญานุกูล
            </p>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
                <h3 className="font-bold text-lg text-gray-800 mb-5 flex items-center gap-2">
                    <CalendarDays className="w-6 h-6 text-amber-600" />
                    กำหนดการรับสมัคร 2569
                </h3>
                <ol className="relative border-l border-gray-200 ml-3">                  
                    <li className="mb-6 ml-6">            
                        <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white">
                            <ClipboardEdit className="w-3 h-3 text-blue-800" />
                        </span>
                        <h4 className="flex items-center mb-1 text-base font-semibold text-gray-900">รับสมัครออนไลน์</h4>
                        <time className="block mb-2 text-sm font-normal leading-none text-gray-400">8 กุมภาพันธ์ – 1 มีนาคม 2569</time>
                        <p className="text-sm font-normal text-gray-500">รับสมัครผ่านเว็บไซต์ ในวันและเวลาราชการ</p>
                    </li>
                    <li className="mb-6 ml-6">
                        <span className="absolute flex items-center justify-center w-6 h-6 bg-purple-100 rounded-full -left-3 ring-8 ring-white">
                           <ScanSearch className="w-3 h-3 text-purple-800" />
                        </span>
                        <h4 className="text-base font-semibold text-gray-900">ประเมินความสามารถพื้นฐาน</h4>
                        <time className="block mb-2 text-sm font-normal leading-none text-gray-400">9-11 มีนาคม 2569 (08.30–16.30 น.)</time>
                         <ul className="list-disc list-inside text-sm text-gray-500 space-y-1 mt-1 pl-1">
                            <li>ประถมศึกษาปีที่ 1–6: 9 มี.ค. 69</li>
                            <li>มัธยมศึกษาปีที่ 1–3: 10 มี.ค. 69</li>
                            <li>มัธยมศึกษาปีที่ 4–6: 11 มี.ค. 69</li>
                        </ul>
                    </li>
                    <li className="mb-6 ml-6">
                        <span className="absolute flex items-center justify-center w-6 h-6 bg-green-100 rounded-full -left-3 ring-8 ring-white">
                            <Megaphone className="w-3 h-3 text-green-800" />
                        </span>
                        <h4 className="text-base font-semibold text-gray-900">ประกาศผลการเข้าเรียน</h4>
                        <time className="block mb-2 text-sm font-normal leading-none text-gray-400">2 เมษายน 2569</time>
                         <p className="text-sm font-normal text-gray-500">ทางเว็บไซต์และสื่อประชาสัมพันธ์ของโรงเรียน</p>
                    </li>
                    <li className="ml-6">
                        <span className="absolute flex items-center justify-center w-6 h-6 bg-rose-100 rounded-full -left-3 ring-8 ring-white">
                            <UserCheck className="w-3 h-3 text-rose-800" />
                        </span>
                        <h4 className="text-base font-semibold text-gray-900">การรายงานตัว</h4>
                        <time className="block mb-2 text-sm font-normal leading-none text-gray-400">20-22 พฤษภาคม 2569 (08.30–16.30 น.)</time>
                        <ul className="list-disc list-inside text-sm text-gray-500 space-y-1 mt-1 pl-1">
                            <li>ประถมศึกษาปีที่ 1–6: 20 พ.ค. 69</li>
                            <li>มัธยมศึกษาปีที่ 1–3: 21 พ.ค. 69</li>
                            <li>มัธยมศึกษาปีที่ 4–6: 22 พ.ค. 69</li>
                        </ul>
                    </li>
                </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section>
        <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800">ภาพรวมการรับสมัคร</h2>
            <p className="text-gray-500 mt-3">ข้อมูลสรุปจำนวนผู้สมัครเรียนประจำปีการศึกษา 2569</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-12">
          <StatCard title="ผู้สมัครทั้งหมด" value={totalApplicants} icon={Users} iconBgColor="bg-blue-100" iconTextColor="text-blue-600" />
          <StatCard title="สมัครผ่านแล้ว" value={approvedApplicants} icon={UserCheck} iconBgColor="bg-green-100" iconTextColor="text-green-600" />
          <StatCard title="รอตรวจสอบ" value={pendingApplicants} icon={FileSearch} iconBgColor="bg-yellow-100" iconTextColor="text-yellow-600" />
          <StatCard title="เอกสารไม่ครบ" value={incompleteApplicants} icon={AlertCircle} iconBgColor="bg-orange-100" iconTextColor="text-orange-600" />
          <StatCard title="ไม่ผ่านการคัดเลือก" value={rejectedApplicants} icon={UserMinus} iconBgColor="bg-red-100" iconTextColor="text-red-600" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
            {/* Grade Level Chart */}
            <div className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-blue-500"/>
                        จำนวนนักเรียนแยกตามระดับชั้น
                    </h3>
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">ข้อมูลรายระดับชั้น</span>
                </div>
                <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                        <BarChart data={gradeData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                            />
                            <Tooltip 
                                cursor={{ fill: '#f9fafb' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: number) => [`${value} คน`, 'จำนวนผู้สมัคร']}
                            />
                            <Bar 
                                dataKey="count" 
                                fill="#3b82f6" 
                                radius={[6, 6, 0, 0]} 
                                barSize={30}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Status Pie Chart */}
            <div className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-emerald-500"/>
                    สัดส่วนสถานะการสมัคร
                </h3>
                {totalForPie > 0 ? (
                  <div className="flex-1 flex flex-col justify-center">
                    <div style={{ width: '100%', height: 220 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie 
                                    data={piePercentage} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    innerRadius={60}
                                    outerRadius={85} 
                                    paddingAngle={5}
                                    labelLine={false}
                                >
                                    {piePercentage.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-3 mt-6">
                        {piePercentage.map((p, i) => (
                           <div key={i} className="flex items-center justify-between text-sm">
                               <div className="flex items-center gap-2">
                                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.fill }}></div>
                                   <span className="text-gray-600">{p.name}</span>
                               </div>
                               <div className="flex items-center gap-3">
                                   <span className="font-bold text-gray-800">{p.value}</span>
                                   <span className="text-xs text-gray-400 w-8 text-right">{p.percent}%</span>
                               </div>
                           </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400">
                    <Users className="w-12 h-12 mb-2"/>
                    <p className="text-sm font-medium">ยังไม่มีผู้สมัคร</p>
                  </div>
                )}
            </div>
        </div>

        {/* Daily Trend Chart */}
        <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <BarChartHorizontal className="w-5 h-5 text-indigo-500"/>
                    สถิติการสมัครรายวัน
                </h3>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span>จำนวนผู้สมัคร</span>
                    </div>
                </div>
            </div>
            <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                    <AreaChart data={CHART_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorApplicants" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#6b7280', fontSize: 12 }} 
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#6b7280', fontSize: 12 }} 
                        />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="applicants" 
                            stroke="#3b82f6" 
                            fillOpacity={1} 
                            fill="url(#colorApplicants)" 
                            strokeWidth={3} 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section>
        <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800">ทำไมต้องเลือกเรียนที่นี่?</h2>
            <p className="text-gray-500 mt-3">เรามุ่งมั่นสร้างสภาพแวดล้อมการเรียนรู้ที่ดีที่สุดสำหรับนักเรียนทุกคน</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 max-w-6xl mx-auto">
          {highlights.map((item, index) => (
            <div key={index} className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow hover:-translate-y-1.5 transform">
              <div className={`w-16 h-16 rounded-2xl ${item.color} flex items-center justify-center mx-auto mb-6`}>
                <item.icon className="w-8 h-8"/>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">{item.title}</h3>
              <p className="text-gray-500 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* News Section */}
      <section>
         <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">ข่าวสารและประกาศ</h2>
            <button onClick={() => onNavigate('news')} className="text-blue-600 font-semibold flex items-center gap-1.5 hover:gap-2 transition-all">
                ดูทั้งหมด <ArrowRight className="w-4 h-4" />
            </button>
        </div>
        {newsItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {newsItems.slice(0, 3).map(news => (
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
      </section>
    </div>
  );
};

export default Dashboard;