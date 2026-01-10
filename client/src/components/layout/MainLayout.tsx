import { Header } from "./Header"
import { Sidebar } from "./Sidebar"
import { Outlet } from "react-router-dom"

export function MainLayout() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 lg:ml-64">
          <div className="container mx-auto px-6 py-8 sm:px-8 lg:px-12 max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

