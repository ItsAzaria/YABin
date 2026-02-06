import { json, type RequestHandler } from '@sveltejs/kit';
import type {
    Paste,
    PasteCreateResponse
} from '$lib/types';
import prisma from '@db';
import { getPaste } from '$lib/server/services.js';
import { nanoid } from 'nanoid';

export const GET: RequestHandler = async ({ params }) => {
    const { id } = params;

    if (!id) {
        return json(
            { success: false, error: 'No key provided' },
            { status: 400 },
        );
    }

    let paste;

    try {
        paste = await getPaste(id);
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

    return new Response(paste.content, {
        headers: {
            'Content-Type': 'text/plain',
        },
    });
};