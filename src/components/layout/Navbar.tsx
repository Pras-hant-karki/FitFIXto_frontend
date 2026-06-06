"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

const navItems = [
  { label: "Shop", href: "/products" },
  { label: "Services", href: "/#services" },
  { label: "Trainers", href: "/trainers" },
  { label: "Gyms", href: "/#categories" },
];

const IconButton = ({
  label,
  children,
  onClick,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
}) => (
  <button className="nav-icon-button" type="button" aria-label={label} onClick={onClick}>
    {children}
  </button>
);

export function Navbar() {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = savedTheme === "dark" || (!savedTheme && prefersDark);

    document.documentElement.classList.toggle("dark", shouldUseDark);
  }, []);

  useEffect(() => {
    const closeAccountMenu = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeAccountMenu);
    return () => document.removeEventListener("mousedown", closeAccountMenu);
  }, []);

  const toggleTheme = () => {
    const nextTheme = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextTheme);
    window.localStorage.setItem("theme", nextTheme ? "dark" : "light");
  };

  return (
    <header className="site-navbar">
      <Link className="site-logo-link" href="/" aria-label="FitFIXto home">
        <Image
          src="/fitfixto_logo.png"
          alt="FitFIXto"
          width={178}
          height={58}
          priority
          className="site-logo"
        />
      </Link>

      <nav className="primary-nav" aria-label="Primary navigation">
        {navItems.map((item) => (
          <Link href={item.href} key={item.label}>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="navbar-actions">
        <IconButton label="Search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m21 21-4.35-4.35m1.35-5.15a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
          </svg>
        </IconButton>
        <IconButton label="Compare">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 7h9.5A2.5 2.5 0 0 1 19 9.5V17" />
            <path d="m16 14 3 3 3-3" />
            <path d="M17 17H7.5A2.5 2.5 0 0 1 5 14.5V7" />
            <path d="m8 10-3-3-3 3" />
          </svg>
        </IconButton>
        <IconButton label="Wishlist">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
          </svg>
        </IconButton>
        <IconButton label="Toggle color theme" onClick={toggleTheme}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
          </svg>
        </IconButton>
        <div className="account-menu-wrap" ref={accountMenuRef}>
          <button
            className={`nav-icon-button ${isAccountMenuOpen ? "active" : ""}`}
            type="button"
            aria-label="Account"
            aria-expanded={isAccountMenuOpen}
            aria-haspopup="menu"
            onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 21a8 8 0 0 0-16 0" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
          {isAccountMenuOpen ? (
            <div className="account-dropdown" role="menu">
              <Link href="/login" role="menuitem" onClick={() => setIsAccountMenuOpen(false)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 21a8 8 0 0 0-16 0" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Login
              </Link>
              <Link href="/signup" role="menuitem" onClick={() => setIsAccountMenuOpen(false)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 21a8 8 0 0 0-16 0" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Sign Up
              </Link>
            </div>
          ) : null}
        </div>
        <Link className="nav-icon-button" href="/cart" aria-label="Cart">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6h15l-1.5 8.5H8L6 3H3" />
            <circle cx="9" cy="20" r="1.5" />
            <circle cx="18" cy="20" r="1.5" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
