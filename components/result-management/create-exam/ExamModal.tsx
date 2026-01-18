// components/result-management/ExamModal.tsx
"use client";

import { useState, useEffect } from "react";
import styles from "./ExamModal.module.css";

// Types for dropdown options
export interface DropdownOption {
  _id: string;
  name: string;
  classname?: string;
  subjectName?: string;
  categoryName?: string;
  [key: string]: any;
}

export interface ExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  loading: boolean;
  exam?: any | null;
  // Dropdown data
  classes: DropdownOption[];
  activeBatches: DropdownOption[];
  subjects: DropdownOption[];
  examCategories: DropdownOption[];
  dropdownsLoaded: boolean;
  fetchBatchesByClass: (classId: string) => Promise<DropdownOption[]>;
}

// Predefined marks field types
const MARKS_FIELD_TYPES = [
  { id: 'mcq', label: 'MCQ Total Marks' },
  { id: 'cq', label: 'CQ Total Marks' },
  { id: 'written', label: 'Written Total Marks' }
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
    marksFields: [
      { 
        type: 'mcq', 
        enabled: false,
        totalMarks: 0, 
        enablePassMarks: false, 
        passMarks: 0, 
        enableNegativeMarking: false, 
        negativeMarks: 0 
      },
      { 
        type: 'cq', 
        enabled: false,
        totalMarks: 0, 
        enablePassMarks: false, 
        passMarks: 0, 
        enableNegativeMarking: false, 
        negativeMarks: 0 
      },
      { 
        type: 'written', 
        enabled: false,
        totalMarks: 0, 
        enablePassMarks: false, 
        passMarks: 0, 
        enableNegativeMarking: false, 
        negativeMarks: 0 
      }
    ],
    totalMarks: 0,
    enableGrading: false,
    totalPassMarks: 0,
    showPercentageInResult: false,
    showGPAInResult: false,
    useGPASystem: false,
  });

  // Local batches state (fetched based on selected class)
  const [localBatches, setLocalBatches] = useState<DropdownOption[]>(activeBatches);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Initialize form with exam data when in edit mode
  useEffect(() => {
    const initializeForm = async () => {
      if (exam && isOpen) {
        console.log("Edit mode - Exam data:", exam);
        
        // Parse marksFields from exam data
        let marksFieldsData = [
          { 
            type: 'mcq', 
            enabled: false,
            totalMarks: 0, 
            enablePassMarks: false, 
            passMarks: 0, 
            enableNegativeMarking: false, 
            negativeMarks: 0 
          },
          { 
            type: 'cq', 
            enabled: false,
            totalMarks: 0, 
            enablePassMarks: false, 
            passMarks: 0, 
            enableNegativeMarking: false, 
            negativeMarks: 0 
          },
          { 
            type: 'written', 
            enabled: false,
            totalMarks: 0, 
            enablePassMarks: false, 
            passMarks: 0, 
            enableNegativeMarking: false, 
            negativeMarks: 0 
          }
        ];

        // If exam has marksFields, map them to our structure
        if (exam.marksFields && Array.isArray(exam.marksFields)) {
          marksFieldsData = marksFieldsData.map(defaultField => {
            const existingField = exam.marksFields.find((f: any) => f.type === defaultField.type);
            if (existingField) {
              return {
                ...defaultField,
                enabled: true,
                totalMarks: existingField.totalMarks || 0,
                enablePassMarks: existingField.enablePassMarks || false,
                passMarks: existingField.passMarks || 0,
                enableNegativeMarking: existingField.enableNegativeMarking || false,
                negativeMarks: existingField.negativeMarks || 0
              };
            }
            return defaultField;
          });
        }

        const formattedData = {
          examName: exam.examName || "",
          topicName: exam.topicName || "",
          classId: "",
          batchIds: [],
          subjectId: "",
          examCategoryId: "",
          examDate: exam.examDate ? exam.examDate.split('T')[0] : new Date().toISOString().split('T')[0],
          showMarksTitle: exam.showMarksTitle || false,
          marksFields: marksFieldsData,
          totalMarks: exam.totalMarks || 0,
          enableGrading: exam.enableGrading || false,
          totalPassMarks: exam.totalPassMarks || 0,
          showPercentageInResult: exam.showPercentageInResult || false,
          showGPAInResult: exam.showGPAInResult || false,
          useGPASystem: exam.useGPASystem || false,
        };

        // Find IDs from names for edit mode
        const classObj = classes.find(c => c.classname === exam.className || c.name === exam.className);
        const subjectObj = subjects.find(s => s.subjectName === exam.subjectName || s.name === exam.subjectName);
        const categoryObj = examCategories.find(c => c.categoryName === exam.examCategory || c.name === exam.examCategory);
        
        if (classObj) {
          formattedData.classId = classObj._id;
          
          // Fetch batches for the class
          const batches = await fetchBatchesForClass(classObj._id);
          
          // For edit mode, we need to find batch IDs from batchName string
          if (exam.batchName) {
            const batchNames = exam.batchName.split(',').map((b: string) => b.trim());
            const selectedBatchIds = batches
              .filter(batch => batchNames.includes(batch.name))
              .map(batch => batch._id);
            formattedData.batchIds = selectedBatchIds;
          }
        }
        
        if (subjectObj) formattedData.subjectId = subjectObj._id;
        if (categoryObj) formattedData.examCategoryId = categoryObj._id;
        
        console.log("Formatted data for edit:", formattedData);
        setFormData(formattedData);
      } else if (isOpen) {
        // Reset form for create mode
        console.log("Create mode - resetting form");
        setFormData({
          examName: "",
          topicName: "",
          classId: "",
          batchIds: [],
          subjectId: "",
          examCategoryId: "",
          examDate: new Date().toISOString().split('T')[0],
          showMarksTitle: false,
          marksFields: [
            { 
              type: 'mcq', 
              enabled: false,
              totalMarks: 0, 
              enablePassMarks: false, 
              passMarks: 0, 
              enableNegativeMarking: false, 
              negativeMarks: 0 
            },
            { 
              type: 'cq', 
              enabled: false,
              totalMarks: 0, 
              enablePassMarks: false, 
              passMarks: 0, 
              enableNegativeMarking: false, 
              negativeMarks: 0 
            },
            { 
              type: 'written', 
              enabled: false,
              totalMarks: 0, 
              enablePassMarks: false, 
              passMarks: 0, 
              enableNegativeMarking: false, 
              negativeMarks: 0 
            }
          ],
          totalMarks: 0,
          enableGrading: false,
          totalPassMarks: 0,
          showPercentageInResult: false,
          showGPAInResult: false,
          useGPASystem: false,
        });
        setLocalBatches(activeBatches);
        setErrors({});
        setTouched({});
      }
    };

    initializeForm();
  }, [exam, isOpen, activeBatches, classes, subjects, examCategories]);

  // Update local batches when activeBatches changes
  useEffect(() => {
    if (!formData.classId && activeBatches.length > 0) {
      setLocalBatches(activeBatches);
    }
  }, [activeBatches, formData.classId]);

  // Calculate total marks when marks fields change
  useEffect(() => {
    const total = formData.marksFields.reduce((sum: number, field: any) => {
      if (field.enabled) {
        return sum + (field.totalMarks || 0);
      }
      return sum;
    }, 0);
    setFormData((prev: any) => ({ ...prev, totalMarks: total }));
  }, [formData.marksFields]);

  // Fetch batches when class changes
  const fetchBatchesForClass = async (classId: string) => {
    try {
      const batches = await fetchBatchesByClass(classId);
      setLocalBatches(batches);
      return batches;
    } catch (error) {
      console.error('Failed to fetch batches:', error);
      setLocalBatches([]);
      return [];
    }
  };

  // Handle class change
  const handleClassChange = (classId: string) => {
    setFormData((prev: any) => ({
      ...prev,
      classId,
      batchIds: [], // Reset batches when class changes
    }));
    
    if (classId) {
      fetchBatchesForClass(classId);
    } else {
      setLocalBatches(activeBatches);
    }
  };

  // Handle batch selection
  const handleBatchToggle = (batchId: string) => {
    const newBatchIds = formData.batchIds.includes(batchId)
      ? formData.batchIds.filter((id: string) => id !== batchId)
      : [...formData.batchIds, batchId];
    
    handleInputChange("batchIds", newBatchIds);
  };

  // Validate field
  const validateField = (field: string, value: any): string => {
    if (!touched[field]) return "";

    switch (field) {
      case "examName":
        if (!value?.trim()) return "Exam name is required";
        if (value.trim().length < 2) return "Exam name must be at least 2 characters";
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
      
      case "totalPassMarks":
        if (formData.enableGrading) {
          if (value === undefined || value === null || value === "") {
            return "Total pass marks is required when grading is enabled";
          }
          if (value < 0) return "Pass marks cannot be negative";
          if (value > formData.totalMarks) return "Pass marks cannot exceed total marks";
        }
        break;
      
      case "totalMarks":
        // Total marks validation depends on whether marks fields are enabled
        const hasEnabledMarks = formData.marksFields.some((field: any) => field.enabled);
        if (hasEnabledMarks && value <= 0) {
          return "Total marks must be greater than 0 when marks fields are enabled";
        }
        break;
    }

    // Validate marks fields
    if (field.startsWith('marksFields')) {
      const fieldIndex = parseInt(field.split('.')[1]);
      const subField = field.split('.')[2];
      const marksField = formData.marksFields[fieldIndex];
      
      if (subField === 'totalMarks' && marksField.enabled) {
        if (value < 0) return "Marks cannot be negative";
        if (value === 0) return "Marks must be greater than 0";
      }
      if (subField === 'passMarks' && marksField.enablePassMarks) {
        if (value < 0) return "Pass marks cannot be negative";
        if (value > marksField.totalMarks) return "Pass marks cannot exceed total marks";
      }
      if (subField === 'negativeMarks' && marksField.enableNegativeMarking) {
        if (value < 0) return "Negative marks cannot be negative";
      }
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

    // Validate total marks only if marks fields are enabled
    const hasEnabledMarks = formData.marksFields.some((field: any) => field.enabled);
    if (hasEnabledMarks) {
      if (formData.totalMarks <= 0) {
        newErrors.totalMarks = "Total marks must be greater than 0";
      }
    }

    // Validate marks fields only if enabled
    formData.marksFields.forEach((field: any, index: number) => {
      if (field.enabled) {
        const totalMarksError = validateField(`marksFields.${index}.totalMarks`, field.totalMarks);
        if (totalMarksError) newErrors[`marksFields.${index}.totalMarks`] = totalMarksError;

        if (field.enablePassMarks) {
          const passMarksError = validateField(`marksFields.${index}.passMarks`, field.passMarks);
          if (passMarksError) newErrors[`marksFields.${index}.passMarks`] = passMarksError;
        }

        if (field.enableNegativeMarking) {
          const negativeMarksError = validateField(`marksFields.${index}.negativeMarks`, field.negativeMarks);
          if (negativeMarksError) newErrors[`marksFields.${index}.negativeMarks`] = negativeMarksError;
        }
      }
    });

    // Validate total pass marks only if grading is enabled
    if (formData.enableGrading) {
      const passMarksError = validateField("totalPassMarks", formData.totalPassMarks);
      if (passMarksError) {
        newErrors.totalPassMarks = passMarksError;
      }
    }

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

  // Handle marks field toggle (enable/disable)
  const handleMarksFieldToggle = (index: number, isEnabled: boolean) => {
    const updatedFields = [...formData.marksFields];
    
    if (isEnabled) {
      // When enabling, set default values like in the image
      updatedFields[index] = { 
        ...updatedFields[index], 
        enabled: true,
        totalMarks: 0, // Start with 0 like in the image
        enablePassMarks: false,
        passMarks: 0,
        enableNegativeMarking: false,
        negativeMarks: 0
      };
    } else {
      // When disabling, reset everything
      updatedFields[index] = { 
        ...updatedFields[index], 
        enabled: false,
        totalMarks: 0,
        enablePassMarks: false,
        passMarks: 0,
        enableNegativeMarking: false,
        negativeMarks: 0
      };
    }
    
    setFormData((prev: any) => ({ ...prev, marksFields: updatedFields }));
  };

  // Handle marks field change
  const handleMarksFieldChange = (index: number, field: string, value: any) => {
    const updatedFields = [...formData.marksFields];
    updatedFields[index] = { ...updatedFields[index], [field]: value };
    
    // If disabling pass marks or negative marking, reset the corresponding value
    if (field === 'enablePassMarks' && !value) {
      updatedFields[index].passMarks = 0;
    }
    if (field === 'enableNegativeMarking' && !value) {
      updatedFields[index].negativeMarks = 0;
    }
    
    setFormData((prev: any) => ({ ...prev, marksFields: updatedFields }));
    
    const errorField = `marksFields.${index}.${field}`;
    if (touched[errorField]) {
      const error = validateField(errorField, value);
      setErrors(prev => ({ ...prev, [errorField]: error }));
    }
  };

  // Handle blur
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
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
      // Find selected options by their IDs to get names
      const selectedClass = classes.find(cls => cls._id === formData.classId);
      const selectedSubject = subjects.find(subj => subj._id === formData.subjectId);
      const selectedCategory = examCategories.find(cat => cat._id === formData.examCategoryId);
      const selectedBatches = localBatches.filter(batch => formData.batchIds.includes(batch._id));

      // Prepare marks fields data - only include enabled ones
      const filteredMarksFields = formData.marksFields
        .filter((field: any) => field.enabled && field.totalMarks > 0)
        .map((field: any) => ({
          type: field.type,
          totalMarks: field.totalMarks || 0,
          enablePassMarks: field.enablePassMarks || false,
          passMarks: field.enablePassMarks ? (field.passMarks || 0) : undefined,
          enableNegativeMarking: field.enableNegativeMarking || false,
          negativeMarks: field.enableNegativeMarking ? (field.negativeMarks || 0) : undefined
        }));

      // Calculate total marks from enabled fields
      const calculatedTotalMarks = filteredMarksFields.reduce((sum: number, field: any) => {
        return sum + (field.totalMarks || 0);
      }, 0);

      // Prepare submission data - MUST match backend DTO format
      const submitData: any = {
        examName: formData.examName.trim(),
        // Send NAMES not IDs to backend
        className: selectedClass?.classname || selectedClass?.name || '',
        batchName: selectedBatches.map(b => b.name).join(', '),
        subjectName: selectedSubject?.subjectName || selectedSubject?.name || '',
        examCategory: selectedCategory?.categoryName || selectedCategory?.name || '',
        examDate: formData.examDate,
        showMarksTitle: formData.showMarksTitle,
        totalMarks: calculatedTotalMarks,
        enableGrading: formData.enableGrading,
      };

      // Add optional fields if they have values
      if (formData.topicName.trim()) {
        submitData.topicName = formData.topicName.trim();
      }

      // Add marks fields if any are enabled - THIS IS OPTIONAL
      if (filteredMarksFields.length > 0) {
        submitData.marksFields = filteredMarksFields;
      }

      // Add total pass marks only if grading is enabled
      if (formData.enableGrading) {
        submitData.totalPassMarks = formData.totalPassMarks || 0;
      }

      // Add grading display options - these are optional even when grading is enabled
      if (formData.showPercentageInResult) {
        submitData.showPercentageInResult = formData.showPercentageInResult;
      }

      if (formData.showGPAInResult) {
        submitData.showGPAInResult = formData.showGPAInResult;
      }

      // GPA system is separate from grading
      if (formData.useGPASystem) {
        submitData.useGPASystem = formData.useGPASystem;
      }

      console.log("Submitting data to backend:", submitData);
      
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
                {/* Basic Information Section - REQUIRED */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Exam Details</h3>
                  
                  <div className={styles.formGrid}>
                    {/* Exam Name */}
                    <div className={styles.formRow}>
                      <label className={styles.label}>
                        Exam Name <span className={styles.required}>*</span>
                      </label>
                      <div className={styles.inputContainer}>
                        <input
                          type="text"
                          value={formData.examName}
                          onChange={(e) => handleInputChange("examName", e.target.value)}
                          onBlur={() => handleBlur("examName")}
                          className={`${styles.input} ${
                            errors.examName ? styles.inputError : ""
                          }`}
                          disabled={loading}
                        />
                        {errors.examName && (
                          <div className={styles.errorMessage}>{errors.examName}</div>
                        )}
                      </div>
                    </div>

                    {/* Topic Name - OPTIONAL */}
                    <div className={styles.formRow}>
                      <label className={styles.label}>
                        Topic Name
                      </label>
                      <div className={styles.inputContainer}>
                        <input
                          type="text"
                          value={formData.topicName}
                          onChange={(e) => handleInputChange("topicName", e.target.value)}
                          className={styles.input}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Class - REQUIRED */}
                    <div className={styles.formRow}>
                      <label className={styles.label}>
                        Class <span className={styles.required}>*</span>
                      </label>
                      <div className={styles.inputContainer}>
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
                    </div>

                    {/* Subject - REQUIRED */}
                    <div className={styles.formRow}>
                      <label className={styles.label}>
                        Subject <span className={styles.required}>*</span>
                      </label>
                      <div className={styles.inputContainer}>
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
                              {subject.subjectName || subject.name}
                            </option>
                          ))}
                        </select>
                        {errors.subjectId && (
                          <div className={styles.errorMessage}>{errors.subjectId}</div>
                        )}
                      </div>
                    </div>

                    {/* Exam Category - REQUIRED */}
                    <div className={styles.formRow}>
                      <label className={styles.label}>
                        Exam Category <span className={styles.required}>*</span>
                      </label>
                      <div className={styles.inputContainer}>
                        <select
                          value={formData.examCategoryId}
                          onChange={(e) => handleInputChange("examCategoryId", e.target.value)}
                          onBlur={() => handleBlur("examCategoryId")}
                          className={`${styles.input} ${
                            errors.examCategoryId ? styles.inputError : ""
                          }`}
                          disabled={loading || examCategories.length === 0}
                        >
                          <option value="">Select category</option>
                          {examCategories.map((category) => (
                            <option key={category._id} value={category._id}>
                              {category.categoryName || category.name}
                            </option>
                          ))}
                        </select>
                        {errors.examCategoryId && (
                          <div className={styles.errorMessage}>{errors.examCategoryId}</div>
                        )}
                      </div>
                    </div>

                    {/* Exam Date - REQUIRED */}
                    <div className={styles.formRow}>
                      <label className={styles.label}>
                        Exam Date <span className={styles.required}>*</span>
                      </label>
                      <div className={styles.inputContainer}>
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
                  </div>

                  {/* Batches Section - REQUIRED */}
                  <div className={styles.formRow}>
                    <label className={styles.label}>
                      Batches <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.inputContainer}>
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
                  </div>
                </div>

                {/* Divider */}
                <hr className={styles.divider} />

                {/* Show Marks Title Checkbox - OPTIONAL */}
                <div className={styles.section}>
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

                {/* Divider */}
                <hr className={styles.divider} />

                {/* Select Marks Fields Section - COMPLETELY OPTIONAL */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Select Marks Fields (Optional)</h3>
                  <div className={styles.optionalNote}>
                    You can enable marks fields if you want to track different types of marks. 
                    If no marks fields are enabled, only the total marks will be recorded.
                  </div>
                  
                  {formData.marksFields.map((field: any, index: number) => {
                    const fieldType = MARKS_FIELD_TYPES[index];
                    
                    return (
                      <div key={fieldType.id} className={styles.marksFieldSection}>
                        <div className={styles.marksFieldHeader}>
                          <h4 className={styles.marksFieldTitle}>{fieldType.label}</h4>
                          <div className={styles.marksFieldToggle}>
                            <input
                              type="checkbox"
                              id={`enable-${fieldType.id}`}
                              checked={field.enabled}
                              onChange={(e) => handleMarksFieldToggle(index, e.target.checked)}
                              disabled={loading}
                              className={styles.toggleSwitch}
                            />
                            <label 
                              htmlFor={`enable-${fieldType.id}`} 
                              className={`${styles.toggleLabel} ${field.enabled ? styles.toggleLabelActive : ''}`}
                            >
                              {field.enabled ? 'Enabled' : 'Disabled'}
                            </label>
                          </div>
                        </div>

                        {field.enabled && (
                          <div className={styles.marksFieldContent}>
                            {/* Total Marks - Required if field is enabled */}
                            <div className={styles.formRow}>
                              <label className={styles.label}>
                                {fieldType.label} <span className={styles.required}>*</span>
                              </label>
                              <div className={styles.inputContainer}>
                                <input
                                  type="number"
                                  min="1"
                                  value={field.totalMarks}
                                  onChange={(e) => handleMarksFieldChange(index, 'totalMarks', parseInt(e.target.value) || 0)}
                                  onBlur={() => handleBlur(`marksFields.${index}.totalMarks`)}
                                  className={`${styles.input} ${
                                    errors[`marksFields.${index}.totalMarks`] ? styles.inputError : ""
                                  }`}
                                  disabled={loading}
                                />
                                {errors[`marksFields.${index}.totalMarks`] && (
                                  <div className={styles.errorMessage}>
                                    {errors[`marksFields.${index}.totalMarks`]}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Enable Pass Marks Checkbox - Optional */}
                            <div className={styles.checkboxField}>
                              <input
                                type="checkbox"
                                id={`pass-${fieldType.id}`}
                                checked={field.enablePassMarks}
                                onChange={(e) => handleMarksFieldChange(index, 'enablePassMarks', e.target.checked)}
                                disabled={loading}
                                className={styles.checkbox}
                              />
                              <label htmlFor={`pass-${fieldType.id}`} className={styles.checkboxLabel}>
                                Enable Pass Marks? (Optional)
                              </label>
                            </div>

                            {field.enablePassMarks && (
                              <div className={styles.formRow}>
                                <label className={styles.label}>
                                  Pass Marks
                                </label>
                                <div className={styles.inputContainer}>
                                  <input
                                    type="number"
                                    min="0"
                                    max={field.totalMarks}
                                    value={field.passMarks}
                                    onChange={(e) => handleMarksFieldChange(index, 'passMarks', parseInt(e.target.value) || 0)}
                                    onBlur={() => handleBlur(`marksFields.${index}.passMarks`)}
                                    className={`${styles.input} ${
                                      errors[`marksFields.${index}.passMarks`] ? styles.inputError : ""
                                    }`}
                                    disabled={loading}
                                  />
                                  {errors[`marksFields.${index}.passMarks`] && (
                                    <div className={styles.errorMessage}>
                                      {errors[`marksFields.${index}.passMarks`]}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Enable Negative Marking Checkbox - Optional */}
                            <div className={styles.checkboxField}>
                              <input
                                type="checkbox"
                                id={`neg-${fieldType.id}`}
                                checked={field.enableNegativeMarking}
                                onChange={(e) => handleMarksFieldChange(index, 'enableNegativeMarking', e.target.checked)}
                                disabled={loading}
                                className={styles.checkbox}
                              />
                              <label htmlFor={`neg-${fieldType.id}`} className={styles.checkboxLabel}>
                                Enable Negative Marking? (Optional)
                              </label>
                            </div>

                            {field.enableNegativeMarking && (
                              <div className={styles.formRow}>
                                <label className={styles.label}>
                                  Negative Marks per Wrong Answer
                                </label>
                                <div className={styles.inputContainer}>
                                  <input
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    value={field.negativeMarks}
                                    onChange={(e) => handleMarksFieldChange(index, 'negativeMarks', parseFloat(e.target.value) || 0)}
                                    onBlur={() => handleBlur(`marksFields.${index}.negativeMarks`)}
                                    className={`${styles.input} ${
                                      errors[`marksFields.${index}.negativeMarks`] ? styles.inputError : ""
                                    }`}
                                    disabled={loading}
                                  />
                                  {errors[`marksFields.${index}.negativeMarks`] && (
                                    <div className={styles.errorMessage}>
                                      {errors[`marksFields.${index}.negativeMarks`]}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Total Marks Display */}
                  <div className={styles.totalMarksSection}>
                    <div className={styles.formRow}>
                      <label className={styles.label}>Total Marks</label>
                      <div className={styles.inputContainer}>
                        <input
                          type="number"
                          value={formData.totalMarks}
                          readOnly
                          className={`${styles.input} ${styles.readonlyInput}`}
                        />
                        {errors.totalMarks && (
                          <div className={styles.errorMessage}>{errors.totalMarks}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <hr className={styles.divider} />

                {/* Grading System Section - COMPLETELY OPTIONAL */}
                <div className={styles.section}>
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
                      Enable Grading System? (Optional)
                    </label>
                    <div className={styles.checkboxHelpText}>
                      Turn this on to configure grading and pass mark options.
                    </div>
                  </div>

                  {formData.enableGrading && (
                    <>
                      {/* Total Pass Marks - Required only when grading is enabled */}
                      <div className={styles.formRow}>
                        <label className={styles.label}>
                          Total Pass Marks <span className={styles.required}>*</span>
                        </label>
                        <div className={styles.inputContainer}>
                          <input
                            type="number"
                            value={formData.totalPassMarks}
                            onChange={(e) => handleInputChange("totalPassMarks", parseInt(e.target.value) || 0)}
                            onBlur={() => handleBlur("totalPassMarks")}
                            placeholder="e.g. 40"
                            className={`${styles.input} ${
                              errors.totalPassMarks ? styles.inputError : ""
                            }`}
                            disabled={loading}
                            min="0"
                            max={formData.totalMarks}
                          />
                          {errors.totalPassMarks && (
                            <div className={styles.errorMessage}>{errors.totalPassMarks}</div>
                          )}
                        </div>
                      </div>

                      {/* Info Text */}
                      <div className={styles.infoText}>
                        Minimum marks required to pass the exam.
                      </div>

                      {/* Show Grading in Result Options - Optional even when grading is enabled */}
                      <div className={styles.checkboxField}>
                        <input
                          type="checkbox"
                          id="showPercentageInResult"
                          checked={formData.showPercentageInResult}
                          onChange={(e) => handleInputChange("showPercentageInResult", e.target.checked)}
                          disabled={loading}
                          className={styles.checkbox}
                        />
                        <label htmlFor="showPercentageInResult" className={styles.checkboxLabel}>
                          Show Grading in Result as % marks?
                        </label>
                        <div className={styles.checkboxHelpText}>
                          Include % marks in result reports
                        </div>
                      </div>

                      <div className={styles.checkboxField}>
                        <input
                          type="checkbox"
                          id="showGPAInResult"
                          checked={formData.showGPAInResult}
                          onChange={(e) => handleInputChange("showGPAInResult", e.target.checked)}
                          disabled={loading}
                          className={styles.checkbox}
                        />
                        <label htmlFor="showGPAInResult" className={styles.checkboxLabel}>
                          As GPA system?
                        </label>
                        <div className={styles.checkboxHelpText}>
                          Include GPA grading in result reports
                        </div>
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