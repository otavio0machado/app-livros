import Link from 'next/link';

function ShelfIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="3" y="26" width="26" height="2" rx="1" fill="currentColor" />
      <rect x="6" y="7" width="5" height="19" rx="1" fill="currentColor" />
      <rect x="13" y="11" width="4" height="15" rx="1" fill="currentColor" opacity="0.55" />
      <rect x="19" y="5" width="5" height="21" rx="1" fill="currentColor" />
    </svg>
  );
}

export default function Logo({ size = 'default' }: { size?: 'default' | 'large' }) {
  const iconSize = size === 'large' ? 'w-7 h-7' : 'w-5 h-5';
  const textSize = size === 'large' ? 'text-xl' : 'text-base';

  return (
    <Link href="/" className="flex items-center gap-1.5 text-navy-700 hover:text-navy-600 transition-colors">
      <ShelfIcon className={iconSize} />
      <span className={`font-semibold tracking-tight ${textSize}`}>myshelf</span>
    </Link>
  );
}
