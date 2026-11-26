import { afterEach, describe, expect, it } from 'vitest';
import { installJSInterface, installWebkit, installWebXPanel, loadLib, resetGlobals } from '../test-helpers';

describe('Ch5SignalBridge (sending to the native side)', () => {

    afterEach(() => {
        resetGlobals();
    });

    describe('in a plain browser', () => {
        it('publishes without throwing when there is no native interface', async () => {
            const C = (await loadLib()).CrComLib;
            expect(() => {
                C.publishEvent('b', 'a', true);
                C.publishEvent('n', 'a', 1);
                C.publishEvent('s', 'a', 'x');
                C.publishEvent('o', 'a', { x: 1 });
            }).not.toThrow();
        });

        it('exposes the repeat digital key', async () => {
            const C = (await loadLib()).CrComLib;
            expect(C.Ch5SignalBridge.REPEAT_DIGITAL_KEY).toBe('repeatdigital');
        });
    });

    describe('with JSInterface (Android container)', () => {
        it('sends each type through its own function', async () => {
            const js = installJSInterface();
            const C = (await loadLib()).CrComLib;

            C.publishEvent('b', 'room.power', true);
            C.publishEvent('n', 'room.volume', 42);
            C.publishEvent('s', 'room.name', 'Boardroom');
            C.publishEvent('o', 'room.info', { a: 1 });

            expect(js.bridgeSendBooleanToNative).toHaveBeenCalledWith('room.power', true);
            expect(js.bridgeSendIntegerToNative).toHaveBeenCalledWith('room.volume', 42);
            expect(js.bridgeSendStringToNative).toHaveBeenCalledWith('room.name', 'Boardroom');
            expect(js.bridgeSendObjectToNative).toHaveBeenCalledWith('room.info', '{"a":1}');
        });

        it('sends once per publish, including repeated values', async () => {
            const js = installJSInterface();
            const C = (await loadLib()).CrComLib;
            C.publishEvent('b', 'press', true);
            C.publishEvent('b', 'press', true);
            C.publishEvent('b', 'press', false);
            expect(js.bridgeSendBooleanToNative.mock.calls).toEqual([['press', true], ['press', true], ['press', false]]);
        });

        it('does not add the "fb" prefix to published join numbers', async () => {
            const js = installJSInterface();
            const C = (await loadLib()).CrComLib;
            C.publishEvent('b', '22', true);
            expect(js.bridgeSendBooleanToNative).toHaveBeenCalledWith('22', true);
        });

        it('sends a repeat digital object through the boolean signal as an object', async () => {
            const js = installJSInterface();
            const C = (await loadLib()).CrComLib;
            const sig = C.Ch5SignalFactory.getInstance().getObjectAsBooleanSignal('press')!;
            sig.publish({ repeatdigital: true });
            expect(js.bridgeSendObjectToNative).toHaveBeenCalledWith('press', '{"repeatdigital":true}');
            expect(js.bridgeSendBooleanToNative).not.toHaveBeenCalled();
        });

        // Known quirk: Ch5Signal.subscribe only tells the native side when it holds exactly one subscription,
        // but every signal already holds an internal one, so the native subscribe functions are never reached.
        it('never calls the native subscribe or unsubscribe functions', async () => {
            const js = installJSInterface();
            const C = (await loadLib()).CrComLib;

            const types = ['b', 'n', 's', 'o'] as const;
            types.forEach(type => {
                const first = C.subscribeState(type, 'sig', () => undefined);
                const second = C.subscribeState(type, 'sig', () => undefined);
                C.unsubscribeState(type, 'sig', first);
                C.unsubscribeState(type, 'sig', second);
            });

            Object.keys(js)
                .filter(name => name.includes('ubscribe'))
                .forEach(name => expect(js[name], name).not.toHaveBeenCalled());
        });
    });

    describe('with webkit message handlers (iOS container)', () => {
        it('posts a JSON string holding the signal name and value', async () => {
            const wk = installWebkit();
            const C = (await loadLib()).CrComLib;

            C.publishEvent('b', 'room.power', true);
            C.publishEvent('n', 'room.volume', 42);
            C.publishEvent('s', 'room.name', 'Boardroom');
            C.publishEvent('o', 'room.info', { a: 1 });

            expect(wk.bridgeSendBooleanToNative.postMessage).toHaveBeenCalledWith('{"signal":"room.power","value":true}');
            expect(wk.bridgeSendIntegerToNative.postMessage).toHaveBeenCalledWith('{"signal":"room.volume","value":42}');
            expect(wk.bridgeSendStringToNative.postMessage).toHaveBeenCalledWith('{"signal":"room.name","value":"Boardroom"}');
            expect(wk.bridgeSendObjectToNative.postMessage).toHaveBeenCalledWith('{"signal":"room.info","value":{"a":1}}');
        });

        it('never posts to the subscribe or unsubscribe handlers', async () => {
            const wk = installWebkit();
            const C = (await loadLib()).CrComLib;
            const key = C.subscribeState('o', 'sig', () => undefined);
            C.unsubscribeState('o', 'sig', key);
            Object.keys(wk)
                .filter(name => name.includes('ubscribe'))
                .forEach(name => expect(wk[name].postMessage, name).not.toHaveBeenCalled());
        });
    });

    describe('with CommunicationInterface (WebXPanel)', () => {
        it('sends each type through its own function', async () => {
            const xp = installWebXPanel();
            const C = (await loadLib()).CrComLib;

            C.publishEvent('b', 'room.power', true);
            C.publishEvent('n', 'room.volume', 42);
            C.publishEvent('s', 'room.name', 'Boardroom');
            C.publishEvent('o', 'room.info', { a: 1 });

            expect(xp.bridgeSendBooleanToNative).toHaveBeenCalledWith('room.power', true);
            expect(xp.bridgeSendIntegerToNative).toHaveBeenCalledWith('room.volume', 42);
            expect(xp.bridgeSendStringToNative).toHaveBeenCalledWith('room.name', 'Boardroom');
            expect(xp.bridgeSendObjectToNative).toHaveBeenCalledWith('room.info', '{"a":1}');
        });
    });

    describe('when more than one interface is present', () => {
        it('prefers JSInterface over webkit and CommunicationInterface', async () => {
            const js = installJSInterface();
            const wk = installWebkit();
            const xp = installWebXPanel();
            const C = (await loadLib()).CrComLib;
            C.publishEvent('b', 'a', true);
            expect(js.bridgeSendBooleanToNative).toHaveBeenCalledWith('a', true);
            expect(wk.bridgeSendBooleanToNative.postMessage).not.toHaveBeenCalled();
            expect(xp.bridgeSendBooleanToNative).not.toHaveBeenCalled();
        });

        it('prefers webkit over CommunicationInterface', async () => {
            const wk = installWebkit();
            const xp = installWebXPanel();
            const C = (await loadLib()).CrComLib;
            C.publishEvent('b', 'a', true);
            expect(wk.bridgeSendBooleanToNative.postMessage).toHaveBeenCalled();
            expect(xp.bridgeSendBooleanToNative).not.toHaveBeenCalled();
        });
    });

    describe('known quirks', () => {
        // typeof undefined is used as a lookup key into a table that only has boolean/number/string/object
        it('throws when an undefined value is published', async () => {
            const C = (await loadLib()).CrComLib;
            expect(() => C.publishEvent('s', 'a', undefined as any)).toThrow(TypeError);
        });

        it('sends null as the JSON string "null" through the object function', async () => {
            const js = installJSInterface();
            const C = (await loadLib()).CrComLib;
            C.publishEvent('o', 'a', null as any);
            expect(js.bridgeSendObjectToNative).toHaveBeenCalledWith('a', 'null');
        });
    });
});
