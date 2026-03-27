"use client";
import { useState, useRef, ChangeEvent, useEffect } from "react";
import { useFinance } from "@/hooks/useFinance";
import { toastManager } from "@/utils/toastConfig";
import styles from "@/components/employeePage/Employee.module.css";
import Link from "next/link";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "mobile_banking", label: "Mobile Banking" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AddExpensePage() {
  const {
    categories,
    todayExpenses,
    todayExpenseTotal,
    expenseLoading,
    fetchCategories,
    fetchTodayExpense,
    createExpense,
    deleteExpense,
  } = useFinance();

  const [form, setForm] = useState({
    category: "",
    expenseName: "",
    date: "",
    amount: "",
    paymentMethod: "cash",
    walletOrAccountNo: "",
    expenseBy: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<{
    url: string;
    type: "image" | "pdf";
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories({ type: "expense", status: "published" });
    fetchTodayExpense();
  }, []);

  const expenseCategories = categories.filter((c) => c.type === "expense");

  const handleChange =
    (field: string) =>
    (
      e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toastManager.showError("File must be under 10 MB");
      return;
    }
    setDocFile(file);
    const isPdf = file.type === "application/pdf";
    if (isPdf) {
      setDocPreview({ url: file.name, type: "pdf" });
    } else {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setDocPreview({
          url: ev.target?.result as string,
          type: "image",
        });
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.category) errs.category = "Category is required";
    if (!form.expenseName.trim()) errs.expenseName = "Expense name is required";
    if (!form.date) errs.date = "Date is required";
    if (
      !form.amount ||
      isNaN(Number(form.amount)) ||
      Number(form.amount) < 0
    )
      errs.amount = "Valid amount is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toastManager.showError("Please fix the errors");
      return;
    }
    setSubmitting(true);
    const tid = toastManager.showLoading("Creating expense record...");
    try {
      const fd = new FormData();
      fd.append("category", form.category);
      fd.append("expenseName", form.expenseName.trim());
      fd.append("date", form.date);
      fd.append("amount", form.amount);
      fd.append("paymentMethod", form.paymentMethod);
      if (form.walletOrAccountNo.trim())
        fd.append("walletOrAccountNo", form.walletOrAccountNo.trim());
      if (form.expenseBy.trim())
        fd.append("expenseBy", form.expenseBy.trim());
      if (form.description.trim())
        fd.append("description", form.description.trim());
      if (docFile) fd.append("document", docFile);

      const result = await createExpense(fd);
      // @ts-ignore
      if (result?.type?.endsWith("/rejected"))
        throw new Error(result.payload as string || "Failed");

      toastManager.safeUpdateToast(tid, "Expense record created!", "success");
      setForm({
        category: "",
        expenseName: "",
        date: "",
        amount: "",
        paymentMethod: "cash",
        walletOrAccountNo: "",
        expenseBy: "",
        description: "",
      });
      setDocFile(null);
      setDocPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchTodayExpense();
    } catch (err: any) {
      toastManager.safeUpdateToast(tid, err.message || "Failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense record?")) return;
    const tid = toastManager.showLoading("Deleting...");
    try {
      await deleteExpense(id);
      toastManager.safeUpdateToast(tid, "Deleted!", "success");
      fetchTodayExpense();
    } catch {
      toastManager.safeUpdateToast(tid, "Failed to delete", "error");
    }
  };

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString() : "-";
  const formatAmount = (n: number) => `৳ ${n?.toLocaleString() || 0}`;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1>Create Expense</h1>
          <p>Record a new expense transaction</p>
        </div>
        <Link
          href="/dashboard/finance/expense/report"
          className={styles.btnSecondary}
        >
          📋 Expense Report
        </Link>
      </div>

      {/* ── Form Card ── */}
      <div className={styles.sectionCard}>
        <div className={styles.formGrid}>
          {/* Category */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>* Select Category</label>
            <select
              className={`${styles.formSelect} ${errors.category ? styles.error : ""}`}
              value={form.category}
              onChange={handleChange("category")}
            >
              <option value="">Select Category</option>
              {expenseCategories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.categoryName}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className={styles.fieldError}>{errors.category}</p>
            )}
          </div>

          {/* Expense Name */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>* Expense Name</label>
            <input
              type="text"
              className={`${styles.formInput} ${errors.expenseName ? styles.error : ""}`}
              value={form.expenseName}
              onChange={handleChange("expenseName")}
              placeholder="Expense name"
            />
            {errors.expenseName && (
              <p className={styles.fieldError}>{errors.expenseName}</p>
            )}
          </div>

          {/* Date */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>* Date</label>
            <input
              type="date"
              className={`${styles.formInput} ${errors.date ? styles.error : ""}`}
              value={form.date}
              onChange={handleChange("date")}
            />
            {errors.date && (
              <p className={styles.fieldError}>{errors.date}</p>
            )}
          </div>

          {/* Amount */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>* Amount</label>
            <input
              type="number"
              className={`${styles.formInput} ${errors.amount ? styles.error : ""}`}
              value={form.amount}
              onChange={handleChange("amount")}
              placeholder="0"
              min="0"
            />
            {errors.amount && (
              <p className={styles.fieldError}>{errors.amount}</p>
            )}
          </div>

          {/* Payment Method */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Payment Method</label>
            <select
              className={styles.formSelect}
              value={form.paymentMethod}
              onChange={handleChange("paymentMethod")}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Wallet / AC No */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Wallet No / AC No</label>
            <input
              type="text"
              className={styles.formInput}
              value={form.walletOrAccountNo}
              onChange={handleChange("walletOrAccountNo")}
              placeholder="Account or wallet number"
            />
          </div>

          {/* Expense By */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Expense By</label>
            <input
              type="text"
              className={styles.formInput}
              value={form.expenseBy}
              onChange={handleChange("expenseBy")}
              placeholder="Expense by name"
            />
          </div>

          {/* Document Upload */}
          <div className={styles.formFieldFull}>
            <label className={styles.formLabel}>Add Document</label>
            <div className={styles.profilePictureSection}>
              {docPreview && (
                <div className={styles.profilePreview}>
                  {docPreview.type === "image" ? (
                    <img
                      src={docPreview.url}
                      alt="Document preview"
                      className={styles.profilePreviewImg}
                    />
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        padding: 8,
                      }}
                    >
                      <span style={{ fontSize: 28 }}>📄</span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "#6b7280",
                          wordBreak: "break-all",
                          textAlign: "center",
                          maxWidth: 100,
                        }}
                      >
                        {docPreview.url}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div className={styles.fileInputWrapper}>
                <label
                  className={styles.fileInputLabel}
                  htmlFor="expenseDocInput"
                >
                  📎 Choose File
                  {docFile ? ` — ${docFile.name}` : " — No file chosen"}
                </label>
                <input
                  id="expenseDocInput"
                  type="file"
                  ref={fileInputRef}
                  className={styles.fileInput}
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf"
                  onChange={handleFileChange}
                />
                <span className={styles.fileHint}>
                  JPG, PNG, GIF, WEBP, PDF — max 10 MB
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className={styles.formFieldFull}>
            <label className={styles.formLabel}>Description</label>
            <textarea
              className={styles.formTextarea}
              value={form.description}
              onChange={handleChange("description")}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
        </div>

        <div className={styles.formActions} style={{ marginTop: 20 }}>
          <button
            className={styles.btnPrimary}
            onClick={handleSubmit}
            disabled={submitting || expenseLoading}
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>

      {/* ── Today's Expense Report ── */}
      <div className={styles.tableCard} style={{ marginTop: 24 }}>
        <div className={styles.tableHeader}>
          <div>
            <h2 className={styles.tableTitle}>Today's Expense Report</h2>
            <span
              style={{
                background: "#dc2626",
                color: "white",
                padding: "4px 14px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 700,
                display: "inline-block",
                marginTop: 6,
              }}
            >
              Total Amount = {formatAmount(todayExpenseTotal)}
            </span>
          </div>
          <Link
            href="/dashboard/finance/expense/report"
            className={styles.btnSecondary}
            style={{ fontSize: 13, padding: "8px 16px" }}
          >
            Full Report
          </Link>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Expense Name</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Transaction ID</th>
                <th>Payment Method</th>
                <th>Wallet/AC No</th>
                <th>Expense By</th>
                <th>Date</th>
                <th>Created At</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {todayExpenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={13}
                    style={{
                      padding: "30px",
                      textAlign: "center",
                      color: "#9ca3af",
                    }}
                  >
                    No Transaction Found Today!
                  </td>
                </tr>
              ) : (
                todayExpenses.map((exp, i) => (
                  <tr key={exp._id}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{exp.expenseName}</td>
                    <td>{exp.categoryInfo?.categoryName || "-"}</td>
                    <td>{exp.description || "-"}</td>
                    <td style={{ fontWeight: 600, color: "#dc2626" }}>
                      {formatAmount(exp.amount)}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {exp.transactionId || "-"}
                    </td>
                    <td style={{ textTransform: "capitalize" }}>
                      {exp.paymentMethod?.replace(/_/g, " ")}
                    </td>
                    <td>{exp.walletOrAccountNo || "-"}</td>
                    <td>
                      {typeof exp.expenseBy === "object"
                        ? exp.expenseBy?.username ||
                          exp.expenseBy?.email ||
                          "-"
                        : exp.expenseBy || "-"}
                    </td>
                    <td>{formatDate(exp.date)}</td>
                    <td>{formatDate(exp.createdAt)}</td>
                    <td>
                      <span
                        style={{
                          background:
                            exp.status === "approved"
                              ? "#d1fae5"
                              : "#fef3c7",
                          color:
                            exp.status === "approved"
                              ? "#065f46"
                              : "#92400e",
                          padding: "2px 8px",
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          textTransform: "capitalize",
                        }}
                      >
                        {exp.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionGroup}>
                        {exp.document && (
                          <a
                            href={`${BASE_URL}${exp.document}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.actionBtnView}
                            style={{ marginRight: 4 }}
                            title="View Document"
                          >
                            📎
                          </a>
                        )}
                        <button
                          className={styles.actionBtnDelete}
                          onClick={() => handleDelete(exp._id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
