import React, { useState } from 'react';
import { Home, UserPlus, Settings, LogIn, Search, School, LogOut, FileText, Menu, X, BarChart, Newspaper } from 'lucide-react';
import { User } from '../types.ts';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onNavigate: (page: string) => void;
  currentPage: string;
  onLoginClick: () => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onNavigate, currentPage, onLoginClick, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchId, setSearchId] = useState('');

  const navItems = [
    { id: 'home', label: 'หน้าหลัก', icon: Home },
    { id: 'apply', label: 'สมัครเรียน', icon: UserPlus },
    { id: 'check', label: 'ตรวจสอบสถานะ', icon: FileText },
    { id: 'news', label: 'ข่าวสาร', icon: Newspaper },
    { id: 'evaluate', label: 'ประเมินนักเรียน', icon: BarChart },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'ตั้งค่าระบบ', icon: Settings });
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      onNavigate(`check?id=${searchId}`);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Header Blue Bar */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
             <img src="https://img2.pic.in.th/channels4_profile-removebg-preview.png" alt="School Logo" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-lg font-bold leading-tight">ระบบรับสมัครนักเรียนออนไลน์</h1>
              <p className="text-xs text-blue-100">โรงเรียนกาฬสินธุ์ปัญญานุกูล</p>
            </div>
          </div>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-blue-300" />
              <input 
                type="text" 
                placeholder="ตรวจสอบข้อมูลด้วยเลขบัตรประชาชน..."
                className="w-full bg-blue-800/50 border border-blue-500/30 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
            </form>
          </div>

          <div className="hidden md:flex items-center gap-4">
             {user ? (
               <div className="flex items-center gap-3">
                 <span className="text-sm font-medium">สวัสดี, {user.name}</span>
                 <button 
                  onClick={onLogout}
                  className="flex items-center gap-1 bg-red-500/20 hover:bg-red-500/30 px-3 py-1.5 rounded-lg text-sm transition-colors border border-red-400/30"
                >
                  <LogOut className="w-4 h-4" />
                  ออกจากระบบ
                </button>
               </div>
             ) : (
                <button 
                  onClick={onLoginClick}
                  className="flex items-center gap-2 hover:bg-white/10 px-3 py-1.5 rounded-lg text-sm transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  เข้าสู่ระบบ
                </button>
             )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
             {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Navigation Tabs (Sub-header) */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40 hidden md:block">
        <div className="container mx-auto px-4">
          <nav className="flex gap-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors ${
                  currentPage.startsWith(item.id)
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-xl z-50">
           <div className="p-4 space-y-4">
             <form onSubmit={handleSearch} className="relative w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="เลขบัตรประชาชน..."
                  className="w-full bg-gray-100 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                />
              </form>
              <nav className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { onNavigate(item.id); setIsMobileMenuOpen(false); }}
                    className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium ${
                      currentPage.startsWith(item.id) ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
                <div className="border-t pt-2 mt-2">
                  {user ? (
                     <button onClick={() => { onLogout(); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 text-red-600 w-full text-left text-sm font-medium">
                        <LogOut className="w-5 h-5" /> ออกจากระบบ
                     </button>
                  ) : (
                    <button onClick={() => { onLoginClick(); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 text-blue-600 w-full text-left text-sm font-medium">
                        <LogIn className="w-5 h-5" /> ผู้ดูแลระบบ
                     </button>
                  )}
                </div>
              </nav>
           </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
         <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
            <img src="https://img2.pic.in.th/channels4_profile-removebg-preview.png" alt="School Logo" className="w-16 h-16 mx-auto mb-4 opacity-80" />
            <p className="font-medium text-gray-700 mb-2">โรงเรียนกาฬสินธุ์ปัญญานุกูล</p>
            <p>169 หมู่ 13 ตำบล ดอนสมบูรณ์ อำเภอ ยางตลาด จังหวัด กาฬสินธุ์ 46120</p>
            <p className="mt-4 text-xs text-gray-400">© 2024 Kalasin Panyanukul School. พัฒนาโดย nanthaphat sangsudta.</p>
         </div>
      </footer>
    </div>
  );
};

export default Layout;