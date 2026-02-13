









import React, { useState, useEffect } from 'react';
import { Settings, Power, Users, Save, Bell, X, Check, FilePen, MessageSquareWarning, Newspaper, Plus, Trash2, Link, Video, Image as ImageIcon, ExternalLink, CircleDashed, Search, ChevronLeft, ChevronRight, CalendarClock } from 'lucide-react';
import { SystemConfig, Student, NewsItem, Evaluation } from '../types.ts';
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

// #region --- Rejection Modal ---
const RejectionModal = ({ isOpen, onClose, onSubmit, studentName }: { isOpen: boolean, onClose: () => void, onSubmit: (reason: string) => void, studentName: string }) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('กรุณาระบุเหตุผลที่ไม่อนุมัติ');
      return;
    }
    onSubmit(reason);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full animate-scale-in" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b">
            <h3 className="text-lg font-bold text-gray-800">เหตุผลที่ไม่อนุมัติใบสมัคร</h3>
            <p className="text-sm text-gray-500">สำหรับ: {studentName}</p>
          </div>
          <div className="p-6">
            <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
              กรุณาระบุสิ่งที่ต้องแก้ไข หรือเอกสารที่ขาด
            </label>
            <textarea
              id="rejectionReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-32 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="เช่น เอกสารไม่ครบ, ขาดสำเนาทะเบียนบ้านของบิดา..."
            ></textarea>
          </div>
          <div className="px-6 py-4 bg-gray-50 flex justify-end items-center gap-3 rounded-b-2xl">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-300 transition-colors">
              ยกเลิก
            </button>
            <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors flex items-center gap-1.5">
              <MessageSquareWarning className="w-4 h-4" />
              ยืนยันการไม่อนุมัติ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// #region --- Student Management Components ---
const StatusBadge = ({ status }: { status: Student['status']}) => {
    const baseClasses = "px-2 py-0.5 rounded text-xs font-medium";
    if (status === 'approved') return <span className={`${baseClasses} bg-green-100 text-green-700`}>อนุมัติ</span>;
    if (status === 'rejected') return <span className={`${baseClasses} bg-red-100 text-red-700`}>ไม่อนุมัติ</span>;
    return <span className={`${baseClasses} bg-yellow-100 text-yellow-700`}>รอตรวจสอบ</span>;
}

const StudentDetailModal = ({ student, isOpen, onClose, onEdit, onDelete, evaluations, onUpdateStatus, onNavigate }: { student: Student | null, isOpen: boolean, onClose: () => void, onEdit: (student: Student) => void, onDelete: (studentId: string) => void, evaluations: Evaluation[], onUpdateStatus: (studentId: string, status: 'approved' | 'rejected', reason?: string) => void, onNavigate: (path: string) => void }) => {
  const [imgError, setImgError] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    setImgError(false);
    setIsRejecting(false);
  }, [student]);

  if (!isOpen || !student) return null;

  const hasParentEval = evaluations.some(e => e.studentId === student.id && e.evaluatorRole === 'parent');
  const hasTeacherEval = evaluations.some(e => e.studentId === student.id && e.evaluatorRole === 'teacher');

  const DetailItem = ({ label, value, fullWidth = false }: { label: string, value?: string | number | null, fullWidth?: boolean }) => (
    <div className={fullWidth ? 'md:col-span-2 lg:col-span-3' : ''}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-800 break-words">{value || '-'}</p>
    </div>
  );
  // FIX: Made children prop optional to resolve 'Property 'children' is missing' error.
  const Section = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div>
      <h4 className="text-base font-bold text-blue-800 border-b-2 border-blue-100 pb-2 mb-4">{title}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">{children}</div>
    </div>
  );

  const fileFieldLabels: Record<string, string> = {
    fileStudentPhoto: "รูปถ่ายนักเรียน",
    fileStudentHouseReg: "สำเนาทะเบียนบ้านนักเรียน",
    fileBirthCertificate: "สำเนาสูติบัตร",
    fileStudentIdCard: "บัตร ปชช. นักเรียน",
    fileDisabilityCard: "บัตร ปชช. คนพิการ",
    fileFatherIdCard: "บัตร ปชช. บิดา",
    fileMotherIdCard: "บัตร ปชช. มารดา",
    fileGuardianIdCard: "บัตร ปชช. ผู้ปกครอง",
  };
  const fileFields = Object.keys(fileFieldLabels);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  const handleDeleteClick = () => {
    if (window.confirm(`คุณต้องการลบข้อมูลของ ${student.firstName} ${student.lastName} ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`)) {
        onDelete(student.id);
        onClose();
    }
  };
  
  const handleApprove = () => {
      if (window.confirm(`คุณต้องการอนุมัติการสมัครของ ${student.firstName} ${student.lastName} ใช่หรือไม่?`)) {
          onUpdateStatus(student.id, 'approved');
          onClose();
      }
  };

  const handleRejectSubmit = (reason: string) => {
      onUpdateStatus(student.id, 'rejected', reason);
      setIsRejecting(false);
      onClose();
  };


  return (
    <>
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b flex justify-between items-start bg-gray-50/50 rounded-t-2xl gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
               <h3 className="text-xl font-bold text-gray-800">{student.prefix}{student.firstName} {student.lastName}</h3>
               <StatusBadge status={student.status} />
            </div>
            <p className="text-sm text-gray-500">เลขประจำตัวประชาชน: {student.nationalId}</p>
          </div>
           <div className="flex items-start gap-4">
              <div className="w-24 h-32 bg-gray-100 rounded-lg border flex items-center justify-center text-gray-400 text-xs text-center p-1 shrink-0 overflow-hidden">
                  {student.fileStudentPhoto && !imgError ? (
                      <img 
                        src={getDriveImageUrl(student.fileStudentPhoto)} 
                        alt="รูปถ่ายนักเรียน" 
                        referrerPolicy="no-referrer" 
                        className="w-full h-full object-cover rounded-md"
                        onError={() => setImgError(true)}
                      />
                  ) : (
                      <div className="flex flex-col items-center gap-1">
                          <ImageIcon className="w-6 h-6"/>
                          <span>{imgError ? 'โหลดภาพไม่ได้' : 'ไม่มีรูปภาพ'}</span>
                      </div>
                  )}
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200"><X /></button>
          </div>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <Section title="ข้อมูลการสมัคร">
            <DetailItem label="ระดับชั้นที่สมัคร" value={student.applyLevel} />
            <DetailItem label="แผนการเรียน" value={student.program} />
            <DetailItem label="วันที่สมัคร" value={formatDate(student.appliedDate)} />
            <DetailItem label="เหตุผลจากแอดมิน (ถ้ามี)" value={student.rejectionReason} fullWidth={true} />
          </Section>

          <Section title="สถานะการประเมิน">
              <div className="md:col-span-2 lg:col-span-3 space-y-3">
                  {/* Parent Evaluation */}
                  <div className="flex flex-wrap items-center justify-between p-3 bg-gray-50 rounded-lg gap-2">
                      <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-700">การประเมินโดยผู้ปกครอง</span>
                      </div>
                      {hasParentEval ? (
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-green-600 px-3 py-1 bg-green-100 rounded-full">
                              <Check size={16} /> ประเมินแล้ว
                          </div>
                      ) : (
                          <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 text-sm font-semibold text-yellow-700 px-3 py-1 bg-yellow-100 rounded-full">
                                  <MessageSquareWarning size={16} /> ยังไม่ประเมิน
                              </div>
                              <button 
                                  onClick={() => {
                                      onNavigate(`evaluate?id=${student.nationalId}`);
                                      onClose();
                                  }}
                                  className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
                                  ไปที่หน้าประเมิน <ExternalLink size={14} />
                              </button>
                          </div>
                      )}
                  </div>
                  {/* Teacher Evaluation */}
                  <div className="flex flex-wrap items-center justify-between p-3 bg-gray-50 rounded-lg gap-2">
                      <div className="flex items-center gap-2">
                          <FilePen className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-700">การประเมินโดยครู</span>
                      </div>
                      {hasTeacherEval ? (
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-green-600 px-3 py-1 bg-green-100 rounded-full">
                              <Check size={16} /> ประเมินแล้ว
                          </div>
                      ) : (
                          <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 text-sm font-semibold text-yellow-700 px-3 py-1 bg-yellow-100 rounded-full">
                                  <MessageSquareWarning size={16} /> ยังไม่ประเมิน
                              </div>
                              <button 
                                  onClick={() => {
                                      onNavigate(`evaluate?id=${student.nationalId}`);
                                      onClose();
                                  }}
                                  className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
                                  ไปที่หน้าประเมิน <ExternalLink size={14} />
                              </button>
                          </div>
                      )}
                  </div>
              </div>
          </Section>
          
          <Section title="ข้อมูลทั่วไป">
            <DetailItem label="ชื่อเล่น" value={student.nickname} />
            <DetailItem label="วันเกิด" value={formatDate(student.birthDate)} />
            <DetailItem label="เชื้อชาติ/สัญชาติ/ศาสนา" value={`${student.ethnicity || '-'} / ${student.nationality || '-'} / ${student.religion || '-'}`} />
            <DetailItem label="เป็นบุตรคนที่" value={student.childOrder} />
            <DetailItem label="จำนวนพี่น้อง (คน)" value={student.siblingsCount} />
            <DetailItem label="พี่น้อง ชาย/หญิง (คน)" value={`${student.siblingsMale || 0} / ${student.siblingsFemale || 0}`} />
            <DetailItem label="โรคประจำตัว" value={student.medicalCondition} />
            <DetailItem label="หมู่เลือด" value={student.bloodType} />
            <DetailItem label="เบอร์โทรศัพท์ติดต่อ" value={student.phone} />
          </Section>

          <Section title="ข้อมูลความพิการ">
            <DetailItem label="การจดทะเบียนคนพิการ" value={student.hasDisabilityId ? 'จด' : 'ไม่จด'} />
            <DetailItem label="เลขประจำตัวคนพิการ" value={student.disabilityId} />
            <DetailItem label="ประเภทความพิการ" value={student.disabilityType} />
            <DetailItem label="ลักษณะความพิการ" value={student.disabilityDescription} fullWidth={true}/>
          </Section>

          <Section title="ข้อมูลบิดา">
            <DetailItem label="ชื่อ-สกุล" value={`${student.fatherPrefix || ''} ${student.fatherFirstName || ''} ${student.fatherLastName || ''}`.trim()} />
            <DetailItem label="อายุ (ปี)" value={student.fatherAge} />
            <DetailItem label="อาชีพ" value={student.fatherOccupation} />
            <DetailItem label="การศึกษา" value={student.fatherEducation} />
            <DetailItem label="รายได้ (บาท/เดือน)" value={student.fatherIncome?.toLocaleString()} />
            <DetailItem label="เบอร์โทรศัพท์" value={student.fatherPhone} />
          </Section>

          <Section title="ข้อมูลมารดา">
            <DetailItem label="ชื่อ-สกุล" value={`${student.motherPrefix || ''} ${student.motherFirstName || ''} ${student.motherLastName || ''}`.trim()} />
            <DetailItem label="อายุ (ปี)" value={student.motherAge} />
            <DetailItem label="อาชีพ" value={student.motherOccupation} />
            <DetailItem label="การศึกษา" value={student.motherEducation} />
            <DetailItem label="รายได้ (บาท/เดือน)" value={student.motherIncome?.toLocaleString()} />
            <DetailItem label="เบอร์โทรศัพท์" value={student.motherPhone} />
          </Section>
          
          { (student.guardianFirstName) &&
            <Section title="ข้อมูลผู้ปกครอง">
                <DetailItem label="ชื่อ-สกุล" value={`${student.guardianPrefix || ''} ${student.guardianFirstName || ''} ${student.guardianLastName || ''}`.trim()} />
                <DetailItem label="เกี่ยวข้องเป็น" value={student.guardianRelation} />
                <DetailItem label="อาชีพ" value={student.guardianOccupation} />
                <DetailItem label="เบอร์โทรศัพท์" value={student.guardianPhone} />
            </Section>
          }

          <Section title="ที่อยู่ปัจจุบัน">
              <DetailItem label="ที่อยู่" value={`${student.addressHouseNumber || ''} หมู่ ${student.addressMoo || ''} ${student.addressVillage || ''} ${student.addressStreet || ''}`.trim()} fullWidth={true} />
              <DetailItem label="ตำบล/อำเภอ" value={`${student.addressSubdistrict || ''} / ${student.addressDistrict || ''}`} />
              <DetailItem label="จังหวัด/รหัสไปรษณีย์" value={`${student.addressProvince || ''} / ${student.addressZipcode || ''}`} />
          </Section>

          <Section title="ข้อมูลด้านการศึกษา">
            <DetailItem label="ประวัติการศึกษา" value={student.hasStudiedBefore ? 'เคยได้รับการศึกษา' : 'ไม่เคยได้รับการศึกษา'} />
            {student.hasStudiedBefore ? (
              <>
                <DetailItem label="โรงเรียนเดิม" value={student.previousSchool} />
                <DetailItem label="ระดับชั้น" value={student.previousEducationLevel} />
                <DetailItem label="ปี พ.ศ. ที่จบ" value={student.previousEducationYear} />
              </>
            ) : (
              <DetailItem label="เนื่องจาก" value={student.reasonForNotStudying} fullWidth={true} />
            )}
          </Section>

          <Section title="ไฟล์เอกสารแนบ">
              {fileFields.map(field => {
                  const fileUrl = student[field as keyof Student] as string | undefined;
                  return fileUrl ? (
                      <div key={field} className="flex items-center gap-2">
                          <Link className="w-4 h-4 text-blue-500" />
                          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{fileFieldLabels[field]}</a>
                      </div>
                  ) : null;
              })}
              {!fileFields.some(f => student[f as keyof Student]) && <p className="text-sm text-gray-400">ไม่มีไฟล์แนบ</p>}
          </Section>

        </div>
        <div className="p-4 bg-gray-50/50 rounded-b-2xl border-t grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
            <div className="flex items-center gap-2 lg:col-span-1">
                 <button onClick={handleApprove} className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                    <Check className="w-4 h-4"/> อนุมัติ
                </button>
                <button onClick={() => setIsRejecting(true)} className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                    <X className="w-4 h-4"/> ไม่อนุมัติ
                </button>
            </div>
            <div className="flex justify-center lg:col-span-1">
                <ApplicationExporter student={student} evaluations={evaluations} />
            </div>
           <div className="flex items-center gap-2 justify-end lg:col-span-1">
                <button onClick={() => { onEdit(student); onClose(); }} className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                    <FilePen className="w-4 h-4"/> แก้ไข
                </button>
                 <button onClick={handleDeleteClick} className="flex items-center gap-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4"/> ลบ
                </button>
           </div>
        </div>
      </div>
    </div>
    <RejectionModal isOpen={isRejecting} onClose={() => setIsRejecting(false)} onSubmit={handleRejectSubmit} studentName={`${student.firstName} ${student.lastName}`} />
    </>
  );
};

const StudentManagement = ({ students, onEditStudent, onDeleteStudent, evaluations, onUpdateStatus, onNavigate }: { students: Student[], onEditStudent: (student: Student) => void, onDeleteStudent: (studentId: string) => void, evaluations: Evaluation[], onUpdateStatus: (studentId: string, status: 'approved' | 'rejected', reason?: string) => void, onNavigate: (path: string) => void }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    const filteredStudents = students.filter(s => 
        s.firstName.includes(searchTerm) || 
        s.lastName.includes(searchTerm) || 
        s.nationalId.includes(searchTerm)
    ).sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());

    const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                    <input type="text" placeholder="ค้นหา (ชื่อ, นามสกุล, เลขบัตร ปชช.)" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full border rounded-lg py-2 pl-10 pr-4 text-sm"/>
                </div>
                <div className="text-sm text-gray-600">ทั้งหมด: <span className="font-semibold">{filteredStudents.length}</span> รายการ</div>
            </div>
            <div className="bg-white rounded-lg border overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left font-semibold text-gray-600 p-3 pl-4">ผู้สมัคร</th>
                            <th className="text-left font-semibold text-gray-600 p-3">เลขบัตรประชาชน</th>
                            <th className="text-left font-semibold text-gray-600 p-3">ระดับชั้น</th>
                            <th className="text-left font-semibold text-gray-600 p-3">วันที่สมัคร</th>
                            <th className="text-left font-semibold text-gray-600 p-3">สถานะ</th>
                            <th className="text-left font-semibold text-gray-600 p-3">สถานะการประเมิน</th>
                            <th className="text-left font-semibold text-gray-600 p-3">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {paginatedStudents.map(s => (
                            <tr key={s.id} className="hover:bg-gray-50">
                                <td className="p-3 pl-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                                            {s.fileStudentPhoto ? (
                                                <img 
                                                    src={getDriveImageUrl(s.fileStudentPhoto)} 
                                                    alt="profile" 
                                                    referrerPolicy="no-referrer" 
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('bg-gray-100'); }}
                                                />
                                            ) : (
                                                <Users className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">{s.prefix}{s.firstName} {s.lastName}</p>
                                            <p className="text-xs text-gray-500 lg:hidden">{s.nationalId}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-3 text-gray-600">{s.nationalId}</td>
                                <td className="p-3 text-gray-600">{s.applyLevel}</td>
                                <td className="p-3 text-gray-600">{new Date(s.appliedDate).toLocaleDateString('th-TH')}</td>
                                <td className="p-3"><StatusBadge status={s.status} /></td>
                                <td className="p-3 text-gray-600">
                                    {(() => {
                                        const hasParentEval = evaluations.some(e => e.studentId === s.id && e.evaluatorRole === 'parent');
                                        const hasTeacherEval = evaluations.some(e => e.studentId === s.id && e.evaluatorRole === 'teacher');
                                        return (
                                            <div className="space-y-1">
                                                <div className={`flex items-center gap-1.5 text-xs ${hasParentEval ? 'text-green-600' : 'text-gray-400'}`}>
                                                    {hasParentEval ? <Check size={14} className="flex-shrink-0" /> : <X size={14} className="flex-shrink-0" />} <span>ผู้ปกครอง</span>
                                                </div>
                                                <div className={`flex items-center gap-1.5 text-xs ${hasTeacherEval ? 'text-green-600' : 'text-gray-400'}`}>
                                                    {hasTeacherEval ? <Check size={14} className="flex-shrink-0" /> : <X size={14} className="flex-shrink-0" />} <span>ครู</span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </td>
                                <td className="p-3">
                                    <button onClick={() => setSelectedStudent(s)} className="text-blue-600 hover:underline font-medium">ดูรายละเอียด</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {paginatedStudents.length === 0 && <div className="text-center p-8 text-gray-500">ไม่พบข้อมูล</div>}
            </div>
             {totalPages > 1 && (
                <div className="flex justify-between items-center text-sm">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex items-center gap-1 px-3 py-1 border rounded-md disabled:opacity-50"><ChevronLeft className="w-4 h-4"/> ก่อนหน้า</button>
                    <span>หน้า {currentPage} / {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex items-center gap-1 px-3 py-1 border rounded-md disabled:opacity-50">ถัดไป <ChevronRight className="w-4 h-4"/></button>
                </div>
            )}
            <StudentDetailModal student={selectedStudent} isOpen={!!selectedStudent} onClose={() => setSelectedStudent(null)} onEdit={onEditStudent} onDelete={onDeleteStudent} evaluations={evaluations} onUpdateStatus={onUpdateStatus} onNavigate={onNavigate} />
        </div>
    );
}

// #endregion

// #region --- News Management Components ---
const NewsEditorModal = ({ isOpen, onClose, newsItem, onSave }: { isOpen: boolean, onClose: () => void, newsItem?: Partial<NewsItem> | null, onSave: (data: Partial<NewsItem>, files: { newImageFiles: File[], newAttachmentFile: File | null }) => Promise<boolean> }) => {
    const [formData, setFormData] = useState<Partial<NewsItem>>({});
    const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
    const [newAttachmentFile, setNewAttachmentFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setFormData(newsItem || { type: 'news', date: new Date().toISOString().slice(0, 16) });
        setNewImageFiles([]);
        setNewAttachmentFile(null);
    }, [newsItem, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setNewImageFiles(prev => [...prev, ...Array.from(e.target.files)]);
        }
    };

    const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setNewAttachmentFile(e.target.files[0]);
            setFormData(prev => ({...prev, fileName: e.target.files[0].name }));
        }
    };
    
    const removeExistingImage = (url: string) => {
       setFormData(prev => ({...prev, imageUrls: prev.imageUrls?.filter(u => u !== url) || [] }));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const success = await onSave(formData, { newImageFiles, newAttachmentFile });
        setIsSaving(false);
        if (success) onClose();
    }
    
    const getSafeDateValue = (dateVal: string | number | undefined) => {
        if (!dateVal) return '';
        try {
            return new Date(dateVal).toISOString().slice(0, 16);
        } catch (e) {
            return '';
        }
    };

    return (
      <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
           <div className="p-4 border-b flex justify-between items-center"><h3 className="font-bold text-lg">{newsItem?.id ? 'แก้ไขข่าว' : 'เพิ่มข่าวใหม่'}</h3><button onClick={onClose}><X/></button></div>
           <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
                <input name="title" placeholder="หัวข้อข่าว" value={formData.title || ''} onChange={handleChange} className="w-full border rounded p-2" required />
                <textarea name="content" placeholder="เนื้อหา" value={formData.content || ''} onChange={handleChange} className="w-full border rounded p-2 h-32" required />
                <input name="date" type="datetime-local" value={getSafeDateValue(formData.date)} onChange={handleChange} className="w-full border rounded p-2"/>
                <select name="type" value={formData.type || 'news'} onChange={handleChange} className="w-full border rounded p-2 bg-white"><option value="news">ข่าวสาร</option><option value="announcement">ประกาศ</option></select>
                <input name="videoUrl" placeholder="ลิงก์วิดีโอ (YouTube Embed)" value={formData.videoUrl || ''} onChange={handleChange} className="w-full border rounded p-2" />
                
                <div>
                    <label className="font-medium text-sm">รูปภาพ</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {formData.imageUrls?.map(url => (
                            <div key={url} className="relative">
                                <img 
                                  src={getDriveImageUrl(url)} 
                                  referrerPolicy="no-referrer" 
                                  className="w-20 h-20 object-cover rounded"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                                <button type="button" onClick={() => removeExistingImage(url)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5"><X size={12}/></button>
                            </div>
                        ))}
                        {newImageFiles.map((f,i) => <div key={i}><img src={URL.createObjectURL(f)} className="w-20 h-20 object-cover rounded"/></div>)}
                    </div>
                    <input type="file" multiple accept="image/*" onChange={handleImageChange} className="mt-2 text-sm" />
                </div>
                 <div>
                    <label className="font-medium text-sm">ไฟล์แนบ</label>
                    {formData.fileUrl && !newAttachmentFile && <div className="text-sm text-blue-600 flex items-center gap-2"><span>{formData.fileName}</span> <button type="button" onClick={() => setFormData(p => ({...p, fileUrl: '', fileName: ''}))}><X size={14} className="text-red-500"/></button></div>}
                    {newAttachmentFile && <div className="text-sm">{newAttachmentFile.name}</div>}
                    <input type="file" onChange={handleAttachmentChange} className="mt-1 text-sm"/>
                 </div>

           </form>
            <div className="p-4 bg-gray-50 border-t flex justify-end gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">ยกเลิก</button>
                <button type="submit" form="news-form" onClick={handleSubmit} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-blue-300">{isSaving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
            </div>
        </div>
      </div>
    );
};

const NewsManagement = ({ news, onAddNews, onUpdateNews, onDeleteNews }: { news: NewsItem[], onAddNews: any, onUpdateNews: any, onDeleteNews: any }) => {
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingNews, setEditingNews] = useState<Partial<NewsItem> | null>(null);

    const openEditor = (item?: NewsItem) => { setEditingNews(item || {}); setIsEditorOpen(true); };

    return (
        <div>
            <button onClick={() => openEditor()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg mb-4"><Plus size={18}/>เพิ่มข่าวใหม่</button>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {news.map(item => (
                   <div key={item.id} className="bg-white border rounded-lg p-4 space-y-2">
                       <p className="font-bold">{item.title}</p>
                       <p className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString('th-TH')}</p>
                       <div className="flex gap-2 pt-2">
                           <button onClick={() => openEditor(item)} className="text-sm text-yellow-600">แก้ไข</button>
                           <button onClick={() => window.confirm('ยืนยันการลบ?') && onDeleteNews(item.id)} className="text-sm text-red-600">ลบ</button>
                       </div>
                   </div>
               ))}
            </div>
            <NewsEditorModal isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} newsItem={editingNews} onSave={editingNews?.id ? onUpdateNews : onAddNews} />
        </div>
    );
}

// #endregion

// #region --- Settings Management Component ---
const SettingsManagement = ({ config, onUpdateConfig }: { config: SystemConfig, onUpdateConfig: (config: SystemConfig) => Promise<boolean> }) => {
    const [localConfig, setLocalConfig] = useState(config);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setLocalConfig(config);
    }, [config]);

    const handleSave = async () => { 
        setIsSaving(true);
        await onUpdateConfig(localConfig); 
        setIsSaving(false);
    };

    // Helper to ensure date string is formatted for datetime-local input
    // Accepts full ISO string (e.g., from DB) and returns "YYYY-MM-DDTHH:mm" for input
    const formatDateForInput = (val: string | undefined) => {
        if (!val) return '';
        // If it's already in simplified format (no Z), just return it
        if (!val.includes('Z') && !val.includes('+')) return val;
        
        // If it is ISO from DB (UTC), convert to local "YYYY-MM-DDTHH:mm"
        try {
            const d = new Date(val);
            const offsetMs = d.getTimezoneOffset() * 60000;
            const localISOTime = new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
            return localISOTime;
        } catch (e) {
            return val;
        }
    }

    return (
        <div className="max-w-2xl space-y-6 bg-white p-6 rounded-2xl border border-gray-200">
            <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800">
                <Settings className="w-5 h-5"/> ตั้งค่าระบบรับสมัคร
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                     <label className="block text-sm font-medium text-gray-700 mb-2">สถานะระบบ (Master Switch)</label>
                     <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setLocalConfig({...localConfig, isOpen: !localConfig.isOpen})}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${localConfig.isOpen ? 'bg-green-500' : 'bg-gray-200'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localConfig.isOpen ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                        <span className={`text-sm font-medium ${localConfig.isOpen ? 'text-green-700' : 'text-gray-500'}`}>
                            {localConfig.isOpen ? 'เปิดใช้งาน' : 'ปิดการใช้งานชั่วคราว'}
                        </span>
                     </div>
                     <p className="text-xs text-gray-400 mt-1">หากปิด ระบบจะแสดงข้อความปิดรับสมัครทันที โดยไม่สนวันที่</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                        <CalendarClock className="w-4 h-4"/> วันที่เปิดรับสมัคร
                    </label>
                    <input 
                        type="datetime-local" 
                        value={formatDateForInput(localConfig.startDate)} 
                        onChange={e => setLocalConfig({...localConfig, startDate: e.target.value})} 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                        <CalendarClock className="w-4 h-4"/> วันที่ปิดรับสมัคร
                    </label>
                    <input 
                        type="datetime-local" 
                        value={formatDateForInput(localConfig.endDate)} 
                        onChange={e => setLocalConfig({...localConfig, endDate: e.target.value})} 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                </div>
            
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">ปีการศึกษา</label>
                    <input 
                        type="text" 
                        value={localConfig.academicYear} 
                        onChange={e => setLocalConfig({...localConfig, academicYear: e.target.value})} 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>
                
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">ข้อความแจ้งเตือน (เมื่อปิดรับสมัคร/ยังไม่ถึงกำหนด)</label>
                    <textarea 
                        value={localConfig.announcementText} 
                        onChange={e => setLocalConfig({...localConfig, announcementText: e.target.value})} 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none h-24"
                        placeholder="เช่น ขณะนี้อยู่นอกระยะเวลาการรับสมัคร..."
                    />
                </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
                 <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed">
                    {isSaving ? (
                        <><CircleDashed className="w-4 h-4 animate-spin"/> กำลังบันทึก...</>
                    ) : (
                        <><Save className="w-4 h-4" /> บันทึกการเปลี่ยนแปลง</>
                    )}
                 </button>
            </div>
        </div>
    );
}
// #endregion

const AdminPanel = ({ config, onUpdateConfig, students, onEditStudent, onDeleteStudent, news, onAddNews, onUpdateNews, onDeleteNews, evaluations, onUpdateStudentStatus, onNavigate }) => {
    const [activeTab, setActiveTab] = useState('students');
    
    const tabs = [
      { id: 'students', label: 'จัดการผู้สมัคร', icon: Users },
      { id: 'news', label: 'จัดการข่าวสาร', icon: Newspaper },
      { id: 'settings', label: 'ตั้งค่าระบบ', icon: Settings }
    ];

    const renderContent = () => {
        switch(activeTab) {
            case 'students': return <StudentManagement students={students} onEditStudent={onEditStudent} onDeleteStudent={onDeleteStudent} evaluations={evaluations} onUpdateStatus={onUpdateStudentStatus} onNavigate={onNavigate} />;
            case 'news': return <NewsManagement news={news} onAddNews={onAddNews} onUpdateNews={onUpdateNews} onDeleteNews={onDeleteNews} />;
            case 'settings': return <SettingsManagement config={config} onUpdateConfig={onUpdateConfig} />;
            default: return null;
        }
    }

    return (
        <div className="space-y-6">
             <h2 className="text-2xl font-bold text-gray-800">แผงควบคุมผู้ดูแลระบบ</h2>
            <div className="flex border-b overflow-x-auto">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                        <tab.icon size={16}/>{tab.label}
                    </button>
                ))}
            </div>
            <div className="animate-fade-in">{renderContent()}</div>
        </div>
    );
};

export default AdminPanel;