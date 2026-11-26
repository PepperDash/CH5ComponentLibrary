import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadLib, resetGlobals, TLib } from '../test-helpers';

describe('Ch5Emulator', () => {
    let lib: TLib;
    let C: TLib['CrComLib'];

    /** Actions run 30 ms after the cue */
    const ACTION_DELAY = 30;

    const load = (cues: any[], onStart?: any[]) => {
        const emulator = lib.Ch5Emulator.getInstance();
        emulator.loadScenario({ cues, onStart } as any);
        return emulator;
    };

    beforeEach(async () => {
        vi.useFakeTimers();
        lib = await loadLib();
        C = lib.CrComLib;
    });

    afterEach(() => {
        vi.useRealTimers();
        resetGlobals();
    });

    describe('instance and scenario', () => {
        it('is a singleton until cleared', () => {
            const first = lib.Ch5Emulator.getInstance();
            expect(lib.Ch5Emulator.getInstance()).toBe(first);
            lib.Ch5Emulator.clear();
            expect(lib.Ch5Emulator.getInstance()).not.toBe(first);
        });

        it('returns the loaded scenario, and an empty object before loading or after clear', () => {
            const scenario = { cues: [] };
            expect(lib.Ch5Emulator.getInstance().getScenario()).toEqual({});
            lib.Ch5Emulator.getInstance().loadScenario(scenario);
            expect(lib.Ch5Emulator.getInstance().getScenario()).toBe(scenario);
            lib.Ch5Emulator.clear();
            expect(lib.Ch5Emulator.getInstance().getScenario()).toEqual({});
        });

        it('rejects a scenario without cues, but still stores it', () => {
            const emulator = lib.Ch5Emulator.getInstance();
            const scenario = {} as any;
            expect(() => emulator.loadScenario(scenario)).toThrow('The loaded scenario has no cues');
            expect(emulator.getScenario()).toBe(scenario);
        });

        it('rejects loading on an instance that was cleared', () => {
            const stale = lib.Ch5Emulator.getInstance();
            lib.Ch5Emulator.clear();
            expect(() => stale.loadScenario({ cues: [] })).toThrow('The Ch5Emulator instance is not created');
        });

        it('rejects malformed cues', () => {
            expect(() => load([{ type: 'b', trigger: true, actions: [] }])).toThrow('Property "signal" is not set in cue.');
            expect(() => load([{ type: 'b', event: 'e', trigger: true }])).toThrow('Property "actions" is not set in cue.');
            expect(() => load([{ type: 'x', event: 'e', trigger: true, actions: [] }])).toThrow('Invalid cue type: x');
        });
    });

    describe('cues', () => {
        it('run their actions 30 ms after the event matches the trigger', () => {
            load([{ type: 'b', event: 'press', trigger: true, actions: [{ state: 'lamp', type: 'b', logic: 'set', value: true }] }]);
            C.publishEvent('b', 'press', true);
            vi.advanceTimersByTime(ACTION_DELAY - 1);
            expect(C.getState('b', 'lamp')).toBeNull();
            vi.advanceTimersByTime(1);
            expect(C.getState('b', 'lamp')).toBe(true);
        });

        it('do nothing when the event does not match the trigger', () => {
            load([{ type: 'n', event: 'level', trigger: 5, actions: [{ state: 'out', type: 'n', logic: 'link' }] }]);
            C.publishEvent('n', 'level', 4);
            vi.advanceTimersByTime(ACTION_DELAY);
            expect(C.getState('n', 'out')).toBeNull();
            C.publishEvent('n', 'level', 5);
            vi.advanceTimersByTime(ACTION_DELAY);
            expect(C.getState('n', 'out')).toBe(5);
        });

        it.each([
            ['b', true], ['boolean', true],
            ['n', 3], ['number', 3], ['numeric', 3],
            ['s', 'go'], ['string', 'go'],
            ['o', { a: 1 }], ['object', { a: 1 }],
        ])('work for events of type "%s"', (type, trigger) => {
            load([{ type, event: 'evt', trigger, actions: [{ state: 'done', type: 'b', logic: 'set', value: true }] }]);
            C.publishEvent(type as any, 'evt', trigger);
            vi.advanceTimersByTime(ACTION_DELAY);
            expect(C.getState('b', 'done')).toBe(true);
        });

        it('compare object triggers by content', () => {
            load([{ type: 'o', event: 'evt', trigger: { a: 1 }, actions: [{ state: 'count', type: 'n', logic: 'increment' }] }]);
            C.publishEvent('o', 'evt', { a: 2 });
            C.publishEvent('o', 'evt', { a: 1 });
            vi.advanceTimersByTime(ACTION_DELAY);
            expect(C.getState('n', 'count')).toBe(1);
        });

        it('use the event name as given, so a join number is not prefixed', () => {
            load([{ type: 'b', event: '5', trigger: true, actions: [{ state: 'done', type: 'b', logic: 'set', value: true }] }]);
            C.publishEvent('b', '5', true);
            vi.advanceTimersByTime(ACTION_DELAY);
            expect(C.getState('b', 'done')).toBe(true);
        });

        it('with the "&change" trigger fire whenever the value differs from the previous one', () => {
            load([{ type: 's', event: 'text', trigger: '&change', actions: [{ state: 'count', type: 'n', logic: 'increment' }] }]);
            vi.advanceTimersByTime(ACTION_DELAY);
            expect(C.getState('n', 'count')).toBeNull();

            C.publishEvent('s', 'text', 'a');
            vi.advanceTimersByTime(ACTION_DELAY);
            C.publishEvent('s', 'text', 'a');
            vi.advanceTimersByTime(ACTION_DELAY);
            C.publishEvent('s', 'text', 'b');
            vi.advanceTimersByTime(ACTION_DELAY);
            expect(C.getState('n', 'count')).toBe(2);
        });

        it('unwrap a repeat digital object before comparing it to the trigger', () => {
            load([{ type: 'b', event: 'press', trigger: true, actions: [{ state: 'count', type: 'n', logic: 'increment' }] }]);
            C.Ch5SignalFactory.getInstance().getObjectAsBooleanSignal('press')!.publish({ repeatdigital: true });
            vi.advanceTimersByTime(ACTION_DELAY);
            expect(C.getState('n', 'count')).toBe(1);
        });

        // Known quirk: subscribing delivers the current value of the event, which counts as an event
        it('fire while loading when the trigger equals the current value of the event', () => {
            load([{ type: 'b', event: 'press', trigger: false, actions: [{ state: 'count', type: 'n', logic: 'increment' }] }]);
            vi.advanceTimersByTime(ACTION_DELAY);
            expect(C.getState('n', 'count')).toBe(1);
        });

        // Known quirk: cues are never removed, so loading again adds a second set
        it('are added again when a scenario is loaded twice', () => {
            const cues = [{ type: 'b', event: 'press', trigger: true, actions: [{ state: 'count', type: 'n', logic: 'increment' }] }];
            load(cues);
            load(cues);
            C.publishEvent('b', 'press', true);
            vi.advanceTimersByTime(ACTION_DELAY);
            expect(C.getState('n', 'count')).toBe(2);
        });
    });

    describe('isTriggered', () => {
        it('compares by value for simple types and by content for objects', () => {
            const emulator = lib.Ch5Emulator.getInstance();
            expect(emulator.isTriggered(true, true, null)).toBe(true);
            expect(emulator.isTriggered(true, false, null)).toBe(false);
            expect(emulator.isTriggered(1, 1, null)).toBe(true);
            expect(emulator.isTriggered(1, '1', null)).toBe(false);
            expect(emulator.isTriggered('a', 'a', null)).toBe(true);
            expect(emulator.isTriggered({ a: [1] }, { a: [1] }, null)).toBe(true);
            expect(emulator.isTriggered({ a: [1] }, { a: [2] }, null)).toBe(false);
        });

        it('"&change" needs a signal and compares against its previous value', () => {
            const emulator = lib.Ch5Emulator.getInstance();
            const sig = C.Ch5SignalFactory.getInstance().getNumberSignal('n')!;
            sig.publish(1);
            sig.publish(2);
            expect(emulator.isTriggered('&change', 2, null)).toBe(false);
            expect(emulator.isTriggered('&change', 2, sig)).toBe(true);
            expect(emulator.isTriggered('&change', 1, sig)).toBe(false);
        });
    });

    describe('actions', () => {
        /** Loads one cue on the boolean event "go" with the given actions, fires it and waits for the actions */
        const run = (actions: any[], cue: { type?: string; value?: any } = {}) => {
            const type = cue.type ?? 'b';
            const value = cue.value ?? true;
            load([{ type, event: 'go', trigger: value, actions }]);
            C.publishEvent(type as any, 'go', value);
            vi.advanceTimersByTime(ACTION_DELAY);
        };

        it('reject an action without a state or with an unknown type when they run', () => {
            const emulator = lib.Ch5Emulator.getInstance();
            emulator.processAction({ type: 'b', logic: 'set' } as any, 0, [], true);
            expect(() => vi.advanceTimersByTime(ACTION_DELAY)).toThrow('Property "state" is not set in action.');
            emulator.processAction({ state: 's', type: 'x', logic: 'set' } as any, 0, [], true);
            expect(() => vi.advanceTimersByTime(ACTION_DELAY)).toThrow('Invalid cue type: x');
        });

        it('write to "fb<number>" when the state is a join number', () => {
            run([{ state: '10', type: 'b', logic: 'set', value: true }]);
            expect(C.getState('b', '10')).toBe(true);
            expect(C.Ch5SignalFactory.getInstance().getBooleanSignal('fb10', false)!.value).toBe(true);
        });

        it('arrive as if the control system had sent them', () => {
            run([{ state: 'lamp', type: 'b', logic: 'set', value: true }]);
            expect(C.Ch5SignalFactory.getInstance().getBooleanSignal('lamp')!.receivedFromSignalBridge).toBe(true);
        });

        describe('boolean', () => {
            it('set uses the value as given, and does nothing without one', () => {
                run([
                    { state: 'a', type: 'b', logic: 'set', value: true },
                    { state: 'b', type: 'boolean', logic: 'set' },
                ]);
                expect(C.getState('b', 'a')).toBe(true);
                expect(C.getState('b', 'b')).toBeNull();
            });

            it('link copies the event value', () => {
                run([{ state: 'a', type: 'b', logic: 'link' }]);
                expect(C.getState('b', 'a')).toBe(true);
            });

            it.each([
                ['true', true], [' YES ', true], ['1', true], ['anything', true],
                ['false', false], ['No', false], ['0', false], ['', false],
            ])('link reads the string "%s" as %s', (text, expected) => {
                C.bridgeReceiveBooleanFromNative('a', !expected);
                run([{ state: 'a', type: 'b', logic: 'link' }], { type: 's', value: text });
                expect(C.getState('b', 'a')).toBe(expected);
            });

            it('link reads numbers and objects by truthiness', () => {
                run([{ state: 'a', type: 'b', logic: 'link' }], { type: 'n', value: 7 });
                expect(C.getState('b', 'a')).toBe(true);
            });

            it('toggle flips the state', () => {
                run([{ state: 'a', type: 'b', logic: 'toggle' }]);
                expect(C.getState('b', 'a')).toBe(true);
                C.publishEvent('b', 'go', true);
                vi.advanceTimersByTime(ACTION_DELAY);
                expect(C.getState('b', 'a')).toBe(false);
            });

            it('pulse sends true and then false', () => {
                const cb = vi.fn();
                C.subscribeState('b', 'a', cb);
                run([{ state: 'a', type: 'b', logic: 'pulse' }]);
                expect(cb.mock.calls).toEqual([[false], [true], [false]]);
            });
        });

        describe('number', () => {
            it('set uses numbers only', () => {
                run([
                    { state: 'a', type: 'n', logic: 'set', value: 12 },
                    { state: 'b', type: 'number', logic: 'set', value: '12' },
                    { state: 'c', type: 'numeric', logic: 'set' },
                ]);
                expect(C.getState('n', 'a')).toBe(12);
                expect(C.getState('n', 'b')).toBeNull();
                expect(C.getState('n', 'c')).toBeNull();
            });

            it('link parses the event value as an integer and falls back to 0', () => {
                run([{ state: 'a', type: 'n', logic: 'link' }], { type: 's', value: '42.9px' });
                expect(C.getState('n', 'a')).toBe(42);
                run([{ state: 'b', type: 'n', logic: 'link' }], { type: 's', value: 'abc' });
                expect(C.getState('n', 'b')).toBe(0);
            });

            it('increment and decrement step by 1 or by the offset', () => {
                const fire = (event: string) => {
                    C.publishEvent('b', event, true);
                    vi.advanceTimersByTime(ACTION_DELAY);
                };
                load([
                    { type: 'b', event: 'up', trigger: true, actions: [{ state: 'a', type: 'n', logic: 'increment' }] },
                    { type: 'b', event: 'up5', trigger: true, actions: [{ state: 'a', type: 'n', logic: 'increment', offset: 5 }] },
                    { type: 'b', event: 'down', trigger: true, actions: [{ state: 'a', type: 'n', logic: 'decrement' }] },
                    { type: 'b', event: 'down20', trigger: true, actions: [{ state: 'a', type: 'n', logic: 'decrement', offset: 20 }] },
                ]);
                C.bridgeReceiveIntegerFromNative('a', 10);
                fire('up');
                expect(C.getState('n', 'a')).toBe(11);
                fire('up5');
                expect(C.getState('n', 'a')).toBe(16);
                fire('down');
                expect(C.getState('n', 'a')).toBe(15);
                fire('down20');
                expect(C.getState('n', 'a')).toBe(-5);
            });

            it('rcb sets the value after the given time', () => {
                run([{ state: 'a', type: 'n', logic: 'rcb', value: 80, time: 500 }]);
                vi.advanceTimersByTime(499);
                expect(C.getState('n', 'a')).toBeNull();
                vi.advanceTimersByTime(1);
                expect(C.getState('n', 'a')).toBe(80);
            });

            it('rcb does nothing without a value or a time', () => {
                run([
                    { state: 'a', type: 'n', logic: 'rcb', value: 80 },
                    { state: 'b', type: 'n', logic: 'rcb', time: 10 },
                ]);
                vi.advanceTimersByTime(1000);
                expect(C.getState('n', 'a')).toBeNull();
                expect(C.getState('n', 'b')).toBeNull();
            });
        });

        describe('string', () => {
            it('set converts the value to a string, including a missing one', () => {
                run([
                    { state: 'a', type: 's', logic: 'set', value: 'text' },
                    { state: 'b', type: 'string', logic: 'set', value: 5 },
                    { state: 'c', type: 's', logic: 'set' },
                ]);
                expect(C.getState('s', 'a')).toBe('text');
                expect(C.getState('s', 'b')).toBe('5');
                expect(C.getState('s', 'c')).toBe('undefined');
            });

            it('link converts the event value to a string', () => {
                run([{ state: 'a', type: 's', logic: 'link' }]);
                expect(C.getState('s', 'a')).toBe('true');
            });
        });

        describe('object', () => {
            it('set uses the value as given, and does nothing without one', () => {
                const value = { a: 1 };
                run([
                    { state: 'a', type: 'o', logic: 'set', value },
                    { state: 'b', type: 'object', logic: 'set' },
                ]);
                expect(C.getState('o', 'a')).toBe(value);
                expect(C.getState('o', 'b')).toBeNull();
            });

            it('link copies the event value', () => {
                const value = { a: 1 };
                run([{ state: 'a', type: 'o', logic: 'link' }], { type: 'o', value });
                expect(C.getState('o', 'a')).toBe(value);
            });

            it('set with a ramp object ramps the number state of the same name', () => {
                run([{ state: 'a', type: 'o', logic: 'set', value: { rcb: { value: 100, time: 1000 } } }]);
                vi.advanceTimersByTime(500);
                expect(C.getState('n', 'a')).toBe(50);
                vi.advanceTimersByTime(500);
                expect(C.getState('n', 'a')).toBe(100);
            });
        });
    });

    describe('run', () => {
        it('needs a loaded scenario', () => {
            expect(() => lib.Ch5Emulator.getInstance().run()).toThrow('You must load a scenario before trying to run one.');
        });

        it('does nothing when the scenario has no onStart list', () => {
            expect(() => load([]).run()).not.toThrow();
        });

        it('sets the onStart values immediately', () => {
            const info = { a: 1 };
            load([], [
                { type: 'b', state: 'flag', value: true },
                { type: 'n', state: 'level', value: 5 },
                { type: 'numeric', state: 'parsed', value: '7' },
                { type: 's', state: 'text', value: 'hi' },
                { type: 'o', state: 'info', value: info },
                { type: 'b', state: '3', value: true },
            ]).run();
            expect(C.getState('b', 'flag')).toBe(true);
            expect(C.getState('n', 'level')).toBe(5);
            expect(C.getState('n', 'parsed')).toBe(7);
            expect(C.getState('s', 'text')).toBe('hi');
            expect(C.getState('o', 'info')).toBe(info);
            expect(C.getState('b', '3')).toBe(true);
        });

        it.each([
            [{ type: 'b', state: 'x', value: 'true' }, 'Error when setting initial value (true) for state: x'],
            [{ type: 'n', state: 'x', value: 'abc' }, 'Error when setting initial value (abc) for state: x'],
            [{ type: 's', state: 'x', value: 5 }, 'Error when setting initial value (5) for state: x'],
            [{ type: 'o', state: 'x', value: 'text' }, 'Error when setting initial value (text) for signal: x'],
            [{ type: 'z', state: 'x', value: 1 }, "Invalid 'onStart' type: z"],
        ])('rejects the onStart entry %j', (entry, message) => {
            expect(() => load([], [entry]).run()).toThrow(message);
        });
    });
});
