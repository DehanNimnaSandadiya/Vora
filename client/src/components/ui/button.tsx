import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5865F2] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-sm hover:shadow-md active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-[#5865F2] text-white hover:bg-[#4752C4] hover:shadow-glow-sm active:bg-[#3C45A5]",
        destructive:
          "bg-[#ED4245] text-white hover:bg-[#D83C3E] hover:shadow-md active:bg-[#C03537]",
        outline:
          "border border-gray-200 bg-white text-[#2C2F33] hover:bg-gray-50 hover:border-[#5865F2] hover:text-[#5865F2]",
        secondary:
          "bg-gray-100 text-[#2C2F33] hover:bg-gray-200 active:bg-gray-300",
        ghost: "hover:bg-gray-100 text-[#2C2F33] hover:text-[#5865F2] active:bg-gray-200",
        link: "text-[#5865F2] underline-offset-4 hover:underline hover:text-[#4752C4] shadow-none",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

