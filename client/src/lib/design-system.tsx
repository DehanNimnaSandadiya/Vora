/**
 * Vora Design System
 * Premium Light Theme - Discord-inspired with sophisticated polish
 */

import { cn } from "./utils"

// Spacing scale (Tailwind defaults)
export const spacing = {
  xs: "0.5rem",    // 8px
  sm: "0.75rem",   // 12px
  md: "1rem",      // 16px
  lg: "1.5rem",    // 24px
  xl: "2rem",      // 32px
  "2xl": "3rem",   // 48px
  "3xl": "4rem",   // 64px
}

// Typography scale
export const typography = {
  xs: "text-xs",      // 0.75rem / 12px
  sm: "text-sm",      // 0.875rem / 14px
  base: "text-base",  // 1rem / 16px
  lg: "text-lg",      // 1.125rem / 18px
  xl: "text-xl",      // 1.25rem / 20px
  "2xl": "text-2xl",  // 1.5rem / 24px
  "3xl": "text-3xl",  // 1.875rem / 30px
  "4xl": "text-4xl",  // 2.25rem / 36px
  "5xl": "text-5xl",  // 3rem / 48px
}

// Reusable page container - Premium spacing and layout
export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className, ...props }: PageContainerProps) {
  return (
    <div
      className={cn(
        "container mx-auto px-6 py-12 sm:px-8 lg:px-12 max-w-7xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// Empty state component
export interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-muted-foreground opacity-50">
          {icon}
        </div>
      )}
      <h3 className={cn(typography["2xl"], "font-semibold mb-2")}>
        {title}
      </h3>
      {description && (
        <p className={cn(typography.sm, "text-muted-foreground mb-6 max-w-sm")}>
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}

// Skeleton components
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-2xl bg-muted", className)}
      {...props}
    />
  )
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border bg-card p-6", className)}>
      <Skeleton className="h-6 w-3/4 mb-4" />
      <SkeletonText lines={3} />
    </div>
  )
}

// Export design tokens
export const designTokens = {
  spacing,
  typography,
  borderRadius: {
    sm: "calc(var(--radius) - 4px)",
    md: "calc(var(--radius) - 2px)",
    lg: "var(--radius)",
    "2xl": "1rem",
  },
  shadows: {
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
  },
}

