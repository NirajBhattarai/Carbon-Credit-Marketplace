import { HTMLAttributes, ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  className,
  ...props
}: ModalProps) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4',
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <div
      className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
      onClick={handleOverlayClick}
    >
      <div
        className={cn(
          'bg-white rounded-2xl w-full max-h-[90vh] overflow-y-auto',
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  onClose?: () => void;
}

export function ModalHeader({
  children,
  onClose,
  className,
  ...props
}: ModalHeaderProps) {
  return (
    <div className={cn('p-6 border-b border-gray-200', className)} {...props}>
      <div className='flex items-center justify-between'>
        <div className='flex-1'>{children}</div>
        {onClose && (
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
          >
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

interface ModalContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function ModalContent({
  children,
  className,
  ...props
}: ModalContentProps) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
}

interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function ModalFooter({
  children,
  className,
  ...props
}: ModalFooterProps) {
  return (
    <div className={cn('p-6 border-t border-gray-200', className)} {...props}>
      {children}
    </div>
  );
}
