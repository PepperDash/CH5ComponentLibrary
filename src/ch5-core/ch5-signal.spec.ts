import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installJSInterface, loadLib, resetGlobals, TLib } from '../test-helpers';

describe('Ch5Signal', () => {
    let lib: TLib;
    let C: TLib['CrComLib'];

    beforeEach(async () => {
        lib = await loadLib();
        C = lib.CrComLib;
    });

    afterEach(() => {
        resetGlobals();
    });

    describe('signal names', () => {
        it('treats only canonical base 10 integers as join numbers', () => {
            expect(C.Ch5Signal.isIntegerSignalName('22')).toBe(true);
            expect(C.Ch5Signal.isIntegerSignalName('0')).toBe(true);
            expect(C.Ch5Signal.isIntegerSignalName('-5')).toBe(true);
            expect(C.Ch5Signal.isIntegerSignalName('022')).toBe(false);
            expect(C.Ch5Signal.isIntegerSignalName('22a')).toBe(false);
            expect(C.Ch5Signal.isIntegerSignalName('2.5')).toBe(false);
            expect(C.Ch5Signal.isIntegerSignalName(' 22')).toBe(false);
            expect(C.Ch5Signal.isIntegerSignalName('')).toBe(false);
            expect(C.Ch5Signal.isIntegerSignalName('room.power')).toBe(false);
        });

        it('prefixes join numbers with "fb" and leaves names alone', () => {
            expect(C.Ch5Signal.getJoinNumberSignalName('22')).toBe('fb22');
            expect(C.Ch5Signal.getSubscriptionSignalName('22')).toBe('fb22');
            expect(C.Ch5Signal.getSubscriptionSignalName('fb22')).toBe('fb22');
            expect(C.Ch5Signal.getSubscriptionSignalName('room.power')).toBe('room.power');
        });
    });

    describe('a new signal', () => {
        it('exposes its name, type and default value', () => {
            const b = C.Ch5SignalFactory.getInstance().getBooleanSignal('b1')!;
            const n = C.Ch5SignalFactory.getInstance().getNumberSignal('n1')!;
            const s = C.Ch5SignalFactory.getInstance().getStringSignal('s1')!;
            const o = C.Ch5SignalFactory.getInstance().getObjectSignal('o1')!;

            expect([b.name, b.type, b.value, b.prevValue]).toEqual(['b1', 'boolean', false, false]);
            expect([n.name, n.type, n.value, n.prevValue]).toEqual(['n1', 'number', 0, 0]);
            expect([s.name, s.type, s.value, s.prevValue]).toEqual(['s1', 'string', '', '']);
            expect([o.name, o.type, o.value, o.prevValue]).toEqual(['o1', 'object', {}, {}]);
        });

        it('has not changed and has not been received from the bridge', () => {
            const sig = C.Ch5SignalFactory.getInstance().getBooleanSignal('b1')!;
            expect(sig.hasChangedSinceInit()).toBe(false);
            expect(sig.receivedFromSignalBridge).toBe(false);
        });
    });

    describe('publish', () => {
        it('updates value and prevValue and marks the signal as changed', () => {
            const sig = C.Ch5SignalFactory.getInstance().getNumberSignal('n1')!;
            sig.publish(5);
            sig.publish(9);
            expect(sig.value).toBe(9);
            expect(sig.prevValue).toBe(5);
            expect(sig.hasChangedSinceInit()).toBe(true);
            expect(sig.receivedFromSignalBridge).toBe(false);
        });

        it('notifies subscribers every time, even when the value did not change', () => {
            const sig = C.Ch5SignalFactory.getInstance().getBooleanSignal('b1')!;
            const cb = vi.fn();
            sig.subscribe(cb);
            sig.publish(true);
            sig.publish(true);
            expect(cb.mock.calls).toEqual([[false], [true], [true]]);
        });
    });

    describe('fromSignalBridge', () => {
        it('updates the value and marks the signal as changed and received', () => {
            const sig = C.Ch5SignalFactory.getInstance().getStringSignal('s1')!;
            sig.fromSignalBridge('hello');
            expect(sig.value).toBe('hello');
            expect(sig.hasChangedSinceInit()).toBe(true);
            expect(sig.receivedFromSignalBridge).toBe(true);
        });

        it('does not notify subscribers when the value is the same', () => {
            const sig = C.Ch5SignalFactory.getInstance().getNumberSignal('n1')!;
            const cb = vi.fn();
            sig.subscribe(cb);
            sig.fromSignalBridge(3);
            sig.fromSignalBridge(3);
            sig.fromSignalBridge(4);
            expect(cb.mock.calls).toEqual([[0], [3], [4]]);
        });

        it('notifies for every object, because objects are compared by reference', () => {
            const sig = C.Ch5SignalFactory.getInstance().getObjectSignal('o1')!;
            const cb = vi.fn();
            sig.subscribe(cb);
            sig.fromSignalBridge({ a: 1 });
            sig.fromSignalBridge({ a: 1 });
            expect(cb).toHaveBeenCalledTimes(3);
        });

        it('does not send anything to the native side', () => {
            resetGlobals();
            const jsInterface = installJSInterface();
            return loadLib().then(fresh => {
                jsInterface.bridgeSendIntegerToNative.mockClear();
                fresh.CrComLib.Ch5SignalFactory.getInstance().getNumberSignal('n1')!.fromSignalBridge(3);
                expect(jsInterface.bridgeSendIntegerToNative).not.toHaveBeenCalled();
            });
        });
    });

    describe('subscribe / unsubscribe', () => {
        it('calls the callback immediately with the current value', () => {
            const sig = C.Ch5SignalFactory.getInstance().getStringSignal('s1')!;
            sig.publish('now');
            const cb = vi.fn();
            sig.subscribe(cb);
            expect(cb.mock.calls).toEqual([['now']]);
        });

        it('returns keys made of the signal name and a zero padded counter', () => {
            const sig = C.Ch5SignalFactory.getInstance().getStringSignal('s1')!;
            expect(sig.subscribe(() => undefined)).toBe('s1-00001');
            expect(sig.subscribe(() => undefined)).toBe('s1-00002');
        });

        it('does not reuse a key after an unsubscribe', () => {
            const sig = C.Ch5SignalFactory.getInstance().getStringSignal('s1')!;
            const first = sig.subscribe(() => undefined);
            sig.unsubscribe(first);
            expect(sig.subscribe(() => undefined)).toBe('s1-00002');
        });

        it('stops calling the callback after unsubscribe', () => {
            const sig = C.Ch5SignalFactory.getInstance().getNumberSignal('n1')!;
            const cb = vi.fn();
            const key = sig.subscribe(cb);
            sig.publish(1);
            sig.unsubscribe(key);
            sig.publish(2);
            expect(cb.mock.calls).toEqual([[0], [1]]);
        });

        it('ignores an unknown subscription key', () => {
            const sig = C.Ch5SignalFactory.getInstance().getNumberSignal('n1')!;
            expect(() => sig.unsubscribe('nope')).not.toThrow();
        });

        it('accepts an error callback', () => {
            const sig = C.Ch5SignalFactory.getInstance().getNumberSignal('n1')!;
            const cb = vi.fn();
            const err = vi.fn();
            expect(sig.subscribe(cb, err)).toBe('n1-00001');
            expect(cb).toHaveBeenCalledWith(0);
            expect(err).not.toHaveBeenCalled();
        });
    });
});
