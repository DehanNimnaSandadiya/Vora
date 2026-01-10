import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          className={cn(
            "peer sr-only",
            className
          )}
          ref={ref}
          {...props}
        />
        <div className="relative w-11 h-6 bg-gray-300 rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#5865F2] peer-focus:ring-offset-2 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-[#5865F2] hover:peer-checked:bg-[#4752C4] transition-colors duration-200"></div>
        {label && <span className="text-sm font-medium text-[#2C2F33]">{label}</span>}
      </label>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }

