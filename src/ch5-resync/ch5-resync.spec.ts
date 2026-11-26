import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadLib, receiveSync, resetGlobals, TLib } from '../test-helpers';

/**
 * Resynchronization: the control system announces an update, re-sends the states it still has, then announces the end.
 * Every state that was received before but not re-sent during the update goes back to its default value.
 */
describe('resynchronization (Csig.State_Synchronization)', () => {
    let lib: TLib;
    let C: TLib['CrComLib'];

    const emptyRange = { stateNames: [], joinLow: 0, joinHigh: 0 };
    const range = (overrides: object) => ({ boolean: emptyRange, numeric: emptyRange, string: emptyRange, ...overrides });

    beforeEach(async () => {
        vi.useFakeTimers();
        lib = await loadLib();
        C = lib.CrComLib;
    });

    afterEach(() => {
        vi.useRealTimers();
        resetGlobals();
    });

    describe('StartOfUpdate ... EndOfUpdate', () => {
        it('resets states that were not re-sent and keeps the ones that were', () => {
            C.bridgeReceiveBooleanFromNative('kept', true);
            C.bridgeReceiveBooleanFromNative('dropped', true);
            C.bridgeReceiveIntegerFromNative('level', 55);
            C.bridgeReceiveStringFromNative('label', 'text');

            receiveSync(lib, 'StartOfUpdate', { excludePrefixes: [] });
            C.bridgeReceiveBooleanFromNative('kept', true);
            receiveSync(lib, 'EndOfUpdate');

            expect(C.getState('b', 'kept')).toBe(true);
            expect(C.getState('b', 'dropped')).toBe(false);
            expect(C.getState('n', 'level')).toBe(0);
            expect(C.getState('s', 'label')).toBe('');
        });

        it('notifies subscribers of the reset', () => {
            C.bridgeReceiveBooleanFromNative('dropped', true);
            const cb = vi.fn();
            C.subscribeState('b', 'dropped', cb);
            receiveSync(lib, 'StartOfUpdate', { excludePrefixes: [] });
            receiveSync(lib, 'EndOfUpdate');
            expect(cb.mock.calls).toEqual([[true], [false]]);
        });

        it('changes nothing until EndOfUpdate arrives', () => {
            C.bridgeReceiveBooleanFromNative('dropped', true);
            receiveSync(lib, 'StartOfUpdate', { excludePrefixes: [] });
            expect(C.getState('b', 'dropped')).toBe(true);
        });

        it('resets the ramp object that goes with a number state', () => {
            C.bridgeReceiveIntegerFromNative('level', 55);
            receiveSync(lib, 'StartOfUpdate', { excludePrefixes: [] });
            receiveSync(lib, 'EndOfUpdate');
            expect(C.getState('o', 'level')).toEqual({ rcb: { value: 0, time: 0 } });
        });

        it('leaves other object states alone', () => {
            C.bridgeReceiveObjectFromNative('info', { a: 1 });
            receiveSync(lib, 'StartOfUpdate', { excludePrefixes: [] });
            receiveSync(lib, 'EndOfUpdate');
            expect(C.getState('o', 'info')).toEqual({ a: 1 });
        });

        it('leaves states alone that only this side published', () => {
            C.publishEvent('b', 'local', true);
            receiveSync(lib, 'StartOfUpdate', { excludePrefixes: [] });
            receiveSync(lib, 'EndOfUpdate');
            expect(C.getState('b', 'local')).toBe(true);
        });

        it('leaves states alone whose name starts with an excluded prefix', () => {
            C.bridgeReceiveBooleanFromNative('Csig.something', true);
            C.bridgeReceiveBooleanFromNative('other', true);
            receiveSync(lib, 'StartOfUpdate', { excludePrefixes: ['Csig.'] });
            receiveSync(lib, 'EndOfUpdate');
            expect(C.getState('b', 'Csig.something')).toBe(true);
            expect(C.getState('b', 'other')).toBe(false);
        });

        it('counts a re-sent state even when it arrives with a different value', () => {
            C.bridgeReceiveIntegerFromNative('level', 55);
            receiveSync(lib, 'StartOfUpdate', { excludePrefixes: [] });
            C.bridgeReceiveIntegerFromNative('level', 60);
            receiveSync(lib, 'EndOfUpdate');
            expect(C.getState('n', 'level')).toBe(60);
        });

        it('resets on its own after 60 seconds without EndOfUpdate', () => {
            C.bridgeReceiveBooleanFromNative('dropped', true);
            receiveSync(lib, 'StartOfUpdate', { excludePrefixes: [] });
            vi.advanceTimersByTime(59999);
            expect(C.getState('b', 'dropped')).toBe(true);
            vi.advanceTimersByTime(1);
            expect(C.getState('b', 'dropped')).toBe(false);
        });

        it('waits for as many EndOfUpdate messages as there were StartOfUpdate messages', () => {
            C.bridgeReceiveBooleanFromNative('dropped', true);
            receiveSync(lib, 'StartOfUpdate', { excludePrefixes: [] });
            receiveSync(lib, 'StartOfUpdate', { excludePrefixes: [] });
            receiveSync(lib, 'EndOfUpdate');
            expect(C.getState('b', 'dropped')).toBe(true);
            receiveSync(lib, 'EndOfUpdate');
            expect(C.getState('b', 'dropped')).toBe(false);
        });

        it('ignores an EndOfUpdate that has no matching start', () => {
            C.bridgeReceiveBooleanFromNative('a', true);
            receiveSync(lib, 'EndOfUpdate');
            expect(C.getState('b', 'a')).toBe(true);
        });

        it('does nothing for states received after the update finished', () => {
            receiveSync(lib, 'StartOfUpdate', { excludePrefixes: [] });
            receiveSync(lib, 'EndOfUpdate');
            C.bridgeReceiveBooleanFromNative('a', true);
            vi.advanceTimersByTime(120000);
            expect(C.getState('b', 'a')).toBe(true);
        });
    });

    describe('StartOfUpdateRange ... EndOfUpdate', () => {
        it('resets only the named states and the joins inside the range', () => {
            C.bridgeReceiveBooleanFromNative('named', true);
            C.bridgeReceiveBooleanFromNative('untouched', true);
            C.bridgeReceiveBooleanFromNative('1', true);
            C.bridgeReceiveBooleanFromNative('2', true);
            C.bridgeReceiveBooleanFromNative('3', true);
            C.bridgeReceiveIntegerFromNative('5', 9);
            C.bridgeReceiveStringFromNative('title', 'x');

            receiveSync(lib, 'StartOfUpdateRange', {
                excludePrefixes: [],
                range: range({
                    boolean: { stateNames: ['named'], joinLow: 1, joinHigh: 2 },
                    numeric: { stateNames: [], joinLow: 5, joinHigh: 5 },
                    string: { stateNames: ['title'], joinLow: 0, joinHigh: 0 },
                }),
            });
            receiveSync(lib, 'EndOfUpdate');

            expect(C.getState('b', 'named')).toBe(false);
            expect(C.getState('b', 'untouched')).toBe(true);
            expect(C.getState('b', '1')).toBe(false);
            expect(C.getState('b', '2')).toBe(false);
            expect(C.getState('b', '3')).toBe(true);
            expect(C.getState('n', '5')).toBe(0);
            expect(C.getState('s', 'title')).toBe('');
        });

        it('keeps the states in the range that were re-sent', () => {
            C.bridgeReceiveBooleanFromNative('1', true);
            C.bridgeReceiveBooleanFromNative('2', true);
            receiveSync(lib, 'StartOfUpdateRange', {
                excludePrefixes: [],
                range: range({ boolean: { stateNames: [], joinLow: 1, joinHigh: 2 } }),
            });
            C.bridgeReceiveBooleanFromNative('1', true);
            receiveSync(lib, 'EndOfUpdate');
            expect(C.getState('b', '1')).toBe(true);
            expect(C.getState('b', '2')).toBe(false);
        });

        it('does not create signals for joins in the range that never existed', () => {
            receiveSync(lib, 'StartOfUpdateRange', {
                excludePrefixes: [],
                range: range({ boolean: { stateNames: ['ghost'], joinLow: 1, joinHigh: 3 } }),
            });
            receiveSync(lib, 'EndOfUpdate');
            const f = C.Ch5SignalFactory.getInstance();
            expect(f.getBooleanSignal('fb1', false)).toBeNull();
            expect(f.getBooleanSignal('ghost', false)).toBeNull();
        });

        it('also resets states that only this side published, unlike StartOfUpdate', () => {
            C.publishEvent('b', 'local', true);
            receiveSync(lib, 'StartOfUpdateRange', {
                excludePrefixes: [],
                range: range({ boolean: { stateNames: ['local'], joinLow: 0, joinHigh: 0 } }),
            });
            receiveSync(lib, 'EndOfUpdate');
            expect(C.getState('b', 'local')).toBe(false);
        });

        it('resets on its own after 60 seconds without EndOfUpdate', () => {
            C.bridgeReceiveBooleanFromNative('1', true);
            receiveSync(lib, 'StartOfUpdateRange', {
                excludePrefixes: [],
                range: range({ boolean: { stateNames: [], joinLow: 1, joinHigh: 1 } }),
            });
            vi.advanceTimersByTime(60000);
            expect(C.getState('b', '1')).toBe(false);
        });
    });

    describe('StartOfUpdateRangeSO', () => {
        it('adds its range to an update that is already running', () => {
            C.bridgeReceiveBooleanFromNative('1', true);
            C.bridgeReceiveBooleanFromNative('2', true);
            receiveSync(lib, 'StartOfUpdateRange', {
                excludePrefixes: [],
                range: range({ boolean: { stateNames: [], joinLow: 1, joinHigh: 1 } }),
            });
            receiveSync(lib, 'StartOfUpdateRangeSO', {
                excludePrefixes: [],
                range: range({ boolean: { stateNames: [], joinLow: 2, joinHigh: 2 } }),
            });
            receiveSync(lib, 'EndOfUpdate');
            expect(C.getState('b', '1')).toBe(false);
            expect(C.getState('b', '2')).toBe(false);
        });

        it('on its own never leads to a reset', () => {
            C.bridgeReceiveBooleanFromNative('1', true);
            receiveSync(lib, 'StartOfUpdateRangeSO', {
                excludePrefixes: [],
                range: range({ boolean: { stateNames: [], joinLow: 1, joinHigh: 1 } }),
            });
            receiveSync(lib, 'EndOfUpdate');
            vi.advanceTimersByTime(120000);
            expect(C.getState('b', '1')).toBe(true);
        });
    });

    describe('malformed messages', () => {
        // The failure happens inside a signal subscription, so rxjs reports it as an uncaught error on a timer
        it('StartOfUpdate without excludePrefixes is reported as an uncaught error', () => {
            expect(() => receiveSync(lib, 'StartOfUpdate')).not.toThrow();
            expect(() => vi.runAllTimers()).toThrow('Invalid resyncRequest object');
        });

        it('StartOfUpdateRange without a range or without excludePrefixes is reported as an uncaught error', () => {
            receiveSync(lib, 'StartOfUpdateRange', { excludePrefixes: [] });
            expect(() => vi.runAllTimers()).toThrow('Invalid resyncRequest object');
            receiveSync(lib, 'StartOfUpdateRange', { range: range({}) });
            expect(() => vi.runAllTimers()).toThrow('Invalid resyncRequest object');
        });

        it('an unknown state name is ignored', () => {
            C.bridgeReceiveBooleanFromNative('a', true);
            receiveSync(lib, 'ClearAll', { excludePrefixes: [] });
            receiveSync(lib, 'EndOfUpdate');
            vi.runAllTimers();
            expect(C.getState('b', 'a')).toBe(true);
        });
    });

    describe('Ch5Resync.checkIfStateShouldBeIncluded', () => {
        // Ch5Resync is not exported from the package, so it is reached through its own module
        it('excludes the synchronization state itself and the given prefixes', async () => {
            const { Ch5Resync } = await import('./ch5-resync');
            const prefixes = { excludePrefixes: ['Csig.', 'local.'] };
            expect(Ch5Resync.checkIfStateShouldBeIncluded({ excludePrefixes: [] }, 'Csig.State_Synchronization')).toBe(false);
            expect(Ch5Resync.checkIfStateShouldBeIncluded(prefixes, 'Csig.Platform_Info')).toBe(false);
            expect(Ch5Resync.checkIfStateShouldBeIncluded(prefixes, 'local.thing')).toBe(false);
            expect(Ch5Resync.checkIfStateShouldBeIncluded(prefixes, 'room.power')).toBe(true);
            expect(Ch5Resync.checkIfStateShouldBeIncluded(prefixes, 'fb22')).toBe(true);
        });
    });
});
