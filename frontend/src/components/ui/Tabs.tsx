import React from 'react';

interface TabsProps {
  tabs: { id: string; label: string; icon?: string }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex border-b border-white/10 glass-surface rounded-xl overflow-hidden">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
            activeTab === tab.id
              ? 'bg-primary/20 text-foreground'
              : 'text-foreground/70 hover:bg-white/10 hover:text-foreground'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

