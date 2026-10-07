/**
 * Breadcrumbs Component
 * Provides navigation context for better UX
 */

import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center space-x-2 text-sm">
        <li>
          <button onClick={() => window.location.href = '/'} className="text-gray-500 hover:text-gray-900 transition flex items-center gap-1">
            <Home size={14} />
            <span>Home</span>
          </button>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center space-x-2">
            <ChevronRight size={14} className="text-gray-400" />
            {item.onClick ? (
              <button onClick={item.onClick} className="text-gray-500 hover:text-gray-900 transition">
                {item.label}
              </button>
            ) : (
              <span className="text-gray-900 font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
