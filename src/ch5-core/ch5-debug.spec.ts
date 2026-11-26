import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadLib, resetGlobals, TLib } from '../test-helpers';

describe('Ch5Debug', () => {
    let C: TLib['CrComLib'];

    const DEFAULT_KEYS = [
        'Ch5SignalBridge.constructor',
        'Ch5SignalBridge.subscribe',
        'Ch5SignalBridge.unsubscribe',
        'Ch5SignalBridge.publish',
        'Ch5SignalBridge.sendBooleanToNative',
        'Ch5SignalBridge.sendIntegerToNative',
        'Ch5SignalBridge.sendStringToNative',
        'Ch5SignalBridge.sendObjectToNative',
        'bridgeReceiveIntegerFromNative',
        'bridgeReceiveBooleanFromNative',
        'bridgeReceiveStringFromNative',
        'bridgeReceiveObjectFromNative',
        'bridge.rcbTimerCallback',
        'bridge.clearTimersForSignal',
        'bridge.rcbIntervalTimerCallback',
        'Ch5Resync',
        'Logger.messagesFilter.defaultLevel',
    ];

    beforeEach(async () => {
        C = (await loadLib()).CrComLib;
    });

    afterEach(() => {
        resetGlobals();
    });

    it('starts with every key switched off and the log level at warning (2)', () => {
        const config = C.Ch5Debug.getConfig();
        expect(Object.keys(config)).toEqual(DEFAULT_KEYS);
        DEFAULT_KEYS.slice(0, -1).forEach(key => expect(config[key], key).toBe(false));
        expect(config['Logger.messagesFilter.defaultLevel']).toBe(2);
    });

    it('exposes the names of the logger filter keys', () => {
        expect(C.Ch5Debug.DEBUG_MESSAGE_FILTER_SOURCE_KEY).toBe('Logger.messagesFilter.source');
        expect(C.Ch5Debug.DEBUG_MESSAGE_FILTER_LEVEL_KEY).toBe('Logger.messagesFilter.defaultLevel');
        expect(C.Ch5Debug.CONSOLE_OVERRIDDEN).toBe(false);
    });

    it('prints nothing while a key is off', () => {
        const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
        C.publishEvent('b', 'a', true);
        C.Ch5Debug.info('Ch5Resync', 'message');
        expect(log).not.toHaveBeenCalled();
    });

    it('prints "key:message" and the extra parameters as one array once the key is on', () => {
        const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
        C.Ch5Debug.setConfigKeyValue('Ch5Resync', true);
        C.Ch5Debug.info('Ch5Resync', 'message', 1, 'two');
        C.Ch5Debug.info('Ch5Resync', 'alone');
        expect(log.mock.calls).toEqual([['Ch5Resync:message', [1, 'two']], ['Ch5Resync:alone', []]]);
    });

    it('prints bridge traffic when the matching keys are on', () => {
        const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
        C.Ch5Debug.setConfigKeyValue('Ch5SignalBridge.publish', true);
        C.Ch5Debug.setConfigKeyValue('bridgeReceiveStringFromNative', true);
        C.publishEvent('n', 'level', 5);
        C.bridgeReceiveStringFromNative('7', 'text');
        expect(log.mock.calls).toEqual([
            ['Ch5SignalBridge.publish:"level":5', []],
            ['bridgeReceiveStringFromNative:"fb7":"text"', []],
        ]);
    });

    it('only displays keys whose value is exactly true', () => {
        C.Ch5Debug.setConfigKeyValue('custom', 'yes');
        expect(C.Ch5Debug.shouldDisplay('custom')).toBe(false);
        expect(C.Ch5Debug.shouldDisplay('missing')).toBe(false);
        C.Ch5Debug.setConfigKeyValue('custom', true);
        expect(C.Ch5Debug.shouldDisplay('custom')).toBe(true);
        expect(C.Ch5Debug.getConfigKeyValue('custom')).toBe(true);
    });

    it('loadConfig replaces the whole configuration', () => {
        const config = { mine: true };
        C.Ch5Debug.loadConfig(config);
        expect(C.Ch5Debug.getConfig()).toBe(config);
        expect(C.Ch5Debug.shouldDisplay('mine')).toBe(true);
        expect(C.Ch5Debug.shouldDisplay('Ch5Resync')).toBe(false);
    });

    // Known quirk: the log level entry is switched like every other key
    it('enableAll and disableAll set every key, including the log level', () => {
        C.Ch5Debug.enableAll();
        DEFAULT_KEYS.forEach(key => expect(C.Ch5Debug.getConfigKeyValue(key), key).toBe(true));
        C.Ch5Debug.disableAll();
        DEFAULT_KEYS.forEach(key => expect(C.Ch5Debug.getConfigKeyValue(key), key).toBe(false));
    });
});
