import { afterEach, describe, expect, it } from 'vitest';
import { installJSInterface, installWebkit, installWebXPanel, loadLib, resetGlobals } from './test-helpers';

const RECEIVERS = [
    'bridgeReceiveIntegerFromNative',
    'bridgeReceiveBooleanFromNative',
    'bridgeReceiveStringFromNative',
    'bridgeReceiveObjectFromNative',
] as const;

describe('package entry point', () => {

    afterEach(() => {
        resetGlobals();
    });

    it('exports exactly CrComLib and Ch5Emulator', async () => {
        const lib = await loadLib();
        expect(Object.keys(lib).sort()).toEqual(['Ch5Emulator', 'CrComLib']);
    });

    // A change to this list is a change to the public API of the package
    it('exposes a fixed set of names on CrComLib', async () => {
        const lib = await loadLib();
        expect(Object.keys(lib.CrComLib).sort()).toEqual([
            'Ch5Debug',
            'Ch5Heartbeats',
            'Ch5Platform',
            'Ch5Signal',
            'Ch5SignalBehaviorSubject',
            'Ch5SignalBridge',
            'Ch5SignalFactory',
            'Ch5TranslationFactory',
            'Ch5TranslationListeners',
            'Ch5TranslationUtility',
            'Ch5Uid',
            'bridgeReceiveBooleanFromNative',
            'bridgeReceiveIntegerFromNative',
            'bridgeReceiveObjectFromNative',
            'bridgeReceiveStringFromNative',
            'countNumberOfCh5Components',
            'debounce',
            'generateSubSigScriptKey',
            'getBooleanSignalValue',
            'getNumericSignalValue',
            'getObjectSignalValue',
            'getState',
            'getStringSignalValue',
            'getSubscriptionsCount',
            'isCrestronTouchscreen',
            'isIosDevice',
            'languageChangedSignalName',
            'publishEvent',
            'registerTranslationInterface',
            'subscribeState',
            'subscribeStateScript',
            'subscribeStateScriptSigSubs',
            'textformat',
            'translationFactory',
            'triggerTranslation',
            'unsubscribeState',
            'unsubscribeStateScript',
        ]);
    });

    it('puts CrComLib on the window', async () => {
        const lib = await loadLib();
        expect((window as any).CrComLib).toBe(lib.CrComLib);
    });

    it('does not put the receive functions on the window in a plain browser', async () => {
        await loadLib();
        RECEIVERS.forEach(name => expect((window as any)[name], name).toBeUndefined());
    });

    it.each([
        ['JSInterface', installJSInterface],
        ['webkit message handlers', installWebkit],
        ['CommunicationInterface', installWebXPanel],
    ])('puts the receive functions on the window when %s is present', async (_name, install) => {
        install();
        const lib = await loadLib();
        RECEIVERS.forEach(name => expect((window as any)[name], name).toBe(lib.CrComLib[name]));
    });

    it('lets the native side deliver values through the window functions', async () => {
        installJSInterface();
        const lib = await loadLib();
        (window as any).bridgeReceiveBooleanFromNative('1', true);
        (window as any).bridgeReceiveIntegerFromNative('1', 5);
        (window as any).bridgeReceiveStringFromNative('1', 'text');
        (window as any).bridgeReceiveObjectFromNative('info', { a: 1 });
        expect(lib.CrComLib.getState('b', '1')).toBe(true);
        expect(lib.CrComLib.getState('n', '1')).toBe(5);
        expect(lib.CrComLib.getState('s', '1')).toBe('text');
        expect(lib.CrComLib.getState('o', 'info')).toEqual({ a: 1 });
    });
});
