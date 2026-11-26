import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadLib, resetGlobals, TLib } from '../test-helpers';

describe('bridgeReceive...FromNative', () => {
    let C: TLib['CrComLib'];

    beforeEach(async () => {
        vi.useFakeTimers();
        C = (await loadLib()).CrComLib;
    });

    afterEach(() => {
        vi.useRealTimers();
        resetGlobals();
    });

    const numberValue = (name: string) => C.Ch5SignalFactory.getInstance().getNumberSignal(name)!.value;
    const objectValue = (name: string) => C.Ch5SignalFactory.getInstance().getObjectSignal(name)!.value;

    describe('boolean and string', () => {
        it('updates the signal and its subscribers', () => {
            const onBool = vi.fn();
            const onString = vi.fn();
            C.subscribeState('b', 'room.power', onBool);
            C.subscribeState('s', 'room.name', onString);

            C.bridgeReceiveBooleanFromNative('room.power', true);
            C.bridgeReceiveStringFromNative('room.name', 'Boardroom');

            expect(onBool.mock.calls).toEqual([[false], [true]]);
            expect(onString.mock.calls).toEqual([[''], ['Boardroom']]);
            expect(C.getState('b', 'room.power')).toBe(true);
            expect(C.getState('s', 'room.name')).toBe('Boardroom');
        });

        it('creates the signal when nobody subscribed yet', () => {
            C.bridgeReceiveBooleanFromNative('late', true);
            const cb = vi.fn();
            C.subscribeState('b', 'late', cb);
            expect(cb.mock.calls).toEqual([[true]]);
        });

        it('stores join numbers under the "fb" prefix', () => {
            C.bridgeReceiveBooleanFromNative('22', true);
            C.bridgeReceiveStringFromNative('22', 'text');
            const f = C.Ch5SignalFactory.getInstance();
            expect(f.getBooleanSignal('fb22', false)!.value).toBe(true);
            expect(f.getStringSignal('fb22', false)!.value).toBe('text');
            expect(f.getBooleanSignal('22', false)).toBeNull();
            expect(C.getState('b', '22')).toBe(true);
        });
    });

    describe('integer', () => {
        it('updates the number signal', () => {
            C.bridgeReceiveIntegerFromNative('room.volume', 42);
            expect(C.getState('n', 'room.volume')).toBe(42);
        });

        it('also updates the object signal of the same name with a finished ramp', () => {
            C.bridgeReceiveIntegerFromNative('room.volume', 42);
            expect(objectValue('room.volume')).toEqual({ rcb: { value: 42, time: 0 } });
        });

        it('stores join numbers under the "fb" prefix', () => {
            C.bridgeReceiveIntegerFromNative('7', 42);
            expect(numberValue('fb7')).toBe(42);
            expect(objectValue('fb7')).toEqual({ rcb: { value: 42, time: 0 } });
        });
    });

    describe('object', () => {
        it('passes an ordinary object through untouched', () => {
            const payload = { anything: [1, 2, 3] };
            C.bridgeReceiveObjectFromNative('room.info', payload);
            expect(objectValue('room.info')).toBe(payload);
        });

        it('stores join numbers under the "fb" prefix', () => {
            C.bridgeReceiveObjectFromNative('9', { a: 1 });
            expect(objectValue('fb9')).toEqual({ a: 1 });
        });

        it('throws on null', () => {
            expect(() => C.bridgeReceiveObjectFromNative('room.info', null as any)).toThrow(TypeError);
        });
    });

    describe('ramp (rcb) objects', () => {
        it('adds the starting value and time to the object signal', () => {
            C.bridgeReceiveIntegerFromNative('vol', 20);
            const start = Date.now();
            C.bridgeReceiveObjectFromNative('vol', { rcb: { value: 120, time: 1000 } });
            expect(objectValue('vol')).toEqual({ rcb: { value: 120, time: 1000, startv: 20, startt: start } });
        });

        it('uses 0 as the starting value when the number signal was never set', () => {
            C.bridgeReceiveObjectFromNative('vol', { rcb: { value: 100, time: 1000 } });
            expect((objectValue('vol') as any).rcb.startv).toBe(0);
        });

        it('moves the number signal linearly every 100 ms and lands on the target', () => {
            C.bridgeReceiveIntegerFromNative('vol', 0);
            C.bridgeReceiveObjectFromNative('vol', { rcb: { value: 100, time: 1000 } });

            expect(numberValue('vol')).toBe(0);
            vi.advanceTimersByTime(100);
            expect(numberValue('vol')).toBe(10);
            vi.advanceTimersByTime(400);
            expect(numberValue('vol')).toBe(50);
            vi.advanceTimersByTime(499);
            expect(numberValue('vol')).toBe(90);
            vi.advanceTimersByTime(1);
            expect(numberValue('vol')).toBe(100);
            expect(objectValue('vol')).toEqual({ rcb: { value: 100, time: 0 } });
        });

        it('stops updating once the ramp is done', () => {
            C.bridgeReceiveIntegerFromNative('vol', 0);
            C.bridgeReceiveObjectFromNative('vol', { rcb: { value: 100, time: 1000 } });
            vi.advanceTimersByTime(1000);
            const cb = vi.fn();
            C.subscribeState('n', 'vol', cb);
            vi.advanceTimersByTime(5000);
            expect(cb.mock.calls).toEqual([[100]]);
            expect(vi.getTimerCount()).toBe(0);
        });

        it('ramps upwards and rounds towards the starting value', () => {
            C.bridgeReceiveIntegerFromNative('vol', 0);
            C.bridgeReceiveObjectFromNative('vol', { rcb: { value: 100, time: 300 } });
            vi.advanceTimersByTime(200);
            // 66.67, rounded down so the target is never reached early
            expect(numberValue('vol')).toBe(66);
        });

        it('ramps downwards and rounds towards the starting value', () => {
            C.bridgeReceiveIntegerFromNative('vol', 100);
            C.bridgeReceiveObjectFromNative('vol', { rcb: { value: 0, time: 300 } });
            vi.advanceTimersByTime(100);
            // 100 - 100/3 = 66.67, rounded up so the target is never reached early
            expect(numberValue('vol')).toBe(67);
            vi.advanceTimersByTime(100);
            expect(numberValue('vol')).toBe(34);
            vi.advanceTimersByTime(100);
            expect(numberValue('vol')).toBe(0);
        });

        it('jumps at the end without intermediate steps when the ramp is 100 ms or shorter', () => {
            C.bridgeReceiveIntegerFromNative('vol', 0);
            const cb = vi.fn();
            C.subscribeState('n', 'vol', cb);
            C.bridgeReceiveObjectFromNative('vol', { rcb: { value: 50, time: 100 } });
            vi.advanceTimersByTime(99);
            expect(numberValue('vol')).toBe(0);
            vi.advanceTimersByTime(1);
            expect(cb.mock.calls).toEqual([[0], [50]]);
        });

        it('is cancelled by an integer received for the same signal', () => {
            C.bridgeReceiveIntegerFromNative('vol', 0);
            C.bridgeReceiveObjectFromNative('vol', { rcb: { value: 100, time: 1000 } });
            vi.advanceTimersByTime(300);
            C.bridgeReceiveIntegerFromNative('vol', 5);
            vi.advanceTimersByTime(5000);
            expect(numberValue('vol')).toBe(5);
            expect(objectValue('vol')).toEqual({ rcb: { value: 5, time: 0 } });
        });

        it('is replaced by a newer ramp, which starts from the current value', () => {
            C.bridgeReceiveIntegerFromNative('vol', 0);
            C.bridgeReceiveObjectFromNative('vol', { rcb: { value: 100, time: 1000 } });
            vi.advanceTimersByTime(500);
            C.bridgeReceiveObjectFromNative('vol', { rcb: { value: 0, time: 500 } });
            expect((objectValue('vol') as any).rcb.startv).toBe(50);
            vi.advanceTimersByTime(500);
            expect(numberValue('vol')).toBe(0);
            expect(vi.getTimerCount()).toBe(0);
        });

        it('works for join numbers', () => {
            C.bridgeReceiveObjectFromNative('3', { rcb: { value: 10, time: 200 } });
            vi.advanceTimersByTime(200);
            expect(numberValue('fb3')).toBe(10);
        });
    });
});
