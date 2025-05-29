// src/components/common/Navbar.jsx
import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button'; // Assuming Shadcn/ui button
import { Input } from '@/components/ui/input';   // Assuming Shadcn/ui input
import { Menu, Search, X } from 'lucide-react';   // Icons
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"; // For mobile menu

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Placeholder for auth state - will be replaced by AuthContext later
  const isAuthenticated = false; 
  const user = null; // Placeholder for user object

  const navLinks = [
    { title: "Browse Listings", href: "/listings" },
    { title: "Offer/Request", href: "/listings/new" }, // Protected route, handle later
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo/Brand Name */}
        <Link to="/" className="text-2xl font-bold text-primary mr-6">
          CommonGood
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navLinks.map((link) => (
            <NavLink
              key={link.title}
              to={link.href}
              className={({ isActive }) =>
                `transition-colors hover:text-foreground/80 ${isActive ? 'text-foreground' : 'text-foreground/60'}`
              }
            >
              {link.title}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-4">
          {/* Search Bar - Basic for now */}
          <div className="hidden sm:block w-full max-w-xs">
            <form> {/* Add search logic later */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search listings..."
                  className="w-full pl-10 h-9"
                />
              </div>
            </form>
          </div>

          {/* Auth Buttons / User Menu - Desktop */}
          <div className="hidden md:flex items-center space-x-2">
            {isAuthenticated ? (
              <p>User Menu Placeholder</p> // Replace with DropdownMenu and Avatar later
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </>
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
              <SheetContent side="right" className="w-full max-w-xs">
                <div className="flex flex-col space-y-4 p-4">
                  <SheetClose asChild>
                    <Link to="/" className="text-xl font-bold text-primary mb-4">
                      CommonGood
                    </Link>
                  </SheetClose>
                  
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.title}>
                      <NavLink
                        to={link.href}
                        className={({ isActive }) =>
                          `block py-2 text-lg font-medium transition-colors hover:text-foreground/80 ${isActive ? 'text-foreground' : 'text-foreground/60'}`
                        }
                      >
                        {link.title}
                      </NavLink>
                    </SheetClose>
                  ))}
                  <hr className="my-4"/>
                  {/* Auth Buttons / User Info - Mobile */}
                  {isAuthenticated ? (
                     <SheetClose asChild>
                        <p>User Menu Placeholder (Mobile)</p>
                     </SheetClose>
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
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;