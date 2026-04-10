"use client";

import { useState, useEffect } from 'react';
import { 
  AdmissionType, 
  Gender, 
  Religion, 
  StudentStatus, 
  CreateStudentDto, 
  BatchSubject, 
  StudentBatch 
} from '@/api/studentApi/types/student.types';
import styles from './CreateStudentModal.module.css';

interface ClassForDropdown {
  _id: string;
  classname: string;
}

interface BatchForDropdown {
  _id: string;
  batchName: string;
  batchId: number | string;
  sessionYear: string;
  className?: {
    classname: string;
  };
}

interface CreateStudentModalProps {
  onClose: () => void;
  onCreate: (studentData: CreateStudentDto) => Promise<void>;
  onSaveDraft?: (studentData: CreateStudentDto) => Promise<void>;
  loading?: boolean;
  classes?: ClassForDropdown[];
  fetchBatchesByClass?: (classId: string) => Promise<any>;
}

export default function CreateStudentModal({ 
  onClose, 
  onCreate, 
  onSaveDraft,
  loading = false,
  classes = [],
  fetchBatchesByClass
}: CreateStudentModalProps) {
  const [formData, setFormData] = useState<CreateStudentDto>({
    registrationId: '',
    class: '',
    batch: '',
    nameEnglish: '',
    dateOfBirth: '',
    gender: Gender.MALE,
    religion: Religion.ISLAM,
    presentAddress: '',
    fatherName: '',
    fatherMobileNumber: '',
    admissionType: AdmissionType.MONTHLY,
    admissionFee: 0,
    monthlyTuitionFee: 0,
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
    referredBy: '',
    remarks: '',
    batches: [] as StudentBatch[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  // Generate registration ID on component mount
  useEffect(() => {
    const generateRegistrationId = () => {
      const year = new Date().getFullYear();
      const randomNum = Math.floor(100 + Math.random() * 900);
      return `STU-${year}-${randomNum}`;
    };
    
    setFormData(prev => ({
      ...prev,
      registrationId: generateRegistrationId()
    }));
  }, []);

  // Fetch batches when class is selected
  useEffect(() => {
    const loadBatches = async () => {
      if (!selectedClass || !fetchBatchesByClass) {
        setAvailableBatches([]);
        return;
      }

      setLoadingBatches(true);
      try {
        const batches = await fetchBatchesByClass(selectedClass);
        // Fix: Ensure batches is an array even if API returns an object { data: [...] }
        const safeBatches = Array.isArray(batches) ? batches : (batches as any)?.data || [];
        setAvailableBatches(safeBatches);
      } catch (error) {
        console.error('Failed to fetch batches:', error);
        setAvailableBatches([]);
      } finally {
        setLoadingBatches(false);
      }
    };

    loadBatches();
  }, [selectedClass, fetchBatchesByClass]);



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else {
      setFormData(prev => {
        const updated = { ...prev, [name]: value };
        if (name === 'admissionType') {
          if (value === AdmissionType.COURSE) {
            updated.admissionFee = 0;
            updated.monthlyTuitionFee = 0;
          } else if (value === AdmissionType.MONTHLY) {
            updated.courseFee = 0;
          }
        }
        return updated;
      });
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const classId = e.target.value;
    setSelectedClass(classId);
    setFormData(prev => ({ ...prev, class: classId, batches: [] }));
    setAvailableBatches([]);
    if (errors.class) setErrors(prev => ({ ...prev, class: '' }));
    if (errors.batches) setErrors(prev => ({ ...prev, batches: '' }));
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
          batchId: batch.batchId,
          subjects: [], // Add with empty subjects initially
          admissionFee: prev.admissionType === AdmissionType.COURSE ? 0 : (batch.admissionFee || 0),
          tuitionFee: prev.admissionType === AdmissionType.COURSE ? 0 : (batch.tuitionFee || 0),
          courseFee: prev.admissionType === AdmissionType.MONTHLY ? 0 : (batch.courseFee || 0),
        };
        newBatches = [...(prev.batches || []), newBatch];
      }

      return { ...prev, batches: newBatches };
    });
    if (errors.batches) setErrors(prev => ({ ...prev, batches: '' }));
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!(formData.class ?? '').trim()) {
      newErrors.class = 'Class is required';
    }

    if (!formData.batches || formData.batches.length === 0) {
      newErrors.batches = 'At least one batch is required';
    }

    if (!(formData.nameEnglish ?? '').trim()) {
      newErrors.nameEnglish = 'Student name is required';
    }

    if (!(formData.fatherName ?? '').trim()) {
      newErrors.fatherName = "Father's name is required";
    }

    if (!(formData.fatherMobileNumber ?? '').trim()) {
      newErrors.fatherMobileNumber = "Father's mobile number is required";
    } else if (!/^01[3-9]\d{8}$/.test(formData.fatherMobileNumber ?? '')) {
      newErrors.fatherMobileNumber = 'Please enter a valid Bangladeshi mobile number';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    if (!(formData.presentAddress ?? '').trim()) {
      newErrors.presentAddress = 'Present address is required';
    }

    if (!(formData.instituteName ?? '').trim()) {
      newErrors.instituteName = 'Institute name is required';
    }

    if ((formData.admissionFee ?? 0) < 0) {
      newErrors.admissionFee = 'Admission fee cannot be negative';
    }

    if ((formData.totalAmount ?? 0) < 0) {
      newErrors.totalAmount = 'Total amount cannot be negative';
    }

    if (formData.admissionType === AdmissionType.MONTHLY && (!formData.monthlyTuitionFee || formData.monthlyTuitionFee < 0)) {
      newErrors.monthlyTuitionFee = 'Monthly tuition fee is required';
    }

    if (formData.admissionType === AdmissionType.COURSE && (!formData.courseFee || formData.courseFee < 0)) {
      newErrors.courseFee = 'Course fee is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onCreate(formData);
    } catch (error) {
      console.error('Failed to create student:', error);
    }
  };

  const handleSaveDraft = async () => {
    // Drafts only require a registrationId — everything else is optional
    const draftData: CreateStudentDto = {
      ...formData,
      status: StudentStatus.PENDING,
      isActive: false,
    };

    try {
      if (onSaveDraft) {
        await onSaveDraft(draftData);
      } else {
        await onCreate(draftData);
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  // Calculate total amount automatically
  useEffect(() => {
    const batchesTotal = formData.batches?.reduce((sum, b) => sum + (b.admissionFee || 0) + (b.tuitionFee || 0) + (b.courseFee || 0), 0) || 0;
    if (batchesTotal > 0) {
      setFormData(prev => ({ ...prev, totalAmount: batchesTotal }));
    } else if (formData.admissionType === AdmissionType.MONTHLY) {
      setFormData(prev => ({
        ...prev,
        totalAmount: (prev.admissionFee || 0) + (prev.monthlyTuitionFee || 0)
      }));
    } else if (formData.admissionType === AdmissionType.COURSE) {
      setFormData(prev => ({
        ...prev,
        totalAmount: (prev.admissionFee || 0) + (prev.courseFee || 0)
      }));
    }
  }, [formData.admissionFee, formData.monthlyTuitionFee, formData.courseFee, formData.admissionType, formData.batches]);

  const safeClasses = Array.isArray(classes) ? classes : [];
  const safeBatches = Array.isArray(availableBatches) ? availableBatches : [];

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.modalLarge}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Register New Student</h2>
          <button
            onClick={onClose}
            className={styles.modalClose}
            type="button"
            disabled={loading}
          >
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
            {/* Registration & Class/Batch Section */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Registration & Academic Details</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="registrationId">
                    Registration ID <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="registrationId"
                    type="text"
                    name="registrationId"
                    value={formData.registrationId}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.registrationId ? styles.inputError : ''}`}
                    placeholder="STU-2024-001"
                    required
                    readOnly
                  />
                  {errors.registrationId && <span className={styles.errorMessage}>{errors.registrationId}</span>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="class">
                    Select Class <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="class"
                    name="class"
                    value={selectedClass}
                    onChange={handleClassChange}
                    className={`${styles.input} ${errors.class ? styles.inputError : ''}`}
                    disabled={loading || safeClasses.length === 0}
                    required
                  >
                    <option value="">Select the class</option>
                    {safeClasses.map(cls => (
                      <option key={cls._id} value={cls._id}>
                        {cls.classname}
                      </option>
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
                        ) : safeBatches.length === 0 ? (
                          <div style={{ color: '#ef4444', fontSize: '14px', marginTop: '8px' }}>No batches available for this class</div>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
                            {safeBatches
                              .filter((b, idx, arr) => arr.findIndex(x => String(x._id) === String(b._id)) === idx)
                              .map(b => (
                              <label key={b._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'white', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                <input
                                  type="checkbox"
                                  checked={formData.batches?.some(fb => fb.batch === b._id)}
                                  onChange={() => handleBatchToggle(b)}
                                  style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                                />
                                <span style={{ fontSize: '15px', fontWeight: 500, color: '#334155' }}>
                                  {b.batchName} ({b.sessionYear})
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                        {errors.batches && <span className={styles.errorMessage}>{errors.batches}</span>}
                      </div>

                      {formData.batches && formData.batches.length > 0 && (
                        <div className={styles.formFieldFull} style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                          <label className={styles.label}>2. Select Subjects</label>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px' }}>
                            {formData.batches.map(batchObj => {
                              // Collect ALL subjects for this batch from all matching entries
                              const batchEntries = safeBatches.filter(b => String(b._id) === String(batchObj.batch));
                              if (batchEntries.length === 0) return null;

                              const seenSubjectIds = new Set<string>();
                              const batchSubjects: Array<{ _id: string; subjectName: string }> = [];
                              batchEntries.forEach(entry => {
                                const rawSubject = entry.subject;
                                if (!rawSubject) return;
                                let subjectId: string;
                                let subjectName: string;
                                if (typeof rawSubject === 'object' && rawSubject._id) {
                                  subjectId = String(rawSubject._id);
                                  subjectName = rawSubject.subjectName || 'Subject';
                                } else if (typeof rawSubject === 'string') {
                                  subjectId = rawSubject;
                                  subjectName = 'Subject';
                                } else {
                                  return;
                                }
                                if (!seenSubjectIds.has(subjectId)) {
                                  seenSubjectIds.add(subjectId);
                                  batchSubjects.push({ _id: subjectId, subjectName });
                                }
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
                                    border: `1px solid ${isSelected ? '#8b5cf6' : '#cbd5e1'}`,
                                    padding: '8px 14px', borderRadius: '24px', transition: 'all 0.2s',
                                    boxShadow: isSelected ? '0 2px 4px rgba(139, 92, 246, 0.15)' : 'none'
                                  }}>
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleSubjectToggle(batchObj.batch, subj)}
                                      style={{ cursor: 'pointer', display: 'none' }}
                                    />
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

            {/* Basic Information Section */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Student Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="nameEnglish">
                    Name (English) <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="nameEnglish"
                    type="text"
                    name="nameEnglish"
                    value={formData.nameEnglish}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.nameEnglish ? styles.inputError : ''}`}
                    placeholder="Enter full name in English"
                    required
                  />
                  {errors.nameEnglish && <span className={styles.errorMessage}>{errors.nameEnglish}</span>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="subunitCategory">
                    Name (Bangla)
                  </label>
                  <input
                    id="subunitCategory"
                    type="text"
                    name="subunitCategory"
                    value={formData.subunitCategory || ''}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="বাংলায় নাম লিখুন"
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="instituteName">
                    School/College <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="instituteName"
                    type="text"
                    name="instituteName"
                    value={formData.instituteName || ''}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.instituteName ? styles.inputError : ''}`}
                    placeholder="Enter school/college name"
                  />
                  {errors.instituteName && <span className={styles.errorMessage}>{errors.instituteName}</span>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="dateOfBirth">
                    Student Date of Birth <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.dateOfBirth ? styles.inputError : ''}`}
                    required
                  />
                  {errors.dateOfBirth && <span className={styles.errorMessage}>{errors.dateOfBirth}</span>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="gender">
                    Student Gender <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={styles.input}
                  >
                    <option value={Gender.MALE}>Male</option>
                    <option value={Gender.FEMALE}>Female</option>
                    <option value={Gender.OTHER}>Other</option>
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="religion">
                    Religion <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="religion"
                    name="religion"
                    value={formData.religion}
                    onChange={handleChange}
                    className={styles.input}
                  >
                    <option value={Religion.ISLAM}>Islam</option>
                    <option value={Religion.HINDUISM}>Hinduism</option>
                    <option value={Religion.CHRISTIANITY}>Christianity</option>
                    <option value={Religion.BUDDHISM}>Buddhism</option>
                    <option value={Religion.OTHER}>Other</option>
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="studentMobileNumber">
                    Student Mobile Number
                  </label>
                  <input
                    id="studentMobileNumber"
                    type="tel"
                    name="studentMobileNumber"
                    value={formData.studentMobileNumber || ''}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="01XXXXXXXXX"
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="whatsappMobile">
                    WhatsApp Number
                  </label>
                  <input
                    id="whatsappMobile"
                    type="tel"
                    name="whatsappMobile"
                    value={formData.whatsappMobile || ''}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="01XXXXXXXXX"
                  />
                </div>
              </div>
            </div>

            {/* Address Information Section */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Address Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formFieldFull}>
                  <label className={styles.label} htmlFor="presentAddress">
                    Present Address <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    id="presentAddress"
                    name="presentAddress"
                    value={formData.presentAddress}
                    onChange={handleChange}
                    className={`${styles.textarea} ${errors.presentAddress ? styles.inputError : ''}`}
                    placeholder="Enter complete present address"
                    rows={3}
                    required
                  />
                  {errors.presentAddress && <span className={styles.errorMessage}>{errors.presentAddress}</span>}
                </div>

                <div className={styles.formFieldFull}>
                  <label className={styles.label} htmlFor="permanentAddress">
                    Permanent Address
                  </label>
                  <textarea
                    id="permanentAddress"
                    name="permanentAddress"
                    value={formData.permanentAddress || ''}
                    onChange={handleChange}
                    className={styles.textarea}
                    placeholder="If different from present address"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Guardian Information Section */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Guardian Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="fatherName">
                    Father's Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="fatherName"
                    type="text"
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.fatherName ? styles.inputError : ''}`}
                    placeholder="Enter father's name"
                    required
                  />
                  {errors.fatherName && <span className={styles.errorMessage}>{errors.fatherName}</span>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="fatherMobileNumber">
                    Father's Mobile Number <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="fatherMobileNumber"
                    type="tel"
                    name="fatherMobileNumber"
                    value={formData.fatherMobileNumber}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.fatherMobileNumber ? styles.inputError : ''}`}
                    placeholder="01XXXXXXXXX"
                    required
                  />
                  {errors.fatherMobileNumber && <span className={styles.errorMessage}>{errors.fatherMobileNumber}</span>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="motherName">
                    Mother's Name
                  </label>
                  <input
                    id="motherName"
                    type="text"
                    name="motherName"
                    value={formData.motherName || ''}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Enter mother's name"
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="motherMobileNumber">
                    Mother's Mobile Number
                  </label>
                  <input
                    id="motherMobileNumber"
                    type="tel"
                    name="motherMobileNumber"
                    value={formData.motherMobileNumber || ''}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="01XXXXXXXXX"
                  />
                </div>
              </div>
            </div>

            {/* Payment Information Section */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Payment Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="admissionType">
                    Admission Type <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="admissionType"
                    name="admissionType"
                    value={formData.admissionType}
                    onChange={handleChange}
                    className={styles.input}
                  >
                    <option value={AdmissionType.MONTHLY}>Monthly</option>
                    <option value={AdmissionType.COURSE}>Course</option>
                  </select>
                </div>

                {formData.admissionType === AdmissionType.MONTHLY && (
                  <div className={styles.formField}>
                    <label className={styles.label} htmlFor="monthlyTuitionFee">
                      Monthly Tuition Fee <span className={styles.required}>*</span>
                    </label>
                    <input
                      id="monthlyTuitionFee"
                      type="number"
                      name="monthlyTuitionFee"
                      value={formData.monthlyTuitionFee || ''}
                      onChange={handleChange}
                      className={`${styles.input} ${errors.monthlyTuitionFee ? styles.inputError : ''}`}
                      min="0"
                      step="100"
                      required
                    />
                    {errors.monthlyTuitionFee && <span className={styles.errorMessage}>{errors.monthlyTuitionFee}</span>}
                  </div>
                )}

                {formData.admissionType === AdmissionType.COURSE && (
                  <div className={styles.formField}>
                    <label className={styles.label} htmlFor="courseFee">
                      Course Fee <span className={styles.required}>*</span>
                    </label>
                    <input
                      id="courseFee"
                      type="number"
                      name="courseFee"
                      value={formData.courseFee || ''}
                      onChange={handleChange}
                      className={`${styles.input} ${errors.courseFee ? styles.inputError : ''}`}
                      min="0"
                      step="100"
                      required
                    />
                    {errors.courseFee && <span className={styles.errorMessage}>{errors.courseFee}</span>}
                  </div>
                )}

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="admissionFee">
                    Admission Fee
                  </label>
                  <input
                    id="admissionFee"
                    type="number"
                    name="admissionFee"
                    value={formData.admissionFee}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.admissionFee ? styles.inputError : ''}`}
                    min="0"
                    step="100"
                    disabled={formData.admissionType === AdmissionType.COURSE}
                  />
                  {errors.admissionFee && <span className={styles.errorMessage}>{errors.admissionFee}</span>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="totalAmount">
                    Total Amount
                  </label>
                  <input
                    id="totalAmount"
                    type="number"
                    name="totalAmount"
                    value={formData.totalAmount}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.totalAmount ? styles.inputError : ''}`}
                    min="0"
                    step="100"
                    readOnly
                  />
                  {errors.totalAmount && <span className={styles.errorMessage}>{errors.totalAmount}</span>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="admissionDate">
                    Admission Date <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="admissionDate"
                    type="date"
                    name="admissionDate"
                    value={formData.admissionDate}
                    onChange={handleChange}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="referredBy">
                    Refer By
                  </label>
                  <input
                    id="referredBy"
                    type="text"
                    name="referredBy"
                    value={formData.referredBy || ''}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Person who referred"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Additional Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formFieldFull}>
                  <label className={styles.label} htmlFor="remarks">
                    Remarks
                  </label>
                  <textarea
                    id="remarks"
                    name="remarks"
                    value={formData.remarks || ''}
                    onChange={handleChange}
                    className={styles.textarea}
                    placeholder="Any additional remarks or notes"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnSecondary}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              className={styles.btnDraft}
              disabled={loading}
              title="Save as draft (incomplete) — you can complete later"
            >
              {loading ? (
                <>
                  <span className={styles.spinnerSmall}></span>
                  Saving...
                </>
              ) : (
                '💾 Save Draft'
              )}
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinnerSmall}></span>
                  Creating...
                </>
              ) : (
                'Submit'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}