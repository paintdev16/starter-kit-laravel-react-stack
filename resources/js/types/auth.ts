export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
    roles: string[];
    permissions: Array<{
        name: string;
        label: string;
    }>;
    can: {
        viewAccessControl: boolean;
        createRoles: boolean;
        updateRoles: boolean;
        deleteRoles: boolean;
        createPermissions: boolean;
        updatePermissions: boolean;
        deletePermissions: boolean;
        viewUsers: boolean;
        createUsers: boolean;
        updateUsers: boolean;
        deleteUsers: boolean;
        manageAdvanced: boolean;
    };
};

export type Passkey = {
    id: number;
    name: string;
    authenticator: string | null;
    created_at_diff: string;
    last_used_at_diff: string | null;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
