import type { LucideIcon } from 'lucide-react';
import { Monitor, Moon, Sun } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

export default function AppearanceToggleTab({
    className = '',
    compact = false,
    ...props
}: HTMLAttributes<HTMLDivElement> & { compact?: boolean }) {
    const { appearance, updateAppearance } = useAppearance();

    const tabs: { value: Appearance; icon: LucideIcon; label: string }[] = [
        { value: 'light', icon: Sun, label: 'Claro' },
        { value: 'dark', icon: Moon, label: 'Oscuro' },
        { value: 'system', icon: Monitor, label: 'Sistema' },
    ];

    return (
        <div
            className={cn(
                compact
                    ? 'inline-flex items-center gap-0.5 rounded-full border border-border/50 bg-muted/40 p-1 shadow-xs'
                    : 'inline-flex gap-1 rounded-lg bg-muted p-1',
                className,
            )}
            {...props}
        >
            {tabs.map(({ value, icon: Icon, label }) => (
                <button
                    key={value}
                    type="button"
                    aria-label={label}
                    aria-pressed={appearance === value}
                    onClick={() => updateAppearance(value)}
                    className={cn(
                        compact
                            ? 'flex size-7 items-center justify-center rounded-full'
                            : 'flex items-center rounded-md px-3.5 py-1.5',
                        appearance === value
                            ? 'bg-background text-sidebar-primary shadow-sm'
                            : 'text-muted-foreground hover:bg-accent/70 hover:text-accent-foreground',
                    )}
                >
                    <Icon className={cn('h-4 w-4', !compact && '-ml-1')} />
                    <span className={cn('ml-1.5 text-sm', compact && 'sr-only')}>
                        {label}
                    </span>
                </button>
            ))}
        </div>
    );
}
