













import React, { useState, useEffect } from 'react';
import Layout from './components/Layout.tsx';
import Dashboard from './components/Dashboard.tsx';
import { RegistrationForm, StatusCheck } from './components/Admission.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import { EvaluationPage } from './components/Evaluation.tsx';
import { EvaluationAuth } from './components/EvaluationAuth.tsx';
import { NewsPage } from './components/NewsPage.tsx';
import { NewsDetail } from './components/NewsDetail.tsx';
import { User, SystemConfig, Student, NewsItem, Evaluation } from './types.ts';
import { MOCK_STUDENTS, MOCK_NEWS } from './constants.tsx';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzpVHe4gzibp_SCVdT4Ty-EaJtyTFUIflXt8_AzqYGMSUshy7U4Q3uuKi0ENhSb3qBd/exec';
const SHEET_ID = '126WoKP5kNrVYlZzX8CiE9mX8ZZ6QEZJVX_WfHTgaoxQ';

// Optimized file processor with Image Compression
const processFile = async (file: File): Promise<{ data: string, name: string }> => {
  return new Promise((resolve, reject) => {
    // 1. Non-images: Return original Base64 (e.g. PDF)
    if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({ 
            data: reader.result as string, 
            name: file.name 
        });
        reader.onerror = error => reject(error);
        return;
    }

    // 2. Images: Resize and Compress
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Resize logic (Max 1280px - sufficient for documents/A4 printing)
        const MAX_SIZE = 1280; 
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Fill white background (handling transparent PNGs converted to JPEG)
            ctx.fillStyle = '#FFFFFF'; 
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, width, height);
            
            // Compress to JPEG with 0.75 quality (Significant size reduction)
            const compressedData = canvas.toDataURL('image/jpeg', 0.75);
            
            // Rename to .jpg to match the content
            const originalName = file.name;
            const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
            const newName = `${nameWithoutExt}.jpg`;

            resolve({ data: compressedData, name: newName });
        } else {
            // Fallback if canvas fails
            resolve({ data: event.target?.result as string, name: file.name });
        }
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Helper function to hash strings using SHA-256
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Simple Login Modal Component
const LoginModal = ({ isOpen, onClose, onLogin }: { isOpen: boolean; onClose: () => void; onLogin: (user: User, remember: boolean) => void; }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');

    try {
      const hashedPassword = await hashString(password);
      
      const payload = {
          action: 'login',
          username: username,
          hashedPassword: hashedPassword
      };

      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Network error during login.');
      }

      const result = await response.json();

      if (result.status === 'success') {
        onLogin({ username: 'admin', name: 'ผู้ดูแลระบบ', role: 'admin' }, rememberMe);
        setUsername('');
        setPassword('');
        setRememberMe(false);
      } else {
        setError(result.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      console.error("Login error:", err);
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsLoggingIn(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-scale-in">
        <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">เข้าสู่ระบบผู้ดูแล</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Username</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ชื่อผู้ใช้"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
            <input type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="รหัสผ่าน"/>
          </div>
           <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"/>
                จำข้อมูลการเข้าสู่ระบบ
              </label>
            </div>
          
          {error && (
            (() => {
              const isSetupError = error.includes('ยังไม่ได้ตั้งค่าผู้ใช้แอดมิน');
              const setupInstruction = "ดูเหมือนว่าบัญชีผู้ดูแลระบบยังไม่ได้ถูกตั้งค่าใน Google Apps Script ซึ่งเป็นขั้นตอนที่จำเป็นต้องทำเพียงครั้งแรกครั้งเดียว กรุณาติดต่อผู้พัฒนาระบบเพื่อดำเนินการตั้งค่าฟังก์ชัน `setupAdmin`";

              return (
                <div className={`p-4 rounded-lg text-center text-sm border ${isSetupError ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                  <div className="font-bold mb-1">
                    {isSetupError ? 'คำแนะนำในการตั้งค่า' : 'ไม่สามารถเข้าสู่ระบบได้'}
                  </div>
                  <p className="text-xs">{isSetupError ? setupInstruction : error}</p>
                </div>
              );
            })()
          )}

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium text-gray-700 transition-colors">ยกเลิก</button>
            <button type="submit" disabled={isLoggingIn} className="flex-1 px-4 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed font-medium transition-colors">
              {isLoggingIn ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditStudentModal = ({ isOpen, onClose, student, config, onUpdateStudent, evaluations, students }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
        <div className="max-w-6xl w-full max-h-[90vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
           <RegistrationForm 
              config={config} 
              studentToEdit={student}
              onUpdateStudent={onUpdateStudent}
              onAddStudent={async () => false} // This won't be called in edit mode
              onClose={onClose}
              evaluations={evaluations}
              existingStudents={students}
           />
        </div>
      </div>
    );
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [searchParam, setSearchParam] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Centralized state
  const [students, setStudents] = useState<Student[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    isOpen: true,
    startDate: '', 
    endDate: '',   
    academicYear: '2569',
    announcementText: 'ขณะนี้อยู่นอกระยะเวลาการรับสมัคร กรุณาติดตามข่าวสารในภายหลัง'
  });
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${SCRIPT_URL}?sheetId=${SHEET_ID}&action=getAllData`);
      if (!response.ok) throw new Error('Network response was not ok');
      const result = await response.json();

      if (result.status === 'success') {
        const studentData = result.data.students || [];
        const newsData = result.data.news || [];
        const evalData = result.data.evaluations || [];
        const settings = result.data.settings;

        if (settings) {
            setSystemConfig({
                isOpen: settings.isOpen === true || settings.isOpen === "TRUE",
                startDate: settings.startDate || '',
                endDate: settings.endDate || '',
                academicYear: settings.academicYear || '2569',
                announcementText: settings.announcementText || ''
            });
        }
        
        const formattedStudents = studentData.map(s => ({...s, gpa: Number(s.gpa) || 0 }));
        setStudents(formattedStudents);
        setNews(newsData.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        
        const formattedEvals = evalData.map((ev: any) => {
            try {
                return {
                    ...ev,
                    section1: JSON.parse(ev.section1 || '{}'),
                    section2: JSON.parse(ev.section2 || '{}'),
                    section3: JSON.parse(ev.section3 || '{}'),
                };
            } catch (err) {
                console.error("Failed to parse evaluation sections for eval ID:", ev.id, err);
                return ev;
            }
        });
        setEvaluations(formattedEvals);


      } else {
         throw new Error(result.message || 'Failed to parse data from server');
      }

    } catch (error) {
      console.error('Failed to fetch data:', error);
      console.warn('Could not fetch data from the server. Falling back to mock data.');
      setStudents(MOCK_STUDENTS);
      setNews(MOCK_NEWS);
      setEvaluations([]);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    const checkLoginStatus = () => {
      const loggedIn = localStorage.getItem('isLoggedIn');
      if (loggedIn === 'true') {
        setUser({ username: 'admin', name: 'ผู้ดูแลระบบ', role: 'admin' });
      }
    };
    checkLoginStatus();
    fetchData();
  }, []);

  const handleNavigate = (page: string) => {
    window.scrollTo(0, 0);
    if (page.includes('?')) {
      const [path, query] = page.split('?');
      const params = new URLSearchParams(query);
      setSearchParam(params.get('id') || '');
      setCurrentPage(path);
    } else {
      setSearchParam('');
      setCurrentPage(page);
    }
  };

  const handleLogin = (u: User, remember: boolean) => {
    setUser(u);
    if (remember) {
      localStorage.setItem('isLoggedIn', 'true');
    }
    setShowLogin(false);
    handleNavigate('admin');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('isLoggedIn');
    handleNavigate('home');
  };
  
  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setIsEditModalOpen(true);
  };

  const handleAddStudent = async (studentData: Omit<Student, 'id' | 'status' | 'appliedDate'>, files: Record<string, File | null>): Promise<boolean> => {
    try {
        const payload: any = { ...studentData, action: 'addStudent', sheetId: SHEET_ID };

        // Process and Compress Files
        for (const [key, file] of Object.entries(files)) {
            if (file) {
                try {
                    const processed = await processFile(file);
                    payload[key] = processed.data;
                    payload[key + '_name'] = processed.name;
                } catch (e) {
                    console.error("Error processing file " + key, e);
                    alert("เกิดข้อผิดพลาดในการเตรียมไฟล์: " + file.name);
                    return false;
                }
            }
        }

        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Network error: ${response.status} - ${response.statusText}`);
        }

        const result = await response.json();

        if (result.status !== 'success') {
            throw new Error(`Server error: ${result.message}`);
        }
        
        alert('สมัครเรียนสำเร็จ! กรุณากรอกข้อมูลการประเมินนักเรียนในขั้นตอนต่อไป');
        await fetchData(); // Refresh all data
        handleNavigate(`evaluate?id=${studentData.nationalId}`);
        return true;
    } catch (error) {
        console.error('Failed to add student:', error);
        alert(`เกิดข้อผิดพลาดในการสมัคร: ${error.message}\n\nกรุณาตรวจสอบการเชื่อมต่อและลองอีกครั้ง`);
        return false;
    }
  };
  
 const handleUpdateStudentWithFiles = async (studentData: Student, files: Record<string, File | null>): Promise<boolean> => { 
    try {
        const payload: any = { ...studentData, action: 'updateStudent', sheetId: SHEET_ID };

         // Process and Compress Files
        for (const [key, file] of Object.entries(files)) {
            if (file) {
                try {
                    const processed = await processFile(file);
                    payload[key] = processed.data;
                    payload[key + '_name'] = processed.name;
                } catch (e) {
                    console.error("Error processing file " + key, e);
                    alert("เกิดข้อผิดพลาดในการเตรียมไฟล์: " + file.name);
                    return false;
                }
            }
        }
        
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(`Network error: ${response.status}`);
        
        const result = await response.json();
        if (result.status !== 'success') throw new Error(`Server error: ${result.message}`);
        
        alert('อัปเดตข้อมูลสำเร็จ');
        await fetchData(); // Refresh data
        return true;
    } catch (error) {
        console.error('Failed to update student:', error);
        alert(`เกิดข้อผิดพลาดในการอัปเดตข้อมูล: ${error.message}`);
        return false;
    }
  };

  const handleDeleteStudent = async (studentId: string): Promise<boolean> => {
      try {
          const payload = {
              action: 'deleteStudent',
              sheetId: SHEET_ID,
              id: studentId
          };

          const response = await fetch(SCRIPT_URL, {
              method: 'POST',
              body: JSON.stringify(payload)
          });

          if (!response.ok) throw new Error(`Network error`);

          const result = await response.json();
          if (result.status !== 'success') throw new Error(result.message);

          alert('ลบข้อมูลการสมัครเรียบร้อยแล้ว');
          await fetchData();
          return true;
      } catch (error) {
          console.error('Failed to delete student:', error);
          alert(`เกิดข้อผิดพลาดในการลบข้อมูล: ${error.message}`);
          return false;
      }
  };

    const handleUpdateStudentStatus = async (studentId: string, status: 'approved' | 'rejected', reason: string = ''): Promise<boolean> => {
        setIsLoading(true);
        try {
            const payload = {
                action: 'updateStudentStatus',
                sheetId: SHEET_ID,
                id: studentId,
                status: status,
                rejectionReason: reason
            };

            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`Network error`);

            const result = await response.json();
            if (result.status !== 'success') throw new Error(result.message);

            alert(`อัปเดตสถานะเป็น '${status === 'approved' ? 'อนุมัติ' : 'ไม่อนุมัติ'}' เรียบร้อยแล้ว`);
            await fetchData();
            return true;
        } catch (error) {
            console.error('Failed to update student status:', error);
            alert(`เกิดข้อผิดพลาดในการอัปเดตสถานะ: ${error.message}`);
            return false;
        } finally {
            setIsLoading(false);
        }
    };
  
    // News Handlers
    const handleAddNews = async (data: Partial<NewsItem>, files: { newImageFiles: File[], newAttachmentFile: File | null }): Promise<boolean> => {
        try {
            const payload: any = { ...data, action: 'addNews', sheetId: SHEET_ID };
            
            // Handle Images with Compression
            payload.newImages = [];
            if (files.newImageFiles && files.newImageFiles.length > 0) {
                for (const file of files.newImageFiles) {
                    const processed = await processFile(file);
                     payload.newImages.push({
                        data: processed.data,
                        name: processed.name
                    });
                }
            }

            // Handle Attachment (Compress if image, else keep original)
            if (files.newAttachmentFile) {
                const processed = await processFile(files.newAttachmentFile);
                payload.attachmentFile = processed.data;
                payload.attachmentFileName = processed.name;
            }

            const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
            const result = await res.json();
            if (result.status !== 'success') throw new Error(result.message);
            await fetchData();
            return true;
        } catch (error) {
            console.error('Failed to add news:', error);
            alert(`เกิดข้อผิดพลาด: ${error.message}`);
            return false;
        }
    };

    const handleUpdateNews = async (data: Partial<NewsItem>, files: { newImageFiles: File[], newAttachmentFile: File | null }): Promise<boolean> => {
        try {
            const payload: any = { ...data, action: 'updateNews', sheetId: SHEET_ID };
            
            // Ensure imageUrls is a string representation if present
            if (Array.isArray(payload.imageUrls)) {
                payload.imageUrls = payload.imageUrls.join(',');
            }

            // Handle Images with Compression
            payload.newImages = [];
            if (files.newImageFiles && files.newImageFiles.length > 0) {
                for (const file of files.newImageFiles) {
                     const processed = await processFile(file);
                     payload.newImages.push({
                        data: processed.data,
                        name: processed.name
                    });
                }
            }
             
            // Handle Attachment
            if (files.newAttachmentFile) {
                const processed = await processFile(files.newAttachmentFile);
                payload.attachmentFile = processed.data;
                payload.attachmentFileName = processed.name;
            }

            const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
            const result = await res.json();
            if (result.status !== 'success') throw new Error(result.message);
            await fetchData();
            return true;
        } catch (error) {
            console.error('Failed to update news:', error);
            alert(`เกิดข้อผิดพลาด: ${error.message}`);
            return false;
        }
    };

    const handleDeleteNews = async (id: string): Promise<boolean> => {
        try {
            const payload = {
                action: 'deleteNews',
                sheetId: SHEET_ID,
                id: id
            };
            
            const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
            const result = await res.json();
            if (result.status !== 'success') throw new Error(result.message);
            await fetchData();
            return true;
        } catch (error) {
            console.error('Failed to delete news:', error);
            alert(`เกิดข้อผิดพลาด: ${error.message}`);
            return false;
        }
    };

  
    const handleSaveEvaluation = async (evaluationData: Partial<Evaluation>): Promise<boolean> => {
      try {
          const payload: any = { ...evaluationData, action: evaluationData.id ? 'updateEvaluation' : 'addEvaluation', sheetId: SHEET_ID };
          
          if (payload.section1) payload.section1 = JSON.stringify(payload.section1);
          if (payload.section2) payload.section2 = JSON.stringify(payload.section2);
          if (payload.section3) payload.section3 = JSON.stringify(payload.section3);

          const response = await fetch(SCRIPT_URL, {
              method: 'POST',
              body: JSON.stringify(payload),
          });

          if (!response.ok) throw new Error(`Network error`);
          
          const result = await response.json();
          if (result.status !== 'success') throw new Error(result.message);

          alert('บันทึกผลการประเมินเรียบร้อยแล้ว');
          await fetchData();
          handleNavigate('home');
          return true;
      } catch (error) {
          console.error('Failed to save evaluation:', error);
          alert(`เกิดข้อผิดพลาดในการบันทึกผลประเมิน: ${error.message}`);
          return false;
      }
    };

    const handleUpdateConfig = async (newConfig: SystemConfig): Promise<boolean> => {
        try {
            const payload = { ...newConfig, action: 'updateSettings', sheetId: SHEET_ID };
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            if (result.status === 'success') {
                setSystemConfig(newConfig);
                alert('บันทึกการตั้งค่าเรียบร้อยแล้ว');
                return true;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error("Failed to update settings", error);
            alert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
            return false;
        }
    };

  const renderContent = () => {
    if (isLoading && !['apply', 'admin', 'evaluate', 'check', 'news'].includes(currentPage)) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    switch (currentPage) {
      case 'home': return <Dashboard onApplyClick={() => handleNavigate('apply')} onNavigate={handleNavigate} newsItems={news} students={students} />;
      case 'apply': return <RegistrationForm config={systemConfig} onAddStudent={handleAddStudent} onUpdateStudent={handleUpdateStudentWithFiles} existingStudents={students} />;
      case 'evaluate': {
        if (user?.role === 'admin') {
          return <EvaluationPage user={user} students={students} initialStudentId={searchParam} onSaveEvaluation={handleSaveEvaluation} evaluations={evaluations} />;
        } else {
          if (searchParam) {
            return <EvaluationPage user={user} students={students} initialStudentId={searchParam} onSaveEvaluation={handleSaveEvaluation} evaluations={evaluations} />;
          }
          return <EvaluationAuth students={students} onNavigate={handleNavigate} />;
        }
      }
      case 'check': return <StatusCheck initialId={searchParam} students={students} onEdit={handleEditStudent} onDelete={handleDeleteStudent} evaluations={evaluations} />;
      case 'news': return <NewsPage newsItems={news} onNavigate={handleNavigate} />;
      case 'news-detail': {
          const newsId = searchParam;
          const item = news.find(n => String(n.id).trim() === String(newsId).trim());
          return <NewsDetail newsItem={item} onNavigate={handleNavigate} />;
      }
      case 'admin':
        if (user?.role === 'admin') {
          return <AdminPanel 
                    config={systemConfig} onUpdateConfig={handleUpdateConfig} 
                    students={students} onEditStudent={handleEditStudent} onDeleteStudent={handleDeleteStudent}
                    news={news} onAddNews={handleAddNews} onUpdateNews={handleUpdateNews} onDeleteNews={handleDeleteNews}
                    evaluations={evaluations}
                    onUpdateStudentStatus={handleUpdateStudentStatus}
                    onNavigate={handleNavigate}
                 />;
        } else {
          return (
            <div className="text-center py-20">
               <h2 className="text-2xl text-red-500 font-bold">Access Denied</h2>
               <p className="text-gray-500">กรุณาเข้าสู่ระบบก่อนใช้งานส่วนนี้</p>
               <button onClick={() => setShowLogin(true)} className="mt-4 text-blue-600 underline font-medium">เข้าสู่ระบบ</button>
            </div>
          );
        }
      default: return <Dashboard onApplyClick={() => handleNavigate('apply')} onNavigate={handleNavigate} newsItems={news} students={students} />;
    }
  };

  return (
    <>
      <Layout 
        user={user} currentPage={currentPage} onNavigate={handleNavigate}
        onLoginClick={() => setShowLogin(true)} onLogout={handleLogout}>
        {renderContent()}
      </Layout>
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onLogin={handleLogin}/>
      <EditStudentModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        student={editingStudent}
        config={systemConfig}
        onUpdateStudent={handleUpdateStudentWithFiles}
        evaluations={evaluations}
        students={students}
      />
    </>
  );
};

export default App;