"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, X, Clock, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type AdminNotification,
} from "@/lib/actions/admin-settings";

export function AdminNotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [allNotifications, setAllNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalLoading, setIsModalLoading] = useState<boolean>(false);
  const [modalFilter, setModalFilter] = useState<"ALL" | "UNREAD">("ALL");
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchAlerts = async () => {
    try {
      const data = await getNotifications(5);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error("Error loading admin notifications:", err);
    }
  };

  const fetchAllAlerts = async () => {
    setIsModalLoading(true);
    try {
      const data = await getNotifications(50);
      setAllNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error("Error loading all notifications:", err);
    } finally {
      setIsModalLoading(false);
    }
  };

  // Initial load + silent 30s background polling
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleOpenModal = () => {
    setIsOpen(false);
    setIsModalOpen(true);
    void fetchAllAlerts();
  };

  const handleMarkAll = async () => {
    setLoading(true);
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setAllNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await markAllNotificationsAsRead();
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = async (id: string, isRead: boolean) => {
    if (isRead) return;

    setUnreadCount((c) => Math.max(0, c - 1));
    setNotifications((prev) =>
      prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
    );
    setAllNotifications((prev) =>
      prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
    );

    await markNotificationAsRead(id);
  };

  const filteredModalNotifications = allNotifications.filter((n) => {
    if (modalFilter === "UNREAD") return !n.isRead;
    return true;
  });

  return (
    <>
      <div className="relative inline-block" ref={containerRef}>
        {/* Bell Button */}
        <button
          onClick={handleToggle}
          aria-label="Admin Notifications"
          className="relative p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-colors focus:outline-none"
        >
          <Bell className="w-5 h-5 cursor-pointer" />

          {/* Live Unread Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-950 animate-in fade-in zoom-in duration-150">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                    {unreadCount} new
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  disabled={loading}
                  className="flex items-center gap-1 text-xs text-[var(--brand-primary)] hover:opacity-80 transition-opacity font-medium disabled:opacity-50"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List items */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  No notifications to display
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.notificationId}
                    onClick={() => handleItemClick(item.notificationId, item.isRead)}
                    className={`p-3.5 cursor-pointer transition-colors text-left flex gap-3 items-start ${
                      !item.isRead
                        ? "bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70"
                        : "hover:bg-slate-50/50 dark:hover:bg-slate-850/40"
                    }`}
                  >
                    {/* Indicator Dot */}
                    <span
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                        !item.isRead
                          ? "bg-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]/20"
                          : "bg-transparent"
                      }`}
                    />

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs ${
                          !item.isRead
                            ? "font-semibold text-slate-900 dark:text-slate-100"
                            : "font-medium text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {item.message}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block font-mono">
                        {item.createdAt}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Trigger Button to Open Modal */}
            <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center">
              <button
                onClick={handleOpenModal}
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-[var(--brand-primary)] dark:hover:text-[var(--brand-primary)] transition-colors py-1"
              >
                <span>View all notifications</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dedicated Notification Center Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[var(--brand-primary)]" />
                  Notification Center
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Complete audit history and system alerts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleMarkAll}
                    disabled={loading}
                    className="h-8 text-xs border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                  >
                    <CheckCheck className="w-3.5 h-3.5 mr-1 text-[var(--brand-primary)]" />
                    Mark all read
                  </Button>
                )}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 flex gap-2 text-xs">
              <button
                onClick={() => setModalFilter("ALL")}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  modalFilter === "ALL"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200 dark:border-slate-700"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                All ({allNotifications.length})
              </button>
              <button
                onClick={() => setModalFilter("UNREAD")}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  modalFilter === "UNREAD"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200 dark:border-slate-700"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/70 p-2">
              {isModalLoading ? (
                <div className="py-16 text-center text-xs text-slate-400 dark:text-slate-500">
                  Loading notifications...
                </div>
              ) : filteredModalNotifications.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400 dark:text-slate-500">
                  No notifications found.
                </div>
              ) : (
                filteredModalNotifications.map((item) => (
                  <div
                    key={item.notificationId}
                    onClick={() => handleItemClick(item.notificationId, item.isRead)}
                    className={`p-3.5 rounded-lg text-xs flex gap-3 transition-colors cursor-pointer ${
                      !item.isRead
                        ? "bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70"
                        : "hover:bg-slate-50/60 dark:hover:bg-slate-800/20"
                    }`}
                  >
                    <span
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                        !item.isRead
                          ? "bg-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]/20"
                          : "bg-transparent"
                      }`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`truncate ${
                            !item.isRead
                              ? "font-semibold text-slate-900 dark:text-slate-100"
                              : "font-medium text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 font-mono shrink-0">
                          <Clock className="w-3 h-3" />
                          {item.createdAt}
                        </span>
                      </div>

                      <p className="text-slate-600 dark:text-slate-400 text-xs mt-1 leading-relaxed">
                        {item.message}
                      </p>

                      {!item.isRead && (
                        <div className="mt-2 flex justify-end">
                          <span className="text-[11px] text-[var(--brand-primary)] font-medium">
                            Mark as read
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="h-8 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}