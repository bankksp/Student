

import React, { useState, useMemo } from 'react';
import { Student, Evaluation, EvaluationScore } from '../types.ts';
import { EVALUATION_QUESTIONS } from '../constants.tsx';
import { Printer, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Utility Functions ---
const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const formatDateThai = (dateStr: string | undefined) => {
    if (!dateStr) return "";
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "";
        const day = date.getDate();
        const month = THAI_MONTHS[date.getMonth()];
        const year = date.getFullYear() + 543;
        return `${day} ${month} ${year}`;
    } catch (e) {
        return "";
    }
};

const getCorsFriendlyDriveUrl = (url?: string): string | undefined => {
    if (!url || !url.includes('drive.google.com/uc?id=')) {
        return url;
    }
    try {
        const urlObj = new URL(url);
        const id = urlObj.searchParams.get('id');
        if (id) {
            return `https://lh3.googleusercontent.com/d/${id}`;
        }
    } catch (e) {
        console.error("Could not parse Google Drive URL:", e);
    }
    return url;
};

// --- PDF Generation Logic ---
const toBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const PROXY_URL = 'https://images.weserv.nl/?url=';

const embedImagesAsBase64 = async (element: HTMLElement) => {
  const images = Array.from(element.getElementsByTagName('img'));
  const promises = images.map(async (img) => {
    if (!img.src || img.src.startsWith('data:')) return;

    let dataUrl: string | null = null;
    const originalSrc = img.src;

    // Strategy 1: Direct Fetch
    try {
        const response = await fetch(originalSrc, { 
            mode: 'cors', 
            credentials: 'omit',
            cache: 'no-cache' 
        });
        if (response.ok) {
            const blob = await response.blob();
            dataUrl = await toBase64(blob);
        }
    } catch (e) {
        // Fallback to proxy
    }

    // Strategy 2: Proxy
    if (!dataUrl) {
        try {
            const cleanUrl = originalSrc.replace(/^https?:\/\//, '');
            const proxiedUrl = `${PROXY_URL}${encodeURIComponent(cleanUrl)}`;
            
            const response = await fetch(proxiedUrl);
            if (response.ok) {
                const blob = await response.blob();
                dataUrl = await toBase64(blob);
            } else {
                console.warn(`Proxy fetch failed with status ${response.status} for ${originalSrc}`);
            }
        } catch (error) {
            console.error(`Could not embed image from ${originalSrc}:`, error);
        }
    }

    if (dataUrl) {
        img.src = dataUrl;
        img.removeAttribute('srcset');
    }
  });
  await Promise.all(promises);
};


// --- PDF Form Helper Components ---

const FormField = ({ label, value, width = 'flex-1', labelWidth = 'auto', align = 'left', suffix = '' }: any) => (
  <div className={`flex items-end ${width} mb-1`}>
    <span className="font-semibold text-gray-800 whitespace-nowrap mr-2" style={{ width: labelWidth }}>{label}</span>
    <div className={`flex-1 border-b border-dotted border-gray-500 text-blue-900 px-2 relative top-[2px] ${align === 'center' ? 'text-center' : 'text-left'}`}>
      {value || '-'}
    </div>
    {suffix && <span className="ml-2 whitespace-nowrap">{suffix}</span>}
  </div>
);

const CheckboxItem = ({ label, checked }: any) => (
  <div className="flex items-center mr-4 mb-1">
    <div className={`w-4 h-4 border border-gray-600 mr-2 flex items-center justify-center ${checked ? 'bg-gray-200' : ''}`}>
      {checked && <span className="text-xs font-bold">✓</span>}
    </div>
    <span>{label}</span>
  </div>
);

const SectionHeader = ({ title }: { title: string }) => (
  <div className="mt-3 mb-1">
    <h3 className="font-bold text-[15px] text-black">{title}</h3>
  </div>
);


// --- PAGE 1: APPLICATION FORM COMPONENT ---

const ApplicationPage = ({ student, systemConfig }: { student: Student, systemConfig?: any }) => {
  const s = student || ({} as Student); 
  const logoUrl = "https://img2.pic.in.th/channels4_profile-removebg-preview.png";
  
  const formatDateThai = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const studentPhotoUrl = s.fileStudentPhoto ? getCorsFriendlyDriveUrl(s.fileStudentPhoto) : null;

  return (
    <div 
      id="pdf-application-page" 
      className="bg-white text-black font-['Sarabun'] relative mx-auto flex flex-col" 
      style={{ 
        width: '210mm', 
        height: '297mm', // Fix A4 Height
        padding: '10mm 15mm 10mm 15mm', // Margin: Top Right Bottom Left
        boxSizing: 'border-box', 
        fontSize: '13.5px',
        lineHeight: '1.4' 
      }}
    >
      {/* --- HEADER --- */}
      <div className="relative w-full mb-8"> {/* ปรับ mb-8 เพื่อเว้นระยะห่างจากข้อมูลทั่วไปให้มากขึ้น */}
        
        {/* 1. โลโก้และชื่อโรงเรียน (จัดให้อยู่ตรงกลางหน้ากระดาษจริงๆ โดยไม่ใช้ Absolute) */}
        <div className="w-full flex flex-col items-center pt-0">
            <img src={logoUrl} alt="Logo" className="w-[3.5cm] h-auto object-contain mb-2" />
            <h1 className="text-2xl font-bold text-black leading-none mb-2">ใบสมัคร</h1>
            <h2 className="text-[16px] font-bold text-black leading-tight">โรงเรียนกาฬสินธุ์ปัญญานุกูล จังหวัดกาฬสินธุ์</h2>
            <p className="font-medium text-sm mt-1">ภาคเรียนที่ 1 ประจำปีการศึกษา {systemConfig?.academicYear || '2569'}</p>
        </div>

        {/* 2. รูปถ่าย และ ข้อมูลประจำตัว (วางลอย Absolute ชิดขวาบน ไม่ให้ดันข้อความตรงกลาง) */}
        <div className="absolute top-0 right-0 w-[4.5cm] flex flex-col items-center">
            {/* กรอบรูป */}
            <div className="w-[3cm] h-[4cm] border border-gray-400 bg-white flex items-center justify-center overflow-hidden mb-1">
                 {studentPhotoUrl ? (
                    <img src={studentPhotoUrl} className="w-full h-full object-cover" alt="รูปถ่าย" />
                 ) : ( <div className="text-gray-400 text-xs text-center">รูปถ่าย<br/>1.5 นิ้ว</div> )}
            </div>

            {/* ข้อมูลใต้รูป */}
            <div className="w-full text-sm space-y-1 mt-1 px-1 bg-white/80"> {/* bg-white ช่วยกันข้อความซ้อนทับถ้าจอเล็ก */}
               <div className="flex items-end w-full">
                   <span className="whitespace-nowrap text-xs mr-1">เลขประจำตัว</span>
                   <div className="flex-1 border-b border-dotted border-black text-center text-xs h-5">
                       {s.studentId || ''}
                   </div>
               </div>
               <div className="flex items-end w-full">
                   <span className="whitespace-nowrap text-xs mr-1">ระดับชั้น</span>
                   <div className="flex-1 border-b border-dotted border-black text-center text-xs font-bold h-5 text-blue-900">
                       {s.applyLevel || '-'}
                   </div>
               </div>
            </div>
        </div>

      </div>

      {/* --- BODY FORM --- */}
      <div className="flex-1 flex flex-col justify-start">
        
        {/* 1. ข้อมูลทั่วไป */}
        <SectionHeader title="ข้อมูลทั่วไป" />
        <div className="flex flex-wrap">
            <FormField label="ชื่อ-สกุล" value={`${s.prefix || ''} ${s.firstName || ''} ${s.lastName || ''}`} width="w-2/3" />
            <FormField label="ชื่อเล่น" value={s.nickname} width="w-1/3" />
        </div>
        <div className="flex flex-wrap">
             <FormField label="เชื้อชาติ" value={s.ethnicity} width="w-1/4" />
             <FormField label="สัญชาติ" value={s.nationality} width="w-1/4" />
             <FormField label="ศาสนา" value={s.religion} width="w-1/6" />
             <FormField label="วัน/เดือน/ปีเกิด" value={formatDateThai(s.birthDate)} width="w-1/3" />
        </div>
        <div className="flex flex-wrap">
             <FormField label="เป็นบุตรคนที่" value={s.childOrder} width="w-[20%]" />
             <FormField label="จำนวนพี่น้อง" value={s.siblingsCount} width="w-[20%]" suffix="คน" />
             <FormField label="ชาย" value={s.siblingsMale} width="w-[15%]" suffix="คน" />
             <FormField label="หญิง" value={s.siblingsFemale} width="w-[15%]" suffix="คน" />
             <FormField label="หมู่เลือด" value={s.bloodType} width="w-[30%]" />
        </div>
        <div className="flex flex-wrap">
             <FormField label="เลขประจำตัวประชาชน" value={s.nationalId} width="w-[60%]" />
             <div className="flex items-end w-[40%] mb-1 pl-2">
                 <span className="font-semibold mr-2">การจดทะเบียนคนพิการ</span>
                 <CheckboxItem label="จด" checked={s.hasDisabilityId} />
                 <CheckboxItem label="ไม่จด" checked={!s.hasDisabilityId} />
             </div>
        </div>
        <div className="flex flex-wrap">
             <FormField label="เลขประจำตัวคนพิการ" value={s.disabilityId} width="w-1/2" />
             <FormField label="ประเภทความพิการ" value={s.disabilityType} width="w-1/2" />
        </div>
        <div className="flex flex-wrap">
             <FormField label="ลักษณะความพิการ" value={s.disabilityDescription} width="w-full" />
        </div>
        <div className="flex flex-wrap">
             <FormField label="โรคประจำตัว" value={s.medicalCondition} width="w-2/3" />
        </div>

        {/* 2. ข้อมูลบิดา มารดา */}
        <div className="mt-2">
            {/* บิดา */}
            <div className="flex flex-wrap">
                <span className="font-bold mr-2 mt-1">ชื่อ-สกุล บิดา</span>
                <FormField label="" value={`${s.fatherFirstName || ''} ${s.fatherLastName || ''}`.trim()} width="flex-1" labelWidth="0px" />
                <FormField label="อายุ" value={s.fatherAge} width="w-[15%]" />
                <FormField label="อาชีพ" value={s.fatherOccupation} width="w-[25%]" />
                <FormField label="การศึกษา" value={s.fatherEducation || '-'} width="w-[20%]" />
            </div>
            <div className="flex flex-wrap">
                 <FormField label="เลขประจำตัวประชาชน" value={s.fatherNationalId} width="w-[40%]" />
                 <FormField label="รายได้" value={s.fatherIncome} width="w-[25%]" suffix="บาท/เดือน" />
                 <FormField label="เบอร์โทร" value={s.fatherPhone} width="w-[35%]" />
            </div>

            {/* มารดา */}
            <div className="flex flex-wrap mt-1">
                <span className="font-bold mr-2 mt-1">ชื่อ-สกุล มารดา</span>
                <FormField label="" value={`${s.motherFirstName || ''} ${s.motherLastName || ''}`.trim()} width="flex-1" labelWidth="0px" />
                <FormField label="อายุ" value={s.motherAge} width="w-[15%]" />
                <FormField label="อาชีพ" value={s.motherOccupation} width="w-[25%]" />
                <FormField label="การศึกษา" value={s.motherEducation || '-'} width="w-[20%]" />
            </div>
            <div className="flex flex-wrap">
                 <FormField label="เลขประจำตัวประชาชน" value={s.motherNationalId} width="w-[40%]" />
                 <FormField label="รายได้" value={s.motherIncome} width="w-[25%]" suffix="บาท/เดือน" />
                 <FormField label="เบอร์โทร" value={s.motherPhone} width="w-[35%]" />
            </div>

             {/* ผู้ปกครอง */}
             <div className="flex flex-wrap mt-1">
                <span className="font-bold mr-2 mt-1">ชื่อ-สกุล (ผู้ปกครอง)</span>
                <FormField label="" value={`${s.guardianFirstName || ''} ${s.guardianLastName || ''}`.trim()} width="flex-1" labelWidth="0px" />
                <FormField label="อายุ" value={s.guardianAge} width="w-[15%]" />
                <FormField label="อาชีพ" value={s.guardianOccupation} width="w-[25%]" />
                <FormField label="การศึกษา" value={s.guardianEducation || '-'} width="w-[20%]" />
            </div>
            <div className="flex flex-wrap">
                 <FormField label="เลขประจำตัวประชาชน" value={s.guardianNationalId} width="w-[40%]" />
                 <FormField label="รายได้" value={s.guardianIncome} width="w-[25%]" suffix="บาท/เดือน" />
                 <FormField label="เบอร์โทร" value={s.guardianPhone} width="w-[35%]" />
            </div>
        </div>

        {/* 3. สถานภาพสมรส */}
        <SectionHeader title="สถานภาพการสมรสของบิดา/มารดา" />
        <div className="flex flex-wrap gap-y-1">
            {['อยู่ร่วมกัน', 'หย่าร้างกัน', 'บิดาถึงแก่กรรม', 'มารดาถึงแก่กรรม', 'บิดาแต่งงานใหม่', 'มารดาแต่งงานใหม่', 'แยกกันอยู่'].map(status => (
                <div key={status} className="w-1/4">
                    <CheckboxItem label={status} checked={s.maritalStatus?.includes(status)} />
                </div>
            ))}
        </div>

        {/* 4. ที่อยู่ */}
        <SectionHeader title="ที่อยู่ปัจจุบันสามารถติดต่อได้" />
        <div className="flex flex-wrap">
             <FormField label="หมู่บ้าน" value={s.addressVillage} width="w-[40%]" />
             <FormField label="บ้านเลขที่" value={s.addressHouseNumber} width="w-[20%]" />
             <FormField label="หมู่ที่" value={s.addressMoo} width="w-[15%]" />
             <FormField label="ซอย/ถนน" value={s.addressStreet} width="w-[25%]" />
        </div>
        <div className="flex flex-wrap">
             <FormField label="ตำบล/แขวง" value={s.addressSubdistrict} width="w-[33%]" />
             <FormField label="อำเภอ/เขต" value={s.addressDistrict} width="w-[33%]" />
             <FormField label="จังหวัด" value={s.addressProvince} width="w-[33%]" />
        </div>
        <div className="flex flex-wrap">
            <FormField label="รหัสไปรษณีย์" value={s.addressZipcode} width="w-[30%]" />
            <FormField label="เบอร์โทรศัพท์" value={s.addressPhone} width="w-[40%]" />
            <FormField label="ปัจจุบันนักเรียนอาศัยอยู่กับ" value={s.studentLivesWith} width="flex-1" />
        </div>
         <div className="flex flex-wrap">
            <FormField label="เกี่ยวข้องเป็น" value={s.studentLivesWithRelation} width="w-1/2" />
            <FormField label="เบอร์โทร" value={s.studentLivesWithPhone} width="w-1/2" />
        </div>

        {/* 5. การศึกษา */}
        <SectionHeader title="ข้อมูลด้านการศึกษา" />
        <div className="flex flex-col space-y-1">
             <div className="flex items-end">
                <CheckboxItem label="ไม่เคยได้รับการศึกษา เนื่องจาก" checked={s.hasStudiedBefore === false} />
                <div className="flex-1 border-b border-dotted border-gray-500 relative top-[2px]">{!s.hasStudiedBefore ? s.reasonForNotStudying : ''}</div>
             </div>
             <div className="flex flex-wrap items-center">
                <CheckboxItem label="เคยได้รับการศึกษา จาก" checked={s.hasStudiedBefore === true} />
                <div className="flex-1 border-b border-dotted border-gray-500 mr-1">{s.hasStudiedBefore ? s.previousSchool : ''}</div>
                <span className="mr-1">ระดับ</span>
                <div className="w-20 border-b border-dotted border-gray-500 mr-2 text-center">{s.hasStudiedBefore ? s.previousEducationLevel : ''}</div>
                <span className="mr-1">พ.ศ.</span>
                <div className="w-20 border-b border-dotted border-gray-500 text-center">{s.hasStudiedBefore ? s.previousEducationYear : ''}</div>
             </div>
        </div>

      </div>

      {/* --- FOOTER / SIGNATURE --- */}
      <div className="mt-6 mb-4">
        <div className="flex justify-between items-start px-8">
            {/* ผู้สมัคร */}
            <div className="flex flex-col items-center w-[40%]">
                <div className="w-full border-b border-dotted border-black mb-2 h-8"></div> {/* เส้นเซ็น */}
                <div className="flex items-end w-full justify-center">
                    <span className="mr-2">(</span>
                    <div className="border-b border-dotted border-black flex-1 text-center h-6"></div>
                    <span className="ml-2">)</span>
                </div>
                <p className="mt-1 font-bold">ผู้สมัคร</p>
            </div>

            {/* ผู้รับสมัคร */}
            <div className="flex flex-col items-center w-[40%]">
                <div className="w-full border-b border-dotted border-black mb-2 h-8"></div> {/* เส้นเซ็น */}
                <div className="flex items-end w-full justify-center">
                    <span className="mr-2">(</span>
                    <div className="border-b border-dotted border-black flex-1 text-center h-6"></div>
                    <span className="ml-2">)</span>
                </div>
                <p className="mt-1 font-bold">ผู้รับสมัคร</p>
                <div className="w-full flex justify-center mt-2 text-sm">
                    วันที่......./........../..........
                </div>
            </div>
        </div>
      </div>

    </div>
  );
};

// --- EVALUATION CONTENT (FOR MULTI-PAGE PDF) ---
const EvaluationContentPdf = ({ student, parentEval, teacherEval }: { student: Student, parentEval?: Evaluation, teacherEval?: Evaluation }) => {
    const s = student;
    const scoreMap: Record<EvaluationScore, string> = { good: 'ดี', fair: 'พอใช้', needs_improvement: 'ควรพัฒนา' };
    const getScore = (ev: Evaluation | undefined, sec: 'section1'|'section2'|'section3', idx: number) => {
        if (!ev?.id) return '';
        const sc = ev[sec]?.scores[idx];
        return sc ? scoreMap[sc] : '-';
    };

    const TableSection = ({ title, items, secKey }: { title: string, items: string[], secKey: 'section1'|'section2'|'section3' }) => (
        <div className="mb-4 break-inside-avoid">
             <div className="font-bold bg-gray-100 border border-black border-b-0 px-2 py-1 text-[16px]">{title}</div>
             <table className="w-full border-collapse border border-black text-[15px]">
                 <thead><tr className="bg-gray-50"><th className="border border-black p-1 w-[60%] text-left pl-2 font-bold">รายการประเมิน</th><th className="border border-black p-1 w-[20%] text-center font-bold">ผู้ปกครอง</th><th className="border border-black p-1 w-[20%] text-center font-bold">ครู</th></tr></thead>
                 <tbody>{items.map((item, i) => (<tr key={i}><td className="border border-black px-2 py-[2px] text-left align-top">{i+1}. {item}</td><td className="border border-black text-center font-bold text-blue-900 align-middle">{getScore(parentEval, secKey, i)}</td><td className="border border-black text-center font-bold text-blue-900 align-middle">{getScore(teacherEval, secKey, i)}</td></tr>))}</tbody>
             </table>
        </div>
    );

    return (
        <div id="pdf-evaluation-page" className="bg-white text-black font-['Sarabun'] relative mx-auto" style={{ width: '210mm', paddingTop: '25mm', paddingBottom: '20mm', paddingLeft: '20mm', paddingRight: '15mm', boxSizing: 'border-box', fontSize: '16px', lineHeight: '1.2' }}>
            <div className="text-center mb-6">
                <h1 className="text-[24px] font-bold">แบบประเมินความสามารถพื้นฐาน</h1>
                <div className="flex justify-center items-end gap-2 mt-2">
                    <span className="font-bold text-[18px] pb-1">ชื่อ-สกุล นักเรียน:</span>
                    <div className="border-b-[1.5px] border-dotted border-black text-blue-900 font-bold px-8 min-w-[250px] text-center text-[18px] pb-1">{s.prefix}{s.firstName} {s.lastName}</div>
                </div>
            </div>
            {(parentEval || teacherEval) ? (
                <div>
                    <TableSection title={EVALUATION_QUESTIONS.section1.title} items={EVALUATION_QUESTIONS.section1.items} secKey="section1" />
                    <TableSection title={EVALUATION_QUESTIONS.section2.title} items={EVALUATION_QUESTIONS.section2.items} secKey="section2" />
                    <TableSection title={EVALUATION_QUESTIONS.section3.title} items={EVALUATION_QUESTIONS.section3.items} secKey="section3" />
                    <div className="flex justify-around mt-8 pt-4 break-inside-avoid">
                        {parentEval && (<div className="flex flex-col items-center w-[40%]"><p className="mb-10">ลงชื่อ .........................................................</p><div className="font-bold text-blue-900 text-[16px]">({parentEval.evaluatorName})</div><div className="font-bold">ผู้ปกครอง (ผู้ประเมิน)</div></div>)}
                        {teacherEval && (<div className="flex flex-col items-center w-[40%]"><p className="mb-10">ลงชื่อ .........................................................</p><div className="font-bold text-blue-900 text-[16px]">({teacherEval.evaluatorName})</div><div className="font-bold">ครู (ผู้ประเมิน)</div></div>)}
                    </div>
                </div>
            ) : (<div className="h-[50%] flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl text-gray-400 mt-10 p-8"><p className="text-xl font-bold">ยังไม่มีข้อมูลการประเมิน</p><p>กรุณาบันทึกข้อมูลการประเมินผ่านระบบก่อนพิมพ์เอกสารหน้านี้</p></div>)}
            <div className="absolute -bottom-[10mm] left-0 right-0 text-center text-gray-400 text-xs">ระบบรับสมัครนักเรียนออนไลน์ โรงเรียนกาฬสินธุ์ปัญญานุกูล</div>
        </div>
    );
};


// --- Main Exporter Wrapper ---
export const ApplicationExporter = ({ student, evaluations, systemConfig }: { student: Student, evaluations: Evaluation[], systemConfig?: any }) => {
    const [isExporting, setIsExporting] = useState<boolean>(false);

    const parentEval = useMemo(() => evaluations.find(e => e.studentId === student.id && e.evaluatorRole === 'parent'), [evaluations, student.id]);
    const teacherEval = useMemo(() => evaluations.find(e => e.studentId === student.id && e.evaluatorRole === 'teacher'), [evaluations, student.id]);

    const handleExportPdf = async () => {
        setIsExporting(true);
        const appPageElement = document.getElementById('pdf-application-page');
        const evalPageElement = document.getElementById('pdf-evaluation-page');
        if (!appPageElement || !evalPageElement) { setIsExporting(false); return; }

        const container = document.createElement('div');
        container.style.position = 'fixed'; 
        container.style.left = '-9999px'; 
        container.style.zIndex = '-1';
        container.style.overflow = 'hidden'; // Ensure no extra scrollbars
        document.body.appendChild(container);

        const cloneApp = appPageElement.cloneNode(true) as HTMLElement;
        const cloneEval = evalPageElement.cloneNode(true) as HTMLElement;
        container.appendChild(cloneApp);
        container.appendChild(cloneEval);
        
        try {
            await embedImagesAsBase64(cloneApp);
            await embedImagesAsBase64(cloneEval);
            
            const canvasOpts = { scale: 2.5, useCORS: true, logging: false, backgroundColor: '#ffffff' };
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfW = pdf.internal.pageSize.getWidth();
            const pdfH = pdf.internal.pageSize.getHeight();

            // --- Page 1: Application Form (Scale to Fit - FIXING DISTORTION) ---
            const canvasApp = await html2canvas(cloneApp, { ...canvasOpts });
            const imgDataApp = canvasApp.toDataURL('image/jpeg', 0.95);
            const imgPropsApp = pdf.getImageProperties(imgDataApp);
            
            // Calculate height proportional to width to preserve aspect ratio
            const ratioApp = imgPropsApp.width / imgPropsApp.height;
            let finalW = pdfW;
            let finalH = pdfW / ratioApp;

            // If the proportional height exceeds A4 height, scale down to fit the page
            if (finalH > pdfH) {
                finalH = pdfH;
                finalW = finalH * ratioApp;
            }

            // Center content if width is less than PDF width (though it should typically fill width)
            const x = (pdfW - finalW) / 2;
            
            // Render without forcing dimensions that distort aspect ratio
            pdf.addImage(imgDataApp, 'JPEG', x, 0, finalW, finalH);
            
            // --- Page 2+: Evaluation Form (Multi-page) ---
            pdf.addPage();
            const canvasEval = await html2canvas(cloneEval, { ...canvasOpts });
            const imgDataEval = canvasEval.toDataURL('image/jpeg', 0.95);
            const imgPropsEval = pdf.getImageProperties(imgDataEval);
            const imgHeightEval = (imgPropsEval.height * pdfW) / imgPropsEval.width;

            let heightLeft = imgHeightEval;
            let position = 0;
            
            while (heightLeft > 0) {
                // For subsequent pages, we usually fill width and let it flow
                pdf.addImage(imgDataEval, 'JPEG', 0, position, pdfW, imgHeightEval);
                heightLeft -= pdfH;
                if (heightLeft > 0) {
                    position -= pdfH;
                    pdf.addPage();
                }
            }
            
            pdf.save(`ใบสมัคร_${student.nationalId}.pdf`);

        } catch (error) {
            console.error("PDF Error:", error);
            alert("เกิดข้อผิดพลาดในการสร้าง PDF กรุณาลองใหม่");
        } finally {
            document.body.removeChild(container);
            setIsExporting(false);
        }
    };

    return (
        <>
            <div className="hidden">
                <ApplicationPage student={student} systemConfig={systemConfig} />
                <EvaluationContentPdf student={student} parentEval={parentEval} teacherEval={teacherEval} />
            </div>
            <button 
                onClick={handleExportPdf} 
                disabled={isExporting} 
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-wait"
            >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                {isExporting ? "กำลังสร้างเอกสาร..." : "พิมพ์ใบสมัคร (PDF)"}
            </button>
        </>
    );
};
