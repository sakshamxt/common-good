// src/components/common/Navbar.jsx
import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth'; // Import useAuth
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Search, LogOut, UserCircle, LayoutList, MessageSquare } from 'lucide-react';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout, isLoading } = useAuth(); // Use auth context

  const navLinks = [
    { title: "Browse Listings", href: "/listings" },
  ];
  
  // Add protected links if authenticated
  const protectedNavLinks = isAuthenticated ? [
    { title: "Offer/Request", href: "/listings/new" },
    { title: "My Messages", href: "/messages" }, // Placeholder
  ] : [];

  const allNavLinks = [...navLinks, ...protectedNavLinks];

  const getAvatarFallback = (name) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length > 1) {
      return parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  if (isLoading && !user && !localStorage.getItem('commonGoodToken')) { // Show minimal navbar or loader during initial auth check if no token
      return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link to="/" className="text-2xl font-bold text-primary mr-6">CommonGood</Link>
            <div className="h-8 w-8 bg-slate-200 rounded-full animate-pulse"></div> {/* Placeholder for loading state */}
          </div>
        </header>
      );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="text-2xl font-bold text-primary mr-6">
          CommonGood
        </Link>

        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {allNavLinks.map((link) => (
            <NavLink
              key={link.title}
              to={link.href}
              className={({ isActive }) =>
                `transition-colors hover:text-foreground/80 ${isActive ? 'text-foreground font-semibold' : 'text-foreground/60'}`
              }
            >
              {link.title}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-4">
          <div className="hidden sm:block w-full max-w-xs">
            {/* Search Bar - to be implemented */}
             <form>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="search" placeholder="Search listings..." className="w-full pl-10 h-9"/>
              </div>
            </form>
          </div>

          <div className="hidden md:flex items-center">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.profilePictureUrl || undefined} alt={user.name} />
                      <AvatarFallback>{getAvatarFallback(user.name)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile/me"><UserCircle className="mr-2 h-4 w-4" /> Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-listings"><LayoutList className="mr-2 h-4 w-4" /> My Listings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/messages"><MessageSquare className="mr-2 h-4 w-4" /> Messages</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600 hover:!text-red-600 hover:!bg-red-50 focus:!bg-red-100 focus:!text-red-700 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="space-x-2">
                <Button variant="ghost" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="md:hidden">
             <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-xs pt-10"> {/* Increased pt */}
                <div className="flex flex-col h-full">
                  <div className="space-y-3 mb-6">
                    {allNavLinks.map((link) => (
                      <SheetClose asChild key={link.title}>
                        <NavLink
                          to={link.href}
                           className={({ isActive }) =>
                            `block py-2 text-base transition-colors hover:text-foreground/80 ${isActive ? 'text-foreground font-semibold' : 'text-foreground/60'}`
                          }
                        >
                          {link.title}
                        </NavLink>
                      </SheetClose>
                    ))}
                  </div>
                  
                  <div className="mt-auto space-y-3 pb-6"> {/* Auth buttons at bottom */}
                    <hr/>
                    {isAuthenticated && user ? (
                      <>
                        <SheetClose asChild><Link to="/profile/me" className="block py-2 text-base">My Profile</Link></SheetClose>
                        <SheetClose asChild><Link to="/my-listings" className="block py-2 text-base">My Listings</Link></SheetClose>
                        <SheetClose asChild>
                           <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700" onClick={() => { logout(); setIsMobileMenuOpen(false);}}>
                            <LogOut className="mr-2 h-4 w-4" /> Logout
                           </Button>
                        </SheetClose>
                      </>
                    ) : (
                      <>
                        <SheetClose asChild>
                          <Button variant="outline" className="w-full" asChild>
                            <Link to="/login">Login</Link>
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button className="w-full" asChild>
                            <Link to="/signup">Sign Up</Link>
                          </Button>
                        </SheetClose>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;