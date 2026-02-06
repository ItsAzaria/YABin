import { json, type RequestHandler } from '@sveltejs/kit';
import prisma from '@db';
import { nanoid } from 'nanoid';

export const POST: RequestHandler = async ({ request }) => {
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

    const body = await request.text();

    await prisma.paste.create({
        data: {
            key,
            content: body || '',
        },
    });


    return json({ key });
};


function randomString() {
    return nanoid();
}
