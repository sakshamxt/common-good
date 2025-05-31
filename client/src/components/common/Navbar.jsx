// src/components/common/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Menu, Search as SearchIcon, LogOut, UserCircle, LayoutList, MessageSquare, PlusCircle } from 'lucide-react'; // Renamed Search
import { cn } from '@/lib/utils';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout, isLoading: authIsLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');

  // Sync search term if present in URL (e.g., when navigating directly to /listings?search=...)
  useEffect(() => {
    if (location.pathname === '/listings' && location.search) {
      const params = new URLSearchParams(location.search);
      const querySearch = params.get('search');
      if (querySearch) {
        setSearchTerm(querySearch);
      } else {
        setSearchTerm(''); // Clear if search param removed from URL but still on listings page
      }
    } else if (location.pathname !== '/listings') {
        setSearchTerm(''); // Clear search bar if navigating away from listings page
    }
  }, [location.pathname, location.search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmedSearchTerm = searchTerm.trim();
    if (trimmedSearchTerm) {
      navigate(`/listings?search=${encodeURIComponent(trimmedSearchTerm)}`);
      // Optionally clear search term from input after navigation if preferred:
      // setSearchTerm(''); 
    } else {
      // If search is cleared, navigate to listings without search param
      navigate('/listings');
    }
    // Close mobile menu if open and search is submitted from there
    if(isMobileMenuOpen) setIsMobileMenuOpen(false); 
  };

  const navLinks = [
    { title: "Browse Listings", href: "/listings" },
  ];
  
  const protectedNavLinks = isAuthenticated ? [
    { title: "Offer/Request", href: "/listings/new" },
    { title: "My Messages", href: "/messages" },
  ] : [];

  const allNavLinks = [...navLinks, ...protectedNavLinks];

  const getAvatarFallback = (name) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
      return parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  // Show a minimal loading state for navbar if auth is still loading on initial app mount.
  if (authIsLoading && !isAuthenticated && typeof window !== 'undefined' && !localStorage.getItem('commonGoodToken')) {
      return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-slate-900/95 dark:border-slate-800">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link to="/" className="text-2xl font-bold text-primary mr-6">CommonGood</Link>
            <div className="h-8 w-9 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
          </div>
        </header>
      );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-slate-900/95 dark:border-slate-800">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="text-2xl font-bold text-primary mr-4 md:mr-6 flex-shrink-0">
          CommonGood
        </Link>

        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {allNavLinks.map((link) => (
            <NavLink
              key={link.title}
              to={link.href}
              className={({ isActive }) =>
                cn("transition-colors hover:text-foreground/80 dark:hover:text-slate-300", 
                   isActive ? 'text-foreground dark:text-slate-50 font-semibold' : 'text-foreground/60 dark:text-slate-400')
              }
              onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
            >
              {link.title}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-4">
          {/* Search Bar - always visible on larger screens if not focused on mobile */}
          <div className="hidden sm:block w-full flex-1 max-w-xs lg:max-w-sm">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground dark:text-slate-400" />
                <Input
                  type="search"
                  placeholder="Search listings..."
                  className="w-full pl-10 h-9 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </form>
          </div>

          <div className="hidden md:flex items-center">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9 border dark:border-slate-600">
                      <AvatarImage src={user.profilePictureUrl || undefined} alt={user.name} />
                      <AvatarFallback>{getAvatarFallback(user.name)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 dark:bg-slate-800 dark:border-slate-700" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none dark:text-slate-100">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground dark:text-slate-400">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="dark:bg-slate-700"/>
                  <DropdownMenuItem asChild className="dark:hover:bg-slate-700 dark:focus:bg-slate-700">
                    <Link to="/profile/me"><UserCircle className="mr-2 h-4 w-4" /> Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="dark:hover:bg-slate-700 dark:focus:bg-slate-700">
                    <Link to="/my-listings"><LayoutList className="mr-2 h-4 w-4" /> My Listings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="dark:hover:bg-slate-700 dark:focus:bg-slate-700">
                    <Link to="/messages"><MessageSquare className="mr-2 h-4 w-4" /> Messages</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="dark:bg-slate-700"/>
                  <DropdownMenuItem onClick={logout} className="text-red-600 hover:!text-red-600 dark:text-red-400 dark:hover:!text-red-400 dark:hover:!bg-red-700/20 focus:!bg-red-100 focus:!text-red-700 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="space-x-2">
                <Button variant="ghost" asChild className="dark:text-slate-200 dark:hover:bg-slate-700">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Trigger & Content */}
          <div className="md:hidden">
             <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-xs pt-10 px-0 dark:bg-slate-900 dark:border-slate-800">
                <div className="flex flex-col h-full">
                  {/* Mobile Search Bar */}
                  <div className="px-4 mb-6">
                     <form onSubmit={handleSearchSubmit}>
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground dark:text-slate-400" />
                            <Input
                            type="search"
                            placeholder="Search listings..."
                            className="w-full pl-10 h-9 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </form>
                  </div>

                  <div className="space-y-1 px-4 mb-6">
                    {allNavLinks.map((link) => (
                      <SheetClose asChild key={link.title}>
                        <NavLink
                          to={link.href}
                           className={({ isActive }) =>
                            cn("block py-2 px-3 rounded-md text-base transition-colors hover:bg-slate-100 dark:hover:bg-slate-800", 
                               isActive ? 'bg-slate-100 dark:bg-slate-800 text-foreground dark:text-slate-50 font-semibold' : 'text-foreground/70 dark:text-slate-400')
                          }
                        >
                          {link.title}
                        </NavLink>
                      </SheetClose>
                    ))}
                  </div>
                  
                  <div className="mt-auto border-t dark:border-slate-700 px-4 pt-4 pb-6 space-y-3">
                    {isAuthenticated && user ? (
                      <>
                        <SheetClose asChild><Link to="/profile/me" className="flex items-center py-2 text-base dark:text-slate-200"><UserCircle className="mr-2 h-4 w-4"/>My Profile</Link></SheetClose>
                        <SheetClose asChild><Link to="/my-listings" className="flex items-center py-2 text-base dark:text-slate-200"><LayoutList className="mr-2 h-4 w-4"/>My Listings</Link></SheetClose>
                        <SheetClose asChild>
                           <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 dark:hover:bg-slate-800" onClick={() => { logout(); setIsMobileMenuOpen(false);}}>
                            <LogOut className="mr-2 h-4 w-4" /> Logout
                           </Button>
                        </SheetClose>
                      </>
                    ) : (
                      <>
                        <SheetClose asChild>
                          <Button variant="outline" className="w-full dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700" asChild>
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