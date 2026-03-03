import React, { useState } from 'react';
import { Student } from '../types.ts';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

interface BulkExporterProps {
  students: Student[];
}

export const BulkExporter: React.FC<BulkExporterProps> = ({ students }) => {
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);

  const exportToExcel = () => {
    setIsExportingExcel(true);
    try {
      // Prepare data for Excel
      const data = students.map((s, index) => ({
        'ลำดับ': index + 1,
        'วันที่สมัคร': new Date(s.appliedDate).toLocaleDateString('th-TH'),
        'สถานะ': s.status === 'approved' ? 'อนุมัติ' : s.status === 'rejected' ? 'ไม่อนุมัติ' : s.status === 'incomplete' ? 'เอกสารไม่ครบ' : 'รอตรวจสอบ',
        'เลขประจำตัวประชาชน': s.nationalId,
        'คำนำหน้า': s.prefix,
        'ชื่อ': s.firstName,
        'นามสกุล': s.lastName,
        'ชื่อเล่น': s.nickname || '',
        'ระดับชั้นที่สมัคร': s.applyLevel,
        'แผนการเรียน': s.program,
        'วันเกิด': new Date(s.birthDate).toLocaleDateString('th-TH'),
        'เชื้อชาติ': s.ethnicity || '',
        'สัญชาติ': s.nationality || '',
        'ศาสนา': s.religion || '',
        'เบอร์โทรศัพท์': s.phone,
        'ประเภทความพิการ': s.disabilityType || '',
        'ลักษณะความพิการ': s.disabilityDescription || '',
        'ชื่อบิดา': `${s.fatherPrefix || ''} ${s.fatherFirstName || ''} ${s.fatherLastName || ''}`.trim(),
        'เบอร์โทรบิดา': s.fatherPhone || '',
        'ชื่อมารดา': `${s.motherPrefix || ''} ${s.motherFirstName || ''} ${s.motherLastName || ''}`.trim(),
        'เบอร์โทรมารดา': s.motherPhone || '',
        'ชื่อผู้ปกครอง': `${s.guardianPrefix || ''} ${s.guardianFirstName || ''} ${s.guardianLastName || ''}`.trim(),
        'ความสัมพันธ์ผู้ปกครอง': s.guardianRelation || '',
        'เบอร์โทรผู้ปกครอง': s.guardianPhone || '',
        'ที่อยู่': `${s.addressHouseNumber || ''} ม.${s.addressMoo || ''} ${s.addressVillage || ''} ${s.addressStreet || ''} ต.${s.addressSubdistrict || ''} อ.${s.addressDistrict || ''} จ.${s.addressProvince || ''} ${s.addressZipcode || ''}`.trim(),
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "รายชื่อผู้สมัคร");
      
      // Auto-size columns
      const maxWidths = data.reduce((acc: any, row: any) => {
        Object.keys(row).forEach((key, i) => {
          const val = row[key] ? row[key].toString() : '';
          acc[i] = Math.max(acc[i] || 0, val.length, key.length);
        });
        return acc;
      }, []);
      worksheet['!cols'] = maxWidths.map((w: number) => ({ w: w + 2 }));

      XLSX.writeFile(workbook, `ข้อมูลการสมัครทั้งหมด_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error("Excel Export Error:", error);
      alert("เกิดข้อผิดพลาดในการส่งออก Excel");
    } finally {
      setIsExportingExcel(false);
    }
  };

  const exportToWord = async () => {
    setIsExportingWord(true);
    try {
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: "รายชื่อนักเรียนที่สมัครเข้าเรียน",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                text: `ข้อมูล ณ วันที่ ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              }),
              new Table({
                width: {
                  size: 100,
                  type: WidthType.PERCENTAGE,
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ text: "ลำดับ", alignment: AlignmentType.CENTER, style: "Strong" })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                      new TableCell({ children: [new Paragraph({ text: "ชื่อ-นามสกุล", alignment: AlignmentType.CENTER, style: "Strong" })], width: { size: 40, type: WidthType.PERCENTAGE } }),
                      new TableCell({ children: [new Paragraph({ text: "ระดับชั้น", alignment: AlignmentType.CENTER, style: "Strong" })], width: { size: 25, type: WidthType.PERCENTAGE } }),
                      new TableCell({ children: [new Paragraph({ text: "สถานะ", alignment: AlignmentType.CENTER, style: "Strong" })], width: { size: 25, type: WidthType.PERCENTAGE } }),
                    ],
                  }),
                  ...students.map((s, i) => new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ text: (i + 1).toString(), alignment: AlignmentType.CENTER })] }),
                      new TableCell({ children: [new Paragraph({ text: `${s.prefix}${s.firstName} ${s.lastName}` })] }),
                      new TableCell({ children: [new Paragraph({ text: s.applyLevel, alignment: AlignmentType.CENTER })] }),
                      new TableCell({ children: [new Paragraph({ text: s.status === 'approved' ? 'อนุมัติ' : s.status === 'rejected' ? 'ไม่อนุมัติ' : s.status === 'incomplete' ? 'เอกสารไม่ครบ' : 'รอตรวจสอบ', alignment: AlignmentType.CENTER })] }),
                    ],
                  })),
                ],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `รายชื่อนักเรียนที่สมัคร_${new Date().toISOString().split('T')[0]}.docx`);
    } catch (error) {
      console.error("Word Export Error:", error);
      alert("เกิดข้อผิดพลาดในการส่งออก Word");
    } finally {
      setIsExportingWord(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={exportToExcel}
        disabled={isExportingExcel || students.length === 0}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all shadow-sm disabled:opacity-50"
      >
        {isExportingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
        เอ็กซ์พอร์ต Excel (ข้อมูลทั้งหมด)
      </button>
      <button
        onClick={exportToWord}
        disabled={isExportingWord || students.length === 0}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all shadow-sm disabled:opacity-50"
      >
        {isExportingWord ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        เอ็กซ์พอร์ต Word (รายชื่อ)
      </button>
    </div>
  );
};
