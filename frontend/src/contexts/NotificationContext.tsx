'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType) => void;
  notifications: Notification[];
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
    const id = Math.random().toString(36).substring(7);
    const notification: Notification = { id, message, type };
    
    setNotifications((prev) => [...prev, notification]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  }, [removeNotification]);

  return (
    <NotificationContext.Provider value={{ showNotification, notifications, removeNotification }}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
}

function NotificationContainer({ 
  notifications, 
  onRemove 
}: { 
  notifications: Notification[]; 
  onRemove: (id: string) => void;
}) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

function NotificationToast({ 
  notification, 
  onRemove 
}: { 
  notification: Notification; 
  onRemove: (id: string) => void;
}) {
  const getStyles = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-600/90 border-green-500 text-white';
      case 'error':
        return 'bg-red-600/90 border-red-500 text-white';
      case 'warning':
        return 'bg-yellow-600/90 border-yellow-500 text-white';
      case 'info':
      default:
        return 'bg-blue-600/90 border-blue-500 text-white';
    }
  };

  return (
    <div
      className={`${getStyles()} px-4 py-3 rounded-lg shadow-lg border backdrop-blur-sm min-w-[300px] max-w-[400px] flex items-center justify-between gap-3 animate-in slide-in-from-right`}
    >
      <p className="flex-1 text-sm font-medium">{notification.message}</p>
      <button
        onClick={() => onRemove(notification.id)}
        className="text-white/80 hover:text-white transition-colors"
        aria-label="Cerrar notificación"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

