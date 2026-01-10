import { Home, Users, User, UserPlus, BarChart3 } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Rooms", href: "/rooms", icon: Users },
  { name: "Friends", href: "/friends", icon: UserPlus },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Profile", href: "/profile", icon: User },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 border-r border-gray-200 bg-white">
      <nav className="flex flex-col gap-1 p-3">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link key={item.name} to={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start rounded-lg transition-all duration-200",
                  isActive 
                    ? "bg-[#5865F2] text-white shadow-sm hover:bg-[#4752C4] hover:shadow-md" 
                    : "text-[#72767D] hover:text-[#2C2F33] hover:bg-gray-100"
                )}
              >
                <item.icon className={cn(
                  "mr-3 h-5 w-5 transition-colors duration-200",
                  isActive ? "text-white" : "text-[#72767D]"
                )} />
                <span className="font-medium">{item.name}</span>
              </Button>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

