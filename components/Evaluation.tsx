import React, { useState, useEffect, useMemo } from 'react';
import { User, Student, Evaluation, EvaluationScore, EvaluationSection } from '../types.ts';
import { EVALUATION_QUESTIONS } from '../constants.tsx';
import { Users, ChevronDown, Save, BarChart3, Star, Check, AlertTriangle } from 'lucide-react';
import { LoadingOverlay } from './LoadingOverlay.tsx';

// FIX: Made children prop optional to resolve 'Property 'children' is missing' error.
const FormSection = ({ title, icon: Icon, children, initiallyOpen = true }: { title: string, icon: React.ElementType, children?: React.ReactNode, initiallyOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full bg-slate-50/50 hover:bg-slate-100/70 px-6 py-4 border-b border-gray-100 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3"><Icon className="w-5 h-5 text-blue-600" /><span className="font-semibold text-blue-900">{title}</span></div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
      </button>
      {isOpen && <div className="p-1 md:p-2 animate-fade-in-fast">{children}</div>}
    </div>
  );
};

const RadioInput = ({ name, value, checked, onChange, label, color }: { name: string, value: EvaluationScore, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, label: string, color: string }) => (
    <label className={`inline-flex items-center justify-center text-center px-3 py-1.5 rounded-lg cursor-pointer transition-all border-2 ${checked ? `${color} text-white` : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
        <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
        <span className="text-xs font-semibold">{label}</span>
    </label>
);

// FIX: Extracted prop types to a separate type alias to fix issue with 'key' prop in map function.
type EvaluationRowProps = { index: number, question: string, score: EvaluationScore | null, remark: string, onScoreChange: (index: number, score: EvaluationScore) => void, onRemarkChange: (index: number, remark: string) => void };
// FIX: Removed explicit prop type to avoid 'key' prop conflict with linter/TS.
const EvaluationRow = ({ index, question, score, remark, onScoreChange, onRemarkChange }: any) => (
    <div className={`grid grid-cols-12 gap-2 items-center p-3 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}`}>
        <div className="col-span-12 md:col-span-5 flex gap-2">
            <span className="text-slate-400 text-sm font-medium w-6 text-right">{index + 1}.</span>
            <p className="text-sm text-gray-700">{question}</p>
        </div>
        <div className="col-span-12 md:col-span-4">
            <div className="grid grid-cols-3 gap-1.5">
                <RadioInput name={`q-${index}`} value="good" checked={score === 'good'} onChange={(e) => onScoreChange(index, e.target.value as EvaluationScore)} label="ดี" color="bg-green-500 border-green-500" />
                <RadioInput name={`q-${index}`} value="fair" checked={score === 'fair'} onChange={(e) => onScoreChange(index, e.target.value as EvaluationScore)} label="พอใช้" color="bg-yellow-500 border-yellow-500" />
                <RadioInput name={`q-${index}`} value="needs_improvement" checked={score === 'needs_improvement'} onChange={(e) => onScoreChange(index, e.target.value as EvaluationScore)} label="ควรพัฒนา" color="bg-red-500 border-red-500" />
            </div>
        </div>
        <div className="col-span-12 md:col-span-3">
            <input type="text" placeholder="หมายเหตุ..." value={remark} onChange={(e) => onRemarkChange(index, e.target.value)} className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-colors" />
        </div>
    </div>
);

const SummaryBox = ({ title, value, icon: Icon, color }: { title: string, value: number, icon: React.ElementType, color: string }) => (
    <div className="bg-white rounded-xl border p-4 text-center">
        <Icon className={`w-8 h-8 mx-auto mb-2 ${color}`} />
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-xs font-medium text-gray-500">{title}</p>
    </div>
);


export const EvaluationPage = ({ user, students, initialStudentId, onSaveEvaluation, evaluations }: { user: User | null, students: Student[], initialStudentId?: string, onSaveEvaluation: (evaluation: Partial<Evaluation>) => Promise<boolean>, evaluations: Evaluation[] }) => {
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [evaluatorRole, setEvaluatorRole] = useState<'teacher' | 'parent'>('teacher');
    const [evaluatorName, setEvaluatorName] = useState('');
    const [evaluatorPosition, setEvaluatorPosition] = useState('');
    const [existingEvalId, setExistingEvalId] = useState<string | null>(null);
    
    const createInitialSection = (size: number): EvaluationSection => ({ scores: Array(size).fill(null), remarks: Array(size).fill('') });
    
    const [section1, setSection1] = useState<EvaluationSection>(createInitialSection(EVALUATION_QUESTIONS.section1.items.length));
    const [section2, setSection2] = useState<EvaluationSection>(createInitialSection(EVALUATION_QUESTIONS.section2.items.length));
    const [section3, setSection3] = useState<EvaluationSection>(createInitialSection(EVALUATION_QUESTIONS.section3.items.length));
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialStudentId) {
            const student = students.find(s => s.nationalId === initialStudentId);
            if (student) {
                setSelectedStudentId(student.id);
            }
        } else if (students.length > 0) {
            setSelectedStudentId(students[0].id);
        }
    }, [initialStudentId, students]);

    useEffect(() => {
        if (selectedStudentId && evaluatorRole) {
            const existingEvals = evaluations
                .filter(e => e.studentId === selectedStudentId && e.evaluatorRole === evaluatorRole)
                .sort((a, b) => new Date(b.evaluationDate).getTime() - new Date(a.evaluationDate).getTime());
            
            const latestEval = existingEvals[0];

            if (latestEval) {
                setExistingEvalId(latestEval.id);
                setEvaluatorName(latestEval.evaluatorName);
                setEvaluatorPosition(latestEval.evaluatorPosition || '');
                setSection1(latestEval.section1 || createInitialSection(EVALUATION_QUESTIONS.section1.items.length));
                setSection2(latestEval.section2 || createInitialSection(EVALUATION_QUESTIONS.section2.items.length));
                setSection3(latestEval.section3 || createInitialSection(EVALUATION_QUESTIONS.section3.items.length));
            } else {
                 setExistingEvalId(null);
                 setEvaluatorName('');
                 setEvaluatorPosition('');
                 setSection1(createInitialSection(EVALUATION_QUESTIONS.section1.items.length));
                 setSection2(createInitialSection(EVALUATION_QUESTIONS.section2.items.length));
                 setSection3(createInitialSection(EVALUATION_QUESTIONS.section3.items.length));
            }
        }
    }, [selectedStudentId, evaluatorRole, evaluations]);

    const handleScoreChange = (setter: React.Dispatch<React.SetStateAction<EvaluationSection>>, index: number, score: EvaluationScore) => {
        setter(prev => {
            const newScores = [...prev.scores];
            newScores[index] = score;
            return { ...prev, scores: newScores };
        });
    };

    const handleRemarkChange = (setter: React.Dispatch<React.SetStateAction<EvaluationSection>>, index: number, remark: string) => {
        setter(prev => {
            const newRemarks = [...prev.remarks];
            newRemarks[index] = remark;
            return { ...prev, remarks: newRemarks };
        });
    };

    const calculateSummary = (scores: (EvaluationScore | null)[]) => {
        return scores.reduce((acc, score) => {
            if (score === 'good') acc.good++;
            else if (score === 'fair') acc.fair++;
            else if (score === 'needs_improvement') acc.needs_improvement++;
            return acc;
        }, { good: 0, fair: 0, needs_improvement: 0 });
    };

    const summary1 = useMemo(() => calculateSummary(section1.scores), [section1]);
    const summary2 = useMemo(() => calculateSummary(section2.scores), [section2]);
    const summary3 = useMemo(() => calculateSummary(section3.scores), [section3]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentId || !evaluatorName) {
            alert('กรุณาเลือกนักเรียนและกรอกชื่อผู้ประเมิน');
            return;
        }
        
        setIsSubmitting(true);
        const selectedStudent = students.find(s => s.id === selectedStudentId);
        
        const evaluationData: Partial<Evaluation> = {
            id: existingEvalId || undefined,
            studentId: selectedStudentId,
            studentName: `${selectedStudent?.firstName} ${selectedStudent?.lastName}`,
            evaluatorName,
            evaluatorRole,
            evaluatorPosition: evaluatorRole === 'teacher' ? evaluatorPosition : undefined,
            evaluationDate: new Date().toISOString(),
            section1,
            section2,
            section3
        };

        const success = await onSaveEvaluation(evaluationData);
        if(!success) {
            setIsSubmitting(false);
        }
    };
    
    const selectedStudent = students.find(s => s.id === selectedStudentId);

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <LoadingOverlay isOpen={isSubmitting} message="กำลังบันทึกผลการประเมิน กรุณารอสักครู่..." />
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">แบบประเมินความสามารถพื้นฐาน</h2>
                <p className="text-gray-500">สำหรับนักเรียนโรงเรียนกาฬสินธุ์ปัญญานุกูล</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">เลือกนักเรียน</label>
                        <select
                          value={selectedStudentId || ''}
                          onChange={(e) => setSelectedStudentId(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-colors bg-white text-sm"
                          disabled={!!initialStudentId && user?.role !== 'admin'}
                        >
                            {students.map(s => <option key={s.id} value={s.id}>{s.prefix}{s.firstName} {s.lastName} ({s.nationalId})</option>)}
                        </select>
                         {selectedStudent && <p className="text-xs text-gray-500 mt-2">นักเรียนที่เลือก: <span className="font-semibold text-blue-700">{selectedStudent.prefix}{selectedStudent.firstName} {selectedStudent.lastName}</span></p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">บทบาทผู้ประเมิน</label>
                        <div className="flex gap-2 rounded-lg bg-gray-100 p-1">
                           <button type="button" onClick={() => setEvaluatorRole('teacher')} className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${evaluatorRole === 'teacher' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}>ครู</button>
                           <button type="button" onClick={() => setEvaluatorRole('parent')} className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${evaluatorRole === 'parent' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}>ผู้ปกครอง</button>
                        </div>
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อผู้ประเมิน</label>
                        <input type="text" placeholder="กรอกชื่อ-นามสกุล" value={evaluatorName} onChange={e => setEvaluatorName(e.target.value)} required className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-colors text-sm"/>
                    </div>
                     {evaluatorRole === 'teacher' && (
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">ตำแหน่ง</label>
                            <input type="text" placeholder="เช่น ครูประจำชั้น" value={evaluatorPosition} onChange={e => setEvaluatorPosition(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-colors text-sm"/>
                        </div>
                     )}
                </div>

                <FormSection title={EVALUATION_QUESTIONS.section1.title} icon={BarChart3}>
                    {EVALUATION_QUESTIONS.section1.items.map((q, i) => <EvaluationRow key={i} index={i} question={q} score={section1.scores[i]} remark={section1.remarks[i]} onScoreChange={(idx, s) => handleScoreChange(setSection1, idx, s)} onRemarkChange={(idx, r) => handleRemarkChange(setSection1, idx, r)} />)}
                     <div className="p-4 bg-slate-50 border-t mt-2">
                        <h4 className="font-semibold text-sm mb-3 text-gray-600">สรุปผลการประเมิน</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <SummaryBox title="ดี" value={summary1.good} icon={Star} color="text-green-500" />
                            <SummaryBox title="พอใช้" value={summary1.fair} icon={Check} color="text-yellow-500" />
                            <SummaryBox title="ควรพัฒนา" value={summary1.needs_improvement} icon={AlertTriangle} color="text-red-500" />
                        </div>
                    </div>
                </FormSection>
                <FormSection title={EVALUATION_QUESTIONS.section2.title} icon={BarChart3} initiallyOpen={false}>
                    {EVALUATION_QUESTIONS.section2.items.map((q, i) => <EvaluationRow key={i} index={i} question={q} score={section2.scores[i]} remark={section2.remarks[i]} onScoreChange={(idx, s) => handleScoreChange(setSection2, idx, s)} onRemarkChange={(idx, r) => handleRemarkChange(setSection2, idx, r)} />)}
                     <div className="p-4 bg-slate-50 border-t mt-2">
                        <h4 className="font-semibold text-sm mb-3 text-gray-600">สรุปผลการประเมิน</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <SummaryBox title="ดี" value={summary2.good} icon={Star} color="text-green-500" />
                            <SummaryBox title="พอใช้" value={summary2.fair} icon={Check} color="text-yellow-500" />
                            <SummaryBox title="ควรพัฒนา" value={summary2.needs_improvement} icon={AlertTriangle} color="text-red-500" />
                        </div>
                    </div>
                </FormSection>
                <FormSection title={EVALUATION_QUESTIONS.section3.title} icon={BarChart3} initiallyOpen={false}>
                    {EVALUATION_QUESTIONS.section3.items.map((q, i) => <EvaluationRow key={i} index={i} question={q} score={section3.scores[i]} remark={section3.remarks[i]} onScoreChange={(idx, s) => handleScoreChange(setSection3, idx, s)} onRemarkChange={(idx, r) => handleRemarkChange(setSection3, idx, r)} />)}
                     <div className="p-4 bg-slate-50 border-t mt-2">
                        <h4 className="font-semibold text-sm mb-3 text-gray-600">สรุปผลการประเมิน</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <SummaryBox title="ดี" value={summary3.good} icon={Star} color="text-green-500" />
                            <SummaryBox title="พอใช้" value={summary3.fair} icon={Check} color="text-yellow-500" />
                            <SummaryBox title="ควรพัฒนา" value={summary3.needs_improvement} icon={AlertTriangle} color="text-red-500" />
                        </div>
                    </div>
                </FormSection>

                 <div className="flex justify-end pt-4">
                    <button type="submit" disabled={isSubmitting || !selectedStudentId} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed">
                    <Save className="w-5 h-5" />{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกผลการประเมิน'}
                    </button>
                </div>
            </form>
        </div>
    )
}