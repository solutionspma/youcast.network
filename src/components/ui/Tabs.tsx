'use client';

import { useState, type ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
  variant?: 'underline' | 'pills';
}

export default function Tabs({ tabs, defaultTab, onChange, className = '', variant = 'underline' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? '');

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <div className={className}>
      <div
        className={`flex gap-1 ${
          variant === 'underline'
            ? 'border-b border-surface-700'
            : 'bg-surface-800 p-1 rounded-xl'
        }`}
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            disabled={tab.disabled}
            onClick={() => handleTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200
              disabled:opacity-40 disabled:cursor-not-allowed
              ${
                variant === 'underline'
                  ? `border-b-2 -mb-px ${
                      activeTab === tab.id
                        ? 'border-brand-500 text-white'
                        : 'border-transparent text-surface-400 hover:text-surface-200 hover:border-surface-500'
                    }`
                  : `rounded-lg ${
                      activeTab === tab.id
                        ? 'bg-surface-700 text-white shadow-sm'
                        : 'text-surface-400 hover:text-surface-200'
                    }`
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4" role="tabpanel">
        {activeContent}
      </div>
    </div>
  );
}
