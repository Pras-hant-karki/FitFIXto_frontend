"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect } from "react";

const navItems = ["Shop", "Services", "Trainers", "Gyms"];

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
  useEffect(() => {
    const savedTheme = window.localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = savedTheme === "dark" || (!savedTheme && prefersDark);

    document.documentElement.classList.toggle("dark", shouldUseDark);
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
          <a href={`#${item.toLowerCase()}`} key={item}>
            {item}
          </a>
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
        <IconButton label="Account">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 21a8 8 0 0 0-16 0" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </IconButton>
        <IconButton label="Cart">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6h15l-1.5 8.5H8L6 3H3" />
            <circle cx="9" cy="20" r="1.5" />
            <circle cx="18" cy="20" r="1.5" />
          </svg>
        </IconButton>
      </div>
    </header>
  );
}
