import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { BarChart3, User, CreditCard, Menu, Sun, Moon } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { useTheme } from "@/contexts/ThemeContext";

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Pricing", href: "/pricing", icon: CreditCard },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 bg-card border-r">
          <div className="flex items-center flex-shrink-0 px-4">
            <img
              src="/doom-blocker-logo.png"
              alt="Doom Blocker"
              className="h-8 w-8 mr-3"
            />
            <div>
              <span className="text-lg font-bold" style={{ color: "#f8c23e" }}>
                Doom Blocker
              </span>
            </div>
          </div>
          <div className="mt-5 flex-1 flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {navigation.map((item) => {
                const isActive =
                  location.pathname === item.href ||
                  (item.href === "/dashboard" && location.pathname === "/");
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                    style={
                      isActive
                        ? { backgroundColor: "#f8c23e", color: "#000" }
                        : {}
                    }
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0`}
                      style={
                        isActive ? { color: "#000" } : { color: "inherit" }
                      }
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-8 w-8"
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-foreground">
                    John Doe
                  </p>
                  <p className="text-xs text-muted-foreground">
                    john@example.com
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
