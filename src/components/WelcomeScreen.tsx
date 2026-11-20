import { ArrowUpLeft } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface SuggestionItem {
  title: string;
  subtitle: string;
  prompt: string;
}

const SUGGESTIONS: SuggestionItem[] = [
  {
    title: 'كتابة كود برمجي منظم',
    subtitle: 'دالة Python لتحليل البيانات وتنسيق النتائج في جدول',
    prompt:
      'اكتب لي دالة بلغة Python لتحليل قائمة من درجات الطلاب وحساب المتوسط وأعلى درجة، ثم اعرض شرحاً مختصراً وجدولاً يوضح المخرجات.',
  },
  {
    title: 'تبسيط مفهوم علمي معقد',
    subtitle: 'كيف تعمل الشبكات العصبية بأسلوب مبسط مع أمثلة',
    prompt:
      'اشرح لي كيف تعمل الشبكات العصبية في الذكاء الاصطناعي بأسلوب بسيط وواضح مع مثال من الحياة اليومية.',
  },
  {
    title: 'صياغة بريد أو محتوى احترافي',
    subtitle: 'رسالة رسمية مقنعة ومنظمة بالعربية أو الإنجليزية',
    prompt:
      'ساعدني في كتابة بريد إلكتروني احترافي للتقديم على وظيفة مطور واجهات أمامية، بأسلوب واثق ومختصر.',
  },
  {
    title: 'خطة تعلّم عملية ومرتبة',
    subtitle: 'جدول أسبوعي لتعلّم مهارة جديدة من الصفر',
    prompt:
      'ضع لي خطة عملية لمدة 4 أسابيع لتعلّم أساسيات TypeScript وبناء مشروع صغير، مع جدول منظم لكل أسبوع.',
  },
];

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void;
}

export function WelcomeScreen({ onSelectPrompt }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-2xl flex flex-col items-center text-center">
        <BrandLogo size="lg" className="mb-5" />

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 [text-wrap:balance]">
          أهلاً بك في عبودي AI
        </h1>

        <p className="mt-2.5 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
          اسأل في أي موضوع، أرفق صوراً لتحليلها، أو ابدأ بإحدى هذه الأفكار السريعة.
        </p>

        <div className="mt-8 w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-start">
          {SUGGESTIONS.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => onSelectPrompt(item.prompt)}
              className="group flex flex-col justify-between gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141923] hover:border-teal-500/50 dark:hover:border-teal-500/40 hover:bg-slate-50/80 dark:hover:bg-[#19202D] p-4 transition-colors duration-150 text-start cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-600"
            >
              <div className="flex items-start justify-between gap-2 w-full">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                  {item.title}
                </span>
                <ArrowUpLeft className="w-4 h-4 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 shrink-0 transition-transform duration-150 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {item.subtitle}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
