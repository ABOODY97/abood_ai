import { useEffect, useRef, useState } from 'react';
import type { ClipboardEvent, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  ClipboardPaste,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FlaskConical,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  getNextDefaultKeyName,
  maskApiKey,
  sanitizeApiKey,
  validateApiKeyWithServer,
} from '../utils/apiKeys';
import type { ApiKeyEntry, KeyValidationResult } from '../utils/apiKeys';

const AI_STUDIO_KEY_URL = 'https://aistudio.google.com/apikey';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  keys: ApiKeyEntry[];
  activeKeyId: string | null;
  currentModelId: string;
  onActivateKey: (id: string) => void;
  onRenameKey: (id: string, newName: string) => void;
  onDeleteKey: (id: string) => void;
  onAddKey: (rawKey: string, optionalName?: string, activate?: boolean) => void;
  onExportConversations: () => void;
  onClearAllData: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  keys,
  activeKeyId,
  currentModelId,
  onActivateKey,
  onRenameKey,
  onDeleteKey,
  onAddKey,
  onExportConversations,
  onClearAllData,
}: SettingsModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, KeyValidationResult>
  >({});

  // Add new key form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKeyInput, setNewKeyInput] = useState('');
  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKey, setShowNewKey] = useState(false);
  const [isValidatingNew, setIsValidatingNew] = useState(false);
  const [newKeyValidation, setNewKeyValidation] =
    useState<KeyValidationResult | null>(null);
  const [clipboardHint, setClipboardHint] = useState<string | null>(null);

  // Clear all data inline confirm
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const renameInputRef = useRef<HTMLInputElement | null>(null);
  const newKeyInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setEditingId(null);
      setConfirmDeleteId(null);
      setConfirmClearAll(false);
      setShowAddForm(false);
      setNewKeyInput('');
      setNewKeyName('');
      setNewKeyValidation(null);
      setClipboardHint(null);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (editingId) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [editingId]);

  if (!isOpen || typeof document === 'undefined') return null;

  const cleanNewKey = sanitizeApiKey(newKeyInput);
  const defaultNextName = getNextDefaultKeyName(keys);

  const handleTestExistingKey = async (entry: ApiKeyEntry) => {
    if (testingId) return;
    setTestingId(entry.id);
    const result = await validateApiKeyWithServer(entry.key, currentModelId);
    setTestResults((prev) => ({ ...prev, [entry.id]: result }));
    setTestingId(null);
  };

  const handlePasteNewKey = async () => {
    setClipboardHint(null);
    setNewKeyValidation(null);
    try {
      if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
        const text = await navigator.clipboard.readText();
        const cleaned = sanitizeApiKey(text);
        if (!cleaned) {
          setClipboardHint('الحافظة فارغة. انسخ المفتاح أولاً.');
          return;
        }
        setNewKeyInput(cleaned);
        newKeyInputRef.current?.focus();
        return;
      }
      throw new Error('Clipboard API unavailable');
    } catch {
      setClipboardHint(
        'لم يسمح المتصفح بالقراءة التلقائية من الحافظة. الصق المفتاح مباشرة داخل الحقل.'
      );
      newKeyInputRef.current?.focus();
    }
  };

  const handleNewKeyPasteEvent = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData?.getData('text');
    if (typeof pasted === 'string') {
      e.preventDefault();
      setNewKeyInput(sanitizeApiKey(pasted));
      setNewKeyValidation(null);
      setClipboardHint(null);
    }
  };

  const handleValidateAndAddNewKey = async (e: FormEvent) => {
    e.preventDefault();
    if (!cleanNewKey || isValidatingNew) return;

    setIsValidatingNew(true);
    setNewKeyValidation(null);
    const result = await validateApiKeyWithServer(cleanNewKey, currentModelId);
    setNewKeyValidation(result);
    setIsValidatingNew(false);

    if (result.valid) {
      onAddKey(cleanNewKey, newKeyName, true);
      setNewKeyInput('');
      setNewKeyName('');
      setShowAddForm(false);
      setNewKeyValidation(null);
    }
  };

  const handleSaveNewAnyway = () => {
    if (!cleanNewKey) return;
    onAddKey(cleanNewKey, newKeyName, true);
    setNewKeyInput('');
    setNewKeyName('');
    setShowAddForm(false);
    setNewKeyValidation(null);
  };

  const startRename = (entry: ApiKeyEntry) => {
    setConfirmDeleteId(null);
    setEditingId(entry.id);
    setDraftName(entry.name);
  };

  const commitRename = () => {
    if (editingId && draftName.trim()) {
      onRenameKey(editingId, draftName.trim());
    }
    setEditingId(null);
    setDraftName('');
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="الإعدادات وإدارة مفاتيح API"
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/55 backdrop-blur-[1px]"
      />

      {/* Modal Panel */}
      <div className="relative z-10 w-full sm:max-w-xl max-h-[90dvh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141923] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-teal-700 dark:text-teal-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">
              الإعدادات · مفاتيح API
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق الإعدادات"
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] space-y-5">
          {/* Security Notice */}
          <div className="rounded-xl border border-amber-200/90 dark:border-amber-900/60 bg-amber-50/75 dark:bg-amber-950/30 p-3.5 space-y-1.5 text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="font-medium">
                المفتاح محفوظ على هذا المتصفح فقط. لا تستخدم التطبيق بمفتاحك على جهاز عام أو مشترك.
              </p>
            </div>
            <p className="ps-6 text-amber-900/90 dark:text-amber-200/85">
              إن ظننت أن مفتاحك انكشف فاحذفه من{' '}
              <a
                href={AI_STUDIO_KEY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold underline underline-offset-4 hover:text-amber-700 dark:hover:text-amber-100"
              >
                <span>Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>{' '}
              وأنشئ مفتاحاً جديداً.
            </p>
          </div>

          {/* Saved Keys List Section */}
          <section aria-label="قائمة مفاتيح API المحفوظة" className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                المفاتيح المحفوظة
              </h3>
              {!showAddForm && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(true);
                    setNewKeyValidation(null);
                    setClipboardHint(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة مفتاح جديد</span>
                </button>
              )}
            </div>

            {/* Add New Key Inline Form */}
            {showAddForm && (
              <form
                onSubmit={handleValidateAndAddNewKey}
                className="rounded-xl border border-teal-500/40 bg-slate-50/80 dark:bg-[#0F141D] p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    إضافة مفتاح Gemini API جديد
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewKeyInput('');
                      setNewKeyName('');
                      setNewKeyValidation(null);
                    }}
                    aria-label="إلغاء إضافة مفتاح"
                    className="p-1 rounded-lg text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="settings-new-key"
                      className="text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      المفتاح
                    </label>
                    <button
                      type="button"
                      onClick={() => void handlePasteNewKey()}
                      className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      <span>لصق من الحافظة</span>
                    </button>
                  </div>
                  <div dir="ltr" className="relative flex items-center">
                    <input
                      ref={newKeyInputRef}
                      id="settings-new-key"
                      type={showNewKey ? 'text' : 'password'}
                      dir="ltr"
                      autoComplete="off"
                      spellCheck={false}
                      value={newKeyInput}
                      onChange={(e) => {
                        setNewKeyInput(e.target.value);
                        setNewKeyValidation(null);
                      }}
                      onPaste={handleNewKeyPasteEvent}
                      placeholder="AQ... / AIza..."
                      className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#141923] pl-3 pr-10 py-2 text-xs font-mono text-left text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewKey((p) => !p)}
                      aria-label={showNewKey ? 'إخفاء المفتاح الجديد' : 'إظهار المفتاح الجديد'}
                      className="absolute right-1.5 p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      {showNewKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {clipboardHint && (
                    <p className="mt-1 text-[11.5px] text-amber-700 dark:text-amber-300">
                      {clipboardHint}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="settings-new-key-name"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    اسم المفتاح (اختياري)
                  </label>
                  <input
                    id="settings-new-key-name"
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder={`الافتراضي: ${defaultNextName}`}
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#141923] px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-600"
                  />
                </div>

                {newKeyValidation && !newKeyValidation.valid && (
                  <div
                    role="alert"
                    className={`rounded-xl border px-3 py-2.5 text-xs space-y-2 ${
                      newKeyValidation.allowSave
                        ? 'border-amber-200 dark:border-amber-900/70 bg-amber-50/90 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200'
                        : 'border-rose-200 dark:border-rose-900/70 bg-rose-50/90 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200'
                    }`}
                  >
                    <p>{newKeyValidation.message}</p>
                    <button
                      type="button"
                      onClick={handleSaveNewAnyway}
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        newKeyValidation.allowSave
                          ? 'bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white'
                          : 'border border-rose-300 dark:border-rose-800 bg-white dark:bg-rose-950/60 text-rose-800 dark:text-rose-200'
                      }`}
                    >
                      {newKeyValidation.allowSave
                        ? 'حفظ المفتاح والمتابعة'
                        : 'حفظ على أي حال'}
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewKeyInput('');
                      setNewKeyName('');
                      setNewKeyValidation(null);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={!cleanNewKey || isValidatingNew}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    {isValidatingNew ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>جارٍ التحقق...</span>
                      </>
                    ) : (
                      <span>تحقق وحفظ</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Key Cards List */}
            <ul className="space-y-2.5">
              {keys.map((entry) => {
                const isActive = entry.id === activeKeyId;
                const isEditing = editingId === entry.id;
                const isConfirmingDelete = confirmDeleteId === entry.id;
                const isTesting = testingId === entry.id;
                const testResult = testResults[entry.id];

                return (
                  <li
                    key={entry.id}
                    className={`rounded-xl border p-3.5 transition-colors ${
                      isActive
                        ? 'border-teal-500/50 bg-teal-50/40 dark:bg-teal-950/25'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10151E]'
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          ref={renameInputRef}
                          type="text"
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename();
                            if (e.key === 'Escape') {
                              setEditingId(null);
                              setDraftName('');
                            }
                          }}
                          aria-label="اسم المفتاح الجديد"
                          className="flex-1 min-w-0 min-h-[38px] rounded-lg border border-teal-500 bg-white dark:bg-[#141923] px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={commitRename}
                          aria-label="حفظ اسم المفتاح"
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-teal-700 text-white hover:bg-teal-800 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setDraftName('');
                          }}
                          aria-label="إلغاء إعادة التسمية"
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {entry.name}
                              </span>
                              <span
                                dir="ltr"
                                className="text-xs font-mono text-slate-500 dark:text-slate-400"
                              >
                                {maskApiKey(entry.key)}
                              </span>
                              {isActive && (
                                <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                                  · نشط
                                </span>
                              )}
                            </div>
                          </div>

                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => onActivateKey(entry.id)}
                              aria-label={`تفعيل ${entry.name}`}
                              className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                            >
                              تفعيل
                            </button>
                          )}
                        </div>

                        {/* Actions row */}
                        {isConfirmingDelete ? (
                          <div className="flex items-center justify-between gap-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/70 px-3 py-2">
                            <span className="text-xs font-medium text-rose-800 dark:text-rose-200">
                              تأكيد حذف "{entry.name}"؟
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteKey(entry.id);
                                  setConfirmDeleteId(null);
                                }}
                                aria-label={`تأكيد حذف المفتاح ${entry.name}`}
                                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                              >
                                حذف
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 cursor-pointer"
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => void handleTestExistingKey(entry)}
                              disabled={Boolean(testingId)}
                              aria-label={`اختبار ${entry.name}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {isTesting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <FlaskConical className="w-3.5 h-3.5" />
                              )}
                              <span>اختبار</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => startRename(entry)}
                              aria-label={`إعادة تسمية ${entry.name}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>إعادة تسمية</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setConfirmDeleteId(entry.id);
                              }}
                              aria-label={`حذف ${entry.name}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>حذف</span>
                            </button>
                          </div>
                        )}

                        {testResult && (
                          <div
                            role="status"
                            className={`flex items-center gap-1.5 text-xs pt-1 ${
                              testResult.valid
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : testResult.allowSave
                                  ? 'text-amber-700 dark:text-amber-400'
                                  : 'text-rose-700 dark:text-rose-400'
                            }`}
                          >
                            {testResult.valid ? (
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span>{testResult.message}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <hr className="border-0 border-t border-slate-200/80 dark:border-slate-800" />

          {/* Data Export & Clear All Data Section */}
          <section aria-label="إدارة البيانات المحلية" className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              بيانات هذا الجهاز
            </h3>

            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={onExportConversations}
                className="inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                <span>تصدير المحادثات فقط (بدون المفاتيح)</span>
              </button>

              {!confirmClearAll ? (
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(true)}
                  className="inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/70 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>مسح كل البيانات</span>
                </button>
              ) : (
                <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 p-3">
                  <span className="text-xs font-medium text-rose-900 dark:text-rose-100">
                    سيتم حذف جميع المفاتيح والمحادثات من هذا المتصفح نهائياً. هل أنت متأكد؟
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmClearAll(false);
                        onClearAllData();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      نعم، امسح الكل
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearAll(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
}
