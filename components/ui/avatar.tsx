import { cn } from '@/lib/utils';

interface AvatarProps {
  name?: string;
  src?: string | null;
  size?: number;
  className?: string;
}

/** Circular avatar: shows the image when present, otherwise a gradient initial. */
export function Avatar({ name, src, size = 40, className }: AvatarProps) {
  const initial = (name?.trim()?.charAt(0) || 'U').toUpperCase();
  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-full',
        'bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-semibold shadow-soft select-none',
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name || 'Avatar'} className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </div>
  );
}
