import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import hljs from 'highlight.js';
import { Check, Copy } from 'lucide-react';
import type { Components } from 'react-markdown';
import { useLanguage } from '../hooks/useLanguage';

interface CodeBlockProps {
  language: string;
  code: string;
}

function CodeBlock({ language, code }: CodeBlockProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const highlightedHtml = useMemo(() => {
    try {
      if (language && hljs.getLanguage(language)) {
        return hljs.highlight(code, { language, ignoreIllegals: true }).value;
      }
      return hljs.highlightAuto(code).value;
    } catch {
      return code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
  }, [code, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback copy via temporary textarea
      const el = document.createElement('textarea');
      el.value = code;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  const displayLang = language || 'code';

  return (
    <div
      dir="ltr"
      className="my-3.5 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#131822]"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-slate-200/80 dark:border-slate-800 bg-slate-100/80 dark:bg-[#181E2A]">
        <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400 select-none lowercase">
          {displayLang}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={t('message.copyCodeAria', { lang: displayLang })}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-600"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{t('message.copied')}</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>{t('message.copy')}</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-4 text-[13.5px] leading-relaxed">
        <pre className="m-0 bg-transparent">
          <code
            className={`hljs language-${displayLang} font-mono`}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        </pre>
      </div>
    </div>
  );
}

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const components = useMemo<Components>(
    () => ({
      h1: ({ children }) => (
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 mt-5 mb-2.5 leading-snug">
          {children}
        </h1>
      ),
      h2: ({ children }) => (
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-50 mt-5 mb-2 leading-snug">
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 mt-4 mb-1.5 leading-snug">
          {children}
        </h3>
      ),
      p: ({ children }) => (
        <p className="my-2.5 leading-[1.75] text-[15.5px] text-slate-800 dark:text-slate-200">
          {children}
        </p>
      ),
      ul: ({ children }) => (
        <ul className="my-2.5 ps-6 list-disc space-y-1.5 text-[15.5px] leading-[1.7] text-slate-800 dark:text-slate-200">
          {children}
        </ul>
      ),
      ol: ({ children }) => (
        <ol className="my-2.5 ps-6 list-decimal space-y-1.5 text-[15.5px] leading-[1.7] text-slate-800 dark:text-slate-200">
          {children}
        </ol>
      ),
      li: ({ children }) => <li className="leading-[1.7]">{children}</li>,
      strong: ({ children }) => (
        <strong className="font-semibold text-slate-950 dark:text-white">
          {children}
        </strong>
      ),
      blockquote: ({ children }) => (
        <blockquote className="my-3 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 text-[15px]">
          {children}
        </blockquote>
      ),
      hr: () => (
        <hr className="my-5 border-0 border-t border-slate-200 dark:border-slate-800" />
      ),
      a: ({ href, children }) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal-700 dark:text-teal-400 underline underline-offset-4 decoration-teal-600/40 hover:decoration-teal-600 transition-colors"
        >
          {children}
        </a>
      ),
      table: ({ children }) => (
        <div className="my-4 w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full border-collapse text-sm text-start">
            {children}
          </table>
        </div>
      ),
      thead: ({ children }) => (
        <thead className="bg-slate-100/80 dark:bg-slate-800/70 text-slate-900 dark:text-slate-100">
          {children}
        </thead>
      ),
      th: ({ children }) => (
        <th className="px-3.5 py-2.5 font-semibold text-start border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
          {children}
        </th>
      ),
      td: ({ children }) => (
        <td className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 align-top">
          {children}
        </td>
      ),
      pre: ({ children }) => <>{children}</>,
      code: ({ className, children, ...props }) => {
        const match = /language-([\w-+#.]+)/.exec(className || '');
        const rawText = String(children ?? '').replace(/\n$/, '');
        const isBlock = Boolean(match) || rawText.includes('\n');

        if (isBlock) {
          return <CodeBlock language={match?.[1] ?? ''} code={rawText} />;
        }

        return (
          <code
            dir="ltr"
            className="inline-block px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-100 dark:bg-slate-800/90 text-teal-800 dark:text-teal-300 font-mono text-[0.87em]"
            {...props}
          >
            {children}
          </code>
        );
      },
    }),
    []
  );

  return (
    <div className="aboodi-markdown break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
