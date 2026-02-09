<script lang="ts">
    import { goto } from '$app/navigation';
    import { languageKeysByName } from '$lib/data';
    import type {
        Paste,
        PasteConfig,
        PasteCreateResponse
    } from '$lib/types';
    import { onMount } from 'svelte';
    import Select from 'svelte-select-5';
    import { encrypt, encryptWithPassword } from '$lib/crypto';
    import Hamburger from '$lib/components/Hamburger.svelte';
    import { env } from '$env/dynamic/public';
    import type { PageData } from './$types';
    import { DHMToSeconds, secondsToDHM } from '$lib/utils/time';

    const initialConfig: PasteConfig = {
        language: 'plaintext',
        encrypted: true,
        expiresAfter: 5,
        burnAfterRead: false,
    };

    let expiresAfter: {
        days?: number;
        hours?: number;
        minutes?: number;
    } = {};

    $: {
        let expiresAfterSeconds = DHMToSeconds(expiresAfter);
        // Don't allow pastes to be saved for more than a year
        expiresAfterSeconds = Math.min(expiresAfterSeconds, 365 * 24 * 60 * 60);
        // Don't allow pastes to be saved for less than 5 minutes
        if (expiresAfterSeconds > 0) {
            expiresAfterSeconds = Math.max(expiresAfterSeconds, 5 * 60);
            expiresAfter = secondsToDHM(expiresAfterSeconds);
        } else {
            expiresAfter = {};
        }

        config.expiresAfter = expiresAfterSeconds;
    }

    let inputRef: HTMLTextAreaElement;
    let placeholderRef: HTMLDivElement;
    let cmdKey = 'Ctrl';
    let content: string = '';
    let password: string = '';
    let config: PasteConfig = { ...initialConfig };
    let sidebarOpen = false;

    let _sessionStorage: Storage | undefined;

    $: if (_sessionStorage) {
        const pasteData: { content: string; config: PasteConfig } = {
            content,
            config,
        };
        _sessionStorage.setItem('contentBackup', JSON.stringify(pasteData));
    }

    onMount(() => {
        _sessionStorage = sessionStorage;
        const contentBackup = _sessionStorage.getItem('contentBackup');
        if (contentBackup) {
            const data: { content: string; config: PasteConfig } =
                JSON.parse(contentBackup);
            content = data.content;
            config = {
                ...config,
                language: data.config.language ?? config.language,
            };
        }

        inputRef.focus();
        const isMac =
            (navigator as any).userAgentData?.platform?.toLowerCase() ===
                'macos' || navigator.platform?.toLowerCase().startsWith('mac');
        cmdKey = isMac ? '⌘' : 'Ctrl';

        document.addEventListener('keydown', (e) => {
            if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                save();
            }
        });
    });

    const save = async () => {
        if (!content) return;

        let finalContent = content;
        let urlParams = '';
        let passwordProtected = false;
        let initVector: string | undefined;

        if (config.encrypted) {
            if (password) {
                passwordProtected = true;
                const { ciphertext, iv } = await encryptWithPassword(
                    content,
                    password,
                );
                finalContent = ciphertext;
                initVector = iv;
            } else {
                const { ciphertext, iv, key } = await encrypt(content);
                finalContent = ciphertext;
                initVector = iv;
                urlParams = `#${encodeURIComponent(key)}`;
            }
        }

        const data: Paste = {
            content: finalContent,
            config,
            passwordProtected,
            initVector,
        };

        try {
            const response = await fetch('/api/paste', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            const json: PasteCreateResponse = await response.json();
            if (json.success) {
                _sessionStorage?.removeItem('contentBackup');
                await goto(`/${json.data?.key}${urlParams}`);
            } else {
                alert(json.error);
                console.log(json);
            }
        } catch (e) {
            console.log(e);
        }
    };

    $: config.customPath = config.customPath
        ? config.customPath.substring(0, 16)
        : undefined;
</script>

<div class="sm:hidden flex flex-row gap-2 items-center px-4 py-2">
    <h1 class="text-4xl mr-auto"><a href="/">Pastecord</a></h1>

    <button class="bg-amber-500 text-black text-lg px-4 py-1" on:click={save}
        >Save</button
    >

    <Hamburger bind:open={sidebarOpen} />
</div>

<div class="h-screen grid grid-cols-12 text-primary">
    <div class="p-2 col-span-12 sm:col-span-8 lg:col-span-10 flex flex-col relative">
        <textarea
            class="px-2 grow border-none outline-none bg-transparent resize-none"
            spellcheck="false"
            bind:value={content}
            bind:this={inputRef}
        ></textarea>
        <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-lg -z-10 opacity-40 hidden"
            class:hidden={content}
            bind:this={placeholderRef}
        >Type or paste anything here, and then {cmdKey}+S to save.<br /><br />
        </div>
    </div>
    <div
        class="sm:col-span-4 lg:col-span-2 max-sm:fixed max-sm:bg-black max-sm:bg-opacity-50 max-sm:backdrop-blur-sm max-sm:h-full max-sm:w-full max-h-screen overflow-x-hidden overflow-y-auto"
        class:expanded={sidebarOpen}
        id="sidebar"
    >
        <div class="xl:py-4 px-2 md:mt-4 flex flex-col items-center gap-2 2xl:gap-4">
            <h1 class="text-4xl mb-5 max-sm:hidden"><a href="/">Pastecord</a></h1>

            <button
                class="bg-amber-500 text-black text-lg px-4 py-1 my-1 w-full max-sm:hidden"
                title="{cmdKey}+S"
                on:click={save}
            >
                Save
            </button>

            <Select
                class="px-1 py-1"
                items={Array.from(languageKeysByName, ([label, value]) => ({
                    label,
                    value,
                }))}
                onchange={(value: any) => config.language = value.value}
                bind:value={config.language}
                showChevron
                clearable={false}
                --background="var(--color-dark)"
                --list-background="#000"
                --item-hover-bg="rgb(245, 158, 11)"
                --item-hover-color="#000"
                --border="0"
            />

            <div>
                <label for="encrypted" class="py-1">Encrypted?</label>
                <input
                    id="encrypted"
                    type="checkbox"
                    bind:checked={config.encrypted}
                />
            </div>

            <input
                type="text"
                class="bg-dark px-2 py-1 w-full"
                placeholder="Password"
                autocomplete="new-password"
                disabled={!config.encrypted}
                bind:value={password}
            />
            <small
                class="text-center text-xs hidden"
                class:hidden={config.encrypted}
            >
                Need to enable encryption to use a password
            </small>

            <div>
                <label for="burn" class="py-1">Burn after read?</label>
                <input
                    id="burn"
                    type="checkbox"
                    bind:checked={config.burnAfterRead}
                />
            </div>

            <div class="w-full">
                <span>Expires in:</span>
                <div class="grid grid-cols-3 gap-2 justify-center items-center">
                    <input
                        type="number"
                        class="bg-dark py-1 text-center"
                        placeholder="DD"
                        bind:value={expiresAfter.days}
                    />
                    <input
                        type="number"
                        class="bg-dark py-1 text-center"
                        placeholder="HH"
                        bind:value={expiresAfter.hours}
                    />
                    <input
                        type="number"
                        class="bg-dark py-1 text-center"
                        placeholder="MM"
                        bind:value={expiresAfter.minutes}
                    />
                </div>
            </div>

        </div>
    </div>
</div>

<style lang="postcss">
    #sidebar {
        right: -100%;
        transition: right 0.3s ease-out;

        &.expanded {
            right: 0;
        }
    }
</style>