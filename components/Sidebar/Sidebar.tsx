'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

/* ================= TYPES ================= */

type MenuItemLink = {
  label: string;
  href: string;
  icon: string;
};

type MenuItemCategory = {
  category: string;
  basePath: string;
  items: MenuItemLink[];
};

type MenuItem = MenuItemLink | MenuItemCategory;

/* ================= COMPONENT ================= */

const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: '🏠' },

    {
      category: 'Academic Function',
      basePath: '/dashboard',
      items: [
        { label: 'Create Class', href: '/dashboard/classes', icon: '📚' },
        { label: 'Create Subject', href: '/dashboard/subjects', icon: '📝' },
        { label: 'Create Group', href: '/dashboard/groups', icon: '👥' },
        { label: 'Create Batch', href: '/dashboard/batches', icon: '🎯' },
        { label: 'Over-view', href: '/dashboard/overview', icon: '📊' },
      ],
    },

    {
      category: 'Teachers Management',
      basePath: '/dashboard/teachers',
      items: [
        { label: 'Add New Teacher', href: '/dashboard/teachers/add', icon: '➕' },
        { label: 'Teacher List', href: '/dashboard/teachers/list', icon: '📋' },
        { label: 'Take Attendance', href: '/dashboard/teachers/take-attendance', icon: '✅' },
        { label: 'Attendance List', href: '/dashboard/teachers/attendance-list', icon: '🗂️' },
        { label: 'Pending Attendances', href: '/dashboard/teachers/pending', icon: '⏳' },
        { label: 'Monthly Attendance Report', href: '/dashboard/teachers/monthly-report', icon: '📆' },
        { label: 'Assign Subject & Payment', href: '/dashboard/teachers/assign', icon: '✏️' },
        { label: 'List Of Assigned Teacher', href: '/dashboard/teachers/assigned-list', icon: '📄' },
      ],
    },

    {
      category: 'Student Details',
      basePath: '/dashboard/students',
      items: [
        { label: 'Students List View', href: '/dashboard/students/lists', icon: '👨‍🎓' },
        { label: 'Student Deactivation', href: '/dashboard/students/deactivate', icon: '🚫' },
        { label: 'Batch Transfer', href: '/dashboard/students/batch-transfer', icon: '🔁' },
      ],
    },

    {
      category: 'Result Management',
      basePath: '/dashboard/results',
      items: [
        { label: 'Create Exam', href: '/dashboard/result/create-exam', icon: '📝' },
        { label: 'Exam List', href: '/dashboard/result/exam-list', icon: '📋' },
        { label: 'Create Combine Result', href: '/dashboard/result/create-combine', icon: '📊' },
        { label: 'Combine Result List', href: '/dashboard/result/combine-list', icon: '🗂️' },
        { label: 'Exam Category', href: '/dashboard/result/exam-category', icon: '🏷️' },
      ],
    },

    { label: 'Admission', href: '/dashboard/admission', icon: '🎓' },
    { label: 'Student Reports', href: '/dashboard/student-reports', icon: '📈' },
    { label: 'Fee Collection', href: '/dashboard/fee-collection', icon: '💰' },
  ];

  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  /* ========= AUTO EXPAND BASED ON ROUTE ========= */
  useEffect(() => {
    const activeCategories = menuItems
      .filter(
        (item): item is MenuItemCategory =>
          'category' in item && pathname.startsWith(item.basePath)
      )
      .map(item => item.category);

    setExpandedCategories(activeCategories);
  }, [pathname]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const isCategoryItem = (item: MenuItem): item is MenuItemCategory =>
    'category' in item;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarContent}>

        {/* HEADER */}
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <div className={styles.logoIcon}>FA</div>
            <div>
              <h1 className={styles.logo}>Fahim Academy</h1>
              <p className={styles.subtitle}>Coaching Management</p>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className={styles.nav}>
          {menuItems.map((item, index) => (
            <div key={index} className={styles.menuSection}>
              {isCategoryItem(item) ? (
                <>
                  <button
                    onClick={() => toggleCategory(item.category)}
                    className={styles.categoryButton}
                  >
                    <span className={styles.categoryTitle}>
                      {item.category}
                    </span>
                    <span
                      className={`${styles.categoryArrow} ${
                        expandedCategories.includes(item.category)
                          ? styles.expanded
                          : ''
                      }`}
                    >
                      ›
                    </span>
                  </button>

                  <div
                    className={`${styles.submenu} ${
                      expandedCategories.includes(item.category)
                        ? styles.submenuExpanded
                        : ''
                    }`}
                  >
                    {item.items.map(subItem => (
                      <NavLink
                        key={subItem.href}
                        href={subItem.href}
                        label={subItem.label}
                        icon={subItem.icon}
                        isActive={pathname === subItem.href}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <NavLink
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={pathname === item.href}
                />
              )}
            </div>
          ))}
        </nav>

        {/* FOOTER */}
        <div className={styles.footer}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>FA</div>
            <div className={styles.userDetails}>
              <p className={styles.userName}>Fahim Academy</p>
              <p className={styles.userRole}>Administrator</p>
            </div>
          </div>
          <button className={styles.logoutButton}>🚪</button>
        </div>

      </div>
    </aside>
  );
};

/* ================= NAV LINK ================= */

interface NavLinkProps {
  href: string;
  label: string;
  icon: string;
  isActive: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({
  href,
  label,
  icon,
  isActive,
}) => {
  return (
    <Link
      href={href}
      className={`${styles.navLink} ${isActive ? styles.active : ''}`}
    >
      <span className={styles.navIcon}>{icon}</span>
      <span className={styles.navLabel}>{label}</span>
      {isActive && <span className={styles.activeIndicator} />}
    </Link>
  );
};

export default Sidebar;