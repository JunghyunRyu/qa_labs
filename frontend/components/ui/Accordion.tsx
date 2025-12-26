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
  /** Controlled mode: external open state */
  isOpen?: boolean;
  /** Controlled mode: callback when toggle is clicked */
  onToggle?: () => void;
  /** Optional data attribute for section identification */
  sectionId?: string;
  children: ReactNode;
}

export default function Accordion({
  title,
  icon: Icon,
  iconColor = "text-gray-600",
  bgColor = "bg-gray-50 dark:bg-gray-800",
  borderColor = "border-gray-200 dark:border-gray-700",
  defaultOpen = false,
  isOpen: controlledIsOpen,
  onToggle,
  sectionId,
  children,
}: AccordionProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);

  // Controlled vs uncontrolled mode
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    if (isControlled && onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  return (
    <div
      className={`${borderColor} border rounded-lg overflow-hidden`}
      data-section-id={sectionId}
    >
      {/* Header - Always visible */}
      <button
        onClick={handleToggle}
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
