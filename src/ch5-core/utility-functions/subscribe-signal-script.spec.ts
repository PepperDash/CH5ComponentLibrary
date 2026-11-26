import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadLib, resetGlobals, TLib } from '../../test-helpers';

describe('subscribeStateScript', () => {
    let C: TLib['CrComLib'];

    beforeEach(async () => {
        C = (await loadLib()).CrComLib;
    });

    afterEach(() => {
        vi.useRealTimers();
        resetGlobals();
        delete (globalThis as any).__scriptSideEffect;
    });

    it('returns numbered keys', () => {
        expect(C.subscribeStateScript('1', vi.fn() as any)).toBe('ch5SubSigScript-1');
        expect(C.subscribeStateScript('1', vi.fn() as any)).toBe('ch5SubSigScript-2');
        expect(C.generateSubSigScriptKey()).toBe('ch5SubSigScript-3');
    });

    it('delivers the default value while a signal in the template has no value yet', () => {
        const cb = vi.fn();
        C.subscribeStateScript("'Hello {{s.name}}'", cb as any, 'nobody');
        expect(cb).toHaveBeenLastCalledWith('nobody');
    });

    it('delivers the text "undefined" when there is no default value', () => {
        const cb = vi.fn();
        C.subscribeStateScript("'Hello {{s.name}}'", cb as any);
        expect(cb).toHaveBeenLastCalledWith('undefined');
    });

    it('fills in the signal values and evaluates the result as JavaScript', () => {
        const cb = vi.fn();
        C.publishEvent('s', 'name', 'World');
        C.publishEvent('n', 'a', 2);
        C.publishEvent('n', 'b', 3);
        C.publishEvent('b', 'on', true);

        C.subscribeStateScript("'Hello {{s.name}}'", cb as any, 'dflt');
        expect(cb).toHaveBeenLastCalledWith('Hello World');

        C.subscribeStateScript('{{n.a}} + {{n.b}} * {{n.a}}', cb as any, 'dflt');
        expect(cb).toHaveBeenLastCalledWith(8);

        C.subscribeStateScript("{{b.on}} ? 'yes' : 'no'", cb as any, 'dflt');
        expect(cb).toHaveBeenLastCalledWith('yes');
    });

    it('calls back once per token while subscribing, once more at the end, and then on every update', () => {
        const cb = vi.fn();
        C.publishEvent('n', 'a', 1);
        C.publishEvent('n', 'b', 1);
        C.subscribeStateScript('{{n.a}} + {{n.b}} + {{n.a}}', cb as any, 'dflt');
        expect(cb.mock.calls).toEqual([[3], [3], [3]]);

        C.publishEvent('n', 'a', 5);
        expect(cb.mock.calls).toEqual([[3], [3], [3], [11]]);
    });

    it('reads join numbers from "fb<number>"', () => {
        const cb = vi.fn();
        C.subscribeStateScript('{{n.12}} * 2', cb as any, 'dflt');
        expect(cb).toHaveBeenLastCalledWith('dflt');
        C.bridgeReceiveIntegerFromNative('12', 21);
        expect(cb).toHaveBeenLastCalledWith(42);
    });

    it('supports dots and underscores in signal names', () => {
        const cb = vi.fn();
        C.publishEvent('s', 'room.display_1.name', 'TV');
        C.subscribeStateScript("'{{s.room.display_1.name}}'", cb as any, 'dflt');
        expect(cb).toHaveBeenLastCalledWith('TV');
    });

    it('ignores tokens of other types, and then fails to evaluate the template', () => {
        expect(() => C.subscribeStateScript('{{o.thing}}', vi.fn() as any, 'dflt')).toThrow(SyntaxError);
    });

    it('evaluates a template without tokens once', () => {
        const cb = vi.fn();
        C.subscribeStateScript('1 + 1', cb as any, 'dflt');
        expect(cb.mock.calls).toEqual([[2]]);
    });

    it('does not evaluate when the template equals the default value', () => {
        const cb = vi.fn();
        C.subscribeStateScript('not javascript', cb as any, 'not javascript');
        expect(cb.mock.calls).toEqual([['not javascript']]);
    });

    it('tolerates a missing callback', () => {
        expect(() => C.subscribeStateScript('1', undefined as any)).not.toThrow();
    });

    it('records its subscriptions and unsubscribeStateScript ends them', () => {
        const cb = vi.fn();
        C.publishEvent('n', 'a', 1);
        const key = C.subscribeStateScript('{{n.a}} + {{n.7}}', cb as any, 'dflt');
        expect(C.subscribeStateScriptSigSubs[key]).toEqual([
            { sigName: 'a', sigType: 'n', sigSub: 'a-00001' },
            { sigName: 'fb7', sigType: 'n', sigSub: 'fb7-00001' },
        ]);

        cb.mockClear();
        C.unsubscribeStateScript(key);
        C.publishEvent('n', 'a', 2);
        C.bridgeReceiveIntegerFromNative('7', 2);
        expect(cb).not.toHaveBeenCalled();
    });

    it('keeps the record after unsubscribing and ignores unknown keys', () => {
        const key = C.subscribeStateScript('{{n.a}}', vi.fn() as any, 'dflt');
        C.unsubscribeStateScript(key);
        expect(C.subscribeStateScriptSigSubs[key]).toHaveLength(1);
        expect(() => C.unsubscribeStateScript(key)).not.toThrow();
        expect(() => C.unsubscribeStateScript('nope')).not.toThrow();
    });

    describe('known quirks: signal values are pasted into the template as code', () => {
        it('throws when a string value contains the quote used in the template', () => {
            vi.useFakeTimers();
            C.publishEvent('s', 'name', "O'Brien");
            expect(() => C.subscribeStateScript("'Hello {{s.name}}'", vi.fn() as any, 'dflt')).toThrow(SyntaxError);
            // the same failure inside the signal subscription is reported by rxjs as an uncaught error on a timer
            expect(() => vi.runAllTimers()).toThrow(SyntaxError);
        });

        it('reports a later bad value as an uncaught error instead of calling back', () => {
            vi.useFakeTimers();
            const cb = vi.fn();
            C.publishEvent('s', 'name', 'World');
            C.subscribeStateScript("'Hello {{s.name}}'", cb as any, 'dflt');
            cb.mockClear();
            expect(() => C.publishEvent('s', 'name', "O'Brien")).not.toThrow();
            expect(cb).not.toHaveBeenCalled();
            expect(() => vi.runAllTimers()).toThrow(SyntaxError);
        });

        it('runs code contained in a string value', () => {
            const cb = vi.fn();
            C.publishEvent('s', 'name', "' + (globalThis.__scriptSideEffect = 'ran') + '");
            C.subscribeStateScript("'Hello {{s.name}}'", cb as any, 'dflt');
            expect((globalThis as any).__scriptSideEffect).toBe('ran');
            expect(cb).toHaveBeenLastCalledWith('Hello ran');
        });
    });
});
