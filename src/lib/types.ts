export interface PasteConfig {
    language?: string;
    encrypted?: boolean;
    expiresAfter?: number;
    burnAfterRead?: boolean;
    customPath?: string;
}

export interface Paste {
    content: string;
    config?: PasteConfig;
    passwordProtected?: boolean;
    initVector?: string;
}

export interface PasteCreateResponse {
    success: boolean;
    data?: {
        key: string;
    };
    error?: string;
}