import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'outlined' | 'elevated' | 'glass' | 'gradient';
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  hover?: boolean;
  interactive?: boolean;
}

export function Card({
  children,
  className,
  variant = 'default',
  padding = 'md',
  rounded = 'xl',
  hover = false,
  interactive = false,
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-white border border-gray-200',
    outlined: 'bg-white border-2 border-gray-300',
    elevated: 'bg-white shadow-lg border border-gray-100',
    glass: 'bg-white/80 backdrop-blur-sm border border-white/20',
    gradient: 'bg-gradient-to-br from-white to-gray-50 border border-gray-200',
  };

  const paddings = {
    none: '',
    xs: 'p-2',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  const roundedStyles = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  };

  const hoverStyles = hover ? 'transition-all duration-300 hover:shadow-lg hover:-translate-y-1' : '';
  const interactiveStyles = interactive ? 'cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:scale-105' : '';

  return (
    <div
      className={cn(
        variants[variant],
        paddings[padding],
        roundedStyles[rounded],
        hoverStyles,
        interactiveStyles,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  centered?: boolean;
}

export function CardHeader({ children, className, centered = false, ...props }: CardHeaderProps) {
  return (
    <div className={cn('mb-4', centered && 'text-center', className)} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function CardTitle({ children, className, size = 'md', ...props }: CardTitleProps) {
  const sizes = {
    sm: 'text-base font-semibold',
    md: 'text-lg font-semibold',
    lg: 'text-xl font-semibold',
    xl: 'text-2xl font-bold',
  };

  return (
    <h3
      className={cn('text-gray-900', sizes[size], className)}
      {...props}
    >
      {children}
    </h3>
  );
}

interface CardSubtitleProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export function CardSubtitle({ children, className, ...props }: CardSubtitleProps) {
  return (
    <p
      className={cn('text-sm text-gray-600 mt-1', className)}
      {...props}
    >
      {children}
    </p>
  );
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardContent({
  children,
  className,
  ...props
}: CardContentProps) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  centered?: boolean;
}

export function CardFooter({ children, className, centered = false, ...props }: CardFooterProps) {
  return (
    <div
      className={cn(
        'mt-4 pt-4 border-t border-gray-200',
        centered && 'text-center',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardImageProps extends HTMLAttributes<HTMLDivElement> {
  src: string;
  alt: string;
  aspectRatio?: 'square' | 'video' | 'wide';
}

export function CardImage({ src, alt, className, aspectRatio = 'video', ...props }: CardImageProps) {
  const aspectRatios = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[21/9]',
  };

  return (
    <div className={cn('overflow-hidden', aspectRatios[aspectRatio], className)} {...props}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
      />
    </div>
  );
}

interface CardBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

export function CardBadge({ children, className, variant = 'default', ...props }: CardBadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
