"use client";

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOverview } from '@/api/overviewApi/overviewSlice';
import { RootState, AppDispatch } from '@/store/store';
import styles from './Overview.module.css';

export default function OverviewPage() {
  const dispatch = useDispatch<AppDispatch>();
  const overviewState = useSelector((state: RootState) => (state as any).overview);
  const loading = overviewState?.loading || false;
  const error = overviewState?.error || null;
  const data = overviewState?.data || null;

  useEffect(() => {
    dispatch(fetchOverview());
  }, [dispatch]);

  // State to manage global expand/collapse
  const [expandAll, setExpandAll] = useState(false);

  if (loading && !data) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading Academic Structure...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>Error: {error}</p>
        <button onClick={() => dispatch(fetchOverview())} className={styles.retryBtn}>Retry Connection</button>
      </div>
    );
  }

  if (!data) return null;
  const { totals, structure } = data;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Academic Overview</h1>
          <p className={styles.pageSubtitle}>A comprehensive hierarchical view of your institute's structure</p>
        </div>
        <button 
          className={styles.toggleAllBtn} 
          onClick={() => setExpandAll(!expandAll)}
        >
          {expandAll ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      {/* Top Stats Cards with enhanced depth and typography */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.1) 100%)', color: '#6366f1' }}>
             <svg className={styles.svgIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Classes</p>
            <p className={styles.statValue}>{totals?.classes || 0}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.1) 0%, rgba(244,63,94,0.1) 100%)', color: '#ec4899' }}>
             <svg className={styles.svgIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Subjects</p>
            <p className={styles.statValue}>{totals?.subjects || 0}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.1) 0%, rgba(56,189,248,0.1) 100%)', color: '#0ea5e9' }}>
            <svg className={styles.svgIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Groups</p>
            <p className={styles.statValue}>{totals?.groups || 0}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(16,185,129,0.1) 100%)', color: '#22c55e' }}>
            <svg className={styles.svgIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Batches</p>
            <p className={styles.statValue}>{totals?.batches || 0}</p>
          </div>
        </div>
      </div>

      {/* Enhanced Interactive Hierarchy Tree */}
      <div className={styles.treeSection}>
        <h2 className={styles.sectionTitle}>Structure Hierarchy</h2>
        <div className={styles.treeContainer}>
          {structure?.length === 0 ? (
            <div className={styles.emptyStateContainer}>
               <p className={styles.emptyMessage}>No academic structure found.</p>
            </div>
          ) : (
            structure?.map((cls: any) => (
              <details key={cls.classId} className={styles.treeNode} open={expandAll}>
                <summary className={`${styles.treeSummary} ${styles.classLevel}`}>
                  <span className={styles.arrowIcon}></span>
                  <span className={styles.nodeName}>{cls.className}</span> 
                  <span className={`${styles.countBadge} ${styles.badgeClass}`}>{cls.subjects?.length || 0} Subjects</span>
                </summary>
                
                <div className={styles.treeChildren}>
                  {cls.subjects?.map((sub: any) => (
                    <details key={sub.subjectId} className={styles.treeNode} open={expandAll}>
                      <summary className={`${styles.treeSummary} ${styles.subjectLevel}`}>
                        <span className={styles.connectorLineX}></span>
                        <span className={styles.arrowIcon}></span>
                        <span className={styles.nodeName}>{sub.subjectName}</span>
                        <span className={`${styles.countBadge} ${styles.badgeSubject}`}>{sub.groups?.length || 0} Groups</span>
                      </summary>
                      
                      <div className={styles.treeChildren}>
                        {sub.groups?.map((grp: any) => (
                          <details key={grp.groupId} className={styles.treeNode} open={expandAll}>
                            <summary className={`${styles.treeSummary} ${styles.groupLevel}`}>
                              <span className={styles.connectorLineX}></span>
                              <span className={styles.arrowIcon}></span>
                              <span className={styles.nodeName}>{grp.groupName}</span>
                              <span className={`${styles.countBadge} ${styles.badgeGroup}`}>{grp.batches?.length || 0} Batches</span>
                            </summary>
                            
                            <div className={styles.treeChildren}>
                              {grp.batches?.map((batch: any) => (
                                <div key={batch.batchId} className={styles.batchLeaf}>
                                  <span className={styles.connectorLineLeaf}></span>
                                  <span className={styles.leafDot}></span>
                                  <span className={styles.nodeName}>{batch.batchName}</span>
                                </div>
                              ))}
                              {(!grp.batches || grp.batches.length === 0) && (
                                <div className={styles.emptyLeaf}>
                                  <span className={styles.connectorLineLeaf}></span>
                                  No batches assigned yet
                                </div>
                              )}
                            </div>
                          </details>
                        ))}
                        {(!sub.groups || sub.groups.length === 0) && (
                          <div className={styles.emptyLeaf}>
                             <span className={styles.connectorLineLeaf}></span>
                             No groups assigned yet
                          </div>
                        )}
                      </div>
                    </details>
                  ))}
                  {(!cls.subjects || cls.subjects.length === 0) && (
                    <div className={styles.emptyLeaf}>
                       <span className={styles.connectorLineLeaf}></span>
                       No subjects assigned yet
                    </div>
                  )}
                </div>
              </details>
            ))
          )}
        </div>
      </div>
    </div>
  );
}