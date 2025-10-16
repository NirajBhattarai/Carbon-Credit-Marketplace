import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md' | 'lg'
}

export function Badge({ 
  children, 
  className, 
  variant = 'default',
  size = 'md',
  ...props 
}: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800 border-gray-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200'
  }
  
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border font-semibold',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface StatusBadgeProps extends HTMLAttributes<HTMLDivElement> {
  status: 'active' | 'burned' | 'expired' | 'pending' | 'completed'
  children?: ReactNode
}

export function StatusBadge({ status, children, className, ...props }: StatusBadgeProps) {
  const statusConfig = {
    active: {
      variant: 'success' as const,
      icon: '🌱',
      text: 'ACTIVE'
    },
    burned: {
      variant: 'error' as const,
      icon: '🔥',
      text: 'BURNED'
    },
    expired: {
      variant: 'warning' as const,
      icon: '⏰',
      text: 'EXPIRED'
    },
    pending: {
      variant: 'info' as const,
      icon: '⏳',
      text: 'PENDING'
    },
    completed: {
      variant: 'success' as const,
      icon: '✅',
      text: 'COMPLETED'
    }
  }

  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} className={className} {...props}>
      <span className="mr-1">{config.icon}</span>
      {children || config.text}
    </Badge>
  )
}

interface RarityBadgeProps extends HTMLAttributes<HTMLDivElement> {
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  children?: ReactNode
}

export function RarityBadge({ rarity, children, className, ...props }: RarityBadgeProps) {
  const rarityConfig = {
    common: {
      variant: 'default' as const,
      icon: '✨',
      text: 'COMMON'
    },
    rare: {
      variant: 'info' as const,
      icon: '🔮',
      text: 'RARE'
    },
    epic: {
      variant: 'warning' as const,
      icon: '💎',
      text: 'EPIC'
    },
    legendary: {
      variant: 'error' as const,
      icon: '⭐',
      text: 'LEGENDARY'
    }
  }

  const config = rarityConfig[rarity]

  return (
    <Badge variant={config.variant} className={className} {...props}>
      <span className="mr-1">{config.icon}</span>
      {children || config.text}
    </Badge>
  )
}
