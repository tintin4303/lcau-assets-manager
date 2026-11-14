'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption<T extends string> {
  value: T;
  label: string;
  shortLabel?: string;
  badge?: string | number;
  icon?: React.ReactNode;
}

interface CustomDropdownProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  placeholder?: string;
  prefix?: string;
  icon?: React.ReactNode;
  className?: string;
  align?: 'left' | 'right';
  showBadgeOnButton?: boolean;
}

export default function CustomDropdown<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  prefix,
  icon,
  className = '',
  align = 'left',
  showBadgeOnButton = true,
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: T) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`group w-full inline-flex items-center justify-between gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all duration-150 select-none bg-white ${
          isOpen
            ? 'border-[#037ef3] ring-2 ring-[#037ef3]/15 text-slate-900 shadow-2xs'
            : value !== 'All'
            ? 'border-slate-300 bg-slate-50/50 text-slate-900 hover:border-slate-400 shadow-2xs'
            : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs'
        }`}
      >
        <span className="inline-flex items-center gap-1.5 truncate">
          {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
          {prefix && <span className="text-slate-400 font-normal">{prefix}</span>}
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="font-semibold text-slate-900 truncate">
            {selectedOption ? selectedOption.label : placeholder || 'Select'}
          </span>
          {showBadgeOnButton && selectedOption?.badge !== undefined && (
            <span className="text-[10px] text-slate-400 font-normal shrink-0">
              ({selectedOption.badge})
            </span>
          )}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-slate-600' : 'group-hover:text-slate-600'
          }`}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-1.5 z-40 min-w-[170px] w-max max-w-[260px] bg-white rounded-xl border border-slate-200/90 shadow-lg py-1 animate-in fade-in-0 zoom-in-95 duration-100 overflow-hidden`}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-xs text-left transition-colors ${
                  isSelected
                    ? 'bg-blue-50/80 text-[#037ef3] font-semibold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`}
              >
                <span className="inline-flex items-center gap-2 truncate">
                  {option.icon && <span className="shrink-0">{option.icon}</span>}
                  <span className="truncate">{option.label}</span>
                </span>

                <span className="inline-flex items-center gap-2 shrink-0">
                  {option.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-[#037ef3]/10 text-[#037ef3] font-semibold'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {option.badge}
                    </span>
                  )}
                  {isSelected ? (
                    <Check className="w-3.5 h-3.5 text-[#037ef3]" />
                  ) : (
                    <span className="w-3.5 h-3.5" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
