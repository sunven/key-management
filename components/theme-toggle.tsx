'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations('theme');

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-9 w-[108px]" />; // Placeholder to prevent layout shift
  }

  return (
    <div className="flex items-center gap-1 border rounded-md p-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme('light')}
        className={`h-7 w-7 ${
          theme === 'light'
            ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
            : ''
        }`}
        title={t('light')}
      >
        <Sun className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme('dark')}
        className={`h-7 w-7 ${
          theme === 'dark'
            ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
            : ''
        }`}
        title={t('dark')}
      >
        <Moon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme('system')}
        className={`h-7 w-7 ${
          theme === 'system'
            ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
            : ''
        }`}
        title={t('system')}
      >
        <Monitor className="h-4 w-4" />
      </Button>
    </div>
  );
}
