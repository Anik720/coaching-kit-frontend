"use client";

import { useState, useEffect, useRef } from 'react';
import {
  AdmissionType,
  Gender,
  Religion,
  StudentStatus,
  CreateStudentDto,
  StudentBatch,
  BatchSubject,
} from '@/api/studentApi/types/student.types';
import styles from './CreateStudentModal.module.css';
import { subjectsFromBatchEntry } from '@/utils/batchSubjectsFromApi';

interface ClassForDropdown {
  _id: string;
  classname: string;
}

interface CreateStudentModalProps {
  onClose: () => void;
  onCreate: (studentData: CreateStudentDto) => Promise<void>;
  onSaveDraft?: (studentData: CreateStudentDto) => Promise<void>;
  loading?: boolean;
  classes?: ClassForDropdown[];
  fetchBatchesByClass?: (classId: string) => Promise<any>;
}

const BOARDS = [
  'Dhaka Board', 'Rajshahi Board', 'Comilla Board', 'Jessore Board',
  'Chittagong Board', 'Barisal Board', 'Sylhet Board', 'Dinajpur Board',
  'Mymensingh Board', 'Bangladesh Madrasah Education Board',
  'Bangladesh Technical Education Board',
];

const EXAMINATIONS = [
  'SSC (Secondary School Certificate)', 'HSC (Higher Secondary Certificate)',
  'Dakhil (SSC সমমান)', 'Alim (HSC সমমান)', 'Fazil', 'Kamil',
  'SSC Vocational', 'HSC Vocational', 'Diploma in Engineering',
  'Diploma in Textile', 'Trade Course / Certificate Course',
];

const EXAM_YEARS = Array.from({ length: 100 }, (_, i) => String(2000 + i));

const generateRegistrationId = () => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `STU-${year}-${randomNum}`;
};

export default function CreateStudentModal({
  onClose,
  onCreate,
  onSaveDraft,
  loading = false,
  classes = [],
  fetchBatchesByClass,
}: CreateStudentModalProps) {
  const [formData, setFormData] = useState<CreateStudentDto & {
    fathersName: string;
    nameNative: string;
    tuitionFee: number;
    paymentInstallment: string | number;
    lastExamBoard: string;
    lastExamName: string;
    lastExamYear: string;
    lastExamResult: string;
    localGuardianMobileNumber: string;
  }>({
    registrationId: generateRegistrationId(),
    class: '',
    batch: '',
    nameEnglish: '',
    nameNative: '',
    dateOfBirth: '',
    gender: Gender.MALE,
    religion: Religion.ISLAM,
    presentAddress: '',
    fatherName: '',
    fatherMobileNumber: '',
    fathersName: '',
    admissionType: AdmissionType.MONTHLY,
    admissionFee: 0,
    monthlyTuitionFee: 0,
    tuitionFee: 0,
    courseFee: 0,
    totalAmount: 0,
    paidAmount: 0,
    admissionDate: new Date().toISOString().split('T')[0],
    status: StudentStatus.ACTIVE,
    isActive: true,
    instituteName: '',
    subunitCategory: '',
    studentMobileNumber: '',
    whatsappMobile: '',
    permanentAddress: '',
    motherName: '',
    motherMobileNumber: '',
    localGuardianMobileNumber: '',
    referredBy: '',
    remarks: '',
    batches: [] as StudentBatch[],
    paymentInstallment: '',
    lastExamBoard: '',
    lastExamName: '',
    lastExamYear: '',
    lastExamResult: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  useEffect(() => {
    const loadBatches = async () => {
      if (!selectedClass || !fetchBatchesByClass) {
        setAvailableBatches([]);
        return;
      }
      setLoadingBatches(true);
      try {
        const batches = await fetchBatchesByClass(selectedClass);
        const safeBatches = Array.isArray(batches) ? batches : (batches as any)?.data || [];
        setAvailableBatches(safeBatches);
      } catch {
        setAvailableBatches([]);
      } finally {
        setLoadingBatches(false);
      }
    };
    loadBatches();
  }, [selectedClass, fetchBatchesByClass]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value } as typeof formData;
      if (field === 'admissionType') {
        if (value === AdmissionType.COURSE) {
          updated.admissionFee = 0;
          updated.monthlyTuitionFee = 0;
          updated.tuitionFee = 0;
          updated.paymentInstallment = '';
        } else {
          updated.courseFee = 0;
          updated.paymentInstallment = '';
        }
      }
      return updated;
    });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    setFormData(prev => ({ ...prev, class: classId, batches: [] }));
    setAvailableBatches([]);
  };

  const handleBatchToggle = (batch: any) => {
    setFormData(prev => {
      const isSelected = prev.batches?.some(b => b.batch === batch._id);
      let newBatches: StudentBatch[];

      if (isSelected) {
        newBatches = prev.batches?.filter(b => b.batch !== batch._id) || [];
      } else {
        const batchSubjects = subjectsFromBatchEntry(batch);
        const autoSubjects: BatchSubject[] = batchSubjects.map(s => ({ subjectId: s._id, subjectName: s.subjectName }));
        const newBatch: StudentBatch = {
          batch: batch._id,
          batchName: batch.batchName,
          batchId: batch.batchId,
          subjects: autoSubjects,
          admissionFee: batch.admissionFee || 0,
          tuitionFee: batch.tuitionFee || 0,
          courseFee: batch.courseFee || 0,
        };
        newBatches = [...(prev.batches || []), newBatch];
      }

      const totalAdmissionFee = newBatches.reduce((s, b) => s + (b.admissionFee || 0), 0);
      const totalTuitionFee = newBatches.reduce((s, b) => s + (b.tuitionFee || 0), 0);
      const totalCourseFee = newBatches.reduce((s, b) => s + (b.courseFee || 0), 0);

      return {
        ...prev,
        batches: newBatches,
        admissionFee: totalAdmissionFee,
        monthlyTuitionFee: totalTuitionFee,
        tuitionFee: totalTuitionFee,
        courseFee: totalCourseFee,
      };
    });
  };

  const handleSubjectToggle = (batchId: string, subject: any) => {
    setFormData(prev => {
      const updatedBatches = (prev.batches || []).map(b => {
        if (b.batch === batchId) {
          const isSelected = b.subjects.some(s => s.subjectId === subject._id);
          const newSubjects = isSelected
            ? b.subjects.filter(s => s.subjectId !== subject._id)
            : [...b.subjects, { subjectId: subject._id, subjectName: subject.subjectName }];
          return { ...b, subjects: newSubjects };
        }
        return b;
      });
      return { ...prev, batches: updatedBatches };
    });
  };

  // Auto-calculate total
  useEffect(() => {
    const total = formData.admissionType === AdmissionType.MONTHLY
      ? (formData.admissionFee || 0) + (formData.monthlyTuitionFee || formData.tuitionFee || 0)
      : (formData.courseFee || 0);
    setFormData(prev => ({ ...prev, totalAmount: total }));
  }, [formData.admissionFee, formData.monthlyTuitionFee, formData.tuitionFee, formData.courseFee, formData.admissionType]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!(formData.class ?? '').trim()) newErrors.class = 'Class is required';
    if (!formData.batches || formData.batches.length === 0) newErrors.batches = 'At least one batch is required';
    if (!(formData.nameEnglish ?? '').trim()) newErrors.nameEnglish = 'Student name is required';
    if (!(formData.fatherName ?? '').trim()) newErrors.fatherName = "Father's name is required";
    if (!(formData.instituteName ?? '').trim()) newErrors.instituteName = 'Institute name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!(formData.presentAddress ?? '').trim()) newErrors.presentAddress = 'Present address is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const payload: CreateStudentDto = {
      ...formData,
      fatherName: formData.fatherName || formData.fathersName,
      monthlyTuitionFee: formData.monthlyTuitionFee || formData.tuitionFee,
      localGuardianMobileNumber: formData.localGuardianMobileNumber || undefined,
      paymentInstallment: formData.paymentInstallment ? Number(formData.paymentInstallment) : undefined,
      lastExamBoard: formData.lastExamBoard || undefined,
      lastExamName: formData.lastExamName || undefined,
      lastExamYear: formData.lastExamYear || undefined,
      lastExamResult: formData.lastExamResult || undefined,
    };
    try { await onCreate(payload); } catch {}
  };

  const handleSaveDraft = async () => {
    const draftData: CreateStudentDto = { ...formData, status: StudentStatus.PENDING, isActive: false };
    try {
      if (onSaveDraft) await onSaveDraft(draftData);
      else await onCreate(draftData);
    } catch {}
  };

  const safeClasses = Array.isArray(classes) ? classes : [];
  const safeBatches = Array.isArray(availableBatches) ? availableBatches : [];
  const totalFee = formData.admissionType === AdmissionType.MONTHLY
    ? (formData.admissionFee || 0) + (formData.monthlyTuitionFee || formData.tuitionFee || 0)
    : (formData.courseFee || 0);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.modalLarge}`} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Register New Student</h2>
          <button onClick={onClose} className={styles.modalClose} type="button" disabled={loading}>✕</button>
        </div>
        {loading && <div className={styles.modalLoading}><div className={styles.spinnerLarge}></div></div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className={styles.modalBody}>

            {/* Academic Details */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Registration & Academic Details</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label}>Registration ID <span className={styles.required}>*</span></label>
                  <input type="text" value={formData.registrationId} className={`${styles.input}`} readOnly />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Admission Date</label>
                  <input type="date" value={formData.admissionDate} onChange={e => handleChange('admissionDate', e.target.value)} className={styles.input} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Select Class <span className={styles.required}>*</span></label>
                  <select value={selectedClass} onChange={e => handleClassChange(e.target.value)} className={`${styles.input} ${errors.class ? styles.inputError : ''}`} disabled={loading || safeClasses.length === 0}>
                    <option value="">Select the class</option>
                    {safeClasses.map(cls => <option key={cls._id} value={cls._id}>{cls.classname}</option>)}
                  </select>
                  {errors.class && <span className={styles.errorMessage}>{errors.class}</span>}
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Admission Type <span className={styles.required}>*</span></label>
                  <select value={formData.admissionType} onChange={e => handleChange('admissionType', e.target.value)} className={styles.input}>
                    <option value={AdmissionType.MONTHLY}>Monthly</option>
                    <option value={AdmissionType.COURSE}>Course</option>
                  </select>
                </div>

                <div className={styles.formFieldFull} style={{ marginTop: '16px' }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                    <div className={styles.formGrid}>
                      <div className={styles.formFieldFull}>
                        <label className={styles.label}>Select Batches <span className={styles.required}>*</span></label>
                        {!selectedClass ? (
                          <div style={{ color: '#64748b', fontSize: '14px', fontStyle: 'italic', marginTop: '8px' }}>Select class first</div>
                        ) : loadingBatches ? (
                          <div style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>Loading batches...</div>
                        ) : safeBatches.length === 0 ? (
                          <div style={{ color: '#ef4444', fontSize: '14px', marginTop: '8px' }}>No batches available</div>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
                            {safeBatches.filter((b, i, a) => a.findIndex(x => String(x._id) === String(b._id)) === i).map(b => (
                              <label key={b._id} style={{
                                display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                                background: formData.batches?.some(fb => fb.batch === b._id) ? '#ede9fe' : 'white',
                                padding: '10px 14px',
                                border: `2px solid ${formData.batches?.some(fb => fb.batch === b._id) ? '#8b5cf6' : '#cbd5e1'}`,
                                borderRadius: '8px', transition: 'all 0.2s',
                              }}>
                                <input type="checkbox" checked={!!formData.batches?.some(fb => fb.batch === b._id)} onChange={() => handleBatchToggle(b)} style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#8b5cf6' }} />
                                <span style={{ fontSize: '14px', fontWeight: 600, color: formData.batches?.some(fb => fb.batch === b._id) ? '#4c1d95' : '#334155' }}>
                                  {b.batchName} <span style={{ fontWeight: 400, color: '#64748b', fontSize: '12px' }}>({b.sessionYear})</span>
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                        {errors.batches && <span className={styles.errorMessage}>{errors.batches}</span>}
                      </div>

                      {formData.batches && formData.batches.length > 0 && (
                        <div className={styles.formFieldFull} style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                          <label className={styles.label}>Select Subjects</label>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px' }}>
                            {formData.batches.map(batchObj => {
                              const batchEntries = safeBatches.filter(b => String(b._id) === String(batchObj.batch));
                              if (batchEntries.length === 0) return null;
                              const seenIds = new Set<string>();
                              const batchSubjects: Array<{ _id: string; subjectName: string }> = [];
                              batchEntries.forEach(entry => {
                                subjectsFromBatchEntry(entry).forEach(s => {
                                  if (!seenIds.has(s._id)) { seenIds.add(s._id); batchSubjects.push(s); }
                                });
                              });
                              if (batchSubjects.length === 0) return (
                                <div key={batchObj.batch} style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic', padding: '6px 12px', background: '#f1f5f9', borderRadius: '6px' }}>
                                  No subjects for {batchObj.batchName}
                                </div>
                              );
                              return batchSubjects.map(subj => {
                                const isSelected = batchObj.subjects.some(s => String(s.subjectId) === String(subj._id));
                                return (
                                  <label key={`${batchObj.batch}-${subj._id}`} style={{
                                    display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                                    background: isSelected ? '#ede9fe' : 'white',
                                    border: `2px solid ${isSelected ? '#8b5cf6' : '#cbd5e1'}`,
                                    padding: '8px 14px', borderRadius: '24px', transition: 'all 0.2s',
                                  }}>
                                    <input type="checkbox" checked={isSelected} onChange={() => handleSubjectToggle(batchObj.batch, subj)} style={{ cursor: 'pointer', width: '14px', height: '14px', accentColor: '#8b5cf6' }} />
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: isSelected ? '#4c1d95' : '#475569' }}>
                                      {subj.subjectName} <span style={{ fontWeight: 400, opacity: 0.8 }}>({batchObj.batchName})</span>
                                    </span>
                                  </label>
                                );
                              });
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Student Information */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Student Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label}>Name (English) <span className={styles.required}>*</span></label>
                  <input type="text" value={formData.nameEnglish || ''} onChange={e => handleChange('nameEnglish', e.target.value)} className={`${styles.input} ${errors.nameEnglish ? styles.inputError : ''}`} placeholder="Full name in English" />
                  {errors.nameEnglish && <span className={styles.errorMessage}>{errors.nameEnglish}</span>}
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Name (Bangla)</label>
                  <input type="text" value={formData.subunitCategory || ''} onChange={e => handleChange('subunitCategory', e.target.value)} className={styles.input} placeholder="বাংলায় নাম লিখুন" />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>School/College <span className={styles.required}>*</span></label>
                  <input type="text" value={formData.instituteName || ''} onChange={e => handleChange('instituteName', e.target.value)} className={`${styles.input} ${errors.instituteName ? styles.inputError : ''}`} placeholder="Enter school/college name" />
                  {errors.instituteName && <span className={styles.errorMessage}>{errors.instituteName}</span>}
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Date of Birth <span className={styles.required}>*</span></label>
                  <input type="date" value={formData.dateOfBirth || ''} onChange={e => handleChange('dateOfBirth', e.target.value)} className={`${styles.input} ${errors.dateOfBirth ? styles.inputError : ''}`} />
                  {errors.dateOfBirth && <span className={styles.errorMessage}>{errors.dateOfBirth}</span>}
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Gender</label>
                  <select value={formData.gender} onChange={e => handleChange('gender', e.target.value)} className={styles.input}>
                    <option value={Gender.MALE}>Male</option>
                    <option value={Gender.FEMALE}>Female</option>
                    <option value={Gender.OTHER}>Other</option>
                  </select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Religion</label>
                  <select value={formData.religion} onChange={e => handleChange('religion', e.target.value)} className={styles.input}>
                    <option value={Religion.ISLAM}>Islam</option>
                    <option value={Religion.HINDUISM}>Hinduism</option>
                    <option value={Religion.CHRISTIANITY}>Christianity</option>
                    <option value={Religion.BUDDHISM}>Buddhism</option>
                    <option value={Religion.OTHER}>Other</option>
                  </select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Student Mobile</label>
                  <input type="tel" value={formData.studentMobileNumber || ''} onChange={e => handleChange('studentMobileNumber', e.target.value)} className={styles.input} placeholder="01XXXXXXXXX" />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>WhatsApp Number</label>
                  <input type="tel" value={formData.whatsappMobile || ''} onChange={e => handleChange('whatsappMobile', e.target.value)} className={styles.input} placeholder="01XXXXXXXXX" />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Contact Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label}>Father's Name <span className={styles.required}>*</span></label>
                  <input type="text" value={formData.fatherName || ''} onChange={e => handleChange('fatherName', e.target.value)} className={`${styles.input} ${errors.fatherName ? styles.inputError : ''}`} placeholder="Father's full name" />
                  {errors.fatherName && <span className={styles.errorMessage}>{errors.fatherName}</span>}
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Father's Mobile</label>
                  <input type="tel" value={formData.fatherMobileNumber || ''} onChange={e => handleChange('fatherMobileNumber', e.target.value)} className={styles.input} placeholder="01XXXXXXXXX" />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Mother's Name</label>
                  <input type="text" value={formData.motherName || ''} onChange={e => handleChange('motherName', e.target.value)} className={styles.input} placeholder="Mother's full name" />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Mother's Mobile</label>
                  <input type="tel" value={formData.motherMobileNumber || ''} onChange={e => handleChange('motherMobileNumber', e.target.value)} className={styles.input} placeholder="01XXXXXXXXX" />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Local Guardian Mobile</label>
                  <input type="tel" value={formData.localGuardianMobileNumber || ''} onChange={e => handleChange('localGuardianMobileNumber', e.target.value)} className={styles.input} placeholder="01XXXXXXXXX" />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Address Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formFieldFull}>
                  <label className={styles.label}>Present Address <span className={styles.required}>*</span></label>
                  <textarea value={formData.presentAddress || ''} onChange={e => handleChange('presentAddress', e.target.value)} className={`${styles.textarea} ${errors.presentAddress ? styles.inputError : ''}`} rows={3} />
                  {errors.presentAddress && <span className={styles.errorMessage}>{errors.presentAddress}</span>}
                </div>
                <div className={styles.formFieldFull}>
                  <label className={styles.label}>Permanent Address</label>
                  <textarea value={formData.permanentAddress || ''} onChange={e => handleChange('permanentAddress', e.target.value)} className={styles.textarea} rows={3} />
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Payment Information</h3>
              <div className={styles.formGrid}>
                {formData.admissionType === AdmissionType.MONTHLY && (
                  <>
                    <div className={styles.formField}>
                      <label className={styles.label}>Admission Fee</label>
                      <input type="number" value={formData.admissionFee || ''} onChange={e => handleChange('admissionFee', Number(e.target.value) || 0)} className={styles.input} min="0" step="100" />
                    </div>
                    <div className={styles.formField}>
                      <label className={styles.label}>Monthly Tuition Fee <span className={styles.required}>*</span></label>
                      <input type="number" value={formData.monthlyTuitionFee || formData.tuitionFee || ''} onChange={e => { handleChange('monthlyTuitionFee', Number(e.target.value) || 0); handleChange('tuitionFee', Number(e.target.value) || 0); }} className={`${styles.input} ${errors.monthlyTuitionFee ? styles.inputError : ''}`} min="0" step="100" />
                      {errors.monthlyTuitionFee && <span className={styles.errorMessage}>{errors.monthlyTuitionFee}</span>}
                    </div>
                  </>
                )}
                {formData.admissionType === AdmissionType.COURSE && (
                  <>
                    <div className={styles.formField}>
                      <label className={styles.label}>Course Fee <span className={styles.required}>*</span></label>
                      <input type="number" value={formData.courseFee || ''} onChange={e => handleChange('courseFee', Number(e.target.value) || 0)} className={`${styles.input} ${errors.courseFee ? styles.inputError : ''}`} min="0" step="100" />
                      {errors.courseFee && <span className={styles.errorMessage}>{errors.courseFee}</span>}
                    </div>
                    <div className={styles.formField}>
                      <label className={styles.label}>Payment Installment</label>
                      <select value={String(formData.paymentInstallment ?? '')} onChange={e => handleChange('paymentInstallment', e.target.value)} className={styles.input}>
                        <option value="">Select the Installment</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                      </select>
                    </div>
                  </>
                )}
                <div className={styles.formField}>
                  <label className={styles.label}>Total Amount</label>
                  <input type="number" value={totalFee} className={styles.input} readOnly />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Refer By</label>
                  <input type="text" value={formData.referredBy || ''} onChange={e => handleChange('referredBy', e.target.value)} className={styles.input} placeholder="Person who referred" />
                </div>
              </div>
            </div>

            {/* Last Academic Information */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Last Academic Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label}>Name of Board</label>
                  <select value={formData.lastExamBoard || ''} onChange={e => handleChange('lastExamBoard', e.target.value)} className={styles.input}>
                    <option value="">Select One</option>
                    {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Name of Examination</label>
                  <select value={formData.lastExamName || ''} onChange={e => handleChange('lastExamName', e.target.value)} className={styles.input}>
                    <option value="">Select One</option>
                    {EXAMINATIONS.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Year of Examination</label>
                  <select value={formData.lastExamYear || ''} onChange={e => handleChange('lastExamYear', e.target.value)} className={styles.input}>
                    <option value="">Select One</option>
                    {EXAM_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Result</label>
                  <input type="text" value={formData.lastExamResult || ''} onChange={e => handleChange('lastExamResult', e.target.value)} className={styles.input} placeholder="e.g. GPA 5.00" />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Additional Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formFieldFull}>
                  <label className={styles.label}>Remarks</label>
                  <textarea value={formData.remarks || ''} onChange={e => handleChange('remarks', e.target.value)} className={styles.textarea} rows={2} />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.btnSecondary} disabled={loading}>Cancel</button>
            <button type="button" onClick={handleSaveDraft} className={styles.btnDraft} disabled={loading}>
              {loading ? <><span className={styles.spinnerSmall}></span>Saving...</> : '💾 Save Draft'}
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? <><span className={styles.spinnerSmall}></span>Creating...</> : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
