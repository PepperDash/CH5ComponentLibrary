import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installJSInterface, loadLib, resetGlobals, TLib } from '../test-helpers';

/** The smallest stand-in for an i18next instance that the library accepts */
function fakeTranslator(dictionary: Record<string, string>, language?: string) {
    const handlers: Record<string, (...args: any[]) => void> = {};
    return {
        language,
        on: vi.fn((event: string, handler: (...args: any[]) => void) => { handlers[event] = handler; }),
        exists: vi.fn((key: string) => key in dictionary),
        t: vi.fn((key: string) => dictionary[key]),
        handlers,
    };
}

describe('translation', () => {
    let C: TLib['CrComLib'];

    beforeEach(async () => {
        C = (await loadLib()).CrComLib;
    });

    afterEach(() => {
        resetGlobals();
    });

    describe('Ch5TranslationUtility with the default -+ and +- delimiters', () => {
        it('is a singleton', () => {
            expect(C.Ch5TranslationUtility.getInstance()).toBe(C.Ch5TranslationUtility.getInstance());
        });

        it('recognizes translation identifiers', () => {
            const tu = C.Ch5TranslationUtility.getInstance();
            expect(tu.isTranslationIdentifier('-+greeting+-')).toBe(true);
            expect(tu.isTranslationIdentifier('-+menu.file_open+-')).toBe(true);
            expect(tu.isTranslationIdentifier('-+a1+-')).toBe(true);
            expect(tu.isTranslationIdentifier('greeting')).toBe(false);
            expect(tu.isTranslationIdentifier('-+greeting')).toBe(false);
            expect(tu.isTranslationIdentifier('say -+greeting+-')).toBe(false);
            expect(tu.isTranslationIdentifier('-+_greeting+-')).toBe(false);
            expect(tu.isTranslationIdentifier('-++-')).toBe(false);
            expect(tu.isTranslationIdentifier('')).toBe(false);
        });

        // Known quirk: only the second character of each delimiter is escaped, so the "+" of the end
        // delimiter acts as a repeat operator and the check is looser than intended.
        it('also accepts some values that are not properly delimited', () => {
            const tu = C.Ch5TranslationUtility.getInstance();
            expect(tu.translatorBeginKey).toBe('-\\+');
            expect(tu.translatorEndKey).toBe('+\\-');
            expect(tu.isTranslationIdentifier('-+abc-')).toBe(true);
            expect(tu.isTranslationIdentifier('-+a+-')).toBe(true);
            expect(tu.isTranslationIdentifier('-+greeting_+-')).toBe(true);
        });

        it('strips the delimiters', () => {
            const tu = C.Ch5TranslationUtility.getInstance();
            expect(tu.stripDownTranslationCharacters('-+menu.file_open+-')).toBe('menu.file_open');
            expect(tu.stripDownTranslationCharacters('menu.file_open')).toBe('');
            expect(tu.stripDownTranslationCharacters('-+abc-')).toBe('');
        });

        it('reports the match through valuesToTranslation and hasMultipleIdentifiers', () => {
            const tu = C.Ch5TranslationUtility.getInstance();
            expect(Array.from(tu.valuesToTranslation('-+greeting+-')!)).toEqual(['-+greeting+-']);
            expect(tu.valuesToTranslation('greeting')).toBeNull();
            expect(tu.hasMultipleIdentifiers('-+greeting+-')).toBe(false);
            expect(tu.hasMultipleIdentifiers('greeting')).toBe(false);
        });

        it('leaves values alone when no translator has been registered', () => {
            const tu = C.Ch5TranslationUtility.getInstance();
            expect(tu.translatedValue('-+greeting+-')).toBe('-+greeting+-');
            expect(tu.translatedValue('plain')).toBe('plain');
        });
    });

    describe('with a registered translator', () => {
        it('listens to the four translator events', () => {
            const translator = fakeTranslator({});
            C.registerTranslationInterface(translator as any);
            expect(translator.on.mock.calls.map(call => call[0])).toEqual(['initialized', 'loaded', 'added', 'languageChanged']);
            expect(C.translationFactory.translator).toBe(translator);
            expect(C.Ch5TranslationUtility.getInstance().getTranslator()).toBe(translator);
        });

        it('ignores an empty translator object', () => {
            const before = C.translationFactory.translator;
            C.registerTranslationInterface({} as any);
            expect(C.translationFactory.translator).toBe(before);
        });

        it('translates known identifiers and leaves unknown ones alone', () => {
            C.registerTranslationInterface(fakeTranslator({ greeting: 'Hello' }) as any);
            const tu = C.Ch5TranslationUtility.getInstance();
            expect(tu.translatedValue('-+greeting+-')).toBe('Hello');
            expect(tu.translatedValue('-+unknown+-')).toBe('-+unknown+-');
            expect(tu.translatedValue('greeting')).toBe('greeting');
        });

        it('translates string signal values, whether published or received', () => {
            C.registerTranslationInterface(fakeTranslator({ greeting: 'Hello' }) as any);
            const cb = vi.fn();
            C.subscribeState('s', 'label', cb);

            C.publishEvent('s', 'label', '-+greeting+-');
            expect(C.getState('s', 'label')).toBe('Hello');

            C.bridgeReceiveStringFromNative('label', 'plain');
            C.bridgeReceiveStringFromNative('label', '-+greeting+-');
            expect(C.getState('s', 'label')).toBe('Hello');
            expect(cb.mock.calls).toEqual([[''], ['Hello'], ['plain'], ['Hello']]);
        });

        it('sends the untranslated value to the native side', async () => {
            resetGlobals();
            const js = installJSInterface();
            const fresh = (await loadLib()).CrComLib;
            fresh.registerTranslationInterface(fakeTranslator({ greeting: 'Hello' }) as any);
            fresh.publishEvent('s', 'label', '-+greeting+-');
            expect(js.bridgeSendStringToNative).toHaveBeenCalledWith('label', '-+greeting+-');
        });

        it('does not translate string values inside objects', () => {
            C.registerTranslationInterface(fakeTranslator({ greeting: 'Hello' }) as any);
            C.publishEvent('o', 'info', { text: '-+greeting+-' });
            expect(C.getState('o', 'info')).toEqual({ text: '-+greeting+-' });
        });
    });

    describe('custom delimiters', () => {
        it('uses delimiters passed to registerTranslationInterface, trimmed', () => {
            C.registerTranslationInterface(fakeTranslator({ greeting: 'Hello' }) as any, ' {{ ', ' }} ');
            const tu = C.Ch5TranslationUtility.getInstance();
            expect(tu.isTranslationIdentifier('{{greeting}}')).toBe(true);
            expect(tu.isTranslationIdentifier('-+greeting+-')).toBe(false);
            expect(tu.translatedValue('{{greeting}}')).toBe('Hello');
        });

        it('keeps the defaults when only one delimiter is given or one is blank', () => {
            C.registerTranslationInterface(fakeTranslator({ greeting: 'Hello' }) as any, '{{');
            C.registerTranslationInterface(fakeTranslator({ greeting: 'Hello' }) as any, '{{', '  ');
            expect(C.Ch5TranslationUtility.getInstance().translatedValue('-+greeting+-')).toBe('Hello');
        });
    });

    describe('language_changed signal', () => {
        it('publishes the language of the translator when the translator reports a change', () => {
            const translator = fakeTranslator({}, 'en');
            C.registerTranslationInterface(translator as any);
            const cb = vi.fn();
            C.subscribeState('s', C.languageChangedSignalName, cb);

            translator.handlers.languageChanged('fr');
            translator.handlers.loaded(true);
            translator.handlers.added('en', 'ns');
            translator.handlers.initialized({});

            // the translator's own language wins over the one named in the event
            expect(C.languageChangedSignalName).toBe('language_changed');
            expect(cb.mock.calls).toEqual([[''], ['en'], ['en'], ['en'], ['en']]);
        });

        it('falls back to the language passed in when the translator has none', () => {
            const translator = fakeTranslator({});
            C.registerTranslationInterface(translator as any);
            translator.handlers.languageChanged('fr');
            expect(C.getState('s', 'language_changed')).toBe('fr');
        });

        it('triggerTranslation publishes the current language', () => {
            C.registerTranslationInterface(fakeTranslator({}, 'de') as any);
            C.triggerTranslation();
            expect(C.getState('s', 'language_changed')).toBe('de');
        });

        // Known quirk: with no language anywhere an undefined value is published, which the bridge cannot handle
        it('throws when neither the translator nor the caller knows the language', () => {
            C.registerTranslationInterface(fakeTranslator({}) as any);
            expect(() => C.triggerTranslation()).toThrow(TypeError);
        });
    });
});
