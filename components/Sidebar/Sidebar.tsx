'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

type MenuItemLink = {
  label: string;
  href: string;
  icon: string;
};

type MenuItemCategory = {
  category: string;
  items: MenuItemLink[];
};

type MenuItem = MenuItemLink | MenuItemCategory;

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Academic Function']);

  const menuItems: MenuItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: "🏠" },
    { 
      category: "Academic Function",
      items: [
        { label: "Create Class", href: "/dashboard/classes", icon: "📚" },
        { label: "Create Subject", href: "/dashboard/subjects", icon: "📝" },
        { label: "Create Group", href: "/dashboard/groups", icon: "👥" },
        { label: "Create Batch", href: "/dashboard/batches", icon: "🎯" },
        { label: "Over-view", href: "/dashboard/overview", icon: "📊" },
      ]
    },
    { label: "Admission", href: "/dashboard/admission", icon: "🎓" },
    { label: "Student Details", href: "/dashboard/student-details", icon: "👨‍🎓" },
    { label: "Student Reports", href: "/dashboard/student-reports", icon: "📈" },
    { label: "Fee Collection", href: "/dashboard/fee-collection", icon: "💰" },
  ];

  const isCategoryItem = (item: MenuItem): item is MenuItemCategory => {
    return 'category' in item && item.category !== undefined;
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarContent}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <div className={styles.logoIcon}>FA</div>
            <div>
              <h1 className={styles.logo}>Fahim Academy</h1>
              <p className={styles.subtitle}>Coaching Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {menuItems.map((item, index) => (
            <div key={index} className={styles.menuSection}>
              {isCategoryItem(item) ? (
                <>
                  <button 
                    onClick={() => toggleCategory(item.category)}
                    className={styles.categoryButton}
                  >
                    <span className={styles.categoryTitle}>{item.category}</span>
                    <span className={`${styles.categoryArrow} ${expandedCategories.includes(item.category) ? styles.expanded : ''}`}>
                      ›
                    </span>
                  </button>
                  <div className={`${styles.submenu} ${expandedCategories.includes(item.category) ? styles.submenuExpanded : ''}`}>
                    {item.items.map((subItem, subIndex) => (
                      <NavLink 
                        key={subIndex}
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

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              <span>FA</span>
            </div>
            <div className={styles.userDetails}>
              <p className={styles.userName}>Fahim Academy</p>
              <p className={styles.userRole}>Administrator</p>
            </div>
          </div>
          <button className={styles.logoutButton}>
            <span>🚪</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

interface NavLinkProps {
  href: string;
  label: string;
  icon: string;
  isActive: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ href, label, icon, isActive }) => {
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