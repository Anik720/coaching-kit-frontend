"use client";

import { useState, useEffect } from 'react';
import {
  AdmissionType,
  Gender,
  Religion,
  StudentStatus,
  UpdateStudentDto,
  StudentItem,
  StudentBatch,
  BatchSubject,
} from '@/api/studentApi/types/student.types';
import styles from './CreateStudentModal.module.css';
import { subjectsFromBatchEntry } from '@/utils/batchSubjectsFromApi';

interface ClassForDropdown {
  _id: string;
  classname: string;
}

interface BatchForDropdown {
  _id: string;
  batchName: string;
  batchId: number | string;
  sessionYear: string;
  className?: { classname: string };
  subject?: any;
  subjectDetails?: any[];
}

interface EditStudentModalProps {
  student: StudentItem;
  onClose: () => void;
  onUpdate: (id: string, studentData: UpdateStudentDto) => Promise<void>;
  loading?: boolean;
  classes?: ClassForDropdown[];
  fetchBatchesByClass?: (classId: string) => Promise<any>;
}

function toDateInput(dateStr: string) {
  if (!dateStr) return '';
  return dateStr.split('T')[0];
}

function getClassId(cls: any): string {
  if (!cls) return '';
  if (typeof cls === 'string') return cls;
  if (typeof cls === 'object' && cls._id) return String(cls._id);
  return '';
}

export default function EditStudentModal({
  student,
  onClose,
  onUpdate,
  loading = false,
  classes = [],
  fetchBatchesByClass,
}: EditStudentModalProps) {

  const [formData, setFormData] = useState<UpdateStudentDto>({
    registrationId: student.registrationId,
    class: getClassId(student.class),
    batch: student.batch?._id || '',
    nameEnglish: student.nameEnglish,
    subunitCategory: student.subunitCategory || '',
    dateOfBirth: toDateInput(student.dateOfBirth),
    gender: student.gender,
    religion: student.religion,
    studentMobileNumber: student.studentMobileNumber || '',
    presentAddress: student.presentAddress,
    permanentAddress: student.permanentAddress || '',
    fatherName: student.fatherName,
    fatherMobileNumber: student.fatherMobileNumber,
    motherName: student.motherName || '',
    motherMobileNumber: student.motherMobileNumber || '',
    admissionType: student.admissionType,
    admissionDate: toDateInput(student.admissionDate),
    admissionFee: student.admissionFee,
    monthlyTuitionFee: student.monthlyTuitionFee || 0,
    courseFee: student.courseFee || 0,
    totalAmount: student.totalAmount,
    referredBy: student.referredBy || '',
    status: student.status,
    isActive: student.isActive,
    remarks: student.remarks || '',
    batches: student.batches || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedClass, setSelectedClass] = useState<string>(getClassId(student.class));
  const [availableBatches, setAvailableBatches] = useState<BatchForDropdown[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  // Load batches for the student's current class on mount
  useEffect(() => {
    const loadBatches = async () => {
      if (!selectedClass || !fetchBatchesByClass) {
        setAvailableBatches([]);
        return;
      }
      setLoadingBatches(true);
      try {
        const batches = await fetchBatchesByClass(selectedClass);
        setAvailableBatches(batches);
        // Ensure student's original batches are pre-selected
        if (student.batches && student.batches.length > 0) {
          setFormData(prev => {
            if (prev.batches && prev.batches.length > 0) return prev;
            return { ...prev, batches: student.batches! };
          });
        }
      } catch {
        setAvailableBatches([]);
      } finally {
        setLoadingBatches(false);
      }
    };
    loadBatches();
  }, [selectedClass, fetchBatchesByClass]);



  // Auto-calculate total amount
  useEffect(() => {
    const batchesTotal = formData.batches?.reduce((sum, b) => sum + (b.admissionFee || 0) + (b.tuitionFee || 0) + (b.courseFee || 0), 0) || 0;
    if (batchesTotal > 0) {
      setFormData(prev => ({ ...prev, totalAmount: batchesTotal }));
    } else if (formData.admissionType === AdmissionType.MONTHLY) {
      setFormData(prev => ({ ...prev, totalAmount: (prev.admissionFee || 0) + (prev.monthlyTuitionFee || 0) }));
    } else if (formData.admissionType === AdmissionType.COURSE) {
      setFormData(prev => ({ ...prev, totalAmount: (prev.admissionFee || 0) + (prev.courseFee || 0) }));
    }
  }, [formData.admissionFee, formData.monthlyTuitionFee, formData.courseFee, formData.admissionType, formData.batches]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const classId = e.target.value;
    setSelectedClass(classId);
    setFormData(prev => ({ ...prev, class: classId, batches: [] }));
    setAvailableBatches([]);
  };

  const handleBatchToggle = (batch: any) => {
    setFormData(prev => {
      const isSelected = prev.batches?.some(b => b.batch === batch._id);
      let newBatches;
      
      if (isSelected) {
        newBatches = prev.batches?.filter(b => b.batch !== batch._id) || [];
      } else {
        const newBatch: StudentBatch = {
          batch: batch._id,
          batchName: batch.batchName,
          batchId: String(batch.batchId),
          subjects: [], // Add with empty subjects initially
          admissionFee: prev.admissionType === AdmissionType.COURSE ? 0 : (formData.admissionFee || 0),
          tuitionFee: prev.admissionType === AdmissionType.COURSE ? 0 : (formData.monthlyTuitionFee || 0),
          courseFee: prev.admissionType === AdmissionType.MONTHLY ? 0 : (formData.courseFee || 0),
        };
        newBatches = [...(prev.batches || []), newBatch];
      }

      return { ...prev, batches: newBatches };
    });
  };

  const handleSubjectToggle = (batchId: string, subject: any) => {
    setFormData(prev => {
      const updatedBatches = (prev.batches || []).map(b => {
        if (b.batch === batchId) {
          const isSelected = b.subjects.some(s => String(s.subjectId) === String(subject._id));
          const newSubjects = isSelected
            ? b.subjects.filter(s => String(s.subjectId) !== String(subject._id))
            : [...b.subjects, { subjectId: subject._id, subjectName: subject.subjectName }];
          return { ...b, subjects: newSubjects };
        }
        return b;
      });
      return { ...prev, batches: updatedBatches };
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.class?.trim()) newErrors.class = 'Class is required';
    if (!formData.nameEnglish?.trim()) newErrors.nameEnglish = 'Student name is required';
    if (!formData.fatherName?.trim()) newErrors.fatherName = "Father's name is required";
    if (!formData.fatherMobileNumber?.trim()) {
      newErrors.fatherMobileNumber = "Father's mobile number is required";
    } else if (!/^01[3-9]\d{8}$/.test(formData.fatherMobileNumber)) {
      newErrors.fatherMobileNumber = 'Please enter a valid Bangladeshi mobile number';
    }
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.presentAddress?.trim()) newErrors.presentAddress = 'Present address is required';
    if (!formData.admissionDate?.trim()) newErrors.admissionDate = 'Joining date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await onUpdate(student._id, formData);
    } catch (error) {
      console.error('Failed to update student:', error);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.modalLarge}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Edit Student</h2>
          <button onClick={onClose} className={styles.modalClose} type="button" disabled={loading}>
            ✕
          </button>
        </div>

        {loading && (
          <div className={styles.modalLoading}>
            <div className={styles.spinnerLarge}></div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className={styles.modalBody}>
            {/* Registration & Class/Batch */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Registration & Academic Details</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label}>Registration ID</label>
                  <input
                    type="text"
                    value={formData.registrationId || ''}
                    className={styles.input}
                    readOnly
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>
                    Select Class <span className={styles.required}>*</span>
                  </label>
                  <select
                    value={selectedClass}
                    onChange={handleClassChange}
                    className={`${styles.input} ${errors.class ? styles.inputError : ''}`}
                    disabled={loading || !classes.length}
                  >
                    <option value="">Select the class</option>
                    {classes.map(cls => (
                      <option key={cls._id} value={cls._id}>{cls.classname}</option>
                    ))}
                  </select>
                  {errors.class && <span className={styles.errorMessage}>{errors.class}</span>}
                </div>

                <div className={styles.formFieldFull} style={{ marginTop: '16px' }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                    <div className={styles.formGrid}>
                      <div className={styles.formFieldFull}>
                        <label className={styles.label}>1. Select Batches <span className={styles.required}>*</span></label>
                        {!selectedClass ? (
                          <div style={{ color: '#64748b', fontSize: '14px', fontStyle: 'italic', marginTop: '8px' }}>Select class first to view available batches</div>
                        ) : loadingBatches ? (
                          <div style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>Loading batches...</div>
                        ) : availableBatches.length === 0 ? (
                          <div style={{ color: '#ef4444', fontSize: '14px', marginTop: '8px' }}>No batches available for this class</div>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
                            {availableBatches
                              .filter((b, idx, arr) => arr.findIndex(x => String(x._id) === String(b._id)) === idx)
                              .map(b => {
                              const isChecked = formData.batches?.some(fb => String(fb.batch) === String(b._id));
                              return (
                                <label key={b._id} style={{
                                  display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                                  background: isChecked ? '#ede9fe' : 'white',
                                  padding: '10px 14px',
                                  border: `2px solid ${isChecked ? '#8b5cf6' : '#cbd5e1'}`,
                                  borderRadius: '8px', transition: 'all 0.2s',
                                  boxShadow: isChecked ? '0 2px 6px rgba(139,92,246,0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
                                }}>
                                  <input
                                    type="checkbox"
                                    checked={!!isChecked}
                                    onChange={() => handleBatchToggle(b)}
                                    style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#8b5cf6' }}
                                  />
                                  <span style={{ fontSize: '14px', fontWeight: 600, color: isChecked ? '#4c1d95' : '#334155' }}>
                                    {b.batchName} <span style={{ fontWeight: 400, color: '#64748b', fontSize: '12px' }}>({b.sessionYear})</span>
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                        {errors.batches && <span className={styles.errorMessage}>{errors.batches}</span>}
                      </div>

                      {formData.batches && formData.batches.length > 0 && (
                        <div className={styles.formFieldFull} style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                          <label className={styles.label}>2. Select Subjects</label>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px' }}>
                            {formData.batches.map(batchObj => {
                              // Collect ALL subjects for this batch from all matching entries in availableBatches
                              const batchEntries = availableBatches.filter(b => String(b._id) === String(batchObj.batch));

                              // Batches still loading — show existing saved subjects as selected
                              if (batchEntries.length === 0) {
                                if (!batchObj.subjects || batchObj.subjects.length === 0) return null;
                                return batchObj.subjects.map(subj => (
                                  <label key={`saved-${batchObj.batch}-${subj.subjectId}`} style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    background: '#ede9fe', border: '2px solid #8b5cf6',
                                    padding: '8px 14px', borderRadius: '24px',
                                    boxShadow: '0 2px 4px rgba(139,92,246,0.15)',
                                  }}>
                                    <input type="checkbox" checked readOnly style={{ width: '14px', height: '14px', accentColor: '#8b5cf6' }} />
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#4c1d95' }}>
                                      {subj.subjectName} <span style={{ fontWeight: 400, opacity: 0.7, fontSize: '12px' }}>({batchObj.batchName})</span>
                                    </span>
                                  </label>
                                ));
                              }

                              // Collect unique subjects from all entries for this batch
                              const seenSubjectIds = new Set<string>();
                              const batchSubjects: Array<{ _id: string; subjectName: string }> = [];
                              batchEntries.forEach(entry => {
                                subjectsFromBatchEntry(entry).forEach(s => {
                                  if (!seenSubjectIds.has(s._id)) {
                                    seenSubjectIds.add(s._id);
                                    batchSubjects.push(s);
                                  }
                                });
                              });

                              if (batchSubjects.length === 0) {
                                return (
                                  <div key={batchObj.batch} style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic', padding: '6px 12px', background: '#f1f5f9', borderRadius: '6px' }}>
                                    No subjects available for {batchObj.batchName}
                                  </div>
                                );
                              }

                              return batchSubjects.map((subj) => {
                                const isSelected = batchObj.subjects.some(s => String(s.subjectId) === String(subj._id));
                                return (
                                  <label key={`${batchObj.batch}-${subj._id}`} style={{
                                    display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                                    background: isSelected ? '#ede9fe' : 'white',
                                    border: `2px solid ${isSelected ? '#8b5cf6' : '#cbd5e1'}`,
                                    padding: '8px 14px', borderRadius: '24px', transition: 'all 0.2s',
                                    boxShadow: isSelected ? '0 2px 4px rgba(139, 92, 246, 0.15)' : 'none'
                                  }}>
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleSubjectToggle(batchObj.batch, subj)}
                                      style={{ cursor: 'pointer', width: '14px', height: '14px', accentColor: '#8b5cf6' }}
                                    />
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: isSelected ? '#4c1d95' : '#475569' }}>
                                      {subj.subjectName} <span style={{ fontWeight: 400, opacity: 0.8, fontSize: '12px' }}>({batchObj.batchName})</span>
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

                <div className={styles.formField}>
                  <label className={styles.label}>Status</label>
                  <select
                    name="status"
                    value={formData.status || ''}
                    onChange={handleChange}
                    className={styles.input}
                    disabled={loading}
                  >
                    <option value={StudentStatus.ACTIVE}>Active</option>
                    <option value={StudentStatus.INACTIVE}>Inactive</option>
                    <option value={StudentStatus.GRADUATED}>Graduated</option>
                    <option value={StudentStatus.DROPPED}>Dropped</option>
                    <option value={StudentStatus.SUSPENDED}>Suspended</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Student Information */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Student Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label}>
                    Name (English) <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    name="nameEnglish"
                    value={formData.nameEnglish || ''}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.nameEnglish ? styles.inputError : ''}`}
                    placeholder="Enter full name in English"
                    disabled={loading}
                  />
                  {errors.nameEnglish && <span className={styles.errorMessage}>{errors.nameEnglish}</span>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Name (Bangla)</label>
                  <input
                    type="text"
                    name="subunitCategory"
                    value={formData.subunitCategory || ''}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="বাংলায় নাম লিখুন"
                    disabled={loading}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>
                    Date of Birth <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth || ''}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.dateOfBirth ? styles.inputError : ''}`}
                    disabled={loading}
                  />
                  {errors.dateOfBirth && <span className={styles.errorMessage}>{errors.dateOfBirth}</span>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Gender</label>
                  <select
                    name="gender"
                    value={formData.gender || ''}
                    onChange={handleChange}
                    className={styles.input}
                    disabled={loading}
                  >
                    <option value={Gender.MALE}>Male</option>
                    <option value={Gender.FEMALE}>Female</option>
                    <option value={Gender.OTHER}>Other</option>
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Religion</label>
                  <select
                    name="religion"
                    value={formData.religion || ''}
                    onChange={handleChange}
                    className={styles.input}
                    disabled={loading}
                  >
                    <option value={Religion.ISLAM}>Islam</option>
                    <option value={Religion.HINDUISM}>Hinduism</option>
                    <option value={Religion.CHRISTIANITY}>Christianity</option>
                    <option value={Religion.BUDDHISM}>Buddhism</option>
                    <option value={Religion.OTHER}>Other</option>
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Student Mobile</label>
                  <input
                    type="tel"
                    name="studentMobileNumber"
                    value={formData.studentMobileNumber || ''}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="01XXXXXXXXX"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Address Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formFieldFull}>
                  <label className={styles.label}>
                    Present Address <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    name="presentAddress"
                    value={formData.presentAddress || ''}
                    onChange={handleChange}
                    className={`${styles.textarea} ${errors.presentAddress ? styles.inputError : ''}`}
                    rows={3}
                    disabled={loading}
                  />
                  {errors.presentAddress && <span className={styles.errorMessage}>{errors.presentAddress}</span>}
                </div>

                <div className={styles.formFieldFull}>
                  <label className={styles.label}>Permanent Address</label>
                  <textarea
                    name="permanentAddress"
                    value={formData.permanentAddress || ''}
                    onChange={handleChange}
                    className={styles.textarea}
                    rows={3}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Guardian */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Guardian Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label}>
                    Father's Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    name="fatherName"
                    value={formData.fatherName || ''}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.fatherName ? styles.inputError : ''}`}
                    disabled={loading}
                  />
                  {errors.fatherName && <span className={styles.errorMessage}>{errors.fatherName}</span>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>
                    Father's Mobile <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="tel"
                    name="fatherMobileNumber"
                    value={formData.fatherMobileNumber || ''}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.fatherMobileNumber ? styles.inputError : ''}`}
                    placeholder="01XXXXXXXXX"
                    disabled={loading}
                  />
                  {errors.fatherMobileNumber && <span className={styles.errorMessage}>{errors.fatherMobileNumber}</span>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Mother's Name</label>
                  <input
                    type="text"
                    name="motherName"
                    value={formData.motherName || ''}
                    onChange={handleChange}
                    className={styles.input}
                    disabled={loading}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Mother's Mobile</label>
                  <input
                    type="tel"
                    name="motherMobileNumber"
                    value={formData.motherMobileNumber || ''}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="01XXXXXXXXX"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Payment Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label}>Admission Type</label>
                  <select
                    name="admissionType"
                    value={formData.admissionType || ''}
                    onChange={handleChange}
                    className={styles.input}
                    disabled={loading}
                  >
                    <option value={AdmissionType.MONTHLY}>Monthly</option>
                    <option value={AdmissionType.COURSE}>Course</option>
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>
                    Joining date <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="date"
                    name="admissionDate"
                    value={formData.admissionDate || ''}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.admissionDate ? styles.inputError : ''}`}
                    disabled={loading}
                  />
                  {errors.admissionDate && (
                    <span className={styles.errorMessage}>{errors.admissionDate}</span>
                  )}
                </div>

                {formData.admissionType === AdmissionType.MONTHLY && (
                  <div className={styles.formField}>
                    <label className={styles.label}>Monthly Tuition Fee</label>
                    <input
                      type="number"
                      name="monthlyTuitionFee"
                      value={formData.monthlyTuitionFee || ''}
                      onChange={handleChange}
                      className={styles.input}
                      min="0"
                      step="100"
                      disabled={loading}
                    />
                  </div>
                )}

                {formData.admissionType === AdmissionType.COURSE && (
                  <div className={styles.formField}>
                    <label className={styles.label}>Course Fee</label>
                    <input
                      type="number"
                      name="courseFee"
                      value={formData.courseFee || ''}
                      onChange={handleChange}
                      className={styles.input}
                      min="0"
                      step="100"
                      disabled={loading}
                    />
                  </div>
                )}

                <div className={styles.formField}>
                  <label className={styles.label}>Admission Fee</label>
                  <input
                    type="number"
                    name="admissionFee"
                    value={formData.admissionFee ?? ''}
                    onChange={handleChange}
                    className={styles.input}
                    min="0"
                    step="100"
                    disabled={loading}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Total Amount</label>
                  <input
                    type="number"
                    value={formData.totalAmount ?? ''}
                    className={styles.input}
                    readOnly
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Referred By</label>
                  <input
                    type="text"
                    name="referredBy"
                    value={formData.referredBy || ''}
                    onChange={handleChange}
                    className={styles.input}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Additional Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formFieldFull}>
                  <label className={styles.label}>Remarks</label>
                  <textarea
                    name="remarks"
                    value={formData.remarks || ''}
                    onChange={handleChange}
                    className={styles.textarea}
                    rows={2}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.btnSecondary} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? (
                <>
                  <span className={styles.spinnerSmall}></span>
                  Updating...
                </>
              ) : (
                'Update Student'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
