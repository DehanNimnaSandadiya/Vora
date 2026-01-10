import { Search, User, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { NotificationsBell } from "./NotificationsBell"

export function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="container flex h-16 items-center gap-4 px-6 sm:px-8 lg:px-12">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#72767D]" />
          <Input
            type="search"
            placeholder="Search rooms, users..."
            className="pl-10 rounded-lg border-gray-200 bg-gray-50 focus:bg-white transition-colors duration-200"
          />
        </div>

        {/* Notifications & User Menu */}
        <div className="flex items-center gap-2">
          <NotificationsBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-lg hover:bg-gray-100">
                {(user?.avatar || user?.avatarUrl) ? (
                  <img
                    src={user.avatar || user.avatarUrl || ''}
                    alt={user.name || 'User'}
                    className="h-8 w-8 rounded-full ring-2 ring-gray-200 hover:ring-[#5865F2] transition-all duration-200"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-[#5865F2] flex items-center justify-center text-white font-semibold text-sm ring-2 ring-gray-200 hover:ring-[#5865F2] transition-all duration-200">
                    {user?.name?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                  </div>
                )}
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-lg">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none text-[#2C2F33]">{user?.name}</p>
                  <p className="text-xs leading-none text-[#72767D]">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="rounded-lg cursor-pointer"
                onClick={() => navigate('/profile')}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="rounded-lg text-[#ED4245] cursor-pointer focus:text-[#ED4245] hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

