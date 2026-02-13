









import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Clock, Upload, User, Users, Home, Save, School, MessageCircleWarning, FileText, Trash2, Image as ImageIcon, Building, FilePen, CalendarClock, Lock, AlertTriangle } from 'lucide-react';
import { Student, SystemConfig, Evaluation } from '../types.ts';
import { ApplicationExporter } from './ApplicationExporter.tsx';
import { LoadingOverlay } from './LoadingOverlay.tsx';

// Helper function for Google Drive Images
const getDriveImageUrl = (url?: string) => {
  if (!url) return undefined;
  // Check if it's a standard Google Drive View/Export URL
  if (url.includes('drive.google.com') && url.includes('id=')) {
    const match = url.match(/id=([^&]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
  }
  return url;
};

// --- Sub-Component: Status Checker ---
export const StatusCheck = ({ initialId, students, onEdit, onDelete, evaluations }: { initialId: string, students: Student[], onEdit: (student: Student) => void, onDelete: (studentId: string) => any, evaluations: Evaluation[] }) => {
  const [searchId, setSearchId] = useState(initialId || '');
  const [result, setResult] = useState<Student | null>(null);
  const [searched, setSearched] = useState(false);
  const [imgError, setImgError] = useState(false);

  const performSearch = (idToSearch: string) => {
    const trimmedId = idToSearch.trim();
    if (!trimmedId) {
        setResult(null);
        setSearched(false);
        return;
    }
    const found = students.find(s => String(s.nationalId) === trimmedId);
    setResult(found || null);
    setSearched(true);
    setImgError(false);
  };
  
  useEffect(() => {
    if (initialId && students.length > 0) {
      setSearchId(initialId);
      performSearch(initialId);
    }
  }, [initialId, students]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchId);
  };
  
  const handleDeleteClick = () => {
    if (result && window.confirm(`คุณต้องการยกเลิกการสมัครของ ${result.firstName} ${result.lastName} ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`)) {
      onDelete(result.id);
      setResult(null); // Clear result after deletion
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">ตรวจสอบสถานะการสมัคร</h2>
        <p className="text-gray-500">กรอกเลขบัตรประจำตัวประชาชน 13 หลักเพื่อตรวจสอบ</p>
      </div>
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <form onSubmit={handleFormSubmit} className="flex gap-4">
          <input type="text" maxLength={13} placeholder="เลขบัตรประชาชน 13 หลัก" className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg" value={searchId} onChange={(e) => setSearchId(e.target.value)} />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2">
            <Search className="w-5 h-5" /> ค้นหา
          </button>
        </form>
        {searched && (
          <div className="mt-8 animate-fade-in">
            {result ? (
              <div className="border rounded-xl overflow-hidden">
                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-4 sm:gap-6">
                     <div className="shrink-0">
                          {result.fileStudentPhoto && !imgError ? (
                              <img 
                                src={getDriveImageUrl(result.fileStudentPhoto)} 
                                alt="รูปถ่ายนักเรียน" 
                                referrerPolicy="no-referrer" 
                                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                                onError={() => setImgError(true)}
                              />
                          ) : (
                              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border-4 border-white shadow-lg">
                                  <Users className="w-8 h-8"/>
                              </div>
                          )}
                      </div>
                      <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-start">
                              <div>
                                  <p className="font-medium text-gray-800 text-lg">{result.prefix}{result.firstName} {result.lastName}</p>
                                  <p className="text-sm text-gray-500">ID: {result.nationalId}</p>
                              </div>
                              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${result.status === 'approved' ? 'bg-green-100 text-green-700' : result.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                  {result.status === 'approved' && <CheckCircle className="w-4 h-4" />}
                                  {result.status === 'rejected' && <XCircle className="w-4 h-4" />}
                                  {result.status === 'pending' && <Clock className="w-4 h-4" />}
                                  {result.status === 'approved' ? 'ผ่านการคัดเลือก' : result.status === 'rejected' ? 'ไม่ผ่านการคัดเลือก' : 'รอการตรวจสอบ'}
                              </div>
                          </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 pt-2">
                              <div><label className="text-xs text-gray-400">ระดับชั้นที่สมัคร</label><p className="font-medium text-gray-700">{result.applyLevel}</p></div>
                              <div><label className="text-xs text-gray-400">แผนการเรียน</label><p className="font-medium text-gray-700">{result.program}</p></div>
                          </div>
                      </div>
                  </div>
                  <div className="pt-4 flex items-center justify-between flex-wrap gap-4 border-t">
                     <ApplicationExporter student={result} evaluations={evaluations} />
                     <div className="flex items-center gap-2">
                        <button onClick={() => onEdit(result)} className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                            <FilePen className="w-4 h-4"/> แก้ไขใบสมัคร
                        </button>
                         <button onClick={handleDeleteClick} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4"/> ยกเลิกการสมัคร
                        </button>
                     </div>
                  </div>
                </div>
                {result.status === 'rejected' && result.rejectionReason && (<div className="bg-red-50/50 p-6 border-t"><div className="flex items-start gap-3"><MessageCircleWarning className="w-5 h-5 text-red-500 mt-0.5" /><div><h4 className="font-semibold text-red-800">เหตุผลจากเจ้าหน้าที่</h4><p className="text-red-700 text-sm mt-1">{result.rejectionReason}</p></div></div></div>)}
              </div>
            ) : (<div className="text-center py-8"><div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><XCircle className="w-8 h-8 text-red-500" /></div><h3 className="text-gray-800 font-medium">ไม่พบข้อมูลผู้สมัคร</h3><p className="text-gray-500 text-sm mt-1">กรุณาตรวจสอบเลขบัตรประชาชนใหม่อีกครั้ง</p></div>)}
          </div>
        )}
      </div>
    </div>
  );
};


// --- Helper Components for New Form ---
const FormSection = ({ title }: { title: string }) => (
    <h3 className="text-lg font-bold text-gray-800 mt-6 mb-2 col-span-12">{title}</h3>
);
const Line = ({ children, className = '' }: { children?: React.ReactNode, className?: string }) => (
    <div className={`flex flex-wrap items-end gap-x-4 gap-y-2 text-md mt-2 ${className}`}>
        {children}
    </div>
);
const Field = ({ label, children, className = '', required = false }: { label?: string, children?: React.ReactNode, className?: string, required?: boolean }) => (
    <div className={`flex items-end gap-2 ${className}`}>
        {label && <label className="text-gray-800 whitespace-nowrap">{label} {required && <span className="text-red-500">*</span>}</label>}
        {children}
    </div>
);

const UnderlinedInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => {
    const value = props.value || '';
    const hasValue = value.toString().length > 0;
    return (
        <div className="relative flex-1 min-w-[100px]">
            <input 
                {...props} 
                className={`w-full pt-1 pb-0.5 border-0 border-b-2 border-dotted border-gray-400 focus:ring-0 focus:border-blue-500 outline-none transition-colors bg-transparent text-center font-semibold text-blue-800 ${props.className || ''}`}
            />
        </div>
    );
};

const UnderlinedSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <div className="relative flex-1 min-w-[100px]">
        <select {...props} className="w-full pt-1 pb-0.5 border-0 border-b-2 border-dotted border-gray-400 focus:ring-0 focus:border-blue-500 outline-none transition-colors bg-transparent text-center font-semibold text-blue-800 appearance-none">
            {props.children}
        </select>
    </div>
);

const FileInput = ({ label, name, required, onFileChange, fileName, existingFileUrl, accept, icon: Icon }: { label: string, name: string, required?: boolean, onFileChange: (name: string, file: File | null) => void, fileName?: string | null, existingFileUrl?: string | null, accept?: string, icon?: React.ElementType }) => {
    const FileIcon = Icon || FileText;
    const currentFileName = fileName || (existingFileUrl ? "ไฟล์เดิม" : null);

    return (
      <div className="border border-gray-200 rounded-lg p-3 bg-white">
          <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                 <FileIcon className="w-4 h-4 text-gray-500"/> {label} {required && <span className="text-red-500">*</span>}
              </p>
              <input type="file" id={`file-${name}`} name={name} accept={accept} onChange={(e) => onFileChange(name, e.target.files ? e.target.files[0] : null)} className="hidden"/>
              <label htmlFor={`file-${name}`} className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold px-3 py-1.5 rounded-md cursor-pointer transition-colors">เลือกไฟล์</label>
          </div>
          {currentFileName && (
            <div className="mt-2 bg-gray-50 rounded-md px-3 py-2 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" /> 
                    <span className="truncate max-w-xs">{currentFileName}</span>
                    {existingFileUrl && !fileName && <a href={existingFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs hover:underline">(ดูไฟล์)</a>}
                </div>
                <button type="button" onClick={() => onFileChange(name, null)}><Trash2 className="w-4 h-4 text-red-400 hover:text-red-600"/></button>
            </div>
          )}
      </div>
    );
};
type CheckboxInputProps = { label: string, value: string, name: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void };
const CheckboxInput = ({ label, value, name, checked, onChange }: any) => (
    <label className="flex items-center gap-2 text-md font-medium text-gray-700 cursor-pointer">
        <input type="checkbox" name={name} value={value} checked={checked} onChange={onChange} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
        {label}
    </label>
);

// --- Sub-Component: Registration Form ---
interface RegistrationFormProps {
  config: SystemConfig;
  studentToEdit?: Student | null;
  onAddStudent: (student: any, files: Record<string, File | null>) => Promise<boolean>;
  onUpdateStudent: (student: any, files: Record<string, File | null>) => Promise<boolean>;
  onClose?: () => void;
  evaluations?: Evaluation[];
  existingStudents?: Student[];
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ config, studentToEdit, onAddStudent, onUpdateStudent, onClose, evaluations = [], existingStudents = [] }) => {
  const isEditMode = !!studentToEdit;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Student>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [duplicateError, setDuplicateError] = useState('');

  useEffect(() => {
    if (isEditMode) {
        setFormData(studentToEdit || {});
    } else {
        // Default values for new application
        setFormData({
            prefix: 'เด็กชาย',
            applyLevel: 'ประถมศึกษาปีที่ 1',
            program: 'สติปัญญาและบุคคลออทิสติก',
            hasDisabilityId: false,
            hasStudiedBefore: true,
            maritalStatus: '',
        });
    }
    setFiles({}); // Reset files on mode change
    setDuplicateError('');
  }, [studentToEdit, isEditMode]);

  // Check system status logic
  if (!isEditMode) {
      const now = new Date();
      const startDate = config.startDate ? new Date(config.startDate) : null;
      const endDate = config.endDate ? new Date(config.endDate) : null;
      
      const isNotYetOpen = startDate && now < startDate;
      const isClosed = (endDate && now > endDate) || !config.isOpen;

      if (isNotYetOpen) {
          return (
              <div className="max-w-xl mx-auto py-20 px-4">
                  <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
                      <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                          <CalendarClock className="w-10 h-10 text-blue-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">ระบบยังไม่เปิดรับสมัคร</h2>
                      <p className="text-gray-500 mb-6">ระบบรับสมัครออนไลน์จะเปิดให้บริการในวันที่</p>
                      
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 inline-block mb-6">
                           <p className="text-blue-800 font-bold text-xl">
                               {startDate.toLocaleDateString('th-TH', { 
                                   weekday: 'long', 
                                   year: 'numeric', 
                                   month: 'long', 
                                   day: 'numeric',
                                   hour: '2-digit',
                                   minute: '2-digit'
                               })}
                           </p>
                      </div>
                      
                      <p className="text-sm text-gray-400">กรุณากลับมาใหม่อีกครั้งตามวันและเวลาที่กำหนด</p>
                  </div>
              </div>
          );
      }

      if (isClosed) {
           return (
              <div className="max-w-xl mx-auto py-20 px-4">
                  <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
                      <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Lock className="w-10 h-10 text-red-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">ปิดรับสมัครแล้ว</h2>
                      <p className="text-gray-500 mb-6">{config.announcementText || "ขณะนี้อยู่นอกระยะเวลาการรับสมัคร"}</p>
                      
                      {endDate && (
                           <p className="text-sm text-gray-400">
                               สิ้นสุดการรับสมัครเมื่อ: {endDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                           </p>
                      )}
                  </div>
              </div>
          );
      }
  }


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const isCheckbox = type === 'checkbox';
      const checked = (e.target as HTMLInputElement).checked;
      
      if (name === 'nationalId') {
        const checkValue = value.trim();
        const isDuplicate = existingStudents.some(s => 
          s.nationalId === checkValue && 
          (!isEditMode || s.id !== studentToEdit?.id)
        );

        if (isDuplicate) {
          setDuplicateError('เลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว กรุณาตรวจสอบสถานะการสมัคร');
        } else {
          setDuplicateError('');
        }
      }

      if (name === 'hasStudiedBefore') {
        setFormData({ ...formData, hasStudiedBefore: value === 'true' });
      } else {
        setFormData({ ...formData, [name]: isCheckbox ? checked : value });
      }
  };
  
  const handleFileChange = (name: string, file: File | null) => {
    setFiles(prev => ({...prev, [name]: file}));
    if (file === null) {
        // When a file is removed in the UI, clear the corresponding URL field in the form data
        setFormData(prev => ({...prev, [name]: '' }));
    }
  }

  const handleMaritalStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    const currentStatus = formData.maritalStatus?.split(',').filter(s => s) || [];
    let newStatus: string[];
    if (checked) {
        newStatus = [...currentStatus, value];
    } else {
        newStatus = currentStatus.filter(item => item !== value);
    }
    setFormData({ ...formData, maritalStatus: newStatus.join(',') });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (duplicateError) {
      alert('ไม่สามารถสมัครได้เนื่องจากมีข้อมูลซ้ำ');
      return;
    }

    setIsSubmitting(true);
    const requiredFields: (keyof Student)[] = ['nationalId', 'firstName', 'lastName', 'birthDate', 'phone', 'applyLevel', 'program'];
     if (formData.hasStudiedBefore) {
        requiredFields.push('previousSchool');
    }
    
    const isMissing = requiredFields.some(field => !formData[field]);

    if (isMissing) {
        alert('กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน');
        setIsSubmitting(false);
        return;
    }
    
    const dataToSubmit = { ...formData, gpa: Number(formData.gpa) || 0 };
    
    let success = false;
    if (isEditMode) {
      success = await onUpdateStudent(dataToSubmit, files);
    } else {
      success = await onAddStudent(dataToSubmit, files);
    }

    setIsSubmitting(false);
    if (success) {
      if (onClose) onClose(); // Close modal on success if it's a modal
      if (!isEditMode) { // Reset form only for new applications
        setFormData({ prefix: 'เด็กชาย', applyLevel: 'ประถมศึกษาปีที่ 1', program: 'สติปัญญาและบุคคลออทิสติก', hasDisabilityId: false, hasStudiedBefore: true, maritalStatus: '' });
        setFiles({});
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto font-['Sarabun']">
      <LoadingOverlay isOpen={isSubmitting} message={isEditMode ? "กำลังประมวลผลและอัปเดตข้อมูล..." : "กำลังประมวลผลไฟล์และสมัครเรียน..."} />
      
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100">
        <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Form Header */}
            <div className="text-center mb-4">
                <img src="https://img2.pic.in.th/channels4_profile-removebg-preview.png" alt="School Logo" className="w-24 h-24 mx-auto mb-2" />
                <h1 className="text-2xl md:text-3xl font-bold text-blue-900">ใบสมัคร</h1>
                <h2 className="text-lg md:text-xl font-semibold text-gray-700">โรงเรียนกาฬสินธุ์ปัญญานุกูล จังหวัดกาฬสินธุ์</h2>
                <p className="text-gray-500 mt-1">ภาคเรียนที่ 1 ประจำปีการศึกษา {config.academicYear}</p>
            </div>
            
            {/* Top section with Photo */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-8 pt-4">
                <div className="w-full sm:w-auto flex-shrink-0 flex flex-col items-center mx-auto sm:mx-0 sm:order-last">
                    <input type="file" id="fileStudentPhoto" name="fileStudentPhoto" accept="image/*" onChange={(e) => handleFileChange('fileStudentPhoto', e.target.files ? e.target.files[0] : null)} className="hidden"/>
                    <label htmlFor="fileStudentPhoto" className="w-36 h-44 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-400 overflow-hidden relative text-center text-gray-500 text-sm p-2 cursor-pointer hover:bg-gray-200 transition-colors">
                         {files.fileStudentPhoto ? (
                            <img src={URL.createObjectURL(files.fileStudentPhoto)} alt="Preview" className="w-full h-full object-cover" />
                        ) : studentToEdit?.fileStudentPhoto ? (
                            <img src={getDriveImageUrl(studentToEdit.fileStudentPhoto)} alt="Existing" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center gap-1">
                                <ImageIcon className="w-8 h-8 opacity-50"/>
                                <span>รูปถ่าย 1.5 นิ้ว</span>
                                <span className="text-xs">(หน้าตรง)</span>
                            </div>
                        )}
                    </label>
                    <div className="w-full mt-2">
                        <label className="block text-sm font-medium text-gray-700 text-center mb-1">ระดับชั้น</label>
                         <select name="applyLevel" value={formData.applyLevel} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="ประถมศึกษาปีที่ 1">ประถมศึกษาปีที่ 1</option><option value="ประถมศึกษาปีที่ 2">ประถมศึกษาปีที่ 2</option><option value="ประถมศึกษาปีที่ 3">ประถมศึกษาปีที่ 3</option><option value="ประถมศึกษาปีที่ 4">ประถมศึกษาปีที่ 4</option><option value="ประถมศึกษาปีที่ 5">ประถมศึกษาปีที่ 5</option><option value="ประถมศึกษาปีที่ 6">ประถมศึกษาปีที่ 6</option>
                            <option value="มัธยมศึกษาปีที่ 1">มัธยมศึกษาปีที่ 1</option><option value="มัธยมศึกษาปีที่ 2">มัธยมศึกษาปีที่ 2</option><option value="มัธยมศึกษาปีที่ 3">มัธยมศึกษาปีที่ 3</option><option value="มัธยมศึกษาปีที่ 4">มัธยมศึกษาปีที่ 4</option><option value="มัธยมศึกษาปีที่ 5">มัธยมศึกษาปีที่ 5</option><option value="มัธยมศึกษาปีที่ 6">มัธยมศึกษาปีที่ 6</option>
                        </select>
                    </div>
                </div>
                <div className="flex-1 w-full"> {/* Main form content starts here */}
                    <FormSection title="ข้อมูลทั่วไป" />
                    <Line>
                        <Field label="ชื่อ-สกุล" className="flex-1 min-w-[300px]" required>
                            <div className="flex items-end gap-2 flex-1">
                                <UnderlinedSelect name="prefix" value={formData.prefix} onChange={handleChange} className="min-w-[80px] flex-none">
                                    <option>เด็กชาย</option><option>เด็กหญิง</option><option>นาย</option><option>นางสาว</option>
                                </UnderlinedSelect>
                                <UnderlinedInput name="firstName" value={formData.firstName || ''} onChange={handleChange} required placeholder="ชื่อ"/>
                                <UnderlinedInput name="lastName" value={formData.lastName || ''} onChange={handleChange} required placeholder="นามสกุล"/>
                            </div>
                        </Field>
                    </Line>
                    <Line>
                        <Field label="ชื่อเล่น" className="flex-1"><UnderlinedInput name="nickname" value={formData.nickname || ''} onChange={handleChange} /></Field>
                        <Field label="วัน/เดือน/ปีเกิด" className="flex-1" required><UnderlinedInput name="birthDate" type="date" value={formData.birthDate || ''} onChange={handleChange} required /></Field>
                    </Line>
                    <Line>
                        <Field label="เชื้อชาติ" className="flex-1"><UnderlinedInput name="ethnicity" value={formData.ethnicity || ''} onChange={handleChange}/></Field>
                        <Field label="สัญชาติ" className="flex-1"><UnderlinedInput name="nationality" value={formData.nationality || ''} onChange={handleChange}/></Field>
                        <Field label="ศาสนา" className="flex-1"><UnderlinedInput name="religion" value={formData.religion || ''} onChange={handleChange}/></Field>
                    </Line>
                    <Line>
                        <Field label="เป็นบุตรคนที่"><UnderlinedInput name="childOrder" type="number" value={formData.childOrder || ''} onChange={handleChange} className="w-16"/></Field>
                        <Field label="จำนวนพี่น้องทั้งหมด"><UnderlinedInput name="siblingsCount" type="number" value={formData.siblingsCount || ''} onChange={handleChange} className="w-16"/></Field>
                        <Field label="ชาย"><UnderlinedInput name="siblingsMale" type="number" value={formData.siblingsMale || ''} onChange={handleChange} className="w-16"/></Field>
                        <Field label="หญิง"><UnderlinedInput name="siblingsFemale" type="number" value={formData.siblingsFemale || ''} onChange={handleChange} className="w-16"/></Field>
                    </Line>
                    <Line>
                      <Field label="เลขประจำตัวประชาชน" className="flex-1 relative" required>
                        <div className="w-full">
                          <UnderlinedInput 
                            name="nationalId" 
                            value={formData.nationalId || ''} 
                            onChange={handleChange} 
                            maxLength={13} 
                            required 
                            className={duplicateError ? 'text-red-600 border-red-400' : ''}
                          />
                          {duplicateError && (
                            <div className="absolute top-full left-0 flex items-center gap-1 text-red-500 text-xs mt-1 animate-pulse font-medium">
                              <AlertTriangle className="w-3 h-3" /> {duplicateError}
                            </div>
                          )}
                        </div>
                      </Field>
                    </Line>
                </div>
            </div>
            
            {/* Rest of the form */}
            <Line>
                <Field label="การจดทะเบียนคนพิการ"><UnderlinedSelect name="hasDisabilityId" value={String(formData.hasDisabilityId)} onChange={(e) => setFormData(prev => ({...prev, hasDisabilityId: e.target.value === 'true'}))}><option value="true">จด</option><option value="false">ไม่จด</option></UnderlinedSelect></Field>
                <Field label="เลขประจำตัวคนพิการ" className="flex-1"><UnderlinedInput name="disabilityId" value={formData.disabilityId || ''} onChange={handleChange} disabled={!formData.hasDisabilityId} /></Field>
            </Line>
             <Line>
                <Field label="ประเภทความพิการ" className="flex-1"><UnderlinedInput name="disabilityType" value={formData.disabilityType || ''} onChange={handleChange}/></Field>
                <Field label="ลักษณะความพิการ" className="flex-1"><UnderlinedInput name="disabilityDescription" value={formData.disabilityDescription || ''} onChange={handleChange}/></Field>
            </Line>
            <Line>
                <Field label="โรคประจำตัว" className="flex-1"><UnderlinedInput name="medicalCondition" value={formData.medicalCondition || ''} onChange={handleChange}/></Field>
                <Field label="หมู่เลือด" className="flex-1"><UnderlinedInput name="bloodType" value={formData.bloodType || ''} onChange={handleChange}/></Field>
                <Field label="เบอร์โทรศัพท์ติดต่อ" className="flex-1" required><UnderlinedInput name="phone" value={formData.phone || ''} onChange={handleChange} required /></Field>
            </Line>
            
            <FormSection title="ข้อมูลบิดา / มารดา / ผู้ปกครอง" />
            <p className="font-semibold text-gray-700">ข้อมูลบิดา</p>
            <Line><Field label="ชื่อ-สกุล"><UnderlinedInput name="fatherFirstName" value={formData.fatherFirstName || ''} onChange={handleChange} placeholder="ชื่อ"/><UnderlinedInput name="fatherLastName" value={formData.fatherLastName || ''} onChange={handleChange} placeholder="นามสกุล"/></Field><Field label="อายุ"><UnderlinedInput name="fatherAge" type="number" value={formData.fatherAge || ''} onChange={handleChange} className="w-20"/></Field><Field label="อาชีพ" className="flex-1"><UnderlinedInput name="fatherOccupation" value={formData.fatherOccupation || ''} onChange={handleChange}/></Field></Line>
            <Line><Field label="เลขบัตร ปชช." className="flex-1"><UnderlinedInput name="fatherNationalId" maxLength={13} value={formData.fatherNationalId || ''} onChange={handleChange}/></Field><Field label="เบอร์โทรศัพท์" className="flex-1"><UnderlinedInput name="fatherPhone" value={formData.fatherPhone || ''} onChange={handleChange}/></Field></Line>
            
            <p className="font-semibold text-gray-700 mt-4">ข้อมูลมารดา</p>
            <Line><Field label="ชื่อ-สกุล"><UnderlinedInput name="motherFirstName" value={formData.motherFirstName || ''} onChange={handleChange} placeholder="ชื่อ"/><UnderlinedInput name="motherLastName" value={formData.motherLastName || ''} onChange={handleChange} placeholder="นามสกุล"/></Field><Field label="อายุ"><UnderlinedInput name="motherAge" type="number" value={formData.motherAge || ''} onChange={handleChange} className="w-20"/></Field><Field label="อาชีพ" className="flex-1"><UnderlinedInput name="motherOccupation" value={formData.motherOccupation || ''} onChange={handleChange}/></Field></Line>
            <Line><Field label="เลขบัตร ปชช." className="flex-1"><UnderlinedInput name="motherNationalId" maxLength={13} value={formData.motherNationalId || ''} onChange={handleChange}/></Field><Field label="เบอร์โทรศัพท์" className="flex-1"><UnderlinedInput name="motherPhone" value={formData.motherPhone || ''} onChange={handleChange}/></Field></Line>
            
            <p className="font-semibold text-gray-700 mt-4">ข้อมูลผู้ปกครอง (กรอกกรณีไม่ใช่บิดา-มารดา)</p>
            <Line><Field label="ชื่อ-สกุล" className="flex-1"><UnderlinedInput name="guardianFirstName" value={formData.guardianFirstName || ''} onChange={handleChange} placeholder="ชื่อ"/><UnderlinedInput name="guardianLastName" value={formData.guardianLastName || ''} onChange={handleChange} placeholder="นามสกุล"/></Field><Field label="เกี่ยวข้องเป็น" className="flex-1"><UnderlinedInput name="guardianRelation" value={formData.guardianRelation || ''} onChange={handleChange}/></Field></Line>
            <Line><Field label="เลขบัตร ปชช." className="flex-1"><UnderlinedInput name="guardianNationalId" maxLength={13} value={formData.guardianNationalId || ''} onChange={handleChange}/></Field><Field label="เบอร์โทรศัพท์" className="flex-1"><UnderlinedInput name="guardianPhone" value={formData.guardianPhone || ''} onChange={handleChange}/></Field></Line>
            
            <FormSection title="สถานภาพการสมรสของบิดา/มารดา" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {['อยู่ร่วมกัน', 'หย่าร้างกัน', 'บิดาถึงแก่กรรม', 'มารดาถึงแก่กรรม', 'บิดาแต่งงานใหม่', 'มารดาแต่งงานใหม่', 'แยกกันอยู่'].map(status => (
                    <CheckboxInput key={status} label={status} value={status} name="maritalStatus" checked={formData.maritalStatus?.includes(status) || false} onChange={handleMaritalStatusChange} />
                ))}
            </div>
            
            <FormSection title="ที่อยู่ปัจจุบันที่สามารถติดต่อได้" />
            <Line><Field label="บ้านเลขที่" className="flex-1"><UnderlinedInput name="addressHouseNumber" value={formData.addressHouseNumber || ''} onChange={handleChange}/></Field><Field label="หมู่ที่" className="flex-1"><UnderlinedInput name="addressMoo" value={formData.addressMoo || ''} onChange={handleChange}/></Field><Field label="หมู่บ้าน/อาคาร" className="flex-1"><UnderlinedInput name="addressVillage" value={formData.addressVillage || ''} onChange={handleChange}/></Field></Line>
            <Line><Field label="ถนน" className="flex-1"><UnderlinedInput name="addressStreet" value={formData.addressStreet || ''} onChange={handleChange}/></Field><Field label="ตำบล/แขวง" className="flex-1"><UnderlinedInput name="addressSubdistrict" value={formData.addressSubdistrict || ''} onChange={handleChange}/></Field><Field label="อำเภอ/เขต" className="flex-1"><UnderlinedInput name="addressDistrict" value={formData.addressDistrict || ''} onChange={handleChange}/></Field></Line>
            <Line><Field label="จังหวัด" className="flex-1"><UnderlinedInput name="addressProvince" value={formData.addressProvince || ''} onChange={handleChange}/></Field><Field label="รหัสไปรษณีย์" className="flex-1"><UnderlinedInput name="addressZipcode" value={formData.addressZipcode || ''} onChange={handleChange}/></Field><Field label="โทรศัพท์บ้าน" className="flex-1"><UnderlinedInput name="addressPhone" value={formData.addressPhone || ''} onChange={handleChange}/></Field></Line>
            
            <FormSection title="ปัจจุบันนักเรียนอาศัยอยู่กับ" />
            <Line><Field label="ปัจจุบันนักเรียนอาศัยอยู่กับ" className="flex-1"><UnderlinedInput name="studentLivesWith" value={formData.studentLivesWith || ''} onChange={handleChange}/></Field><Field label="เกี่ยวข้องเป็น" className="flex-1"><UnderlinedInput name="studentLivesWithRelation" value={formData.studentLivesWithRelation || ''} onChange={handleChange}/></Field><Field label="เบอร์โทรศัพท์" className="flex-1"><UnderlinedInput name="studentLivesWithPhone" value={formData.studentLivesWithPhone || ''} onChange={handleChange}/></Field></Line>
            
            <FormSection title="ข้อมูลด้านการศึกษา" />
            <div className="space-y-3">
                <label className="flex items-center gap-2 text-md"><input type="radio" name="hasStudiedBefore" value="true" checked={formData.hasStudiedBefore === true} onChange={handleChange} className="w-4 h-4" /> เคยได้รับการศึกษา</label>
                 {formData.hasStudiedBefore && <Line><Field label="จากโรงเรียน" className="flex-1" required><UnderlinedInput name="previousSchool" value={formData.previousSchool || ''} onChange={handleChange} required/></Field><Field label="ระดับชั้น" className="flex-1"><UnderlinedInput name="previousEducationLevel" value={formData.previousEducationLevel || ''} onChange={handleChange} /></Field><Field label="ปี พ.ศ. ที่จบ" className="flex-1"><UnderlinedInput name="previousEducationYear" value={formData.previousEducationYear || ''} onChange={handleChange} /></Field></Line>}
                <label className="flex items-center gap-2 text-md"><input type="radio" name="hasStudiedBefore" value="false" checked={formData.hasStudiedBefore === false} onChange={handleChange} className="w-4 h-4" /> ไม่เคยได้รับการศึกษา</label>
                {!formData.hasStudiedBefore && <Line><Field label="เนื่องจาก" className="flex-1"><UnderlinedInput name="reasonForNotStudying" value={formData.reasonForNotStudying || ''} onChange={handleChange} placeholder="ระบุเหตุผล"/></Field></Line>}
            </div>
            
            <div className="pt-6">
                <h3 className="text-lg font-bold text-gray-800 mt-6 mb-4 col-span-12">หลักฐานการรับสมัคร (ไฟล์แนบ)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FileInput label="สำเนาทะเบียนบ้านนักเรียน" name="fileStudentHouseReg" onFileChange={handleFileChange} fileName={files.fileStudentHouseReg?.name} existingFileUrl={formData.fileStudentHouseReg} />
                    <FileInput label="สำเนาสูติบัตร" name="fileBirthCertificate" onFileChange={handleFileChange} fileName={files.fileBirthCertificate?.name} existingFileUrl={formData.fileBirthCertificate} />
                    <FileInput label="บัตร ปชช. นักเรียน (ถ้ามี)" name="fileStudentIdCard" onFileChange={handleFileChange} fileName={files.fileStudentIdCard?.name} existingFileUrl={formData.fileStudentIdCard} />
                    <FileInput label="บัตร ปชช. คนพิการ (ถ้ามี)" name="fileDisabilityCard" onFileChange={handleFileChange} fileName={files.fileDisabilityCard?.name} existingFileUrl={formData.fileDisabilityCard} />
                    <FileInput label="บัตร ปชช. บิดา" name="fileFatherIdCard" onFileChange={handleFileChange} fileName={files.fileFatherIdCard?.name} existingFileUrl={formData.fileFatherIdCard} />
                    <FileInput label="บัตร ปชช. มารดา" name="fileMotherIdCard" onFileChange={handleFileChange} fileName={files.fileMotherIdCard?.name} existingFileUrl={formData.fileMotherIdCard} />
                    <FileInput label="บัตร ปชช. ผู้ปกครอง" name="fileGuardianIdCard" onFileChange={handleFileChange} fileName={files.fileGuardianIdCard?.name} existingFileUrl={formData.fileGuardianIdCard} />
                </div>
                 <div className="bg-blue-50/70 text-blue-800 p-4 rounded-lg mt-4 text-sm border border-blue-100">
                    <strong>คำแนะนำ:</strong> กรุณาเตรียมไฟล์เอกสารเป็นรูปภาพ (.jpg, .png) ระบบจะทำการบีบอัดไฟล์ภาพให้เล็กลงอัตโนมัติเพื่อให้การอัปโหลดรวดเร็วขึ้น
                </div>
            </div>

            <div className="flex justify-between items-center pt-8 mt-6 border-t">
              <div>
                {isEditMode && studentToEdit && (
                  <ApplicationExporter student={studentToEdit} evaluations={evaluations} />
                )}
              </div>
              <div className="flex gap-4">
                {onClose && <button type="button" onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-xl font-bold text-lg transition-colors">ยกเลิก</button>}
                <button 
                  type="submit" 
                  disabled={isSubmitting || !!duplicateError} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:-translate-y-1"
                >
                <Save className="w-6 h-6" />{isSubmitting ? 'กำลังบันทึก...' : (isEditMode ? 'บันทึกการเปลี่ยนแปลง' : 'ยืนยันการสมัคร')}
                </button>
              </div>
            </div>
        </form>
      </div>
    </div>
  );
};