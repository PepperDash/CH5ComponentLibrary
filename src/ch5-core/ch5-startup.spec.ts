import { afterEach, describe, expect, it, vi } from 'vitest';
import { installJSInterface, loadLib, resetGlobals } from '../test-helpers';

/**
 * Things the library does on its own while it loads: heartbeat replies and platform information
 */
describe('Ch5Heartbeats', () => {

    afterEach(() => {
        resetGlobals();
    });

    it('answers a heartbeat request with the same payload', async () => {
        const js = installJSInterface();
        const C = (await loadLib()).CrComLib;
        js.bridgeSendObjectToNative.mockClear();

        C.bridgeReceiveObjectFromNative('Csig.HeartbeatRequest', { id: 7 });

        expect(js.bridgeSendObjectToNative.mock.calls).toEqual([['Csig.HeartbeatResponse', '{"id":7}']]);
    });

    it('answers every request', async () => {
        const js = installJSInterface();
        const C = (await loadLib()).CrComLib;
        js.bridgeSendObjectToNative.mockClear();

        C.bridgeReceiveObjectFromNative('Csig.HeartbeatRequest', { id: 1 });
        C.bridgeReceiveObjectFromNative('Csig.HeartbeatRequest', { id: 2 });

        expect(js.bridgeSendObjectToNative).toHaveBeenCalledTimes(2);
    });

    // Known quirk: subscribing delivers the initial (empty) value, which is answered like a real request
    it('sends one empty heartbeat response while the library loads', async () => {
        const js = installJSInterface();
        await loadLib();
        expect(js.bridgeSendObjectToNative.mock.calls).toEqual([['Csig.HeartbeatResponse', '{}']]);
    });

    it('is a singleton', async () => {
        const C = (await loadLib()).CrComLib;
        expect(C.Ch5Heartbeats.getInstance()).toBe(C.Ch5Heartbeats.getInstance());
    });
});

describe('Ch5Platform', () => {
    const info = {
        capabilities: { supportsTouchActivity: false, supportCredentialIntercept: { http: 'a', https: 'b' } },
        version: '1.2.3',
        name: 'Test container',
    };

    afterEach(() => {
        resetGlobals();
    });

    it('is a singleton', async () => {
        const C = (await loadLib()).CrComLib;
        expect(C.Ch5Platform.getInstance()).toBe(C.Ch5Platform.getInstance());
    });

    it('starts with default platform information', async () => {
        const C = (await loadLib()).CrComLib;
        expect(C.Ch5Platform.getInstance().getPlatformInfo()).toEqual({
            capabilities: { supportsTouchActivity: true, supportCredentialIntercept: { http: '', https: '' } },
            version: '',
            name: '',
        });
    });

    it('takes the platform information from Csig.Platform_Info and freezes it', async () => {
        const C = (await loadLib()).CrComLib;
        const received = { ...info };
        C.bridgeReceiveObjectFromNative('Csig.Platform_Info', received);
        const current = C.Ch5Platform.getInstance().getPlatformInfo();
        expect(current).toBe(received);
        expect(Object.isFrozen(current)).toBe(true);
    });

    it('keeps the first platform information it received', async () => {
        const C = (await loadLib()).CrComLib;
        C.bridgeReceiveObjectFromNative('Csig.Platform_Info', { ...info });
        C.bridgeReceiveObjectFromNative('Csig.Platform_Info', { ...info, name: 'Second' });
        expect(C.Ch5Platform.getInstance().getPlatformInfo().name).toBe('Test container');
    });

    it('ignores an empty object', async () => {
        const C = (await loadLib()).CrComLib;
        const cb = vi.fn();
        C.Ch5Platform.getInstance().registerUpdateCallback(cb);
        cb.mockClear();
        C.bridgeReceiveObjectFromNative('Csig.Platform_Info', {});
        expect(cb).not.toHaveBeenCalled();
        expect(C.Ch5Platform.getInstance().getPlatformInfo().name).toBe('');
    });

    it('calls a registered callback immediately and again on every update', async () => {
        const C = (await loadLib()).CrComLib;
        const cb = vi.fn();
        C.Ch5Platform.getInstance().registerUpdateCallback(cb);
        expect(cb).toHaveBeenCalledTimes(1);
        expect(cb.mock.calls[0][0].name).toBe('');

        C.bridgeReceiveObjectFromNative('Csig.Platform_Info', { ...info });
        C.bridgeReceiveObjectFromNative('Csig.Platform_Info', { ...info, name: 'Second' });

        expect(cb).toHaveBeenCalledTimes(3);
        expect(cb.mock.calls[1][0].name).toBe('Test container');
        // the second update is announced, but still with the first information
        expect(cb.mock.calls[2][0].name).toBe('Test container');
    });
});
