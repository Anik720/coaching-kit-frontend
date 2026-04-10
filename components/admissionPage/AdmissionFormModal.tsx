"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import {
  fetchAdmissionTemplates,
  createAdmission,
  updateAdmission,
  saveDraftForm,
  clearDraftForm,
} from '@/api/admissionApi/admissionSlice';
import {
  AdmissionItem,
  AdmissionStatus,
  AdmissionType,
  Gender,
  Religion,
  AdmissionBatch,
  BatchForDropdown,
  ClassForDropdown,
  GroupForDropdown,
  FormFields,
  AdmissionFormDraft,
} from '@/api/admissionApi/types/admission.types';
import { subjectsFromBatchEntry } from '@/utils/batchSubjectsFromApi';
import styles from './AdmissionPage.module.css';

interface AdmissionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: AdmissionItem | null;
  loading: boolean;
  isEditing: boolean;
  batches?: any[];
  classes: any[];
  groups?: any[];
  subjects?: any[];
  dropdownsLoaded: boolean;
  fetchBatchesByClass: (classId: string) => Promise<any[]>;
}

// Default fallback settings matching the backend
const defaultFields: FormFields = {
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

export default function AdmissionFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading,
  isEditing,
  classes,
  dropdownsLoaded,
  fetchBatchesByClass,
}: AdmissionFormModalProps) {
  const dispatch = useDispatch<AppDispatch>();

  // Get settings, templates, and draftForm from Redux store
  const { settings, templates, draftForm } = useSelector((state: RootState) => state.admission);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  const [draftRestored, setDraftRestored] = useState(false);

  // Refs for debouncing
  const draftSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // LOGIC: Determine active field visibility based on Template OR Global Settings
  const activeSettings = useMemo(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t._id === selectedTemplateId);
      if (template) return template.fields;
    }
    return settings?.fields || defaultFields;
  }, [selectedTemplateId, templates, settings]);

  // Form state
  const [formData, setFormData] = useState({
    registrationId: '',
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
    photo: null as File | null,
    batches: [] as AdmissionBatch[],
  });

  const [selectedClass, setSelectedClass] = useState<string>('');
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Fetch templates when modal opens
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchAdmissionTemplates());
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (initialData) {
      // Editing existing admission - populate from initialData
      setFormData({
        registrationId: initialData.registrationId,
        name: initialData.name,
        nameNative: initialData.nameNative || '',
        studentGender: initialData.studentGender,
        studentDateOfBirth: initialData.studentDateOfBirth?.split('T')[0] || '',
        presentAddress: initialData.presentAddress || '',
        permanentAddress: initialData.permanentAddress || '',
        religion: initialData.religion,
        whatsappMobile: initialData.whatsappMobile || '',
        studentMobileNumber: initialData.studentMobileNumber || '',
        instituteName: initialData.instituteName,
        fathersName: initialData.fathersName || '',
        mothersName: initialData.mothersName || '',
        guardianMobileNumber: initialData.guardianMobileNumber,
        motherMobileNumber: initialData.motherMobileNumber || '',
        admissionType: initialData.admissionType,
        courseFee: initialData.courseFee || 0,
        admissionFee: initialData.admissionFee || 0,
        tuitionFee: initialData.tuitionFee || 0,
        referBy: initialData.referBy || '',
        admissionDate: initialData.admissionDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        remarks: initialData.remarks || '',
        photo: null,
        batches: initialData.batches || [],
      });
      setDraftRestored(false);
    } else {
      // New admission - check if we have a draft to restore
      if (draftForm && isOpen) {
        // Restore from draft
        setFormData({
          registrationId: draftForm.registrationId,
          name: draftForm.formData.name,
          nameNative: draftForm.formData.nameNative,
          studentGender: draftForm.formData.studentGender as Gender,
          studentDateOfBirth: draftForm.formData.studentDateOfBirth,
          presentAddress: draftForm.formData.presentAddress,
          permanentAddress: draftForm.formData.permanentAddress,
          religion: draftForm.formData.religion as Religion,
          whatsappMobile: draftForm.formData.whatsappMobile,
          studentMobileNumber: draftForm.formData.studentMobileNumber,
          instituteName: draftForm.formData.instituteName,
          fathersName: draftForm.formData.fathersName,
          mothersName: draftForm.formData.mothersName,
          guardianMobileNumber: draftForm.formData.guardianMobileNumber,
          motherMobileNumber: draftForm.formData.motherMobileNumber,
          admissionType: draftForm.formData.admissionType as AdmissionType,
          courseFee: draftForm.formData.courseFee,
          admissionFee: draftForm.formData.admissionFee,
          tuitionFee: draftForm.formData.tuitionFee,
          referBy: draftForm.formData.referBy,
          admissionDate: draftForm.formData.admissionDate,
          remarks: draftForm.formData.remarks,
          photo: null,
          batches: draftForm.formData.batches,
        });
        setDraftRestored(true);
      } else {
        // Fresh new form
        const timestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const generatedId = `REG${timestamp.toString().slice(-6)}${randomNum}`;

        setFormData(prev => ({
          ...prev,
          registrationId: generatedId,
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
          photo: null,
          batches: [],
        }));
        setDraftRestored(false);
      }
      setSelectedClass('');
      setAvailableBatches([]);
      setSelectedTemplateId('');
    }

    setErrors({});
    setTouched({});
  }, [initialData, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save to backend removed based on user request



  useEffect(() => {
    const fetchBatchesForClass = async () => {
      if (!selectedClass) {
        setAvailableBatches([]);
        return;
      }

      setLoadingBatches(true);
      try {
        const classBatches = await fetchBatchesByClass(selectedClass);
        setAvailableBatches(classBatches);
      } catch (error) {
        setAvailableBatches([]);
      } finally {
        setLoadingBatches(false);
      }
    };

    fetchBatchesForClass();
  }, [selectedClass, fetchBatchesByClass]);

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

      // Save draft to Redux (debounced, skip photo field)
      if (draftSaveTimerRef.current) {
        clearTimeout(draftSaveTimerRef.current);
      }
      draftSaveTimerRef.current = setTimeout(() => {
        if (!isEditing) {
          const { photo: _photo, ...serializableData } = updated;
          dispatch(saveDraftForm({
            registrationId: updated.registrationId,
            autoSavedRegistrationId: null,
            formData: serializableData,
          }));
        }
      }, 500);

      return updated;
    });

    if (touched[field] && errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Core Base Validation
    if (!formData.name) newErrors.name = 'Student Name is required';
    if (!formData.instituteName) newErrors.instituteName = 'Institute Name is required';
    if (!formData.guardianMobileNumber) newErrors.guardianMobileNumber = 'Guardian Mobile is required';
    if (!formData.admissionDate) newErrors.admissionDate = 'Admission Date is required';

    // Dynamic Validation based on active template/settings
    if (activeSettings.nameNative.isVisible && activeSettings.nameNative.isRequired && !formData.nameNative)
      newErrors.nameNative = "Native Name is required";
    if (activeSettings.studentDateOfBirth.isVisible && activeSettings.studentDateOfBirth.isRequired && !formData.studentDateOfBirth)
      newErrors.studentDateOfBirth = "Date of Birth is required";
    if (activeSettings.studentMobileNumber.isVisible && activeSettings.studentMobileNumber.isRequired && !formData.studentMobileNumber)
      newErrors.studentMobileNumber = "Student Mobile is required";
    if (activeSettings.whatsappMobile.isVisible && activeSettings.whatsappMobile.isRequired && !formData.whatsappMobile)
      newErrors.whatsappMobile = "WhatsApp Mobile is required";
    if (activeSettings.fathersName.isVisible && activeSettings.fathersName.isRequired && !formData.fathersName)
      newErrors.fathersName = "Father's Name is required";
    if (activeSettings.mothersName.isVisible && activeSettings.mothersName.isRequired && !formData.mothersName)
      newErrors.mothersName = "Mother's Name is required";
    if (activeSettings.motherMobileNumber.isVisible && activeSettings.motherMobileNumber.isRequired && !formData.motherMobileNumber)
      newErrors.motherMobileNumber = "Mother's Mobile is required";
    if (activeSettings.presentAddress.isVisible && activeSettings.presentAddress.isRequired && !formData.presentAddress)
      newErrors.presentAddress = "Present Address is required";
    if (activeSettings.permanentAddress.isVisible && activeSettings.permanentAddress.isRequired && !formData.permanentAddress)
      newErrors.permanentAddress = "Permanent Address is required";
    if (activeSettings.referBy.isVisible && activeSettings.referBy.isRequired && !formData.referBy)
      newErrors.referBy = "Refer By is required";
    if (activeSettings.remarks.isVisible && activeSettings.remarks.isRequired && !formData.remarks)
      newErrors.remarks = "Remarks is required";
    if (activeSettings.photo.isVisible && activeSettings.photo.isRequired && !formData.photo)
      newErrors.photo = "Photo is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClassSelect = (classId: string) => {
    setSelectedClass(classId);
    setAvailableBatches([]);
    setFormData(prev => ({ ...prev, batches: [] }));
  };

  const handleBatchToggle = (batchData: any) => {
    setFormData(prev => {
      const isSelected = prev.batches.some(b => b.batch === batchData._id);
      let newBatches;
      
      if (isSelected) {
        newBatches = prev.batches.filter(b => b.batch !== batchData._id);
      } else {
        const newBatch: AdmissionBatch = {
          batch: batchData._id,
          batchName: batchData.batchName,
          batchId: batchData.batchId || batchData._id,
          subjects: [],
          admissionFee: 0,
          tuitionFee: 0,
          courseFee: 0,
        };
        newBatches = [...prev.batches, newBatch];
      }

      return { ...prev, batches: newBatches };
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleChange('photo', file);
      setErrors(prev => ({ ...prev, photo: '' }));
    }
  };



  const handleClearDraft = () => {
    dispatch(clearDraftForm());
    setDraftRestored(false);

    // Reset to fresh form
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const generatedId = `REG${timestamp.toString().slice(-6)}${randomNum}`;

    setFormData(prev => ({
      ...prev,
      registrationId: generatedId,
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
      photo: null,
      batches: [],
    }));
    setSelectedClass('');
    setAvailableBatches([]);
    setErrors({});
    setTouched({});
  };

  const totalFee = useMemo(() => {
    return formData.batches.reduce((sum, batch) => sum + (batch.admissionFee + batch.tuitionFee + batch.courseFee), 0) || (formData.admissionFee + formData.tuitionFee + formData.courseFee);
  }, [formData.batches, formData.admissionFee, formData.tuitionFee, formData.courseFee]);

  const submitData = (isDraft: boolean) => {
    if (!validateForm()) return;
    const submissionData = {
      ...formData,
      totalFee,
      dueAmount: totalFee - (initialData?.paidAmount || 0),
      status: isDraft
        ? AdmissionStatus.INCOMPLETE
        : (initialData?.status === AdmissionStatus.INCOMPLETE
          ? AdmissionStatus.PENDING
          : (initialData?.status || AdmissionStatus.PENDING)),
      _autoSavedRegistrationId: null,
    };

    if (!isDraft) {
      // Clear draft from Redux on full submit
      dispatch(clearDraftForm());
    }

    onSubmit(submissionData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalExtraLarge} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleWrapper}>
            <h2 className={styles.modalTitle}>{isEditing ? 'Edit Admission' : 'Create New Admission'}</h2>
            <p className={styles.modalSubtitle}>Register a new student to your institution</p>
          </div>

          <button onClick={onClose} className={styles.modalClose} disabled={loading} type="button">✕</button>
        </div>

        {/* Draft Restored Banner */}
        {draftRestored && !isEditing && (
          <div style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '10px 16px',
            margin: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '14px',
            color: '#1e40af',
          }}>
            <span>
              <strong>Draft restored</strong> — your previous progress has been loaded.
            </span>
            <button
              type="button"
              onClick={handleClearDraft}
              style={{
                background: '#dbeafe',
                border: '1px solid #93c5fd',
                borderRadius: '6px',
                padding: '4px 12px',
                fontSize: '12px',
                color: '#1d4ed8',
                cursor: 'pointer',
                marginLeft: '12px',
                whiteSpace: 'nowrap',
              }}
            >
              Start Fresh
            </button>
          </div>
        )}

        {loading && <div className={styles.modalLoading}><div className={styles.spinnerLarge}></div><p>Processing...</p></div>}

        <form onSubmit={e => { e.preventDefault(); submitData(false); }} className={styles.modalForm}>
          <div className={styles.modalBody}>

            {/* TEMPLATE SELECTION CARD */}
            {!isEditing && (
              <div className={styles.formSectionCard} style={{ border: '2px solid #6366f1', background: '#f5f3ff', marginBottom: '24px' }}>
                <div className={styles.sectionHeader} style={{ borderBottomColor: '#ddd6fe' }}>
                  <div className={styles.sectionIcon}>📋</div>
                  <h3 className={styles.sectionTitle}>Apply Admission Template</h3>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Select a form structure (Optional)</label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className={styles.select}
                    disabled={loading}
                  >
                    <option value="">Default (Global Settings)</option>
                    {templates.map(template => (
                      <option key={template._id} value={template._id}>
                        {template.templateName}
                      </option>
                    ))}
                  </select>
                  <p style={{ fontSize: '12px', color: '#6366f1', marginTop: '8px' }}>
                    * Selecting a template will dynamically adjust visible and required fields.
                  </p>
                </div>
              </div>
            )}

            <div className={styles.formSectionsContainer}>
              {/* Section 1: Basic Information */}
              <div className={styles.formSectionCard}>
                <div className={styles.sectionHeader}><div className={styles.sectionIcon}>👤</div><h3 className={styles.sectionTitle}>Student Information</h3></div>
                <div className={styles.formGrid}>
                  <div className={styles.formField}><label className={styles.label}>Registration ID</label><input type="text" value={formData.registrationId} className={styles.input} disabled /></div>
                  <div className={styles.formField}>
                    <label className={styles.label}>Student Name <span className={styles.required}>*</span></label>
                    <input type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)} onBlur={() => handleBlur('name')} className={`${styles.input} ${errors.name ? styles.inputError : ''}`} required />
                    {errors.name && <div className={styles.errorMessage}>{errors.name}</div>}
                  </div>

                  {activeSettings.nameNative.isVisible && (
                    <div className={styles.formField}>
                      <label className={styles.label}>Name (Native) {activeSettings.nameNative.isRequired && '*'}</label>
                      <input type="text" value={formData.nameNative} onChange={e => handleChange('nameNative', e.target.value)} className={styles.input} />
                    </div>
                  )}

                  <div className={styles.formField}>
                    <label className={styles.label}>Gender</label>
                    <select value={formData.studentGender} onChange={e => handleChange('studentGender', e.target.value)} className={styles.select}>
                      {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  {activeSettings.studentDateOfBirth.isVisible && (
                    <div className={styles.formField}>
                      <label className={styles.label}>Date of Birth {activeSettings.studentDateOfBirth.isRequired && '*'}</label>
                      <input type="date" value={formData.studentDateOfBirth} onChange={e => handleChange('studentDateOfBirth', e.target.value)} className={styles.input} />
                    </div>
                  )}

                  <div className={styles.formField}>
                    <label className={styles.label}>Religion</label>
                    <select value={formData.religion} onChange={e => handleChange('religion', e.target.value)} className={styles.select}>
                      {Object.values(Religion).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Contact Information */}
              <div className={styles.formSectionCard}>
                <div className={styles.sectionHeader}><div className={styles.sectionIcon}>📞</div><h3 className={styles.sectionTitle}>Contact Information</h3></div>
                <div className={styles.formGrid}>
                  <div className={styles.formField}><label className={styles.label}>Guardian Mobile <span className={styles.required}>*</span></label><input type="tel" value={formData.guardianMobileNumber} onChange={e => handleChange('guardianMobileNumber', e.target.value)} className={styles.input} required /></div>
                  {activeSettings.whatsappMobile.isVisible && (
                    <div className={styles.formField}><label className={styles.label}>WhatsApp {activeSettings.whatsappMobile.isRequired && '*'}</label><input type="tel" value={formData.whatsappMobile} onChange={e => handleChange('whatsappMobile', e.target.value)} className={styles.input} /></div>
                  )}
                  {activeSettings.studentMobileNumber.isVisible && (
                    <div className={styles.formField}><label className={styles.label}>Student Mobile {activeSettings.studentMobileNumber.isRequired && '*'}</label><input type="tel" value={formData.studentMobileNumber} onChange={e => handleChange('studentMobileNumber', e.target.value)} className={styles.input} /></div>
                  )}
                </div>
              </div>

              {/* Section 3: Family Info */}
              {(activeSettings.fathersName.isVisible || activeSettings.mothersName.isVisible || activeSettings.motherMobileNumber.isVisible) && (
                <div className={styles.formSectionCard}>
                  <div className={styles.sectionHeader}><div className={styles.sectionIcon}>👨‍👩‍👧‍👦</div><h3 className={styles.sectionTitle}>Family Information</h3></div>
                  <div className={styles.formGrid}>
                    {activeSettings.fathersName.isVisible && (
                      <div className={styles.formField}><label className={styles.label}>Father's Name {activeSettings.fathersName.isRequired && '*'}</label><input type="text" value={formData.fathersName} onChange={e => handleChange('fathersName', e.target.value)} className={styles.input} /></div>
                    )}
                    {activeSettings.mothersName.isVisible && (
                      <div className={styles.formField}><label className={styles.label}>Mother's Name {activeSettings.mothersName.isRequired && '*'}</label><input type="text" value={formData.mothersName} onChange={e => handleChange('mothersName', e.target.value)} className={styles.input} /></div>
                    )}
                    {activeSettings.motherMobileNumber.isVisible && (
                      <div className={styles.formField}><label className={styles.label}>Mother's Mobile {activeSettings.motherMobileNumber.isRequired && '*'}</label><input type="tel" value={formData.motherMobileNumber} onChange={e => handleChange('motherMobileNumber', e.target.value)} className={styles.input} /></div>
                    )}
                  </div>
                </div>
              )}

              {/* Section 4: Address */}
              {(activeSettings.presentAddress.isVisible || activeSettings.permanentAddress.isVisible) && (
                <div className={styles.formSectionCard}>
                  <div className={styles.sectionHeader}><div className={styles.sectionIcon}>🏠</div><h3 className={styles.sectionTitle}>Address Details</h3></div>
                  <div className={styles.formGrid}>
                    {activeSettings.presentAddress.isVisible && (
                      <div className={styles.formFieldFull}><label className={styles.label}>Present Address {activeSettings.presentAddress.isRequired && '*'}</label><textarea value={formData.presentAddress} onChange={e => handleChange('presentAddress', e.target.value)} className={styles.textarea} rows={2} /></div>
                    )}
                    {activeSettings.permanentAddress.isVisible && (
                      <div className={styles.formFieldFull}><label className={styles.label}>Permanent Address {activeSettings.permanentAddress.isRequired && '*'}</label><textarea value={formData.permanentAddress} onChange={e => handleChange('permanentAddress', e.target.value)} className={styles.textarea} rows={2} /></div>
                    )}
                  </div>
                </div>
              )}

              {/* Section 5: Academic & Batch */}
              <div className={styles.formSectionCard}>
                <div className={styles.sectionHeader}><div className={styles.sectionIcon}>🎓</div><h3 className={styles.sectionTitle}>Academic Information</h3></div>
                <div className={styles.formGrid} style={{ marginBottom: '20px' }}>
                  <div className={styles.formField}>
                    <label className={styles.label}>Admission Type</label>
                    <select value={formData.admissionType} onChange={e => handleChange('admissionType', e.target.value as AdmissionType)} className={styles.select}>
                      {Object.values(AdmissionType).map(type => (
                        <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formField}><label className={styles.label}>Institute Name <span className={styles.required}>*</span></label><input type="text" value={formData.instituteName} onChange={e => handleChange('instituteName', e.target.value)} className={styles.input} required /></div>
                  <div className={styles.formField}><label className={styles.label}>Admission Date <span className={styles.required}>*</span></label><input type="date" value={formData.admissionDate} onChange={e => handleChange('admissionDate', e.target.value)} className={styles.input} required /></div>
                </div>

                {!dropdownsLoaded ? <p>Loading classes...</p> : (
                  <div className={styles.batchSelectionFlow}>
                    <div className={styles.selectionStep}>
                      <span className={styles.stepTitle}>1. Select Class</span>
                      <select value={selectedClass} onChange={e => handleClassSelect(e.target.value)} className={styles.select}>
                        <option value="">Choose Class</option>
                        {classes.map(c => <option key={c._id} value={c._id}>{c.classname}</option>)}
                      </select>
                    </div>
                    {selectedClass && (
                      <div className={styles.selectionStep}>
                        <span className={styles.stepTitle}>2. Select Batches <span className={styles.required}>*</span></span>
                        {loadingBatches ? <p>Loading...</p> : availableBatches.length === 0 ? <p style={{color: '#ef4444'}}>No batches available</p> : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
                            {availableBatches.map(b => (
                              <label key={b._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'white', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                <input
                                  type="checkbox"
                                  checked={formData.batches.some(fb => fb.batch === b._id)}
                                  onChange={() => handleBatchToggle(b)}
                                  style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                                />
                                <span style={{ fontSize: '15px', fontWeight: 500, color: '#334155' }}>
                                  {b.batchName}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {formData.batches && formData.batches.length > 0 && (
                      <div className={styles.selectionStep} style={{borderTop: '1px solid #e2e8f0', paddingTop: '16px'}}>
                        <span className={styles.stepTitle}>3. Select Subjects</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px' }}>
                          {formData.batches.map(batchObj => {
                            const batchData = availableBatches.find(b => b._id === batchObj.batch);
                            if (!batchData) return null;

                            const batchSubjects = subjectsFromBatchEntry(batchData);

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
                )}
              </div>

              {/* Fee Summary */}
              <div className={styles.formSectionCard}>
                <div className={styles.sectionHeader}><div className={styles.sectionIcon}>💰</div><h3 className={styles.sectionTitle}>Fee Information</h3></div>
                <div className={styles.formGrid}>
                  <div className={styles.formField}>
                    <label className={styles.label}>Admission Fee</label>
                    <input type="number" value={formData.admissionFee} onChange={e => handleChange('admissionFee', Number(e.target.value) || 0)} className={`${styles.input} ${errors.admissionFee ? styles.inputError : ''}`} placeholder="0" min="0" disabled={formData.admissionType === AdmissionType.COURSE} />
                    {errors.admissionFee && <div className={styles.errorMessage}>{errors.admissionFee}</div>}
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.label}>Tuition Fee</label>
                    <input type="number" value={formData.tuitionFee} onChange={e => handleChange('tuitionFee', Number(e.target.value) || 0)} className={`${styles.input} ${errors.tuitionFee ? styles.inputError : ''}`} placeholder="0" min="0" disabled={formData.admissionType === AdmissionType.COURSE} />
                    {errors.tuitionFee && <div className={styles.errorMessage}>{errors.tuitionFee}</div>}
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.label}>Course Fee</label>
                    <input type="number" value={formData.courseFee} onChange={e => handleChange('courseFee', Number(e.target.value) || 0)} className={`${styles.input} ${errors.courseFee ? styles.inputError : ''}`} placeholder="0" min="0" disabled={formData.admissionType === AdmissionType.MONTHLY} />
                    {errors.courseFee && <div className={styles.errorMessage}>{errors.courseFee}</div>}
                  </div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981', marginTop: '16px', padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'right' }}>
                  Total Fee: {formatCurrency(totalFee)}
                </div>
              </div>

              {/* Additional Details */}
              {(activeSettings.remarks.isVisible || activeSettings.photo.isVisible || activeSettings.referBy.isVisible) && (
                <div className={styles.formSectionCard}>
                  <div className={styles.sectionHeader}><div className={styles.sectionIcon}>📝</div><h3 className={styles.sectionTitle}>Additional Information</h3></div>
                  <div className={styles.formGrid}>
                    {activeSettings.referBy.isVisible && (
                      <div className={styles.formField}><label className={styles.label}>Refer By {activeSettings.referBy.isRequired && '*'}</label><input type="text" value={formData.referBy} onChange={e => handleChange('referBy', e.target.value)} className={styles.input} /></div>
                    )}
                    {activeSettings.remarks.isVisible && (
                      <div className={styles.formFieldFull}><label className={styles.label}>Remarks</label><textarea value={formData.remarks} onChange={e => handleChange('remarks', e.target.value)} className={styles.textarea} rows={2} /></div>
                    )}
                    {activeSettings.photo.isVisible && (
                      <div className={styles.formField}><label className={styles.label}>Photo</label><input type="file" accept="image/*" onChange={handleFileChange} /></div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.btnSecondary} disabled={loading}>Cancel</button>
            <button type="button" onClick={() => submitData(true)} className={styles.btnDraft} disabled={loading}>Save Draft</button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Processing...' : (isEditing ? 'Update Admission' : 'Submit Admission')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
