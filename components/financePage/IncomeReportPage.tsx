"use client";
import { useState, useEffect } from "react";
import { useFinance } from "@/hooks/useFinance";
import { toastManager } from "@/utils/toastConfig";
import styles from "@/components/employeePage/Employee.module.css";
import Link from "next/link";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function IncomeReportPage() {
  const {
    categories,
    incomes,
    incomeTotal,
    incomeTotalAmount,
    incomePage,
    incomeTotalPages,
    incomeLoading,
    fetchCategories,
    fetchIncomes,
    deleteIncome,
  } = useFinance();

  const [filters, setFilters] = useState({
    category: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchCategories({ type: "income" });
    fetchIncomes({});
  }, []);

  const incomeCategories = categories.filter((c) => c.type === "income");

  const buildParams = (overrides: Record<string, any> = {}) => {
    const params: Record<string, any> = { ...overrides };
    if (filters.category) params.category = filters.category;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    return params;
  };

  const handleFilter = () => {
    const params: Record<string, any> = {};
    if (filters.category) params.category = filters.category;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    fetchIncomes(params);
  };

  const handleReset = () => {
    setFilters({ category: "", startDate: "", endDate: "" });
    fetchIncomes({});
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this income record?")) return;
    const tid = toastManager.showLoading("Deleting...");
    try {
      await deleteIncome(id);
      toastManager.safeUpdateToast(tid, "Deleted!", "success");
      handleFilter();
    } catch {
      toastManager.safeUpdateToast(tid, "Failed", "error");
    }
  };

  const handleDownloadPDF = () => {
    const printContent = document.getElementById("income-report-table");
    if (!printContent) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><title>Income Report</title><style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
      th { background: #f3f4f6; font-weight: 700; }
      h2 { margin-bottom: 16px; }
    </style></head><body>
    <h2>Income Report</h2>
    <p>Total Amount: ৳ ${incomeTotalAmount?.toLocaleString()}</p>
    ${printContent.outerHTML}
    </body></html>`);
    win.document.close();
    win.print();
  };

  const handlePageChange = (page: number) => {
    fetchIncomes(buildParams({ page }));
  };

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString() : "-";
  const formatAmount = (n: number) => `৳ ${n?.toLocaleString() || 0}`;

  return (
    <div className={styles.pageContainerWide}>
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1>Income Report</h1>
          <p>View and filter all income transactions</p>
        </div>
        <Link
          href="/dashboard/finance/income/new"
          className={styles.btnSecondary}
        >
          ➕ Add Income
        </Link>
      </div>

      {/* ── Filters ── */}
      <div className={styles.filterCard}>
        <div className={styles.filterRow}>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Category</label>
            <select
              className={styles.filterSelect}
              value={filters.category}
              onChange={(e) =>
                setFilters((p) => ({ ...p, category: e.target.value }))
              }
            >
              <option value="">Select Category</option>
              {incomeCategories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.categoryName}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterField}>
            <label className={styles.filterLabel}>From Date</label>
            <input
              type="date"
              className={styles.filterInput}
              value={filters.startDate}
              onChange={(e) =>
                setFilters((p) => ({ ...p, startDate: e.target.value }))
              }
            />
          </div>

          <div className={styles.filterField}>
            <label className={styles.filterLabel}>To Date</label>
            <input
              type="date"
              className={styles.filterInput}
              value={filters.endDate}
              onChange={(e) =>
                setFilters((p) => ({ ...p, endDate: e.target.value }))
              }
            />
          </div>

          <div className={styles.filterActions}>
            <button
              className={styles.btnPrimary}
              style={{ padding: "9px 20px", fontSize: 14 }}
              onClick={handleFilter}
            >
              Filter
            </button>
            <button
              className={styles.btnSecondary}
              style={{
                padding: "9px 20px",
                fontSize: 14,
                background: "#059669",
                color: "white",
                border: "none",
              }}
              onClick={handleDownloadPDF}
            >
              📥 Download PDF
            </button>
            <button
              className={styles.btnSecondary}
              style={{
                padding: "9px 20px",
                fontSize: 14,
                background: "#ef4444",
                color: "white",
                border: "none",
              }}
              onClick={handleReset}
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div>
            <h2 className={styles.tableTitle}>Income Records</h2>
            <span
              style={{
                background: "#1d4ed8",
                color: "white",
                padding: "3px 12px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 700,
                display: "inline-block",
                marginTop: 4,
              }}
            >
              Total Amount: {formatAmount(incomeTotalAmount)}
            </span>
          </div>
          <span className={styles.tableCount}>{incomeTotal} records</span>
        </div>

        {incomeLoading ? (
          <div className={styles.loadingWrapper}>
            <div className={styles.spinner} />
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table} id="income-report-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date of Payment</th>
                  <th>Income Name</th>
                  <th>Category</th>
                  <th>Transaction ID</th>
                  <th>Payment Method</th>
                  <th>Amount</th>
                  <th>Payment Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {incomes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      style={{
                        textAlign: "center",
                        padding: "30px",
                        color: "#9ca3af",
                      }}
                    >
                      No data found
                    </td>
                  </tr>
                ) : (
                  incomes.map((inc, i) => (
                    <tr key={inc._id}>
                      <td>{(incomePage - 1) * 20 + i + 1}</td>
                      <td>{formatDate(inc.date)}</td>
                      <td style={{ fontWeight: 600 }}>{inc.incomeName}</td>
                      <td>{inc.categoryInfo?.categoryName || "-"}</td>
                      <td style={{ fontSize: 12 }}>
                        {inc.transactionId || "-"}
                      </td>
                      <td style={{ textTransform: "capitalize" }}>
                        {inc.paymentMethod?.replace(/_/g, " ")}
                      </td>
                      <td style={{ fontWeight: 700, color: "#059669" }}>
                        {formatAmount(inc.amount)}
                      </td>
                      <td>{formatDate(inc.createdAt)}</td>
                      <td>
                        <div className={styles.actionGroup}>
                          {inc.document && (
                            <a
                              href={`${BASE_URL}${inc.document}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.actionBtnView}
                              title="View Document"
                            >
                              📎
                            </a>
                          )}
                          <button
                            className={styles.actionBtnDelete}
                            onClick={() => handleDelete(inc._id)}
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
        )}

        {/* Pagination */}
        {incomeTotalPages > 1 && (
          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
              Page {incomePage} of {incomeTotalPages}
            </span>
            <div className={styles.paginationButtons}>
              <button
                className={styles.pageBtn}
                onClick={() => handlePageChange(incomePage - 1)}
                disabled={incomePage <= 1}
              >
                ‹
              </button>
              {Array.from(
                { length: Math.min(incomeTotalPages, 10) },
                (_, i) => i + 1
              ).map((p) => (
                <button
                  key={p}
                  className={`${styles.pageBtn} ${p === incomePage ? styles.active : ""}`}
                  onClick={() => handlePageChange(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className={styles.pageBtn}
                onClick={() => handlePageChange(incomePage + 1)}
                disabled={incomePage >= incomeTotalPages}
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
