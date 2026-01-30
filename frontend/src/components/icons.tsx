/** Tailwind로 크기/색만 지정하는 아이콘 (Heroicons outline 스타일) */

const baseClass = 'shrink-0 stroke-current';

export function ThumbUpIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`${baseClass} ${className}`}>
      <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 0-.022.196-.045.393L7 20m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
    </svg>
  );
}

export function ThumbDownIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`${baseClass} ${className}`}>
      <path d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715-.211-1.413-.608-2.008L17 13V4m-7 10h2m5-4h12a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
    </svg>
  );
}
