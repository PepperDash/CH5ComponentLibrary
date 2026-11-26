import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installJSInterface, installWebkit, installWebXPanel, loadLib, resetGlobals, TLib } from '../../test-helpers';

/** Overrides read only navigator properties for one test */
function stubNavigator(values: Record<string, unknown>): void {
    Object.keys(values).forEach(key => {
        Object.defineProperty(window.navigator, key, { value: values[key], configurable: true });
    });
}

function restoreNavigator(): void {
    ['userAgent', 'platform', 'maxTouchPoints'].forEach(key => { delete (window.navigator as any)[key]; });
}

describe('utility functions', () => {
    let C: TLib['CrComLib'];

    beforeEach(async () => {
        C = (await loadLib()).CrComLib;
    });

    afterEach(() => {
        vi.useRealTimers();
        restoreNavigator();
        resetGlobals();
    });

    describe('subscribeState / unsubscribeState', () => {
        it.each([
            ['b', false, true], ['boolean', false, true],
            ['n', 0, 5], ['number', 0, 5], ['numeric', 0, 5],
            ['s', '', 'x'], ['string', '', 'x'],
            ['o', {}, { a: 1 }], ['object', {}, { a: 1 }],
        ] as const)('type "%s" delivers the default value and then updates', (type, initial, next) => {
            const cb = vi.fn();
            const key = C.subscribeState(type, 'sig', cb as any);
            C.publishEvent(type, 'sig', next);
            expect(key).toBe('sig-00001');
            expect(cb.mock.calls).toEqual([[initial], [next]]);
        });

        it('accepts type names in any letter case', () => {
            const cb = vi.fn();
            C.subscribeState('BOOLEAN' as any, 'sig', cb);
            C.publishEvent('B' as any, 'sig', true);
            expect(cb.mock.calls).toEqual([[false], [true]]);
        });

        it('treats the short and long type names as the same signal', () => {
            const cb = vi.fn();
            C.subscribeState('numeric', 'sig', cb);
            C.publishEvent('n', 'sig', 3);
            expect(cb).toHaveBeenLastCalledWith(3);
        });

        it('subscribes to "fb<number>" when given a join number', () => {
            const cb = vi.fn();
            expect(C.subscribeState('b', '22', cb)).toBe('fb22-00001');
            C.bridgeReceiveBooleanFromNative('22', true);
            expect(cb).toHaveBeenLastCalledWith(true);
        });

        it('returns an empty key and reports through the error callback for an unknown type', () => {
            const cb = vi.fn();
            const err = vi.fn();
            expect(C.subscribeState('x' as any, 'sig', cb, err)).toBe('');
            expect(cb).not.toHaveBeenCalled();
            expect(err.mock.calls).toEqual([['Signal: sig, has unsupported type: x']]);
        });

        it('returns an empty key for an unknown type without an error callback', () => {
            expect(C.subscribeState('x' as any, 'sig', vi.fn())).toBe('');
        });

        it('unsubscribeState stops the updates, for names and for join numbers', () => {
            const byName = vi.fn();
            const byJoin = vi.fn();
            const nameKey = C.subscribeState('s', 'sig', byName);
            const joinKey = C.subscribeState('s', '4', byJoin);
            C.unsubscribeState('s', 'sig', nameKey);
            C.unsubscribeState('s', '4', joinKey);
            C.bridgeReceiveStringFromNative('sig', 'x');
            C.bridgeReceiveStringFromNative('4', 'x');
            expect(byName.mock.calls).toEqual([['']]);
            expect(byJoin.mock.calls).toEqual([['']]);
        });

        it('unsubscribeState ignores unknown keys and unknown types', () => {
            expect(() => C.unsubscribeState('b', 'sig', 'nope')).not.toThrow();
            expect(() => C.unsubscribeState('x' as any, 'sig', 'nope')).not.toThrow();
        });
    });

    describe('publishEvent', () => {
        it('uses the name as given, so a join number is not the state of the same number', () => {
            C.publishEvent('b', '22', true);
            const f = C.Ch5SignalFactory.getInstance();
            expect(f.getBooleanSignal('22', false)!.value).toBe(true);
            expect(f.getBooleanSignal('fb22', false)).toBeNull();
        });

        it('ignores an unknown type', () => {
            expect(() => C.publishEvent('x' as any, 'sig', true)).not.toThrow();
        });

        it('does not convert the value to the named type', () => {
            C.publishEvent('n', 'sig', '5' as any);
            expect(C.getState('n', 'sig')).toBe('5');
        });
    });

    describe('getState and the typed getters', () => {
        it('returns null for a signal that does not exist, without creating it', () => {
            expect(C.getState('b', 'nope')).toBeNull();
            expect(C.getState('n', 'nope')).toBeNull();
            expect(C.getState('s', 'nope')).toBeNull();
            expect(C.getState('o', 'nope')).toBeNull();
            expect(C.Ch5SignalFactory.getInstance().getBooleanSignal('nope', false)).toBeNull();
        });

        it('returns null for a signal that exists but never changed', () => {
            C.subscribeState('n', 'sig', vi.fn());
            expect(C.getState('n', 'sig')).toBeNull();
            expect(C.getNumericSignalValue('sig')).toBeNull();
        });

        it('returns the given default value instead of null', () => {
            expect(C.getState('b', 'nope', true)).toBe(true);
            expect(C.getState('n', 'nope', 7)).toBe(7);
            expect(C.getState('s', 'nope', 'dflt')).toBe('dflt');
            expect(C.getState('o', 'nope', { d: 1 })).toEqual({ d: 1 });
            expect(C.getBooleanSignalValue('nope', true)).toBe(true);
            expect(C.getNumericSignalValue('nope', 7)).toBe(7);
            expect(C.getStringSignalValue('nope', 'dflt')).toBe('dflt');
            expect(C.getObjectSignalValue('nope', { d: 1 })).toEqual({ d: 1 });
        });

        it('returns the value once the signal changed, even when it equals the initial value', () => {
            C.publishEvent('b', 'flag', false);
            C.publishEvent('n', 'level', 0);
            C.publishEvent('s', 'text', '');
            expect(C.getState('b', 'flag', true)).toBe(false);
            expect(C.getState('n', 'level', 7)).toBe(0);
            expect(C.getState('s', 'text', 'dflt')).toBe('');
        });

        it('reads join numbers from "fb<number>"', () => {
            C.bridgeReceiveIntegerFromNative('8', 3);
            expect(C.getState('n', '8')).toBe(3);
            expect(C.getNumericSignalValue('8')).toBe(3);
            expect(C.getNumericSignalValue('fb8')).toBe(3);
        });

        it('returns null for an unknown type, even with a default value', () => {
            expect(C.getState('x' as any, 'sig', 5)).toBeNull();
        });
    });

    describe('getSubscriptionsCount', () => {
        // Despite the name it returns the table of signals, not a number
        it('returns the signals grouped by type', () => {
            const sig = C.Ch5SignalFactory.getInstance().getBooleanSignal('mine');
            const result = C.getSubscriptionsCount();
            expect(result).toBe(C.Ch5SignalFactory.getInstance().getStates());
            expect(result.boolean.mine).toBe(sig);
        });
    });

    describe('textformat', () => {
        it('replaces 1 based placeholders, in any order and repeatedly', () => {
            expect(C.textformat('third: {3}, first: {1}, second: {2}, first again {1}', 'p1', 2, 'param3'))
                .toBe('third: param3, first: p1, second: 2, first again p1');
        });

        it('leaves placeholders without a parameter in place', () => {
            expect(C.textformat('{1} {2} {0}', 'a')).toBe('a {2} {0}');
            expect(C.textformat('nothing')).toBe('nothing');
        });
    });

    describe('debounce', () => {
        it('runs the callback once for a burst of calls', () => {
            vi.useFakeTimers();
            const cb = vi.fn();
            const state = { start: undefined, timeoutIdentifier: undefined };
            C.debounce(state, cb, 100);
            vi.advanceTimersByTime(50);
            C.debounce(state, cb, 100);
            C.debounce(state, cb, 100);
            expect(cb).not.toHaveBeenCalled();
            vi.advanceTimersByTime(50);
            expect(cb).toHaveBeenCalledTimes(1);
        });

        it('schedules again only when called after the debounce time passed', () => {
            vi.useFakeTimers();
            const cb = vi.fn();
            const state = { start: undefined, timeoutIdentifier: undefined };
            C.debounce(state, cb, 100);
            vi.advanceTimersByTime(100);
            // exactly at the limit: nothing new is scheduled
            C.debounce(state, cb, 100);
            vi.advanceTimersByTime(200);
            expect(cb).toHaveBeenCalledTimes(1);
            // past the limit: a new run is scheduled
            C.debounce(state, cb, 100);
            vi.advanceTimersByTime(100);
            expect(cb).toHaveBeenCalledTimes(2);
        });

        it('defaults to a debounce time of 0', () => {
            vi.useFakeTimers();
            const cb = vi.fn();
            C.debounce({ start: undefined, timeoutIdentifier: undefined }, cb);
            vi.advanceTimersByTime(0);
            expect(cb).toHaveBeenCalledTimes(1);
        });
    });

    describe('countNumberOfCh5Components', () => {
        it('counts ch5- elements by tag and data-ch5 attributes by name', () => {
            const root = document.createElement('div');
            root.innerHTML = `
                <ch5-button></ch5-button>
                <ch5-button data-ch5-show="ignored on ch5 elements"></ch5-button>
                <ch5-slider></ch5-slider>
                <section>
                    <span data-ch5-show="a" data-ch5-id="1" data-ch5-show-subs-key="k" data-ch5-x-sub-key="k"></span>
                    <span data-ch5-show="b" data-ch5-textcontent="c" title="t"></span>
                    <p>plain</p>
                </section>`;
            expect(C.countNumberOfCh5Components(root)).toEqual({
                'parent': 'DIV',
                'total': 6,
                'CH5-BUTTON': 2,
                'CH5-SLIDER': 1,
                'data-ch5-show': 2,
                'data-ch5-textcontent': 1,
            });
        });

        it('returns a total of 0 for an element without ch5 content', () => {
            expect(C.countNumberOfCh5Components(document.createElement('div'))).toEqual({ parent: 'DIV', total: 0 });
        });
    });

    describe('isCrestronTouchscreen', () => {
        it('is false in a plain browser', () => {
            expect(C.isCrestronTouchscreen()).toBe(false);
        });

        it('is true when the user agent mentions Crestron, in any letter case', () => {
            stubNavigator({ userAgent: 'Mozilla/5.0 (Linux; Android 5.1) CRESTRON TSW-1060' });
            expect(C.isCrestronTouchscreen()).toBe(true);
        });

        it('is true when JSInterface can send', () => {
            installJSInterface();
            expect(C.isCrestronTouchscreen()).toBe(true);
        });

        it('is true when webkit message handlers can send', () => {
            installWebkit();
            expect(C.isCrestronTouchscreen()).toBe(true);
        });

        it('is true when CommunicationInterface can send', () => {
            installWebXPanel();
            expect(C.isCrestronTouchscreen()).toBe(true);
        });
    });

    describe('isIosDevice', () => {
        it('is false in a plain browser', () => {
            stubNavigator({ platform: 'Win32', maxTouchPoints: 0, userAgent: 'Mozilla/5.0 (Windows NT 10.0)' });
            expect(C.isIosDevice()).toBe(false);
        });

        it('is true for an iPhone or iPad with a touch screen', () => {
            stubNavigator({ platform: 'iPhone', maxTouchPoints: 5, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' });
            expect(C.isIosDevice()).toBe(true);
            stubNavigator({ platform: 'iPad', maxTouchPoints: 5, userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)' });
            expect(C.isIosDevice()).toBe(true);
        });

        it('is false for an iPhone platform without touch points', () => {
            stubNavigator({ platform: 'iPhone', maxTouchPoints: 0, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' });
            expect(C.isIosDevice()).toBe(false);
        });

        // An iPad in desktop mode reports itself as a Mac, so every Mac counts, with or without a touch screen
        it('is true for anything that reports itself as a Mac', () => {
            stubNavigator({ platform: 'MacIntel', maxTouchPoints: 0, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' });
            expect(C.isIosDevice()).toBe(true);
        });
    });

    describe('Ch5Uid', () => {
        it('counts up from cr-id-1', () => {
            expect(C.Ch5Uid.getUid()).toBe('cr-id-1');
            expect(C.Ch5Uid.getUid()).toBe('cr-id-2');
        });
    });
});
