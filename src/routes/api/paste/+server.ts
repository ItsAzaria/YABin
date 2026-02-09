import { json, type RequestHandler } from '@sveltejs/kit';
import type {
    Paste,
    PasteCreateResponse
} from '$lib/types';
import prisma from '@db';
import { getPaste } from '$lib/server/services.js';
import { nanoid } from 'nanoid';

export const GET: RequestHandler = async ({ url }) => {
    const key = url.searchParams.get('key');
    if (!key) {
        return json(
            { success: false, error: 'No key provided' },
            { status: 400 },
        );
    }

    let paste;
    try {
        paste = await getPaste(key);
    } catch (e: any) {
        if (e?.status && e?.body?.message) {
            return json(
                { success: false, error: e.body.message },
                { status: e.status },
            );
        }
        return json(
            { success: false, error: 'An error occurred' },
            { status: 500 },
        );
    }

    if (!paste) {
        return json(
            { success: false, error: 'Paste not found' },
            { status: 404 },
        );
    }

    console.log(paste);

    const response: PasteCreateResponse = {
        success: true,
        data: paste,
    };

    return json(response);
};

export const POST: RequestHandler = async ({ cookies, request }) => {
    const { content, config, passwordProtected, initVector }: Paste =
    
    await request.json();

    console.log(content, config, passwordProtected, initVector);

    let attempts = 0;
    let keyLength = 5;
    let key: string = randomString();
    while (await prisma.paste.findUnique({ where: { key } })) {
        key = randomString();
        attempts++;
        if (attempts > 1) {
            keyLength++;
            attempts = 0;
        }
    }

    await prisma.paste.create({
        data: {
            key,
            content,
            language: config?.language ?? 'plaintext',
            encrypted: config?.encrypted ?? false,
            passwordProtected,
            expiresCount: config?.burnAfterRead ? 2 : null,
            initVector,
            expiresAt: config?.expiresAfter
                ? new Date(Date.now() + config.expiresAfter * 1000)
                : null
        },
    });

    const response: PasteCreateResponse = {
        success: true,
        data: { key },
    };

    return json(response);
};


function randomString() {
    return nanoid();
}
