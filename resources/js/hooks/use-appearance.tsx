import { useSyncExternalStore } from 'react';

export type ResolvedAppearance = 'light' | 'dark';
export type Appearance = ResolvedAppearance | 'system';

export type UseAppearanceReturn = {
    readonly appearance: Appearance;
    readonly resolvedAppearance: ResolvedAppearance;
    readonly updateAppearance: (mode: Appearance) => void;
};

const listeners = new Set<() => void>();
let currentAppearance: Appearance = 'system';
const APPEARANCE_COOKIE = 'appearance';
const APPEARANCE_MAX_AGE = 365 * 24 * 60 * 60;

const isAppearance = (
    value: string | null | undefined,
): value is Appearance => {
    return value === 'light' || value === 'dark' || value === 'system';
};

const prefersDark = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const setCookie = (name: string, value: string): void => {
    if (typeof document === 'undefined') {
        return;
    }

    const secure = window.location.protocol === 'https:' ? ';Secure' : '';

    document.cookie = `${name}=${value};Path=/;Max-Age=${APPEARANCE_MAX_AGE};SameSite=Lax${secure}`;
};

const getCookieAppearance = (): Appearance | null => {
    const cookie = document.cookie
        .split(';')
        .map((entry) => entry.trim())
        .find((entry) => entry.startsWith(`${APPEARANCE_COOKIE}=`));

    if (!cookie) {
        return null;
    }

    const value = cookie.slice(APPEARANCE_COOKIE.length + 1);

    return isAppearance(value) ? value : null;
};

const isDarkMode = (appearance: Appearance): boolean => {
    return appearance === 'dark' || (appearance === 'system' && prefersDark());
};

const applyTheme = (appearance: Appearance): void => {
    if (typeof document === 'undefined') {
        return;
    }

    const isDark = isDarkMode(appearance);

    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
};

const subscribe = (callback: () => void) => {
    listeners.add(callback);

    return () => listeners.delete(callback);
};

const notify = (): void => listeners.forEach((listener) => listener());

const mediaQuery = (): MediaQueryList | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.matchMedia('(prefers-color-scheme: dark)');
};

const handleSystemThemeChange = (): void => applyTheme(currentAppearance);

export function initializeTheme(): void {
    if (typeof window === 'undefined') {
        return;
    }

    const cookieAppearance = getCookieAppearance();
    currentAppearance = cookieAppearance ?? 'system';
    document.documentElement.dataset.appearance = currentAppearance;

    if (cookieAppearance !== currentAppearance) {
        setCookie(APPEARANCE_COOKIE, currentAppearance);
    }
    applyTheme(currentAppearance);

    // Set up system theme change listener
    mediaQuery()?.addEventListener('change', handleSystemThemeChange);
}

export function useAppearance(): UseAppearanceReturn {
    const appearance: Appearance = useSyncExternalStore(
        subscribe,
        () => currentAppearance,
        () => 'system',
    );

    const resolvedAppearance: ResolvedAppearance = isDarkMode(appearance)
        ? 'dark'
        : 'light';

    const updateAppearance = (mode: Appearance): void => {
        currentAppearance = mode;

        // Store the preference in a cookie so Laravel can render it on reload.
        setCookie(APPEARANCE_COOKIE, mode);
        document.documentElement.dataset.appearance = mode;

        applyTheme(mode);
        notify();
    };

    return { appearance, resolvedAppearance, updateAppearance } as const;
}
