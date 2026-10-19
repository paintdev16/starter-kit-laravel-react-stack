import { useEffect, useState } from 'react';
import { ChevronsUpDown, Monitor, Moon, Sun } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppearance, type Appearance } from '@/hooks/use-appearance';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    dropdownMenuContentStyles,
    dropdownMenuItemStyles,
    dropdownMenuLabelStyles,
} from '@/lib/dropdown-menu-styles';

const options = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Oscuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor },
] as const;

export function AppearanceDropdown({
    placement,
    className,
}: {
    placement: 'navbar' | 'sidebar';
    className?: string;
}) {
    const { appearance, updateAppearance } = useAppearance();
    const currentOption = options.find((option) => option.value === appearance)!;
    const CurrentIcon = currentOption.icon;
    const isNavbar = placement === 'navbar';
    const isMobile = useIsMobile();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (isNavbar && !isMobile) {
            setOpen(false);
        }
    }, [isMobile, isNavbar]);

    return (
        <DropdownMenu
            open={isNavbar && !isMobile ? false : open}
            onOpenChange={setOpen}
        >
            <DropdownMenuTrigger
                render={
                    <button
                        type="button"
                        aria-label={`Tema: ${currentOption.label}`}
                        className={
                            isNavbar
                                ? `flex size-9 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className ?? ''}`
                                : `flex h-9 w-full items-center gap-2 rounded-md px-2 text-sm font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring ${className ?? ''}`
                        }
                    />
                }
            >
                <CurrentIcon className="size-4" />
                {!isNavbar && <span>Tema</span>}
                {!isNavbar && (
                    <ChevronsUpDown className="ml-auto size-4" />
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align={isNavbar ? 'end' : 'start'}
                side={isNavbar ? 'bottom' : 'top'}
                className={dropdownMenuContentStyles}
            >
                <DropdownMenuGroup>
                    <DropdownMenuLabel className={dropdownMenuLabelStyles}>
                        Apariencia
                    </DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                        value={appearance}
                        onValueChange={(value) =>
                            updateAppearance(value as Appearance)
                        }
                    >
                        {options.map(({ value, label, icon: Icon }) => (
                            <DropdownMenuRadioItem
                                key={value}
                                value={value}
                                className={dropdownMenuItemStyles}
                            >
                                <Icon className="size-4" />
                                {label}
                            </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
