'use client'

import Link from 'next/link'
import {
  Cog6ToothIcon,
  KeyIcon,
  SwatchIcon
} from '@heroicons/react/24/outline'

interface SettingsNavSidebarProps {
  readonly active: 'general' | 'ai' | 'display'
}

const SETTINGS_NAV_ITEMS = [
  {
    id: 'general',
    href: '/settings/general',
    title: 'General',
    description: 'Diagnostics and app-level behavior',
    icon: Cog6ToothIcon
  },
  {
    id: 'ai',
    href: '/settings',
    title: 'AI & Models',
    description: 'Providers, model IDs, and keys',
    icon: KeyIcon
  },
  {
    id: 'display',
    href: '/settings/display',
    title: 'Display & Theme',
    description: 'Theme, palette, and document scale',
    icon: SwatchIcon
  }
] as const

export default function SettingsNavSidebar({ active }: SettingsNavSidebarProps) {
  return (
    <aside className="w-full lg:w-72 shrink-0">
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm p-4 lg:sticky lg:top-24">
        <div className="px-2 pb-4 border-b border-gray-100 dark:border-gray-800">
          <h1 className="text-2xl font-black text-gray-800 dark:text-white">Settings</h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Configure app behavior and appearance.
          </p>
        </div>

        <nav className="mt-4 flex flex-col gap-2" aria-label="Settings navigation">
          {SETTINGS_NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = active === item.id

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`group flex items-start gap-3 rounded-xl border px-3 py-3 transition-colors ${
                  isActive
                    ? 'border-blue-100 bg-blue-50/70 text-blue-700 shadow-xs dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300'
                    : 'border-transparent text-gray-600 hover:border-gray-100 hover:bg-gray-50 dark:text-gray-400 dark:hover:border-gray-800 dark:hover:bg-gray-800/60'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-300' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{item.title}</span>
                  <span className={`mt-0.5 block text-[11px] leading-snug ${isActive ? 'text-blue-600/80 dark:text-blue-300/80' : 'text-gray-400 dark:text-gray-500'}`}>
                    {item.description}
                  </span>
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
