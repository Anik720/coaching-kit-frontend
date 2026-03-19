"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import homeworkApi from "@/api/homeworkApi/homeworkApi";
import { toastManager } from "@/utils/toastConfig";
import styles from "../attendancePage/Attendance.module.css";

interface ClassItem   { _id: string; classname: string; }
interface BatchItem   { _id: string; batchName: string; }
interface SubjectItem { _id: string; subjectName: string; }

export default function AddHomeworkPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const editId       = searchParams.get("edit");

  const [classes,  setClasses]  = useState<ClassItem[]>([]);
  const [batches,  setBatches]  = useState<BatchItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [loadingClasses,  setLoadingClasses]  = useState(false);
  const [loadingBatches,  setLoadingBatches]  = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const [form, setForm] = useState({
    homeworkName: "",
    description:  "",
    class:        "",
    batches:      [] as string[],
    subject:      "",
    homeworkDate: "",
  });

  // Load classes & subjects on mount
  useEffect(() => {
    setLoadingClasses(true);
    homeworkApi.getClasses()
      .then(r => { const d = r.data?.data || r.data?.classes || r.data || []; setClasses(Array.isArray(d) ? d : []); })
      .catch(() => toastManager.showError("Failed to load classes"))
      .finally(() => setLoadingClasses(false));

    setLoadingSubjects(true);
    homeworkApi.getSubjects()
      .then(r => { const d = r.data?.data || r.data?.subjects || r.data || []; setSubjects(Array.isArray(d) ? d : []); })
      .catch(() => toastManager.showError("Failed to load subjects"))
      .finally(() => setLoadingSubjects(false));
  }, []);

  // Load batches when class changes
  useEffect(() => {
    if (!form.class) { setBatches([]); setForm(f => ({ ...f, batches: [] })); return; }
    setLoadingBatches(true);
    homeworkApi.getBatches(form.class)
      .then(r => { const d = r.data?.data || r.data?.batches || r.data || []; setBatches(Array.isArray(d) ? d : []); })
      .catch(() => toastManager.showError("Failed to load batches"))
      .finally(() => setLoadingBatches(false));
  }, [form.class]);

  // Load for edit mode
  useEffect(() => {
    if (!editId) return;
    homeworkApi.getHomeworkById(editId).then(r => {
      const h = r.data;
      setForm({
        homeworkName: h.homeworkName || "",
        description:  h.description  || "",
        class:        h.class?._id   || h.class  || "",
        batches:      Array.isArray(h.batches) ? h.batches.map((b: any) => b._id || b) : [],
        subject:      h.subject?._id || h.subject || "",
        homeworkDate: h.homeworkDate ? h.homeworkDate.split("T")[0] : "",
      });
    }).catch(() => toastManager.showError("Failed to load homework"));
  }, [editId]);

  const toggleBatch = (id: string) => {
    setForm(f => ({
      ...f,
      batches: f.batches.includes(id) ? f.batches.filter(b => b !== id) : [...f.batches, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.homeworkName.trim()) { toastManager.showError("Homework name is required"); return; }
    if (!form.class)               { toastManager.showError("Please select a class"); return; }
    if (form.batches.length === 0) { toastManager.showError("Please select at least one batch"); return; }
    if (!form.subject)             { toastManager.showError("Please select a subject"); return; }
    if (!form.homeworkDate)        { toastManager.showError("Please select a date"); return; }

    setLoading(true);
    try {
      if (editId) {
        await homeworkApi.updateHomework(editId, form);
        toastManager.showSuccess("Homework updated successfully");
      } else {
        await homeworkApi.createHomework(form);
        toastManager.showSuccess("Homework created successfully");
      }
      router.push("/dashboard/homework/list");
    } catch (err: any) {
      toastManager.showError(err?.response?.data?.message || "Failed to save homework");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
              boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
            }}>📚</div>
            <div>
              <h1 className={styles.pageTitle}>{editId ? "Edit Homework" : "Add New Homework"}</h1>
              <p className={styles.pageSubtitle}>Create homework assignment for a class, batch & subject</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className={styles.filterCard}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>

            {/* Homework Name */}
            <div className={styles.filterField} style={{ gridColumn: "1 / -1" }}>
              <label className={styles.filterLabel}>Homework Name <span className={styles.required}>*</span></label>
              <input
                type="text"
                className={styles.filterInput}
                placeholder="e.g. Chapter 3 Exercise"
                value={form.homeworkName}
                onChange={e => setForm(f => ({ ...f, homeworkName: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div className={styles.filterField} style={{ gridColumn: "1 / -1" }}>
              <label className={styles.filterLabel}>Description</label>
              <textarea
                className={styles.filterInput}
                rows={3}
                placeholder="Optional description..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                style={{ resize: "vertical", fontFamily: "inherit" }}
              />
            </div>

            {/* Class */}
            <div className={styles.filterField}>
              <label className={styles.filterLabel}>Class <span className={styles.required}>*</span></label>
              <select
                className={styles.filterSelect}
                value={form.class}
                onChange={e => setForm(f => ({ ...f, class: e.target.value, batches: [] }))}
                disabled={loadingClasses}
              >
                <option value="">— Select Class —</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.classname}</option>)}
              </select>
            </div>

            {/* Subject */}
            <div className={styles.filterField}>
              <label className={styles.filterLabel}>Subject <span className={styles.required}>*</span></label>
              <select
                className={styles.filterSelect}
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                disabled={loadingSubjects}
              >
                <option value="">— Select Subject —</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.subjectName}</option>)}
              </select>
            </div>

            {/* Homework Date */}
            <div className={styles.filterField}>
              <label className={styles.filterLabel}>Homework Date <span className={styles.required}>*</span></label>
              <input
                type="date"
                className={styles.filterInput}
                value={form.homeworkDate}
                onChange={e => setForm(f => ({ ...f, homeworkDate: e.target.value }))}
              />
            </div>

          </div>

          {/* Batches — multi-select checkboxes */}
          {form.class && (
            <div className={styles.filterField} style={{ marginBottom: "1.5rem" }}>
              <label className={styles.filterLabel}>Batches <span className={styles.required}>*</span></label>
              {loadingBatches ? (
                <p style={{ color: "#9ca3af", fontSize: 14 }}>Loading batches…</p>
              ) : batches.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: 14 }}>No batches found for selected class</p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6 }}>
                  {batches.map(b => (
                    <label key={b._id} style={{
                      display: "flex", alignItems: "center", gap: 7, cursor: "pointer",
                      padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                      border: `2px solid ${form.batches.includes(b._id) ? "#6366f1" : "#e2e8f0"}`,
                      background: form.batches.includes(b._id) ? "#eef2ff" : "#f8fafc",
                      color: form.batches.includes(b._id) ? "#6366f1" : "#64748b",
                      transition: "all .15s",
                    }}>
                      <input
                        type="checkbox"
                        style={{ display: "none" }}
                        checked={form.batches.includes(b._id)}
                        onChange={() => toggleBatch(b._id)}
                      />
                      {form.batches.includes(b._id) && <span>✓</span>}
                      {b.batchName}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit" disabled={loading} className={styles.btnPrimary} style={{ minWidth: 160 }}>
              {loading ? <><span className={styles.spinnerSmall} />&nbsp;Saving…</> : (editId ? "✓ Update Homework" : "✓ Save Homework")}
            </button>
            <button type="button" className={styles.btnSecondary} onClick={() => router.push("/dashboard/homework/list")}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
