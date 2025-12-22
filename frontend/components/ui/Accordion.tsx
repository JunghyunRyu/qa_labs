"use client";

import { useState, ReactNode } from "react";
import { ChevronDown, ChevronRight, LucideIcon } from "lucide-react";

interface AccordionProps {
  title: string;
  icon?: LucideIcon;
  iconColor?: string;
  bgColor?: string;
  borderColor?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export default function Accordion({
  title,
  icon: Icon,
  iconColor = "text-gray-600",
  bgColor = "bg-gray-50 dark:bg-gray-800",
  borderColor = "border-gray-200 dark:border-gray-700",
  defaultOpen = false,
  children,
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`${borderColor} border rounded-lg overflow-hidden`}>
      {/* Header - Always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 px-3 py-2 ${bgColor}
                    hover:bg-opacity-80 transition-colors text-left`}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
        )}
        {Icon && <Icon className={`w-4 h-4 ${iconColor} flex-shrink-0`} />}
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
          {title}
        </span>
      </button>

      {/* Content - Collapsible */}
      {isOpen && (
        <div className="px-3 py-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          {children}
        </div>
      )}
    </div>
  );
}
