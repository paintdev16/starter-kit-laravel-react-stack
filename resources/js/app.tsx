import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { configureEcho } from '@laravel/echo-react';

configureEcho({
    broadcaster: 'reverb',
});

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Apply the cookie-backed theme before Inertia renders React.
initializeTheme();

void createInertiaApp({
    title: (title, page) => {
        const configuredName = page.props.name;
        const currentAppName =
            typeof configuredName === 'string' ? configuredName : appName;

        return title ? `${title} - ${currentAppName}` : currentAppName;
    },
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
            case name.startsWith('setup/'):
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
