import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  MessageSquare,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import type { Conversation } from '../types/chat';
import { groupConversationsByDate } from '../utils/conversations';
import { useAssistantName } from '../hooks/useAssistantName';
import { useLanguage } from '../hooks/useLanguage';
import { BrandLogo } from './BrandLogo';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  isOpen: boolean;
  onCloseMobile: () => void;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onDeleteChat: (id: string) => void;
}

export function Sidebar({
  conversations,
  activeId,
  isOpen,
  onCloseMobile,
  onNewChat,
  onSelectChat,
  onRenameChat,
  onDeleteChat,
}: SidebarProps) {
  const [assistantName] = useAssistantName();
  const { lang, t, dir } = useLanguage();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement | null>(null);

  const grouped = useMemo(
    () => groupConversationsByDate(conversations, Date.now(), lang),
    [conversations, lang]
  );

  useEffect(() => {
    if (editingId) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [editingId]);

  const startRename = (conv: Conversation) => {
    setConfirmDeleteId(null);
    setEditingId(conv.id);
    setDraftTitle(conv.title);
  };

  const commitRename = () => {
    if (editingId && draftTitle.trim()) {
      onRenameChat(editingId, draftTitle.trim());
    }
    setEditingId(null);
    setDraftTitle('');
  };

  const cancelRename = () => {
    setEditingId(null);
    setDraftTitle('');
  };

  const hiddenSlideClass =
    dir === 'rtl'
      ? 'translate-x-full lg:translate-x-0 lg:hidden'
      : '-translate-x-full lg:translate-x-0 lg:hidden';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          aria-hidden="true"
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <aside
        aria-label={t('sidebar.ariaLabel')}
        className={`fixed lg:static inset-y-0 start-0 z-40 flex flex-col w-[276px] shrink-0 bg-[#F6F7F9] dark:bg-[#131720] border-e border-slate-200/90 dark:border-slate-800/90 transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : hiddenSlideClass
        }`}
      >
        {/* Sidebar Top Brand & New Chat */}
        <div className="p-3.5 border-b border-slate-200/70 dark:border-slate-800/80">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <BrandLogo size="sm" />
              <span className="text-base font-bold text-slate-900 dark:text-slate-50 whitespace-nowrap truncate">
                {assistantName}
              </span>
            </div>
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label={t('sidebar.closeSidebar')}
              className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onNewChat();
              onCloseMobile();
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-600"
          >
            <Plus className="w-4 h-4" />
            <span>{t('sidebar.newChat')}</span>
          </button>
        </div>

        {/* Conversation History List */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
          {grouped.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('sidebar.emptyHistory')}
              </p>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.key}>
                <h2 className="px-2.5 mb-1.5 text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 text-start">
                  {group.label}
                </h2>
                <ul className="space-y-1">
                  {group.items.map((conv) => {
                    const isActive = conv.id === activeId;
                    const isEditing = conv.id === editingId;
                    const isConfirmingDelete = conv.id === confirmDeleteId;

                    if (isEditing) {
                      return (
                        <li
                          key={conv.id}
                          className="flex items-center gap-1 rounded-xl bg-white dark:bg-[#1B212E] border border-teal-500/60 px-2 py-1.5"
                        >
                          <input
                            ref={renameInputRef}
                            type="text"
                            value={draftTitle}
                            onChange={(e) => setDraftTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitRename();
                              if (e.key === 'Escape') cancelRename();
                            }}
                            aria-label={t('sidebar.renameInputAria')}
                            className="flex-1 min-w-0 bg-transparent text-xs text-slate-900 dark:text-slate-100 focus:outline-none px-1"
                          />
                          <button
                            type="button"
                            onClick={commitRename}
                            aria-label={t('sidebar.saveNewName')}
                            className="p-1.5 rounded-lg text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/60 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelRename}
                            aria-label={t('sidebar.cancelRename')}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      );
                    }

                    if (isConfirmingDelete) {
                      return (
                        <li
                          key={conv.id}
                          className="flex items-center justify-between gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/70 px-2.5 py-2"
                        >
                          <span className="text-xs font-medium text-rose-800 dark:text-rose-200 truncate">
                            {t('sidebar.deleteConfirm')}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteChat(conv.id);
                                setConfirmDeleteId(null);
                              }}
                              aria-label={t('sidebar.confirmDeleteAria', {
                                title: conv.title,
                              })}
                              className="px-2 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold cursor-pointer"
                            >
                              {t('sidebar.delete')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              aria-label={t('sidebar.cancelDeleteAria')}
                              className="px-2 py-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-[11px] font-medium cursor-pointer"
                            >
                              {t('sidebar.cancel')}
                            </button>
                          </div>
                        </li>
                      );
                    }

                    return (
                      <li
                        key={conv.id}
                        className={`group flex items-center gap-1 rounded-xl transition-colors ${
                          isActive
                            ? 'bg-slate-200/80 dark:bg-[#1F2736] text-slate-950 dark:text-white'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onSelectChat(conv.id);
                            onCloseMobile();
                          }}
                          className="flex-1 min-w-0 flex items-center gap-2.5 px-2.5 py-2.5 text-start cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-600 rounded-xl"
                        >
                          <MessageSquare className="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500" />
                          <span className="text-xs sm:text-[13px] font-medium truncate">
                            {conv.title}
                          </span>
                        </button>

                        <div
                          className={`flex items-center gap-0.5 pe-1.5 transition-opacity ${
                            isActive
                              ? 'opacity-100'
                              : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => startRename(conv)}
                            aria-label={t('sidebar.renameAria', {
                              title: conv.title,
                            })}
                            title={t('sidebar.rename')}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-300/50 dark:hover:bg-slate-700/60 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null);
                              setConfirmDeleteId(conv.id);
                            }}
                            aria-label={t('sidebar.deleteAria', {
                              title: conv.title,
                            })}
                            title={t('sidebar.delete')}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-100/70 dark:hover:bg-rose-950/60 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </nav>

        <div className="p-3 empty:hidden border-t border-slate-200/70 dark:border-slate-800/80">
          <PWAInstallButton />
        </div>
      </aside>
    </>
  );
}
