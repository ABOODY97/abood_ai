export const ar = {
  app: {
    title: '{name} — مساعدك الذكي للمحادثة',
    switchToLight: 'التبديل إلى الوضع الفاتح',
    switchToDark: 'التبديل إلى الوضع الداكن',
    lightMode: 'الوضع الفاتح',
    darkMode: 'الوضع الداكن',
    settingsAria: 'الإعدادات',
    settingsTitle: 'الإعدادات ومفاتيح API',
    showSidebar: 'إظهار الشريط الجانبي',
    hideSidebar: 'إخفاء الشريط الجانبي',
    scrollToBottom: 'الانتقال إلى أحدث رسالة',
    dragDropTitle: 'أفلت الصور هنا لإرفاقها بالرسالة',
    dragDropHint: 'يدعم PNG و JPG و WebP و GIF حتى 6 صور مع ضغط تلقائي',
  },
  onboarding: {
    welcome: 'أهلاً بك في {name}',
    subtitle:
      'للبدء، أدخل مفتاح Gemini API الخاص بك. يُحفظ المفتاح على جهازك فقط داخل هذا المتصفح.',
    apiKeyLabel: 'مفتاح Gemini API',
    pasteFromClipboard: 'لصق من الحافظة',
    showKey: 'إظهار المفتاح',
    hideKey: 'إخفاء المفتاح',
    keyNameLabel: 'اسم المفتاح',
    optional: '(اختياري)',
    keyNamePlaceholder: 'مثال: مفتاحي الرئيسي (الافتراضي: {defaultName})',
    validating: 'جارٍ التحقق من المفتاح...',
    saveAndStart: 'حفظ وابدأ',
    saveAndContinue: 'حفظ المفتاح والمتابعة',
    saveAnyway: 'حفظ على أي حال',
    privacyNote:
      'يُحفظ مفتاحك محلياً على جهازك فقط في المتصفح، ولا يُخزّن أبداً على الخادم أو في السجلات.',
    noKeyPrefix: 'ليس لديك مفتاح بعد؟ يمكنك الحصول على مفتاح مجاني خلال ثوانٍ من',
    aiStudioLink: 'صفحة مفاتيح Google AI Studio',
    freeKeyTip:
      'إذا كان مفتاحك مجانيًا فالأفضل استخدام Gemini Flash-Lite، فهو أسرع وأقل عرضة لأخطاء الازدحام وحدود الاستخدام.',
    clipboardEmpty: 'الحافظة فارغة. انسخ المفتاح أولاً ثم أعد المحاولة.',
    clipboardBlocked:
      'لم يسمح المتصفح بالقراءة التلقائية من الحافظة. اضغط مطولاً داخل حقل المفتاح واختر "لصق".',
    languageAria: 'تغيير لغة الواجهة',
  },
  sidebar: {
    ariaLabel: 'سجل المحادثات',
    closeSidebar: 'إغلاق القائمة الجانبية',
    newChat: 'محادثة جديدة',
    emptyHistory:
      'لا توجد محادثات سابقة بعد. ابدأ بسؤال جديد وسيتم حفظ محادثاتك تلقائياً هنا.',
    renameInputAria: 'اسم المحادثة الجديد',
    saveNewName: 'حفظ الاسم الجديد',
    cancelRename: 'إلغاء إعادة التسمية',
    deleteConfirm: 'حذف هذه المحادثة؟',
    confirmDeleteAria: 'تأكيد حذف المحادثة {title}',
    delete: 'حذف',
    cancel: 'إلغاء',
    cancelDeleteAria: 'إلغاء الحذف',
    rename: 'إعادة تسمية',
    renameAria: 'إعادة تسمية {title}',
    deleteAria: 'حذف {title}',
    dateGroups: {
      today: 'اليوم',
      yesterday: 'أمس',
      last7Days: 'آخر 7 أيام',
      older: 'سابقاً',
    },
  },
  welcome: {
    greeting: 'أهلاً بك في {name}',
    subtitle:
      'اسأل في أي موضوع، أرفق صوراً لتحليلها، أو ابدأ بإحدى هذه الأفكار السريعة.',
    suggestions: {
      code: {
        title: 'كتابة كود برمجي منظم',
        subtitle: 'دالة Python لتحليل البيانات وتنسيق النتائج في جدول',
        prompt:
          'اكتب لي دالة بلغة Python لتحليل قائمة من درجات الطلاب وحساب المتوسط وأعلى درجة، ثم اعرض شرحاً مختصراً وجدولاً يوضح المخرجات.',
      },
      science: {
        title: 'تبسيط مفهوم علمي معقد',
        subtitle: 'كيف تعمل الشبكات العصبية بأسلوب مبسط مع أمثلة',
        prompt:
          'اشرح لي كيف تعمل الشبكات العصبية في الذكاء الاصطناعي بأسلوب بسيط وواضح مع مثال من الحياة اليومية.',
      },
      email: {
        title: 'صياغة بريد أو محتوى احترافي',
        subtitle: 'رسالة رسمية مقنعة ومنظمة بالعربية أو الإنجليزية',
        prompt:
          'ساعدني في كتابة بريد إلكتروني احترافي للتقديم على وظيفة مطور واجهات أمامية، بأسلوب واثق ومختصر.',
      },
      plan: {
        title: 'خطة تعلّم عملية ومرتبة',
        subtitle: 'جدول أسبوعي لتعلّم مهارة جديدة من الصفر',
        prompt:
          'ضع لي خطة عملية لمدة 4 أسابيع لتعلّم أساسيات TypeScript وبناء مشروع صغير، مع جدول منظم لكل أسبوع.',
      },
    },
  },
  composer: {
    closeNotice: 'إغلاق التنبيه',
    attachedImagesAria: 'الصور المرفقة قبل الإرسال',
    removeImageAria: 'إزالة الصورة {name}',
    attachImages: 'إرفاق صور',
    attachImagesTitle:
      'إرفاق صور من المعرض أو الكاميرا (أو السحب والإفلات / اللصق)',
    placeholder: 'اسأل {name} أي شيء...',
    inputAria: 'حقل كتابة الرسالة',
    stopGeneration: 'إيقاف التوليد',
    sendMessage: 'إرسال الرسالة',
    sendTitle: 'إرسال (Enter)',
    footerHint:
      'اضغط Enter للإرسال · Shift+Enter لسطر جديد · قد يخطئ الذكاء الاصطناعي أحياناً، تحقق من المعلومات المهمة.',
  },
  message: {
    userMessageAria: 'رسالة المستخدم',
    viewImageAria: 'عرض الصورة {name}',
    assistantReplyAria: 'رد {name}',
    stoppedGeneration: '· تم إيقاف التوليد',
    showThinking: 'عرض التفكير',
    showThinkingActive: 'عرض التفكير (جارٍ التفكير...)',
    thinking: '{name} يفكر',
    typing: '{name} يكتب',
    copyReplyAria: 'نسخ رد {name}',
    copied: 'تم النسخ',
    copy: 'نسخ',
    regenerateAria: 'إعادة توليد الرد',
    regenerate: 'إعادة التوليد',
    copyCodeAria: 'نسخ كود {lang}',
  },
  lightbox: {
    previewAria: 'معاينة الصورة {name}',
    closeAria: 'إغلاق معاينة الصورة',
  },
  offline: {
    banner:
      'أنت غير متصل بالإنترنت حالياً — يمكنك تصفح محادثاتك المحفوظة فقط.',
  },
  pwa: {
    installAppAria: 'تثبيت تطبيق {name}',
    installButton: 'تثبيت التطبيق على جهازك',
    addToHomeAria: 'إضافة {name} إلى الشاشة الرئيسية',
    addToHomeButton: 'إضافة للشاشة الرئيسية',
    iosGuideAria: 'طريقة التثبيت على iPhone وiPad',
    iosGuideTitle: 'تثبيت {name} على iOS',
    close: 'إغلاق',
    iosStep1Before: 'اضغط على زر ',
    iosStep1Strong: 'المشاركة (Share)',
    iosStep1After: ' في شريط متصفح Safari.',
    iosStep2Before: 'مرّر للأسفل واختر ',
    iosStep2Strong: 'إضافة إلى الشاشة الرئيسية (Add to Home Screen)',
    iosStep2After: '.',
    iosStep3Before: 'اضغط ',
    iosStep3Strong: 'إضافة',
    iosStep3After: ' ليظهر {name} كتطبيق مستقل.',
    ok: 'حسناً',
  },
  modelPicker: {
    triggerAria: 'اختيار النموذج ومستوى التفكير',
    dialogAria: 'إعدادات النموذج ومستوى التفكير',
    mobileTitle: 'النموذج ومستوى التفكير',
    closeAria: 'إغلاق إعدادات النموذج',
    chooseModel: 'اختر النموذج',
    supportsTextAndImages: 'يدعم النصوص والصور',
    modelSelectionAria: 'اختيار النموذج',
    freeKeyTip:
      'إذا كان مفتاحك مجانيًا فالأفضل استخدام Gemini Flash-Lite، فهو أسرع وأقل عرضة لأخطاء الازدحام وحدود الاستخدام.',
    dismissTipAria: 'إغلاق توصية المفاتيح المجانية',
    dismissTipTitle: 'إغلاق',
    useFlashLite: 'استخدم Flash-Lite',
    thinkingLevel: 'مستوى التفكير',
    thinkingLevelAria: 'مستوى التفكير',
    modeLevel: 'تحكم بالمستوى',
    modeBudget: 'تحكم بميزانية التفكير',
    unsupportedDefault: 'هذا النموذج لا يدعم التفكير العميق.',
    hintAlwaysOn:
      'هذا النموذج يستخدم التفكير دائماً؛ اختر "تلقائي" أو "منخفض" لسرعة أكبر.',
    hintOff: 'التفكير متوقف للحصول على أسرع استجابة ممكنة.',
    hintCollapsible:
      'سيظهر ملخص التفكير (إن توفر) داخل قسم قابل للطي فوق الرد.',
  },
  models: {
    gemini4Hydrogen: {
      shortTag: 'سريع ومتوازن',
      description:
        'الخيار الافتراضي الممتاز للمحادثة اليومية، البرمجة، وتحليل الصور بسرعة عالية.',
    },
    gemini31FlashLite: {
      shortTag: 'فائق السرعة',
      description:
        'خفيف واستجابته فورية للأسئلة السريعة والترجمة والملخصات مع خيار إيقاف التفكير.',
    },
    gemini25Flash: {
      shortTag: 'مرن بالتفكير',
      description:
        'نموذج Flash مستقر يدعم التحكم بميزانية التفكير (من الإيقاف الكامل حتى العميق).',
    },
    gemini25Pro: {
      shortTag: 'الأذكى للتحليل',
      description:
        'أقوى دقة للاستدلال المعقد، البرمجة المتقدمة، والرياضيات وتحليل الصور التفصيلي.',
    },
    thinkingLabels: {
      none: 'بدون',
      auto: 'تلقائي',
      low: 'منخفض',
      medium: 'متوسط',
      high: 'عالٍ',
    },
  },
  keySwitcher: {
    quickSwitchTitle: 'التبديل السريع بين المفاتيح',
    keyCountSingle: '{count} مفتاح',
    keyCountPlural: '{count} مفاتيح',
    savedKeysAria: 'المفاتيح المحفوظة',
    activeTag: '· نشط',
    manageKeysAndSettings: 'إدارة المفاتيح والإعدادات',
    triggerAria: 'التبديل السريع لمفتاح API: {name}',
    triggerTitle: 'المفتاح النشط: {name}',
    dialogAria: 'تبديل مفتاح API',
    mobileTitle: 'مفاتيح API',
    closeAria: 'إغلاق قائمة المفاتيح',
  },
  settings: {
    dialogAria: 'الإعدادات وإدارة مفاتيح API',
    title: 'الإعدادات · مفاتيح API',
    closeAria: 'إغلاق الإعدادات',
    languageSectionAria: 'اختيار لغة الواجهة',
    assistantNameSectionAria: 'تخصيص اسم المساعد',
    assistantNameLabel: 'اسم المساعد',
    resetDefaultName: 'استعادة الاسم الافتراضي',
    assistantNameNote:
      'يُحفظ اسم المساعد في هذا المتصفح فقط (الحد الأقصى {max} حرفاً).',
    securityWarning:
      'المفتاح محفوظ على هذا المتصفح فقط. لا تستخدم التطبيق بمفتاحك على جهاز عام أو مشترك.',
    securityRevokeBefore: 'إن ظننت أن مفتاحك انكشف فاحذفه من',
    securityRevokeAfter: 'وأنشئ مفتاحاً جديداً.',
    savedKeysSectionAria: 'قائمة مفاتيح API المحفوظة',
    savedKeysTitle: 'المفاتيح المحفوظة',
    addNewKey: 'إضافة مفتاح جديد',
    addNewKeyFormTitle: 'إضافة مفتاح Gemini API جديد',
    cancelAddKeyAria: 'إلغاء إضافة مفتاح',
    keyLabel: 'المفتاح',
    pasteFromClipboard: 'لصق من الحافظة',
    showNewKeyAria: 'إظهار المفتاح الجديد',
    hideNewKeyAria: 'إخفاء المفتاح الجديد',
    clipboardEmpty: 'الحافظة فارغة. انسخ المفتاح أولاً.',
    clipboardBlocked:
      'لم يسمح المتصفح بالقراءة التلقائية من الحافظة. الصق المفتاح مباشرة داخل الحقل.',
    keyNameOptional: 'اسم المفتاح (اختياري)',
    defaultPlaceholder: 'الافتراضي: {name}',
    saveAndContinue: 'حفظ المفتاح والمتابعة',
    saveAnyway: 'حفظ على أي حال',
    cancel: 'إلغاء',
    validating: 'جارٍ التحقق...',
    validateAndSave: 'تحقق وحفظ',
    newKeyNameAria: 'اسم المفتاح الجديد',
    saveKeyNameAria: 'حفظ اسم المفتاح',
    cancelRenameAria: 'إلغاء إعادة التسمية',
    activeTag: '· نشط',
    activate: 'تفعيل',
    activateAria: 'تفعيل {name}',
    confirmDeletePrompt: 'تأكيد حذف "{name}"؟',
    confirmDeleteKeyAria: 'تأكيد حذف المفتاح {name}',
    delete: 'حذف',
    test: 'اختبار',
    testAria: 'اختبار {name}',
    rename: 'إعادة تسمية',
    renameAria: 'إعادة تسمية {name}',
    deleteAria: 'حذف {name}',
    localDataSectionAria: 'إدارة البيانات المحلية',
    localDataTitle: 'بيانات هذا الجهاز',
    exportConversations: 'تصدير المحادثات فقط (بدون المفاتيح)',
    clearAllData: 'مسح كل البيانات',
    clearAllConfirm:
      'سيتم حذف جميع المفاتيح والمحادثات من هذا المتصفح نهائياً. هل أنت متأكد؟',
    confirmClearAll: 'نعم، امسح الكل',
  },
  conversations: {
    defaultTitle: 'محادثة جديدة',
    imageAnalysisTitle: 'تحليل صورة',
  },
  apiKeys: {
    defaultKeyName: 'مفتاح {index}',
  },
  imageFiles: {
    invalidType: 'يرجى اختيار ملفات صور صالحة فقط (PNG، JPG، WebP، GIF).',
    maxImagesReached: 'يمكنك إرفاق ما يصل إلى {max} صور في الرسالة الواحدة.',
    partialAdded:
      'تمت إضافة أول {count} صور فقط (الحد الأقصى {max} صور في الرسالة).',
    fileTooLarge:
      'الصورة "{name}" كبيرة جداً (الحد الأقصى 15 ميجابايت قبل الضغط).',
    defaultImageName: 'صورة مرفقة',
    readFailed: 'تعذّرت قراءة الصورة "{name}".',
    compressFailed: 'تعذّر تحميل الصورة للضغط.',
  },
  errorBanner: {
    settings: 'الإعدادات',
    tryFlashLite: 'جرّب Flash-Lite',
    retry: 'إعادة المحاولة',
    dismissAria: 'إغلاق رسالة الخطأ',
    switchKeyPrompt: 'يمكنك التبديل إلى مفتاح آخر محفوظ بضغطة واحدة:',
    switchToKey: 'التبديل إلى {name}',
  },
  errors: {
    OFFLINE:
      'لا يوجد اتصال بالإنترنت حالياً. يرجى التحقق من الشبكة ثم الضغط على "إعادة المحاولة".',
    ABORTED: 'تم إيقاف توليد الرد.',
    NETWORK_ERROR:
      'تعذّر الاتصال بخدمة الذكاء الاصطناعي. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.',
    INVALID_API_KEY:
      'مفتاح الـ API غير صالح أو لا يملك الصلاحيات المطلوبة (رمز الخطأ: {status}). تحقق من مفتاح API في الإعدادات.',
    API_KEY_MISSING:
      'لم يتم تقديم مفتاح Gemini API. يرجى إدخال مفتاحك من الإعدادات أو شاشة البداية للمتابعة.',
    RATE_LIMIT:
      'تم تجاوز الحد المسموح به للطلبات لهذا المفتاح (رمز الخطأ: 429). يمكنك الانتظار قليلاً أو التبديل إلى مفتاح آخر من الإعدادات.',
    RATE_LIMIT_RETRY:
      'أرسلت عدداً كبيراً من الطلبات بسرعة. يرجى الانتظار {seconds} ثانية ثم المحاولة مجدداً.',
    MODEL_NOT_FOUND:
      'النموذج المحدد ({model}) غير متاح حالياً لهذا المفتاح (رمز الخطأ: 404). جرّب اختيار نموذج آخر من القائمة.',
    MODEL_NOT_FOUND_GENERIC:
      'النموذج المطلوب غير متاح حالياً لهذا المفتاح (رمز الخطأ: 404).',
    THINKING_CONFIG_UNSUPPORTED:
      'النموذج ({model}) لا يدعم مستوى التفكير المحدد حالياً (رمز الخطأ: 400). تم الرجوع تلقائياً إلى الإعداد المدعوم — اضغط "إعادة المحاولة".',
    SAFETY_BLOCKED:
      'تعذّر إكمال هذا الرد بسبب سياسات السلامة (رمز الخطأ: 400). جرّب إعادة صياغة سؤالك.',
    PAYLOAD_TOO_LARGE:
      'حجم الرسالة والصور المرفقة كبير جداً (الحد الأقصى 20 ميجابايت). جرّب تقليل عدد الصور ثم أعد الإرسال.',
    EMPTY_REQUEST: 'يرجى كتابة رسالة أو إرفاق صورة قبل الإرسال.',
    INVALID_IMAGES: 'الحد الأقصى هو {max} صور في الرسالة الواحدة.',
    EMPTY_RESPONSE: 'لم يصل رد من {name}. يرجى الضغط على "إعادة المحاولة".',
    CORS_FORBIDDEN: 'تم رفض الطلب من هذا النطاق لأسباب أمنية.',
    NOT_FOUND: 'المسار المطلوب غير موجود.',
    SERVER_ERROR:
      'حدث خطأ مؤقت أثناء توليد الرد من {name} (رمز الخطأ: {status}). يمكنك الضغط على "إعادة المحاولة".',
    SERVICE_UNAVAILABLE:
      'الخدمة مزدحمة مؤقتاً (رمز الخطأ: 503). يرجى المحاولة بعد قليل أو استخدام نموذج أخف.',
    HTTP_ERROR: 'خطأ في الخادم (رمز الخطأ: {status}).',
    STREAM_UNAVAILABLE: 'لم يتم فتح قناة البث من الخادم.',
    UNKNOWN_ERROR:
      'حدث خطأ غير متوقع أثناء الاتصال بـ {name}. يرجى الضغط على "إعادة المحاولة".',
  },
  keyValidation: {
    VALID: 'المفتاح صالح وجاهز للاستخدام.',
    EMPTY_KEY: 'يرجى إدخال مفتاح API أولاً.',
    API_KEY_MISSING: 'يرجى لصق مفتاح Gemini API قبل التحقق (رمز الخطأ: 400).',
    OFFLINE:
      'تعذّر التحقق الآن لعدم وجود اتصال بالإنترنت (رمز الخطأ: OFFLINE). يمكنك حفظ المفتاح والمتابعة.',
    INVALID_API_KEY:
      'المفتاح غير صالح أو لا يملك الصلاحيات المطلوبة (رمز الخطأ: {status}). تحقق من المفتاح ثم أعد المحاولة.',
    RATE_LIMIT:
      'تعذّر التحقق الآن بسبب تجاوز حد الطلبات (رمز الخطأ: 429). يمكنك حفظ المفتاح والمتابعة.',
    RATE_LIMIT_RETRY:
      'تعذّر التحقق الآن بسبب كثرة المحاولات (رمز الخطأ: 429). انتظر {seconds} ثانية أو احفظ المفتاح والمتابعة.',
    TIMEOUT:
      'تعذّر التحقق الآن بسبب انتهاء مهلة الاتصال (رمز الخطأ: {status}). يمكنك حفظ المفتاح والمتابعة.',
    NETWORK_ERROR:
      'تعذّر التحقق الآن بسبب مشكلة في الشبكة (رمز الخطأ: NETWORK). يمكنك حفظ المفتاح والمتابعة.',
    HTTP_ERROR:
      'تعذّر التحقق الآن (رمز الخطأ: {status}). لم يُرفض المفتاح كخاطئ، ويمكنك حفظه والمتابعة.',
    UNVERIFIED_GENERIC:
      'تعذّر التحقق الآن. يمكنك حفظ المفتاح والمتابعة.',
  },
} as const;

export type DeepStringRecord<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : DeepStringRecord<T[K]>;
};

export type Translations = DeepStringRecord<typeof ar>;
