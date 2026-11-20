interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BrandLogo({ size = 'md', className = '' }: BrandLogoProps) {
  const dimensions =
    size === 'sm'
      ? 'w-8 h-8 rounded-lg'
      : size === 'lg'
        ? 'w-14 h-14 rounded-2xl'
        : 'w-9 h-9 rounded-xl';

  const iconSize = size === 'sm' ? 18 : size === 'lg' ? 30 : 20;

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 bg-teal-700 dark:bg-teal-600 text-white shadow-xs ${dimensions} ${className}`}
      aria-hidden="true"
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Geometric Arabic-inspired calligraphy arc ("ع") paired with a subtle node */}
        <path
          d="M21.5 11.2C19.8 9.2 16.9 8.5 14.3 9.4C11.7 10.3 10.2 12.7 10.6 15.1C11 17.5 13.4 18.6 16.5 18.2C13.1 19 10.5 20.8 10.5 23.1C10.5 25.1 12.6 26.2 15.6 25.8C18.5 25.4 21.1 23.6 22.8 21.2"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="22.5" cy="14.5" r="2.1" fill="currentColor" />
      </svg>
    </div>
  );
}
