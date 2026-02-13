

export interface Student {
  id: string; // System-generated
  nationalId: string;
  prefix: string;
  firstName: string;
  lastName:string;
  nickname?: string;
  birthDate: string;
  
  // New General Info
  ethnicity?: string;
  nationality?: string;
  religion?: string;
  childOrder?: number;
  siblingsCount?: number;
  siblingsMale?: number;
  siblingsFemale?: number;
  hasDisabilityId?: boolean;
  disabilityId?: string;
  disabilityType?: string;
  disabilityDescription?: string;
  medicalCondition?: string;
  bloodType?: string;
  
  // Parent Info
  fatherPrefix?: string;
  fatherFirstName?: string;
  fatherLastName?: string;
  fatherAge?: number;
  fatherOccupation?: string;
  fatherEducation?: string;
  fatherNationalId?: string;
  fatherIncome?: number;
  fatherPhone?: string;

  motherPrefix?: string;
  motherFirstName?: string;
  motherLastName?: string;
  motherAge?: number;
  motherOccupation?: string;
  motherEducation?: string;
  motherNationalId?: string;
  motherIncome?: number;
  motherPhone?: string;

  // Guardian Info (if different)
  isGuardianParent?: boolean;
  guardianPrefix?: string;
  guardianFirstName?: string;
  guardianLastName?: string;
  guardianAge?: number;
  guardianOccupation?: string;
  guardianEducation?: string;
  guardianNationalId?: string;
  guardianIncome?: number;
  guardianPhone?: string;
  guardianRelation?: string;
  
  // Marital Status
  maritalStatus?: string; // e.g., 'livingTogether', 'divorced', etc.

  // Address
  addressHouseNumber?: string;
  addressMoo?: string;
  addressVillage?: string;
  addressStreet?: string;
  addressSubdistrict?: string;
  addressDistrict?: string;
  addressProvince?: string;
  addressZipcode?: string;
  addressPhone?: string;
  
  // Living situation
  studentLivesWith?: string;
  studentLivesWithRelation?: string;
  studentLivesWithPhone?: string;

  // Education
  previousSchool: string;
  gpa: number;
  hasStudiedBefore?: boolean;
  reasonForNotStudying?: string;
  previousEducationLevel?: string;
  previousEducationYear?: string;

  // Application Details
  applyLevel: string;
  program: string;
  
  // System Fields
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: string;
  rejectionReason?: string;
  adminNotes?: string;
  phone: string; // Kept for simplicity from old form, can be merged

  // File Attachments
  fileStudentPhoto?: string;
  fileStudentHouseReg?: string;
  fileBirthCertificate?: string;
  fileStudentIdCard?: string;
  fileDisabilityCard?: string;
  fileFatherIdCard?: string;
  fileMotherIdCard?: string;
  fileGuardianIdCard?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'announcement' | 'news';
  imageUrls?: string[];
  videoUrl?: string;
  fileUrl?: string;
  fileName?: string;
}

export interface SystemConfig {
  isOpen: boolean; // Keep as a master override if needed
  startDate?: string; // ISO DateTime string
  endDate?: string;   // ISO DateTime string
  academicYear: string;
  announcementText: string;
}

export interface User {
  username: string;
  role: 'admin' | 'user';
  name: string;
}

// Evaluation System Types
export type EvaluationScore = 'good' | 'fair' | 'needs_improvement';

export interface EvaluationSection {
  scores: (EvaluationScore | null)[];
  remarks: (string | '')[];
}

export interface Evaluation {
  id: string; // Will be studentId-evaluatorRole-timestamp
  studentId: string;
  studentName: string; // For display
  evaluatorName: string;
  evaluatorRole: 'teacher' | 'parent';
  evaluatorPosition?: string;
  evaluationDate: string;
  section1: EvaluationSection;
  section2: EvaluationSection;
  section3: EvaluationSection;
}