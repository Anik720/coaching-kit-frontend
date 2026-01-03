"use client";

import { useState, useEffect, useRef } from "react";
import styles from './AdmissionPage.module.css';
import {
  CreateAdmissionDto,
  UpdateAdmissionDto,
  AdmissionItem,
  Gender,
  Religion,
  AdmissionType,
  AdmissionBatch,
  BatchSubject,
} from "@/api/admissionApi/types/admission.types";

interface AdmissionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAdmissionDto | UpdateAdmissionDto) => void;
  initialData?: AdmissionItem | null;
  loading: boolean;
  isEditing: boolean;
}

interface FormData {
  registrationId: string;
  name: string;
  nameNative: string;
  studentGender: Gender;
  studentDateOfBirth: string;
  presentAddress: string;
  permanentAddress: string;
  religion: Religion;
  whatsappMobile: string;
  studentMobileNumber: string;
  instituteName: string;
  fathersName: string;
  mothersName: string;
  guardianMobileNumber: string;
  motherMobileNumber: string;
  admissionType: AdmissionType;
  courseFee: string;
  admissionFee: string;
  tuitionFee: string;
  referBy: string;
  admissionDate: string;
  batches: AdmissionBatch[];
  remarks: string;
  photo: File | null;
}

const initialFormData: FormData = {
  registrationId: "",
  name: "",
  nameNative: "",
  studentGender: Gender.MALE,
  studentDateOfBirth: "",
  presentAddress: "",
  permanentAddress: "",
  religion: Religion.ISLAM,
  whatsappMobile: "",
  studentMobileNumber: "",
  instituteName: "",
  fathersName: "",
  mothersName: "",
  guardianMobileNumber: "",
  motherMobileNumber: "",
  admissionType: AdmissionType.MONTHLY,
  courseFee: "",
  admissionFee: "",
  tuitionFee: "",
  referBy: "",
  admissionDate: new Date().toISOString().split('T')[0],
  batches: [],
  remarks: "",
  photo: null,
};

export default function AdmissionFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading,
  isEditing,
}: AdmissionFormModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [batchData, setBatchData] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with initial data if editing
  useEffect(() => {
    if (initialData && isEditing) {
      setFormData({
        registrationId: initialData.registrationId,
        name: initialData.name,
        nameNative: initialData.nameNative || "",
        studentGender: initialData.studentGender,
        studentDateOfBirth: initialData.studentDateOfBirth 
          ? new Date(initialData.studentDateOfBirth).toISOString().split('T')[0]
          : "",
        presentAddress: initialData.presentAddress || "",
        permanentAddress: initialData.permanentAddress || "",
        religion: initialData.religion,
        whatsappMobile: initialData.whatsappMobile || "",
        studentMobileNumber: initialData.studentMobileNumber || "",
        instituteName: initialData.instituteName,
        fathersName: initialData.fathersName || "",
        mothersName: initialData.mothersName || "",
        guardianMobileNumber: initialData.guardianMobileNumber,
        motherMobileNumber: initialData.motherMobileNumber || "",
        admissionType: initialData.admissionType,
        courseFee: initialData.courseFee?.toString() || "",
        admissionFee: initialData.admissionFee?.toString() || "",
        tuitionFee: initialData.tuitionFee?.toString() || "",
        referBy: initialData.referBy || "",
        admissionDate: initialData.admissionDate
          ? new Date(initialData.admissionDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        batches: initialData.batches || [],
        remarks: initialData.remarks || "",
        photo: null,
      });
      
      // Set batch data for display
      if (initialData.batches && initialData.batches.length > 0) {
        const batchObj: any = {};
        initialData.batches.forEach((batch, index) => {
          batchObj[`batch-index-${index}`] = {
            batch_name: batch.batchName,
            batch_id: batch.batchId,
            subjects: batch.subjects.map(subject => ({
              subject_name: subject.subjectName,
              subject_id: subject.subjectId,
            })),
            admission_fee: batch.admissionFee,
            tution_fee: batch.tuitionFee,
            course_fee: batch.courseFee,
          };
        });
        setBatchData(JSON.stringify(batchObj, null, 2));
      }
    } else {
      setFormData(initialFormData);
      setBatchData("");
    }
  }, [initialData, isEditing]);

  if (!isOpen) return null;

  const validateField = (name: string, value: any): string => {
    if (!touched[name]) return "";
    
    switch (name) {
      case "registrationId":
        if (!value.trim()) return "Registration ID is required";
        if (value.trim().length < 3) return "Registration ID must be at least 3 characters";
        break;
      case "name":
        if (!value.trim()) return "Student name is required";
        if (value.trim().length < 2) return "Name must be at least 2 characters";
        break;
      case "instituteName":
        if (!value.trim()) return "Institute name is required";
        break;
      case "guardianMobileNumber":
        if (!value.trim()) return "Guardian mobile number is required";
        if (!/^01[3-9]\d{8}$/.test(value.trim())) {
          return "Please provide a valid Bangladeshi mobile number";
        }
        break;
      case "studentGender":
        if (!value) return "Gender is required";
        break;
      case "religion":
        if (!value) return "Religion is required";
        break;
      case "whatsappMobile":
      case "studentMobileNumber":
      case "motherMobileNumber":
        if (value.trim() && !/^01[3-9]\d{8}$/.test(value.trim())) {
          return "Please provide a valid Bangladeshi mobile number";
        }
        break;
      case "courseFee":
      case "admissionFee":
      case "tuitionFee":
        if (value && isNaN(parseFloat(value))) {
          return "Please enter a valid number";
        }
        if (parseFloat(value) < 0) {
          return "Amount cannot be negative";
        }
        break;
      case "admissionDate":
      case "studentDateOfBirth":
        if (value) {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            return "Invalid date format";
          }
        }
        break;
    }
    
    return "";
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const requiredFields = ["registrationId", "name", "instituteName", "guardianMobileNumber", "studentGender", "religion"];
    
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field as keyof FormData]);
      if (error) newErrors[field] = error;
    });

    // Validate optional fields if they have values
    ["whatsappMobile", "studentMobileNumber", "motherMobileNumber"].forEach(field => {
      const value = formData[field as keyof FormData];
      if (value && value.trim()) {
        const error = validateField(field, value);
        if (error) newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, photo: e.target.files![0] }));
    }
  };

  const handleBatchDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBatchData(e.target.value);
    
    try {
      if (e.target.value.trim()) {
        const parsed = JSON.parse(e.target.value);
        const batches: AdmissionBatch[] = [];
        
        Object.keys(parsed).forEach(key => {
          if (key.startsWith('batch-index-')) {
            const batch = parsed[key];
            batches.push({
              batch: "", // Will be generated on server
              batchName: batch.batch_name || "",
              batchId: batch.batch_id || 0,
              subjects: (batch.subjects || []).map((subject: any) => ({
                subjectName: subject.subject_name || "",
                subjectId: subject.subject_id || 0,
              })),
              admissionFee: batch.admission_fee || 0,
              tuitionFee: batch.tution_fee || 0,
              courseFee: batch.course_fee || 0,
            });
          }
        });
        
        setFormData(prev => ({ ...prev, batches }));
      }
    } catch (error) {
      console.error("Invalid JSON format for batch data");
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof FormData]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allFields = Object.keys(formData);
    allFields.forEach(field => {
      if (!touched[field]) {
        setTouched(prev => ({ ...prev, [field]: true }));
      }
    });

    if (!validateForm()) {
      return;
    }

    // Prepare submission data
    const submissionData: any = {
      registrationId: formData.registrationId.trim(),
      name: formData.name.trim(),
      nameNative: formData.nameNative.trim() || undefined,
      studentGender: formData.studentGender,
      studentDateOfBirth: formData.studentDateOfBirth || undefined,
      presentAddress: formData.presentAddress.trim() || undefined,
      permanentAddress: formData.permanentAddress.trim() || undefined,
      religion: formData.religion,
      whatsappMobile: formData.whatsappMobile.trim() || undefined,
      studentMobileNumber: formData.studentMobileNumber.trim() || undefined,
      instituteName: formData.instituteName.trim(),
      fathersName: formData.fathersName.trim() || undefined,
      mothersName: formData.mothersName.trim() || undefined,
      guardianMobileNumber: formData.guardianMobileNumber.trim(),
      motherMobileNumber: formData.motherMobileNumber.trim() || undefined,
      admissionType: formData.admissionType,
      courseFee: formData.courseFee ? parseFloat(formData.courseFee) : undefined,
      admissionFee: formData.admissionFee ? parseFloat(formData.admissionFee) : undefined,
      tuitionFee: formData.tuitionFee ? parseFloat(formData.tuitionFee) : undefined,
      referBy: formData.referBy.trim() || undefined,
      admissionDate: formData.admissionDate,
      remarks: formData.remarks.trim() || undefined,
    };

    // Add batches if provided
    if (formData.batches.length > 0) {
      submissionData.batches = formData.batches;
    }

    // Add photo if provided
    if (formData.photo) {
      submissionData.photo = formData.photo;
    }

    onSubmit(submissionData);
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, photo: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const generateRegistrationId = () => {
    const randomId = Math.floor(Math.random() * 900000) + 100000; // 6-digit random number
    const timestamp = Date.now().toString().slice(-4);
    const newId = `REG${randomId}${timestamp}`;
    setFormData(prev => ({ ...prev, registrationId: newId }));
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {isEditing ? "Edit Admission" : "Create New Admission"}
          </h2>
          <button 
            onClick={onClose} 
            className={styles.modalClose}
            disabled={loading}
            type="button"
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className={styles.modalLoading}>
            <div className={styles.spinnerLarge}></div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {/* Registration ID */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Registration ID *
              </label>
              <div className={styles.inputWithButton}>
                <input
                  type="text"
                  name="registrationId"
                  value={formData.registrationId}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur("registrationId")}
                  className={`${styles.input} ${errors.registrationId ? styles.inputError : ''}`}
                  placeholder="e.g., REG001"
                  disabled={isEditing}
                  required
                />
                {!isEditing && (
                  <button
                    type="button"
                    onClick={generateRegistrationId}
                    className={styles.generateButton}
                  >
                    Generate
                  </button>
                )}
              </div>
              {errors.registrationId && (
                <div className={styles.errorMessage}>{errors.registrationId}</div>
              )}
            </div>

            {/* Personal Information */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Personal Information</h3>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Student Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("name")}
                    className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                    placeholder="Full name"
                    required
                  />
                  {errors.name && (
                    <div className={styles.errorMessage}>{errors.name}</div>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Name (Native)
                  </label>
                  <input
                    type="text"
                    name="nameNative"
                    value={formData.nameNative}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="Name in native language"
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Gender *
                  </label>
                  <select
                    name="studentGender"
                    value={formData.studentGender}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("studentGender")}
                    className={`${styles.input} ${errors.studentGender ? styles.inputError : ''}`}
                    required
                  >
                    {Object.values(Gender).map((gender) => (
                      <option key={gender} value={gender}>
                        {gender.charAt(0).toUpperCase() + gender.slice(1)}
                      </option>
                    ))}
                  </select>
                  {errors.studentGender && (
                    <div className={styles.errorMessage}>{errors.studentGender}</div>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="studentDateOfBirth"
                    value={formData.studentDateOfBirth}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("studentDateOfBirth")}
                    className={`${styles.input} ${errors.studentDateOfBirth ? styles.inputError : ''}`}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {errors.studentDateOfBirth && (
                    <div className={styles.errorMessage}>{errors.studentDateOfBirth}</div>
                  )}
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Religion *
                  </label>
                  <select
                    name="religion"
                    value={formData.religion}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("religion")}
                    className={`${styles.input} ${errors.religion ? styles.inputError : ''}`}
                    required
                  >
                    {Object.values(Religion).map((religion) => (
                      <option key={religion} value={religion}>
                        {religion.charAt(0).toUpperCase() + religion.slice(1)}
                      </option>
                    ))}
                  </select>
                  {errors.religion && (
                    <div className={styles.errorMessage}>{errors.religion}</div>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Admission Date
                  </label>
                  <input
                    type="date"
                    name="admissionDate"
                    value={formData.admissionDate}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("admissionDate")}
                    className={`${styles.input} ${errors.admissionDate ? styles.inputError : ''}`}
                  />
                  {errors.admissionDate && (
                    <div className={styles.errorMessage}>{errors.admissionDate}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Contact Information</h3>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Present Address
                  </label>
                  <input
                    type="text"
                    name="presentAddress"
                    value={formData.presentAddress}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="Current address"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Permanent Address
                  </label>
                  <input
                    type="text"
                    name="permanentAddress"
                    value={formData.permanentAddress}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="Permanent address"
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Guardian Mobile Number *
                  </label>
                  <input
                    type="tel"
                    name="guardianMobileNumber"
                    value={formData.guardianMobileNumber}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("guardianMobileNumber")}
                    className={`${styles.input} ${errors.guardianMobileNumber ? styles.inputError : ''}`}
                    placeholder="01XXXXXXXXX"
                    required
                  />
                  {errors.guardianMobileNumber && (
                    <div className={styles.errorMessage}>{errors.guardianMobileNumber}</div>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    name="whatsappMobile"
                    value={formData.whatsappMobile}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("whatsappMobile")}
                    className={`${styles.input} ${errors.whatsappMobile ? styles.inputError : ''}`}
                    placeholder="01XXXXXXXXX"
                  />
                  {errors.whatsappMobile && (
                    <div className={styles.errorMessage}>{errors.whatsappMobile}</div>
                  )}
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Student Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="studentMobileNumber"
                    value={formData.studentMobileNumber}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("studentMobileNumber")}
                    className={`${styles.input} ${errors.studentMobileNumber ? styles.inputError : ''}`}
                    placeholder="01XXXXXXXXX"
                  />
                  {errors.studentMobileNumber && (
                    <div className={styles.errorMessage}>{errors.studentMobileNumber}</div>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Mother's Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="motherMobileNumber"
                    value={formData.motherMobileNumber}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("motherMobileNumber")}
                    className={`${styles.input} ${errors.motherMobileNumber ? styles.inputError : ''}`}
                    placeholder="01XXXXXXXXX"
                  />
                  {errors.motherMobileNumber && (
                    <div className={styles.errorMessage}>{errors.motherMobileNumber}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Institute & Family */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Institute & Family</h3>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Institute Name *
                  </label>
                  <input
                    type="text"
                    name="instituteName"
                    value={formData.instituteName}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("instituteName")}
                    className={`${styles.input} ${errors.instituteName ? styles.inputError : ''}`}
                    placeholder="School/College name"
                    required
                  />
                  {errors.instituteName && (
                    <div className={styles.errorMessage}>{errors.instituteName}</div>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Admission Type
                  </label>
                  <select
                    name="admissionType"
                    value={formData.admissionType}
                    onChange={handleInputChange}
                    className={styles.input}
                  >
                    {Object.values(AdmissionType).map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Father's Name
                  </label>
                  <input
                    type="text"
                    name="fathersName"
                    value={formData.fathersName}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="Father's full name"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Mother's Name
                  </label>
                  <input
                    type="text"
                    name="mothersName"
                    value={formData.mothersName}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="Mother's full name"
                  />
                </div>
              </div>
            </div>

            {/* Fee Information */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Fee Information</h3>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Course Fee
                  </label>
                  <input
                    type="number"
                    name="courseFee"
                    value={formData.courseFee}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("courseFee")}
                    className={`${styles.input} ${errors.courseFee ? styles.inputError : ''}`}
                    placeholder="0"
                    min="0"
                    step="1"
                  />
                  {errors.courseFee && (
                    <div className={styles.errorMessage}>{errors.courseFee}</div>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Admission Fee
                  </label>
                  <input
                    type="number"
                    name="admissionFee"
                    value={formData.admissionFee}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("admissionFee")}
                    className={`${styles.input} ${errors.admissionFee ? styles.inputError : ''}`}
                    placeholder="0"
                    min="0"
                    step="1"
                  />
                  {errors.admissionFee && (
                    <div className={styles.errorMessage}>{errors.admissionFee}</div>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Tuition Fee
                  </label>
                  <input
                    type="number"
                    name="tuitionFee"
                    value={formData.tuitionFee}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("tuitionFee")}
                    className={`${styles.input} ${errors.tuitionFee ? styles.inputError : ''}`}
                    placeholder="0"
                    min="0"
                    step="1"
                  />
                  {errors.tuitionFee && (
                    <div className={styles.errorMessage}>{errors.tuitionFee}</div>
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Referred By
                </label>
                <input
                  type="text"
                  name="referBy"
                  value={formData.referBy}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Reference person name"
                />
              </div>
            </div>

            {/* Batch & Subjects */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Batch & Subjects</h3>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Batch Data (JSON Format)
                </label>
                <textarea
                  value={batchData}
                  onChange={handleBatchDataChange}
                  className={styles.textarea}
                  rows={6}
                  placeholder={`Enter batch data in JSON format:\n{\n  "batch-index-0": {\n    "batch_name": "Test 2030",\n    "batch_id": 1157,\n    "subjects": [\n      {\n        "subject_name": "Test Subject",\n        "subject_id": 1260\n      }\n    ],\n    "admission_fee": 0,\n    "tution_fee": 0,\n    "course_fee": 0\n  }\n}`}
                />
                <div className={styles.helpText}>
                  Enter batch information in the specified JSON format. Leave empty if not applicable.
                </div>
              </div>
            </div>

            {/* Photo Upload */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Photo Upload</h3>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Student Photo
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                  className={styles.fileInput}
                />
                {formData.photo && (
                  <div className={styles.photoPreview}>
                    <span>Selected: {formData.photo.name}</span>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className={styles.removePhoto}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Remarks */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Remarks</h3>
              <div className={styles.formGroup}>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  className={styles.textarea}
                  rows={3}
                  placeholder="Additional notes or remarks..."
                />
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
              type="submit"
              className={styles.btnPrimary}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinnerSmall}></span>
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                isEditing ? "Update Admission" : "Create Admission"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}