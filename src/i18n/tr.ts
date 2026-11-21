import type { Translations } from './ar';

export const tr: Translations = {
  app: {
    title: '{name} — Yapay Zekâ Sohbet Asistanınız',
    switchToLight: 'Açık temaya geç',
    switchToDark: 'Koyu temaya geç',
    lightMode: 'Açık tema',
    darkMode: 'Koyu tema',
    settingsAria: 'Ayarlar',
    settingsTitle: 'Ayarlar ve API anahtarları',
    showSidebar: 'Kenar çubuğunu göster',
    hideSidebar: 'Kenar çubuğunu gizle',
    scrollToBottom: 'En son mesaja git',
    dragDropTitle: 'Eklemek için görselleri buraya bırakın',
    dragDropHint: 'Otomatik sıkıştırmayla 6 adede kadar PNG, JPG, WebP ve GIF desteklenir',
  },
  onboarding: {
    welcome: "{name}'a hoş geldiniz",
    subtitle:
      'Başlamak için Gemini API anahtarınızı girin. Anahtarınız yalnızca bu tarayıcıda, kendi cihazınızda saklanır.',
    apiKeyLabel: 'Gemini API Anahtarı',
    pasteFromClipboard: 'Panodan yapıştır',
    showKey: 'Anahtarı göster',
    hideKey: 'Anahtarı gizle',
    keyNameLabel: 'Anahtar adı',
    optional: '(isteğe bağlı)',
    keyNamePlaceholder: 'Örn: Ana anahtarım (varsayılan: {defaultName})',
    validating: 'Anahtar doğrulanıyor...',
    saveAndStart: 'Kaydet ve Başla',
    saveAndContinue: 'Anahtarı kaydet ve devam et',
    saveAnyway: 'Yine de kaydet',
    privacyNote:
      'Anahtarınız yalnızca cihazınızdaki tarayıcıda tutulur; sunucuda veya kayıtlarda kesinlikle saklanmaz.',
    noKeyPrefix: 'Henüz bir anahtarınız yok mu? Saniyeler içinde ücretsiz anahtar alın:',
    aiStudioLink: 'Google AI Studio API Anahtarları',
    freeKeyTip:
      'Ücretsiz bir API anahtarı kullanıyorsanız Gemini Flash-Lite önerilir; daha hızlıdır ve yoğunluk ya da kullanım sınırı hatalarına daha az takılır.',
    clipboardEmpty: 'Pano boş. Önce anahtarınızı kopyalayıp tekrar deneyin.',
    clipboardBlocked:
      'Tarayıcı panoyu otomatik okumaya izin vermedi. Anahtarı doğrudan alana yapıştırın.',
    languageAria: 'Arayüz dilini değiştir',
  },
  sidebar: {
    ariaLabel: 'Sohbet geçmişi',
    closeSidebar: 'Kenar çubuğunu kapat',
    newChat: 'Yeni sohbet',
    emptyHistory:
      'Henüz kayıtlı sohbet yok. Yeni bir soru sorun, sohbetleriniz burada otomatik olarak saklansın.',
    renameInputAria: 'Yeni sohbet başlığı',
    saveNewName: 'Başlığı kaydet',
    cancelRename: 'Yeniden adlandırmayı iptal et',
    deleteConfirm: 'Bu sohbet silinsin mi?',
    confirmDeleteAria: '{title} sohbetini silmeyi onayla',
    delete: 'Sil',
    cancel: 'İptal',
    cancelDeleteAria: 'Silmeyi iptal et',
    rename: 'Yeniden adlandır',
    renameAria: '{title} sohbetini yeniden adlandır',
    deleteAria: '{title} sohbetini sil',
    dateGroups: {
      today: 'Bugün',
      yesterday: 'Dün',
      last7Days: 'Son 7 gün',
      older: 'Daha eski',
    },
  },
  welcome: {
    greeting: "{name}'a hoş geldiniz",
    subtitle:
      'İstediğiniz konuda soru sorun, analiz için görsel ekleyin veya bu hızlı fikirlerden biriyle başlayın.',
    suggestions: {
      code: {
        title: 'Düzenli ve temiz kod yaz',
        subtitle: 'Verileri analiz edip sonuçları tablo hâlinde sunan Python fonksiyonu',
        prompt:
          'Bir öğrenci notları listesini analiz edip ortalamayı ve en yüksek notu hesaplayan bir Python fonksiyonu yaz, ardından kısa bir açıklama ve örnek çıktı tablosu ekle.',
      },
      science: {
        title: 'Karmaşık bir konuyu basitleştir',
        subtitle: 'Yapay sinir ağları nasıl çalışır? Günlük örneklerle sade anlatım',
        prompt:
          'Yapay zekâdaki sinir ağlarının nasıl çalıştığını günlük hayattan bir örnekle sade ve anlaşılır şekilde açıkla.',
      },
      email: {
        title: 'Profesyonel e-posta taslağı',
        subtitle: 'Kısa, ikna edici ve özenli bir resmi mesaj hazırla',
        prompt:
          'Ön yüz geliştirici (Frontend Developer) pozisyonuna başvurmak için kendinden emin, kısa ve profesyonel bir e-posta yazmama yardım et.',
      },
      plan: {
        title: 'Uygulanabilir öğrenme planı',
        subtitle: 'Sıfırdan yeni bir beceri için haftalık yol haritası',
        prompt:
          'TypeScript temellerini öğrenip küçük bir proje geliştirmek için 4 haftalık pratik bir çalışma planı hazırla ve haftalık tablo şeklinde düzenle.',
      },
    },
  },
  composer: {
    closeNotice: 'Bildirimi kapat',
    attachedImagesAria: 'Gönderime hazır ekli görseller',
    removeImageAria: '{name} görselini kaldır',
    attachImages: 'Görsel ekle',
    attachImagesTitle: 'Görsel ekle (veya sürükleyip bırak / yapıştır)',
    placeholder: "{name}'a her şeyi sor...",
    inputAria: 'Mesaj giriş alanı',
    stopGeneration: 'Durdur',
    sendMessage: 'Mesajı gönder',
    sendTitle: 'Gönder (Enter)',
    footerHint:
      'Göndermek için Enter · Yeni satır için Shift+Enter · Yapay zekâ bazen hata yapabilir, önemli bilgileri doğrulayın.',
  },
  message: {
    userMessageAria: 'Kullanıcı mesajı',
    viewImageAria: '{name} görselini görüntüle',
    assistantReplyAria: '{name} yanıtı',
    stoppedGeneration: '· Durduruldu',
    showThinking: 'Düşünme sürecini göster',
    showThinkingActive: 'Düşünme sürecini göster (düşünüyor...)',
    thinking: '{name} düşünüyor',
    typing: '{name} yazıyor',
    copyReplyAria: '{name} yanıtını kopyala',
    copied: 'Kopyalandı',
    copy: 'Kopyala',
    regenerateAria: 'Yanıtı yeniden oluştur',
    regenerate: 'Yeniden oluştur',
    copyCodeAria: '{lang} kodunu kopyala',
  },
  lightbox: {
    previewAria: '{name} görsel önizlemesi',
    closeAria: 'Görsel önizlemesini kapat',
  },
  offline: {
    banner:
      'Şu anda çevrimdışısınız — yalnızca kayıtlı sohbetlerinizi görüntüleyebilirsiniz.',
  },
  pwa: {
    installAppAria: '{name} uygulamasını yükle',
    installButton: 'Uygulamayı cihaza yükle',
    addToHomeAria: "{name}'ı Ana Ekrana ekle",
    addToHomeButton: 'Ana Ekrana Ekle',
    iosGuideAria: "iPhone ve iPad'e nasıl yüklenir",
    iosGuideTitle: "{name}'ı iOS'a yükle",
    close: 'Kapat',
    iosStep1Before: 'Safari çubuğundaki ',
    iosStep1Strong: 'Paylaş (Share)',
    iosStep1After: ' düğmesine dokunun.',
    iosStep2Before: 'Aşağı kaydırıp ',
    iosStep2Strong: 'Ana Ekrana Ekle (Add to Home Screen)',
    iosStep2After: ' seçeneğini seçin.',
    iosStep3Before: '',
    iosStep3Strong: 'Ekle',
    iosStep3After: ' düğmesine dokunarak {name} uygulamasını bağımsız kullanın.',
    ok: 'Tamam',
  },
  modelPicker: {
    triggerAria: 'Model ve düşünme düzeyini seç',
    dialogAria: 'Model ve düşünme ayarları',
    mobileTitle: 'Model ve Düşünme Düzeyi',
    closeAria: 'Model ayarlarını kapat',
    chooseModel: 'Model seçin',
    supportsTextAndImages: 'Metin ve görsel',
    modelSelectionAria: 'Model seçimi',
    freeKeyTip:
      'Ücretsiz bir API anahtarı kullanıyorsanız Gemini Flash-Lite önerilir; daha hızlıdır ve yoğunluk ya da kullanım sınırı hatalarına daha az takılır.',
    dismissTipAria: 'Ücretsiz anahtar önerisini kapat',
    dismissTipTitle: 'Kapat',
    useFlashLite: 'Flash-Lite kullan',
    thinkingLevel: 'Düşünme düzeyi',
    thinkingLevelAria: 'Düşünme düzeyi',
    modeLevel: 'Düzey kontrolü',
    modeBudget: 'Düşünme bütçesi',
    unsupportedDefault: 'Bu model derin düşünmeyi desteklemiyor.',
    hintAlwaysOn:
      'Bu model her zaman düşünme kullanır; daha hızlı yanıt için "Otomatik" veya "Düşük" seçin.',
    hintOff: 'En hızlı yanıt için düşünme kapalı.',
    hintCollapsible:
      'Düşünme özeti (mevcutsa) yanıtın üzerinde açılır kapanır bölümde görünür.',
  },
  models: {
    gemini4Hydrogen: {
      shortTag: 'Hızlı ve dengeli',
      description:
        'Günlük sohbet, kodlama ve hızlı görsel analizi için ideal varsayılan seçenek.',
    },
    gemini31FlashLite: {
      shortTag: 'Ultra hızlı',
      description:
        'Hızlı sorular, çeviri ve özetler için anında yanıt veren hafif model; düşünmeyi kapatma seçenekli.',
    },
    gemini25Flash: {
      shortTag: 'Esnek düşünme',
      description:
        'Kapalıdan derin akıl yürütmeye kadar düşünme bütçesi kontrolü sunan kararlı Flash modeli.',
    },
    gemini25Pro: {
      shortTag: 'Analizde en güçlü',
      description:
        'Karmaşık akıl yürütme, ileri düzey kodlama, matematik ve detaylı görsel analizi için en yüksek doğruluk.',
    },
    thinkingLabels: {
      none: 'Kapalı',
      auto: 'Otomatik',
      low: 'Düşük',
      medium: 'Orta',
      high: 'Yüksek',
    },
  },
  keySwitcher: {
    quickSwitchTitle: 'Hızlı anahtar değiştirici',
    keyCountSingle: '{count} anahtar',
    keyCountPlural: '{count} anahtar',
    savedKeysAria: 'Kayıtlı API anahtarları',
    activeTag: '· Aktif',
    manageKeysAndSettings: 'Anahtarları ve ayarları yönet',
    triggerAria: 'API anahtarını hızlı değiştir: {name}',
    triggerTitle: 'Aktif anahtar: {name}',
    dialogAria: 'API anahtarını değiştir',
    mobileTitle: 'API Anahtarları',
    closeAria: 'Anahtar listesini kapat',
  },
  settings: {
    dialogAria: 'Ayarlar ve API anahtarı yönetimi',
    title: 'Ayarlar · API Anahtarları',
    closeAria: 'Ayarları kapat',
    languageSectionAria: 'Arayüz dilini seçin',
    assistantNameSectionAria: 'Asistan adını özelleştir',
    assistantNameLabel: 'Asistan adı',
    resetDefaultName: 'Varsayılana dön',
    assistantNameNote:
      'Yalnızca bu tarayıcıda saklanır (en fazla {max} karakter).',
    securityWarning:
      'Anahtarınız yalnızca bu tarayıcıda saklanır. Kişisel anahtarınızı ortak veya halka açık cihazlarda kullanmayın.',
    securityRevokeBefore: 'Anahtarınızın sızdığını düşünüyorsanız şuradan silin:',
    securityRevokeAfter: 've yeni bir anahtar oluşturun.',
    savedKeysSectionAria: 'Kayıtlı API anahtarları listesi',
    savedKeysTitle: 'Kayıtlı anahtarlar',
    addNewKey: 'Yeni anahtar ekle',
    addNewKeyFormTitle: 'Yeni Gemini API anahtarı ekle',
    cancelAddKeyAria: 'Anahtar eklemeyi iptal et',
    keyLabel: 'Anahtar',
    pasteFromClipboard: 'Panodan yapıştır',
    showNewKeyAria: 'Yeni anahtarı göster',
    hideNewKeyAria: 'Yeni anahtarı gizle',
    clipboardEmpty: 'Pano boş. Önce anahtarı kopyalayın.',
    clipboardBlocked:
      'Tarayıcı panoyu otomatik okumaya izin vermedi. Anahtarı doğrudan alana yapıştırın.',
    keyNameOptional: 'Anahtar adı (isteğe bağlı)',
    defaultPlaceholder: 'Varsayılan: {name}',
    saveAndContinue: 'Anahtarı kaydet ve devam et',
    saveAnyway: 'Yine de kaydet',
    cancel: 'İptal',
    validating: 'Doğrulanıyor...',
    validateAndSave: 'Doğrula ve Kaydet',
    newKeyNameAria: 'Yeni anahtar adı',
    saveKeyNameAria: 'Anahtar adını kaydet',
    cancelRenameAria: 'Yeniden adlandırmayı iptal et',
    activeTag: '· Aktif',
    activate: 'Etkinleştir',
    activateAria: '{name} anahtarını etkinleştir',
    confirmDeletePrompt: '"{name}" silinsin mi?',
    confirmDeleteKeyAria: '{name} anahtarını silmeyi onayla',
    delete: 'Sil',
    test: 'Test et',
    testAria: '{name} anahtarını test et',
    rename: 'Yeniden adlandır',
    renameAria: '{name} anahtarını yeniden adlandır',
    deleteAria: '{name} anahtarını sil',
    localDataSectionAria: 'Yerel veri yönetimi',
    localDataTitle: 'Bu cihazdaki veriler',
    exportConversations: 'Yalnızca sohbetleri dışa aktar (anahtarsız)',
    clearAllData: 'Tüm verileri temizle',
    clearAllConfirm:
      'Bu tarayıcıdaki tüm anahtarlar ve sohbetler kalıcı olarak silinecek. Emin misiniz?',
    confirmClearAll: 'Evet, tümünü sil',
  },
  conversations: {
    defaultTitle: 'Yeni sohbet',
    imageAnalysisTitle: 'Görsel analizi',
  },
  apiKeys: {
    defaultKeyName: 'Anahtar {index}',
  },
  imageFiles: {
    invalidType: 'Lütfen yalnızca geçerli görsel dosyaları seçin (PNG, JPG, WebP, GIF).',
    maxImagesReached: 'Mesaj başına en fazla {max} görsel ekleyebilirsiniz.',
    partialAdded:
      'Yalnızca ilk {count} görsel eklendi (mesaj başına en fazla {max}).',
    fileTooLarge:
      '"{name}" görseli çok büyük (sıkıştırma öncesi en fazla 15 MB).',
    defaultImageName: 'Ekli görsel',
    readFailed: '"{name}" görseli okunamadı.',
    compressFailed: 'Görsel sıkıştırma için yüklenemedi.',
  },
  errorBanner: {
    settings: 'Ayarlar',
    tryFlashLite: 'Flash-Lite dene',
    retry: 'Tekrar dene',
    dismissAria: 'Hata mesajını kapat',
    switchKeyPrompt: 'Tek tıkla kayıtlı başka bir anahtara geçin:',
    switchToKey: '{name} anahtarına geç',
  },
  errors: {
    OFFLINE:
      'Şu anda internet bağlantınız yok. Bağlantınızı kontrol edip "Tekrar dene"ye basın.',
    ABORTED: 'Yanıt oluşturma durduruldu.',
    NETWORK_ERROR:
      'Yapay zekâ hizmetine bağlanılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.',
    INVALID_API_KEY:
      'API anahtarınız geçersiz veya gerekli izinlere sahip değil (hata {status}). Ayarlar bölümünden anahtarınızı kontrol edin.',
    API_KEY_MISSING:
      'Gemini API anahtarı girilmedi. Devam etmek için Ayarlar veya başlangıç ekranından anahtarınızı ekleyin.',
    RATE_LIMIT:
      'Bu anahtar için istek sınırı aşıldı (hata 429). Kısa bir süre bekleyin veya Ayarlardan başka bir anahtara geçin.',
    RATE_LIMIT_RETRY:
      'Çok hızlı istek gönderiyorsunuz. Lütfen {seconds} saniye bekleyip tekrar deneyin.',
    MODEL_NOT_FOUND:
      'Seçili model ({model}) bu anahtar için şu anda kullanılamıyor (hata 404). Listeden başka bir model seçmeyi deneyin.',
    MODEL_NOT_FOUND_GENERIC:
      'İstenen model bu anahtar için şu anda kullanılamıyor (hata 404).',
    THINKING_CONFIG_UNSUPPORTED:
      'Seçili model ({model}) bu düşünme düzeyini desteklemiyor (hata 400). Desteklenen düzeye geçildi — "Tekrar dene"ye basın.',
    SAFETY_BLOCKED:
      'Güvenlik politikaları nedeniyle bu yanıt tamamlanamadı (hata 400). Sorunuzu farklı ifade etmeyi deneyin.',
    PAYLOAD_TOO_LARGE:
      'Mesaj ve görseller 20 MB sınırını aşıyor. Daha az görsel ekleyip tekrar gönderin.',
    EMPTY_REQUEST: 'Göndermeden önce bir mesaj yazın veya görsel ekleyin.',
    INVALID_IMAGES: 'Mesaj başına en fazla {max} görsel ekleyebilirsiniz.',
    EMPTY_RESPONSE: '{name} yanıt vermedi. Lütfen "Tekrar dene"ye basın.',
    CORS_FORBIDDEN: 'Güvenlik nedeniyle bu kaynaktan gelen istek reddedildi.',
    NOT_FOUND: 'İstenen API yolu bulunamadı.',
    SERVER_ERROR:
      '{name} yanıt oluştururken geçici bir hata oluştu (hata {status}). "Tekrar dene"ye basın.',
    SERVICE_UNAVAILABLE:
      'Hizmet şu anda yoğun (hata 503). Biraz sonra tekrar deneyin veya daha hafif bir model seçin.',
    HTTP_ERROR: 'Sunucu hatası (durum kodu: {status}).',
    STREAM_UNAVAILABLE: 'Sunucudan akış kanalı açılamadı.',
    UNKNOWN_ERROR:
      '{name} ile iletişim kurulurken beklenmeyen bir hata oluştu. Lütfen "Tekrar dene"ye basın.',
  },
  keyValidation: {
    VALID: 'API anahtarı geçerli ve kullanıma hazır.',
    EMPTY_KEY: 'Lütfen önce bir API anahtarı girin.',
    API_KEY_MISSING: 'Doğrulamadan önce Gemini API anahtarınızı yapıştırın (hata 400).',
    OFFLINE:
      'İnternet bağlantısı olmadığı için şu anda doğrulanamadı (OFFLINE). Anahtarı kaydedip devam edebilirsiniz.',
    INVALID_API_KEY:
      'API anahtarı geçersiz veya gerekli izinlere sahip değil (hata {status}). Anahtarı kontrol edip tekrar deneyin.',
    RATE_LIMIT:
      'İstek sınırı nedeniyle şu anda doğrulanamadı (hata 429). Anahtarı kaydedip devam edebilirsiniz.',
    RATE_LIMIT_RETRY:
      'Çok fazla doğrulama denemesi yapıldı (hata 429). {seconds} saniye bekleyin veya anahtarı kaydedip devam edin.',
    TIMEOUT:
      'Bağlantı zaman aşımına uğradı (hata {status}). Anahtarı kaydedip devam edebilirsiniz.',
    NETWORK_ERROR:
      'Ağ sorunu nedeniyle şu anda doğrulanamadı (NETWORK). Anahtarı kaydedip devam edebilirsiniz.',
    HTTP_ERROR:
      'Şu anda doğrulanamadı (hata {status}). Anahtar geçersiz olarak reddedilmedi; kaydedip devam edebilirsiniz.',
    UNVERIFIED_GENERIC:
      'Şu anda doğrulanamadı. Anahtarı kaydedip devam edebilirsiniz.',
  },
};
