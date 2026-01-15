// components/result-management/ExamModal.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import styles from "./ExamModal.module.css";

// Types for dropdown options
export interface DropdownOption {
  _id: string;
  name: string;
  [key: string]: any;
}

export interface ExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  loading: boolean;
  exam?: any | null; // For edit mode
  // Dropdown data
  classes: DropdownOption[];
  activeBatches: DropdownOption[];
  subjects: DropdownOption[];
  examCategories: DropdownOption[];
  dropdownsLoaded: boolean;
  fetchBatchesByClass: (classId: string) => Promise<DropdownOption[]>;
}

// Import types from exam service
import { CreateExamDto } from "@/api/result-management/create-exam/types/exam.types";

// Predefined marks fields
const PREDEFINED_MARKS_FIELDS = [
  { id: 'mcq', label: 'MCQ' },
  { id: 'cq', label: 'CQ' },
  { id: 'written', label: 'Written' }
];

export default function ExamModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  exam,
  classes = [],
  activeBatches = [],
  subjects = [],
  examCategories = [],
  dropdownsLoaded,
  fetchBatchesByClass,
}: ExamModalProps) {
  // Main form state
  const [formData, setFormData] = useState<any>({
    examName: "",
    topicName: "",
    classId: "",
    batchIds: [],
    subjectId: "",
    examCategoryId: "",
    examDate: new Date().toISOString().split('T')[0],
    showMarksTitle: false,
    selectedMarksFields: [],
    enableGrading: false,
    passMarks: 40,
    showPercentageInResult: false,
    showGPAInResult: false,
    useGPASystem: false,
    totalMarks: 100,
    instructions: "",
    duration: 180,
    isActive: true,
  });

  // Local batches state (fetched based on selected class)
  const [localBatches, setLocalBatches] = useState<DropdownOption[]>(activeBatches);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Initialize form with exam data when in edit mode
  useEffect(() => {
    if (exam && isOpen) {
      const formattedData = {
        examName: exam.examName || "",
        topicName: exam.topicName || "",
        classId: exam.class?._id || "",
        batchIds: exam.batches?.map((b: any) => b._id) || [],
        subjectId: exam.subject?._id || "",
        examCategoryId: exam.examCategory?._id || "",
        examDate: exam.examDate ? exam.examDate.split('T')[0] : new Date().toISOString().split('T')[0],
        showMarksTitle: exam.showMarksTitle || false,
        selectedMarksFields: exam.selectedMarksFields || [],
        enableGrading: exam.enableGrading || false,
        passMarks: exam.passMarks || 40,
        showPercentageInResult: exam.showPercentageInResult || false,
        showGPAInResult: exam.showGPAInResult || false,
        useGPASystem: exam.useGPASystem || false,
        totalMarks: exam.totalMarks || 100,
        instructions: exam.instructions || "",
        duration: exam.duration || 180,
        isActive: exam.isActive !== undefined ? exam.isActive : true,
      };
      
      setFormData(formattedData);
      
      // If class is selected, fetch batches for that class
      if (exam.class?._id) {
        fetchBatchesForClass(exam.class._id);
      }
    } else if (isOpen) {
      // Reset form for create mode
      setFormData({
        examName: "",
        topicName: "",
        classId: "",
        batchIds: [],
        subjectId: "",
        examCategoryId: "",
        examDate: new Date().toISOString().split('T')[0],
        showMarksTitle: false,
        selectedMarksFields: [],
        enableGrading: false,
        passMarks: 40,
        showPercentageInResult: false,
        showGPAInResult: false,
        useGPASystem: false,
        totalMarks: 100,
        instructions: "",
        duration: 180,
        isActive: true,
      });
      setLocalBatches(activeBatches);
      setErrors({});
      setTouched({});
    }
  }, [exam, isOpen, activeBatches]);

  // Update local batches when activeBatches changes
  useEffect(() => {
    if (!formData.classId && activeBatches.length > 0) {
      setLocalBatches(activeBatches);
    }
  }, [activeBatches, formData.classId]);

  // Fetch batches when class changes
  const fetchBatchesForClass = async (classId: string) => {
    try {
      const batches = await fetchBatchesByClass(classId);
      setLocalBatches(batches);
    } catch (error) {
      console.error('Failed to fetch batches:', error);
      setLocalBatches([]);
    }
  };

  // Handle class change
  const handleClassChange = (classId: string) => {
    setFormData((prev: any) => ({
      ...prev,
      classId,
      batchIds: [], // Reset batches when class changes
      subjectId: "", // Reset subject when class changes
    }));
    
    if (classId) {
      fetchBatchesForClass(classId);
    } else {
      setLocalBatches(activeBatches);
    }
  };

  // Validate field
  const validateField = (field: string, value: any): string => {
    if (!touched[field]) return "";

    switch (field) {
      case "examName":
        if (!value?.trim()) return "Exam name is required";
        if (value.trim().length < 3) return "Exam name must be at least 3 characters";
        if (value.trim().length > 100) return "Exam name must be less than 100 characters";
        break;
      
      case "topicName":
        if (value?.length > 150) return "Topic name must be less than 150 characters";
        break;
      
      case "classId":
        if (!value) return "Class is required";
        break;
      
      case "subjectId":
        if (!value) return "Subject is required";
        break;
      
      case "examCategoryId":
        if (!value) return "Exam category is required";
        break;
      
      case "batchIds":
        if (!value || value.length === 0) return "At least one batch is required";
        break;
      
      case "examDate":
        if (!value) return "Exam date is required";
        break;
      
      case "passMarks":
        if (value < 0) return "Pass marks cannot be negative";
        if (value > formData.totalMarks) return "Pass marks cannot exceed total marks";
        break;
      
      case "totalMarks":
        if (!value || value <= 0) return "Total marks must be greater than 0";
        if (value > 1000) return "Total marks cannot exceed 1000";
        break;
      
      case "duration":
        if (value && value < 1) return "Duration must be at least 1 minute";
        break;
    }

    return "";
  };

  // Validate form
  const validateForm = (): boolean => {
    const requiredFields = ["examName", "classId", "subjectId", "examCategoryId", "batchIds", "examDate"];
    const newErrors: Record<string, string> = {};
    
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    // Validate pass marks
    const passMarksError = validateField("passMarks", formData.passMarks);
    if (passMarksError) newErrors.passMarks = passMarksError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  // Handle blur
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // Handle batch selection
  const handleBatchToggle = (batchId: string) => {
    const newBatchIds = formData.batchIds.includes(batchId)
      ? formData.batchIds.filter((id: string) => id !== batchId)
      : [...formData.batchIds, batchId];
    
    handleInputChange("batchIds", newBatchIds);
  };

  // Handle marks field toggle
  const handleMarksFieldToggle = (fieldId: string) => {
    const newSelectedFields = formData.selectedMarksFields.includes(fieldId)
      ? formData.selectedMarksFields.filter((id: string) => id !== fieldId)
      : [...formData.selectedMarksFields, fieldId];
    
    handleInputChange("selectedMarksFields", newSelectedFields);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allFields = Object.keys(formData);
    const newTouched: Record<string, boolean> = {};
    allFields.forEach(field => newTouched[field] = true);
    setTouched(newTouched);

    if (validateForm()) {
      // Prepare data for API
      const submitData: CreateExamDto = {
        examName: formData.examName.trim(),
        topicName: formData.topicName.trim(),
        classId: formData.classId,
        batchIds: formData.batchIds,
        subjectId: formData.subjectId,
        examCategoryId: formData.examCategoryId,
        examDate: formData.examDate,
        showMarksTitle: formData.showMarksTitle,
        selectedMarksFields: formData.selectedMarksFields,
        totalMarks: formData.totalMarks,
        enableGrading: formData.enableGrading,
        passMarks: formData.passMarks,
        showPercentageInResult: formData.showPercentageInResult,
        showGPAInResult: formData.showGPAInResult,
        useGPASystem: formData.useGPASystem,
        instructions: formData.instructions,
        duration: formData.duration,
        isActive: formData.isActive,
      };
      
      await onSubmit(submitData);
    }
  };

  if (!isOpen) return null;

  if (!dropdownsLoaded) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinnerLarge}></div>
            <p className={styles.loadingText}>Loading dropdown data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>
              {exam ? "Edit Exam" : "Create New Exam"}
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

          <div className={styles.modalContent}>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.modalBody}>
                {/* New Exam Details Section */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>New Exam Details</h3>
                  
                  <div className={styles.formGrid}>
                    <div className={styles.formField}>
                      <label className={styles.label}>
                        Exam Name <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.examName}
                        onChange={(e) => handleInputChange("examName", e.target.value)}
                        onBlur={() => handleBlur("examName")}
                        placeholder="Topic Name"
                        className={`${styles.input} ${
                          errors.examName ? styles.inputError : ""
                        }`}
                        disabled={loading}
                        maxLength={100}
                      />
                      {errors.examName && (
                        <div className={styles.errorMessage}>{errors.examName}</div>
                      )}
                    </div>

                    <div className={styles.formField}>
                      <label className={styles.label}>
                        Class <span className={styles.required}>*</span>
                      </label>
                      <select
                        value={formData.classId}
                        onChange={(e) => handleClassChange(e.target.value)}
                        onBlur={() => handleBlur("classId")}
                        className={`${styles.input} ${
                          errors.classId ? styles.inputError : ""
                        }`}
                        disabled={loading || classes.length === 0}
                      >
                        <option value="">Select Class</option>
                        {classes.map((cls) => (
                          <option key={cls._id} value={cls._id}>
                            {cls.classname || cls.name}
                          </option>
                        ))}
                      </select>
                      {errors.classId && (
                        <div className={styles.errorMessage}>{errors.classId}</div>
                      )}
                    </div>

                    <div className={styles.formField}>
                      <label className={styles.label}>
                        Subject <span className={styles.required}>*</span>
                      </label>
                      <select
                        value={formData.subjectId}
                        onChange={(e) => handleInputChange("subjectId", e.target.value)}
                        onBlur={() => handleBlur("subjectId")}
                        className={`${styles.input} ${
                          errors.subjectId ? styles.inputError : ""
                        }`}
                        disabled={loading || subjects.length === 0}
                      >
                        <option value="">Select subject</option>
                        {subjects.map((subject) => (
                          <option key={subject._id} value={subject._id}>
                            {subject.name}
                          </option>
                        ))}
                      </select>
                      {errors.subjectId && (
                        <div className={styles.errorMessage}>{errors.subjectId}</div>
                      )}
                    </div>

                    <div className={styles.formField}>
                      <label className={styles.label}>
                        Exam Date <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.examDate}
                        onChange={(e) => handleInputChange("examDate", e.target.value)}
                        onBlur={() => handleBlur("examDate")}
                        className={`${styles.input} ${
                          errors.examDate ? styles.inputError : ""
                        }`}
                        disabled={loading}
                      />
                      {errors.examDate && (
                        <div className={styles.errorMessage}>{errors.examDate}</div>
                      )}
                    </div>
                  </div>

                  {/* Batches Section - moved inside New Exam Details */}
                  <div className={styles.formField}>
                    <label className={styles.label}>Batches</label>
                    <div className={styles.batchesContainer}>
                      {localBatches.length > 0 ? (
                        <div className={styles.checkboxGrid}>
                          {localBatches.map((batch) => (
                            <div key={batch._id} className={styles.checkboxOption}>
                              <input
                                type="checkbox"
                                id={`batch-${batch._id}`}
                                checked={formData.batchIds.includes(batch._id)}
                                onChange={() => handleBatchToggle(batch._id)}
                                disabled={loading || !formData.classId}
                                className={styles.checkbox}
                              />
                              <label htmlFor={`batch-${batch._id}`} className={styles.checkboxLabel}>
                                {batch.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={styles.infoText}>
                          {formData.classId 
                            ? "No batches available for this class" 
                            : "Select a class to see available batches"}
                        </div>
                      )}
                    </div>
                    {errors.batchIds && (
                      <div className={styles.errorMessage}>{errors.batchIds}</div>
                    )}
                  </div>

                  {/* Categories Section */}
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      Categories <span className={styles.required}>*</span>
                    </label>
                    <select
                      value={formData.examCategoryId}
                      onChange={(e) => handleInputChange("examCategoryId", e.target.value)}
                      onBlur={() => handleBlur("examCategoryId")}
                      className={`${styles.input} ${
                        errors.examCategoryId ? styles.inputError : ""
                      }`}
                      disabled={loading || examCategories.length === 0}
                    >
                      <option value="">Select categories</option>
                      {examCategories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.examCategoryId && (
                      <div className={styles.errorMessage}>{errors.examCategoryId}</div>
                    )}
                  </div>

                  {/* Show Marks Title Checkbox */}
                  <div className={styles.formField}>
                    <div className={styles.checkboxField}>
                      <input
                        type="checkbox"
                        id="showMarksTitle"
                        checked={formData.showMarksTitle}
                        onChange={(e) => handleInputChange("showMarksTitle", e.target.checked)}
                        disabled={loading}
                        className={styles.checkbox}
                      />
                      <label htmlFor="showMarksTitle" className={styles.checkboxLabel}>
                        Show Marks Title (MCQ, CQ, Written) in Result PDF
                      </label>
                      <div className={styles.checkboxHelpText}>
                        If unchecked, only total marks will be shown in result report.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Horizontal Divider */}
                <hr className={styles.divider} />

                {/* Select Marks Fields Section */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Select Marks Fields</h3>
                  <div className={styles.checkboxGrid}>
                    {PREDEFINED_MARKS_FIELDS.map((field) => (
                      <div key={field.id} className={styles.checkboxOption}>
                        <input
                          type="checkbox"
                          id={`marks-${field.id}`}
                          checked={formData.selectedMarksFields.includes(field.id)}
                          onChange={() => handleMarksFieldToggle(field.id)}
                          disabled={loading}
                          className={styles.checkbox}
                        />
                        <label htmlFor={`marks-${field.id}`} className={styles.checkboxLabel}>
                          {field.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Horizontal Divider */}
                <hr className={styles.divider} />

                {/* Grading System Section */}
                <div className={styles.section}>
                  <div className={styles.formField}>
                    <div className={styles.checkboxField}>
                      <input
                        type="checkbox"
                        id="enableGrading"
                        checked={formData.enableGrading}
                        onChange={(e) => handleInputChange("enableGrading", e.target.checked)}
                        disabled={loading}
                        className={styles.checkbox}
                      />
                      <label htmlFor="enableGrading" className={styles.checkboxLabel}>
                        Enable Grading System?
                      </label>
                      <div className={styles.checkboxHelpText}>
                        Turn this on to configure grading and pass mark options.
                      </div>
                    </div>
                  </div>

                  {formData.enableGrading && (
                    <>
                      {/* Total Pass Marks */}
                      <div className={styles.formField}>
                        <label className={styles.label}>Total Pass Marks</label>
                        <input
                          type="number"
                          value={formData.passMarks}
                          onChange={(e) => handleInputChange("passMarks", parseInt(e.target.value) || 0)}
                          onBlur={() => handleBlur("passMarks")}
                          placeholder="e.g. 40"
                          className={`${styles.input} ${
                            errors.passMarks ? styles.inputError : ""
                          }`}
                          disabled={loading}
                          min="0"
                          max={formData.totalMarks}
                        />
                        {errors.passMarks && (
                          <div className={styles.errorMessage}>{errors.passMarks}</div>
                        )}
                      </div>

                      {/* Show Grading in Result Options */}
                      <div className={styles.formField}>
                        <label className={styles.label}>Show Grading in Result as % marks?</label>
                        <div className={styles.radioGroup}>
                          <div className={styles.radioOption}>
                            <input
                              type="radio"
                              id="showPercentage"
                              name="gradingDisplay"
                              checked={formData.showPercentageInResult}
                              onChange={() => handleInputChange("showPercentageInResult", true)}
                              disabled={loading}
                              className={styles.radio}
                            />
                            <label htmlFor="showPercentage" className={styles.radioLabel}>
                              Include % marks in result reports
                            </label>
                          </div>
                          <div className={styles.radioOption}>
                            <input
                              type="radio"
                              id="showGPA"
                              name="gradingDisplay"
                              checked={formData.showGPAInResult}
                              onChange={() => handleInputChange("showGPAInResult", true)}
                              disabled={loading}
                              className={styles.radio}
                            />
                            <label htmlFor="showGPA" className={styles.radioLabel}>
                              Include GPA grading in result reports
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* GPA System Checkbox */}
                      <div className={styles.formField}>
                        <div className={styles.checkboxField}>
                          <input
                            type="checkbox"
                            id="useGPASystem"
                            checked={formData.useGPASystem}
                            onChange={(e) => handleInputChange("useGPASystem", e.target.checked)}
                            disabled={loading}
                            className={styles.checkbox}
                          />
                          <label htmlFor="useGPASystem" className={styles.checkboxLabel}>
                            As GPA system?
                          </label>
                        </div>
                      </div>

                      {/* Info Text */}
                      <div className={styles.infoBox}>
                        Minimum marks required to pass the exam.
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={onClose}
                  className={styles.btnCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnSave}
                  disabled={loading}
                >
                  {loading ? "Saving..." : exam ? "Update Exam" : "Save Exam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}