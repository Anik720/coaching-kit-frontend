"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState, AppDispatch } from '@/store/store';
import {
  createStudent,
  fetchClasses as fetchStudentClasses,
} from '@/api/studentApi/studentSlice';
import {
  AdmissionType,
  Gender,
  Religion,
  StudentStatus,
  CreateStudentDto,
} from '@/api/studentApi/types/student.types';
import {
  fetchAdmissionTemplates,
  saveDraftForm,
  clearDraftForm,
} from '@/api/admissionApi/admissionSlice';
import { AdmissionBatch } from '@/api/admissionApi/types/admission.types';
import { toastManager } from '@/utils/toastConfig';
import styles from './AdmissionPage.module.css';
import api from '@/api/axios';

// ----- Helpers -----
const generateRegistrationId = () => {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `REG${ts}${rand}`;
};

export default function NewAdmissionPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { classes: studentClasses } = useSelector((state: RootState) => state.student);
  const { settings, templates } = useSelector((state: RootState) => state.admission);

  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const draftSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formData, setFormData] = useState({
    registrationId: generateRegistrationId(),
    name: '',
    nameNative: '',
    studentGender: Gender.MALE,
    studentDateOfBirth: '',
    presentAddress: '',
    permanentAddress: '',
    religion: Religion.ISLAM,
    whatsappMobile: '',
    studentMobileNumber: '',
    instituteName: '',
    fathersName: '',
    mothersName: '',
    guardianMobileNumber: '',
    motherMobileNumber: '',
    admissionType: AdmissionType.MONTHLY,
    courseFee: 0,
    admissionFee: 0,
    tuitionFee: 0,
    referBy: '',
    admissionDate: new Date().toISOString().split('T')[0],
    remarks: '',
    batches: [] as AdmissionBatch[],
  });

  // Load classes and templates on mount
  useEffect(() => {
    dispatch(fetchStudentClasses());
    dispatch(fetchAdmissionTemplates());
  }, [dispatch]);

  // Load batches when class is selected
  useEffect(() => {
    if (!selectedClass) {
      setAvailableBatches([]);
      return;
    }
    setLoadingBatches(true);
    api.get(`/batches/class/${selectedClass}?limit=1000`)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        console.log('Available batches for class:', data);
        setAvailableBatches(data);
      })
      .catch(() => setAvailableBatches([]))
      .finally(() => setLoadingBatches(false));
  }, [selectedClass]);


  const activeSettings = useMemo(() => {
    const defaultFields = {
      nameNative: { isVisible: true, isRequired: false },
      studentDateOfBirth: { isVisible: true, isRequired: true },
      studentMobileNumber: { isVisible: true, isRequired: false },
      whatsappMobile: { isVisible: true, isRequired: false },
      fathersName: { isVisible: true, isRequired: true },
      mothersName: { isVisible: true, isRequired: false },
      motherMobileNumber: { isVisible: true, isRequired: false },
      presentAddress: { isVisible: true, isRequired: true },
      permanentAddress: { isVisible: true, isRequired: false },
      photo: { isVisible: true, isRequired: false },
      referBy: { isVisible: true, isRequired: false },
      remarks: { isVisible: true, isRequired: false },
    };
    if (selectedTemplateId) {
      const tmpl = templates.find(t => t._id === selectedTemplateId);
      if (tmpl) return tmpl.fields;
    }
    return settings?.fields || defaultFields;
  }, [selectedTemplateId, templates, settings]);

  const totalFee = useMemo(() => {
    return formData.admissionFee + formData.tuitionFee + formData.courseFee;
  }, [formData.admissionFee, formData.tuitionFee, formData.courseFee]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'admissionType') {
        if (value === AdmissionType.COURSE) {
          updated.admissionFee = 0;
          updated.tuitionFee = 0;
        } else if (value === AdmissionType.MONTHLY) {
          updated.courseFee = 0;
        }
      }
      // debounced draft save
      if (draftSaveTimerRef.current) clearTimeout(draftSaveTimerRef.current);
      draftSaveTimerRef.current = setTimeout(() => {
        dispatch(saveDraftForm({ registrationId: updated.registrationId, autoSavedRegistrationId: null, formData: updated }));
      }, 500);
      return updated;
    });
    if (touched[field] && errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleClassSelect = (classId: string) => {
    setSelectedClass(classId);
    setAvailableBatches([]);
    setFormData(prev => ({ ...prev, batches: [] }));
  };

  const handleBatchToggle = (batch: any) => {
    setFormData(prev => {
      const isSelected = prev.batches.some(b => b.batch === batch._id);
      if (isSelected) {
        return { ...prev, batches: prev.batches.filter(b => b.batch !== batch._id) };
      }
      const newBatch: AdmissionBatch = {
        batch: batch._id,
        batchName: batch.batchName,
        batchId: batch.batchId,
        subjects: [],
        admissionFee: prev.admissionType === AdmissionType.COURSE ? 0 : (batch.admissionFee || 0),
        tuitionFee: prev.admissionType === AdmissionType.COURSE ? 0 : (batch.tuitionFee || 0),
        courseFee: prev.admissionType === AdmissionType.MONTHLY ? 0 : (batch.courseFee || 0),
      };
      return { ...prev, batches: [...prev.batches, newBatch] };
    });
  };

  const handleSubjectToggle = (batchId: string, subject: any) => {
    setFormData(prev => {
      const updatedBatches = prev.batches.map(b => {
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Student name is required';
    if (!formData.guardianMobileNumber.trim()) newErrors.guardianMobileNumber = "Guardian mobile is required";
    if (!formData.instituteName.trim()) newErrors.instituteName = "Institute name is required";
    if (activeSettings.fathersName?.isRequired && !formData.fathersName.trim()) newErrors.fathersName = "Father's name is required";
    if (activeSettings.presentAddress?.isRequired && !formData.presentAddress.trim()) newErrors.presentAddress = "Present address is required";
    if (activeSettings.studentDateOfBirth?.isRequired && !formData.studentDateOfBirth) newErrors.studentDateOfBirth = "Date of birth is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const studentPayload: CreateStudentDto = {
      registrationId: formData.registrationId,
      nameEnglish: formData.name,
      subunitCategory: formData.nameNative || undefined,
      gender: formData.studentGender,
      religion: formData.religion,
      dateOfBirth: formData.studentDateOfBirth || new Date().toISOString().split('T')[0],
      presentAddress: formData.presentAddress,
      permanentAddress: formData.permanentAddress || undefined,
      instituteName: formData.instituteName,
      fatherName: formData.fathersName,
      fatherMobileNumber: formData.guardianMobileNumber,
      motherName: formData.mothersName || undefined,
      motherMobileNumber: formData.motherMobileNumber || undefined,
      studentMobileNumber: formData.studentMobileNumber || undefined,
      whatsappMobile: formData.whatsappMobile || undefined,
      admissionType: formData.admissionType,
      admissionFee: formData.admissionFee,
      monthlyTuitionFee: formData.tuitionFee,
      courseFee: formData.courseFee,
      totalAmount: totalFee,
      paidAmount: 0,
      admissionDate: formData.admissionDate,
      referredBy: formData.referBy || undefined,
      remarks: formData.remarks || undefined,
      batch: formData.batches[0]?.batch || undefined,
      batches: formData.batches as any,
      class: selectedClass || '',
      status: StudentStatus.ACTIVE,
      isActive: true,
    };

    setLoading(true);
    const toastId = toastManager.showLoading('Registering student...');
    try {
      await dispatch(createStudent(studentPayload)).unwrap();
      dispatch(clearDraftForm());
      toastManager.updateToast(toastId, 'Student registered successfully!', 'success');
      // Reset form
      setFormData({
        registrationId: generateRegistrationId(),
        name: '', nameNative: '', studentGender: Gender.MALE, studentDateOfBirth: '',
        presentAddress: '', permanentAddress: '', religion: Religion.ISLAM,
        whatsappMobile: '', studentMobileNumber: '', instituteName: '', fathersName: '',
        mothersName: '', guardianMobileNumber: '', motherMobileNumber: '',
        admissionType: AdmissionType.MONTHLY, courseFee: 0, admissionFee: 0, tuitionFee: 0,
        referBy: '', admissionDate: new Date().toISOString().split('T')[0], remarks: '', batches: [],
      });
      setSelectedClass(''); setAvailableBatches([]); setErrors({}); setTouched({});
      // Redirect to students list after 1.5s
      setTimeout(() => router.push('/dashboard/students/lists'), 1500);
    } catch (error: any) {
      toastManager.safeUpdateToast(toastId, error.message || 'Failed to register student', 'error');
    } finally {
      setLoading(false);
    }
  };

  const safeClasses = Array.isArray(studentClasses) ? studentClasses : [];
  const safeBatches = Array.isArray(availableBatches) ? availableBatches : [];

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1 className={styles.pageTitle}>New Admission</h1>
            <p className={styles.pageSubtitle}>Register a new student to your institution</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Template Select */}
            {templates.length > 0 && (
              <select
                value={selectedTemplateId}
                onChange={e => setSelectedTemplateId(e.target.value)}
                style={{ padding: '10px 16px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', fontWeight: 600, color: '#374151', background: 'white', cursor: 'pointer' }}
              >
                <option value=''>Default Form Fields</option>
                {templates.map(t => (
                  <option key={t._id} value={t._id}>{t.templateName}</option>
                ))}
              </select>
            )}
            <button type="button" onClick={() => router.push('/dashboard/students/lists')} className={styles.btnSecondary}>
              View Students List
            </button>
          </div>
        </div>
      </div>

      {/* Inline Form */}
      <div style={{ padding: '0 0 40px 0' }}>
        <form onSubmit={handleSubmit}>

          {/* Academic Information */}
          <div className={styles.formSectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>🎓</div>
              <h3 className={styles.sectionTitle}>Academic Information</h3>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.label}>Registration ID</label>
                <input type="text" value={formData.registrationId} readOnly className={`${styles.input} ${styles.readOnly}`} />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Admission Type <span style={{ color: '#ef4444' }}>*</span></label>
                <select value={formData.admissionType} onChange={e => handleChange('admissionType', e.target.value)} className={styles.input}>
                  <option value={AdmissionType.MONTHLY}>Monthly</option>
                  <option value={AdmissionType.COURSE}>Course</option>
                </select>
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>1. Select Class</label>
                <select value={selectedClass} onChange={e => handleClassSelect(e.target.value)} className={styles.input} disabled={safeClasses.length === 0}>
                  <option value="">Select class</option>
                  {safeClasses.map(cls => <option key={cls._id} value={cls._id}>{cls.classname}</option>)}
                </select>
              </div>
              {selectedClass && (
                <div className={styles.formFieldFull} style={{ marginTop: '8px' }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                    {/* Step 2: Select Batches */}
                    <div style={{ marginBottom: '16px' }}>
                      <label className={styles.label} style={{ marginBottom: '8px', display: 'block' }}>
                        2. Select Batches <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      {loadingBatches ? (
                        <div style={{ color: '#64748b', fontSize: '14px' }}>Loading batches...</div>
                      ) : safeBatches.length === 0 ? (
                        <div style={{ color: '#ef4444', fontSize: '14px' }}>No batches available for this class</div>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                          {safeBatches.map(b => (
                            <label key={b._id} style={{
                              display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                              background: formData.batches.some(fb => fb.batch === b._id) ? '#ede9fe' : 'white',
                              padding: '10px 14px',
                              border: `2px solid ${formData.batches.some(fb => fb.batch === b._id) ? '#8b5cf6' : '#cbd5e1'}`,
                              borderRadius: '8px', transition: 'all 0.2s',
                              boxShadow: formData.batches.some(fb => fb.batch === b._id) ? '0 2px 6px rgba(139,92,246,0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
                            }}>
                              <input
                                type="checkbox"
                                checked={formData.batches.some(fb => fb.batch === b._id)}
                                onChange={() => handleBatchToggle(b)}
                                style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#8b5cf6' }}
                              />
                              <span style={{ fontSize: '14px', fontWeight: 600, color: formData.batches.some(fb => fb.batch === b._id) ? '#4c1d95' : '#334155' }}>
                                {b.batchName} <span style={{ fontWeight: 400, color: '#64748b', fontSize: '12px' }}>({b.sessionYear})</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Step 3: Select Subjects per Batch */}
                    {formData.batches.length > 0 && (
                      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                        <label className={styles.label} style={{ marginBottom: '10px', display: 'block' }}>
                          3. Select Subjects
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                          {formData.batches.map(batchObj => {
                            const batchData = safeBatches.find(b => b._id === batchObj.batch);
                            if (!batchData) return null;
                            // Normalize subject — may be { _id, subjectName } object or a raw string ID
                            const rawSubject = batchData.subject;
                            const batchSubjects: Array<{ _id: string; subjectName: string }> = [];
                            if (rawSubject) {
                              if (typeof rawSubject === 'object' && rawSubject._id) {
                                batchSubjects.push({ _id: String(rawSubject._id), subjectName: rawSubject.subjectName || 'Subject' });
                              } else if (typeof rawSubject === 'string') {
                                batchSubjects.push({ _id: rawSubject, subjectName: 'Subject' });
                              }
                            }
                            if (batchSubjects.length === 0) {
                              return (
                                <div key={batchObj.batch} style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic', padding: '6px 12px', background: '#f1f5f9', borderRadius: '6px' }}>
                                  No subjects for {batchObj.batchName}
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
                                  boxShadow: isSelected ? '0 2px 4px rgba(139,92,246,0.15)' : 'none',
                                }}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleSubjectToggle(batchObj.batch, subj)}
                                    style={{ cursor: 'pointer', width: '14px', height: '14px', accentColor: '#8b5cf6' }}
                                  />
                                  <span style={{ fontSize: '14px', fontWeight: 600, color: isSelected ? '#4c1d95' : '#475569' }}>
                                    {subj.subjectName} <span style={{ fontWeight: 400, opacity: 0.7, fontSize: '12px' }}>({batchObj.batchName})</span>
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
              )}
              <div className={styles.formField}>
                <label className={styles.label}>Admission Date</label>
                <input type="date" value={formData.admissionDate} onChange={e => handleChange('admissionDate', e.target.value)} className={styles.input} />
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className={styles.formSectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>👤</div>
              <h3 className={styles.sectionTitle}>Personal Information</h3>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.label}>Student Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)} onBlur={() => setTouched(p => ({ ...p, name: true }))} className={`${styles.input} ${errors.name ? styles.inputError : ''}`} placeholder="Full name in English" />
                {errors.name && <div className={styles.errorMessage}>{errors.name}</div>}
              </div>
              {activeSettings.nameNative?.isVisible && (
                <div className={styles.formField}>
                  <label className={styles.label}>Name (Bangla)</label>
                  <input type="text" value={formData.nameNative} onChange={e => handleChange('nameNative', e.target.value)} className={styles.input} placeholder="বাংলায় নাম" />
                </div>
              )}
              <div className={styles.formField}>
                <label className={styles.label}>Institute Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" value={formData.instituteName} onChange={e => handleChange('instituteName', e.target.value)} onBlur={() => setTouched(p => ({ ...p, instituteName: true }))} className={`${styles.input} ${errors.instituteName ? styles.inputError : ''}`} placeholder="School / College name" />
                {errors.instituteName && <div className={styles.errorMessage}>{errors.instituteName}</div>}
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Gender</label>
                <select value={formData.studentGender} onChange={e => handleChange('studentGender', e.target.value)} className={styles.input}>
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
              {activeSettings.studentDateOfBirth?.isVisible && (
                <div className={styles.formField}>
                  <label className={styles.label}>Date of Birth {activeSettings.studentDateOfBirth.isRequired && <span style={{ color: '#ef4444' }}>*</span>}</label>
                  <input type="date" value={formData.studentDateOfBirth} onChange={e => handleChange('studentDateOfBirth', e.target.value)} className={`${styles.input} ${errors.studentDateOfBirth ? styles.inputError : ''}`} />
                  {errors.studentDateOfBirth && <div className={styles.errorMessage}>{errors.studentDateOfBirth}</div>}
                </div>
              )}
              {activeSettings.studentMobileNumber?.isVisible && (
                <div className={styles.formField}>
                  <label className={styles.label}>Student Mobile</label>
                  <input type="tel" value={formData.studentMobileNumber} onChange={e => handleChange('studentMobileNumber', e.target.value)} className={styles.input} placeholder="01XXXXXXXXX" />
                </div>
              )}
              {activeSettings.whatsappMobile?.isVisible && (
                <div className={styles.formField}>
                  <label className={styles.label}>WhatsApp Number</label>
                  <input type="tel" value={formData.whatsappMobile} onChange={e => handleChange('whatsappMobile', e.target.value)} className={styles.input} placeholder="01XXXXXXXXX" />
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className={styles.formSectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>📞</div>
              <h3 className={styles.sectionTitle}>Contact Information</h3>
            </div>
            <div className={styles.formGrid}>
              {activeSettings.fathersName?.isVisible && (
                <div className={styles.formField}>
                  <label className={styles.label}>Father's Name {activeSettings.fathersName.isRequired && <span style={{ color: '#ef4444' }}>*</span>}</label>
                  <input type="text" value={formData.fathersName} onChange={e => handleChange('fathersName', e.target.value)} className={`${styles.input} ${errors.fathersName ? styles.inputError : ''}`} placeholder="Father's full name" />
                  {errors.fathersName && <div className={styles.errorMessage}>{errors.fathersName}</div>}
                </div>
              )}
              <div className={styles.formField}>
                <label className={styles.label}>Guardian Mobile <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="tel" value={formData.guardianMobileNumber} onChange={e => handleChange('guardianMobileNumber', e.target.value)} onBlur={() => setTouched(p => ({ ...p, guardianMobileNumber: true }))} className={`${styles.input} ${errors.guardianMobileNumber ? styles.inputError : ''}`} placeholder="01XXXXXXXXX" />
                {errors.guardianMobileNumber && <div className={styles.errorMessage}>{errors.guardianMobileNumber}</div>}
              </div>
              {activeSettings.mothersName?.isVisible && (
                <div className={styles.formField}>
                  <label className={styles.label}>Mother's Name</label>
                  <input type="text" value={formData.mothersName} onChange={e => handleChange('mothersName', e.target.value)} className={styles.input} placeholder="Mother's full name" />
                </div>
              )}
              {activeSettings.motherMobileNumber?.isVisible && (
                <div className={styles.formField}>
                  <label className={styles.label}>Mother's Mobile</label>
                  <input type="tel" value={formData.motherMobileNumber} onChange={e => handleChange('motherMobileNumber', e.target.value)} className={styles.input} placeholder="01XXXXXXXXX" />
                </div>
              )}
            </div>
          </div>

          {/* Address Details */}
          {(activeSettings.presentAddress?.isVisible || activeSettings.permanentAddress?.isVisible) && (
            <div className={styles.formSectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>🏠</div>
                <h3 className={styles.sectionTitle}>Address Details</h3>
              </div>
              <div className={styles.formGrid}>
                {activeSettings.presentAddress?.isVisible && (
                  <div className={styles.formFieldFull}>
                    <label className={styles.label}>Present Address {activeSettings.presentAddress.isRequired && <span style={{ color: '#ef4444' }}>*</span>}</label>
                    <textarea value={formData.presentAddress} onChange={e => handleChange('presentAddress', e.target.value)} className={`${styles.textarea} ${errors.presentAddress ? styles.inputError : ''}`} rows={2} placeholder="Current address" />
                    {errors.presentAddress && <div className={styles.errorMessage}>{errors.presentAddress}</div>}
                  </div>
                )}
                {activeSettings.permanentAddress?.isVisible && (
                  <div className={styles.formFieldFull}>
                    <label className={styles.label}>Permanent Address</label>
                    <textarea value={formData.permanentAddress} onChange={e => handleChange('permanentAddress', e.target.value)} className={styles.textarea} rows={2} placeholder="Permanent address (if different)" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fee Information */}
          <div className={styles.formSectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>💰</div>
              <h3 className={styles.sectionTitle}>Fee Information</h3>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.label}>Admission Fee</label>
                <input type="number" value={formData.admissionFee} onChange={e => handleChange('admissionFee', Number(e.target.value) || 0)} className={styles.input} placeholder="0" min="0" disabled={formData.admissionType === AdmissionType.COURSE} />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Tuition Fee</label>
                <input type="number" value={formData.tuitionFee} onChange={e => handleChange('tuitionFee', Number(e.target.value) || 0)} className={styles.input} placeholder="0" min="0" disabled={formData.admissionType === AdmissionType.COURSE} />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Course Fee</label>
                <input type="number" value={formData.courseFee} onChange={e => handleChange('courseFee', Number(e.target.value) || 0)} className={styles.input} placeholder="0" min="0" disabled={formData.admissionType === AdmissionType.MONTHLY} />
              </div>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981', marginTop: '16px', padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'right' }}>
              Total Fee: {formatCurrency(totalFee)}
            </div>
          </div>

          {/* Additional Info */}
          {(activeSettings.referBy?.isVisible || activeSettings.remarks?.isVisible) && (
            <div className={styles.formSectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>📝</div>
                <h3 className={styles.sectionTitle}>Additional Information</h3>
              </div>
              <div className={styles.formGrid}>
                {activeSettings.referBy?.isVisible && (
                  <div className={styles.formField}>
                    <label className={styles.label}>Referred By</label>
                    <input type="text" value={formData.referBy} onChange={e => handleChange('referBy', e.target.value)} className={styles.input} placeholder="Person who referred" />
                  </div>
                )}
                {activeSettings.remarks?.isVisible && (
                  <div className={styles.formFieldFull}>
                    <label className={styles.label}>Remarks</label>
                    <textarea value={formData.remarks} onChange={e => handleChange('remarks', e.target.value)} className={styles.textarea} rows={2} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', paddingTop: '8px' }}>
            <button type="button" onClick={() => router.push('/dashboard/students/lists')} className={styles.btnSecondary} disabled={loading}>Cancel</button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                dispatch(saveDraftForm({ registrationId: formData.registrationId, autoSavedRegistrationId: null, formData: { ...formData } }));
                alert('Draft saved locally!');
              }}
              style={{ padding: '14px 24px', border: '2px solid #f59e0b', background: 'white', color: '#d97706', borderRadius: '10px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
            >
              💾 Save Draft
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Registering...' : '✓ Submit Admission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
