'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

type DashboardHeaderProps = {
  userName: string;
  onLogout: () => void;
};

export function DashboardHeader({ userName, onLogout }: DashboardHeaderProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleOutsidePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (menuRef.current?.contains(target)) {
        return;
      }

      setIsMenuOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsidePointerDown);
    document.addEventListener('touchstart', handleOutsidePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsidePointerDown);
      document.removeEventListener('touchstart', handleOutsidePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleLogoutClick = () => {
    setIsMenuOpen(false);
    onLogout();
  };

  return (
    <header className="w-full bg-primary text-surface">
      <div className="mx-auto flex w-full max-w-[688px] items-center justify-end px-4 py-4 md:py-7 desktop:max-w-[1140px] desktop:px-0 desktop:py-4">
        <div ref={menuRef} className="relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            aria-label="Menu do usuario"
            onClick={() => setIsMenuOpen((current) => !current)}
            className="inline-flex items-center gap-3 rounded-sm px-2 py-1 cursor-pointer hover:bg-surface/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface disabled:cursor-not-allowed"
          >
            <span className="text-body-sm">{userName}</span>
            <Image src="/dashboard/avatar.svg" alt="" width={40} height={40} aria-hidden="true" />
          </button>

          {isMenuOpen ? (
            <div
              role="menu"
              aria-label="Menu do usuario"
              className="absolute right-0 top-full z-10 mt-2 min-w-[140px] overflow-hidden rounded-md bg-surface text-body shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={handleLogoutClick}
                className="w-full cursor-pointer px-4 py-3 text-left text-body-sm font-semibold hover:bg-surface-soft"
              >
                Sair
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
