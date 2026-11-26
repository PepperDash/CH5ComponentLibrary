/**
 * Helpers shared by the spec files. Not part of the published library.
 */
import { vi } from 'vitest';

export type TLib = typeof import('./index');

const SEND = [
    'bridgeSendBooleanToNative',
    'bridgeSendIntegerToNative',
    'bridgeSendStringToNative',
    'bridgeSendObjectToNative',
];
const SUBSCRIBE = [
    'bridgeSubscribeBooleanSignalFromNative',
    'bridgeSubscribeIntegerSignalFromNative',
    'bridgeSubscribeStringSignalFromNative',
    'bridgeSubscribeObjectSignalFromNative',
];
const UNSUBSCRIBE = [
    'bridgeUnsubscribeBooleanSignalFromNative',
    'bridgeUnsubscribeIntegerSignalFromNative',
    'bridgeUnsubscribeStringSignalFromNative',
    'bridgeUnsubscribeObjectSignalFromNative',
];
const WINDOW_RECEIVERS = [
    'bridgeReceiveIntegerFromNative',
    'bridgeReceiveBooleanFromNative',
    'bridgeReceiveStringFromNative',
    'bridgeReceiveObjectFromNative',
];

const g = globalThis as any;

/**
 * The library keeps its state in module level singletons, so every test loads its own copy.
 * Install any native interface (see below) BEFORE calling this: the library looks for them while loading.
 */
export async function loadLib(): Promise<TLib> {
    vi.resetModules();
    return await import('./index');
}

/** Android container: functions called directly on the JSInterface global */
export function installJSInterface(): Record<string, ReturnType<typeof vi.fn>> {
    const jsInterface: Record<string, ReturnType<typeof vi.fn>> = {};
    [...SEND, ...SUBSCRIBE, ...UNSUBSCRIBE].forEach(name => { jsInterface[name] = vi.fn(); });
    g.JSInterface = jsInterface;
    return jsInterface;
}

/** iOS container: webkit.messageHandlers.<name>.postMessage(...) */
export function installWebkit(): Record<string, { postMessage: ReturnType<typeof vi.fn> }> {
    const messageHandlers: Record<string, { postMessage: ReturnType<typeof vi.fn> }> = {};
    [...SEND, ...SUBSCRIBE, ...UNSUBSCRIBE].forEach(name => { messageHandlers[name] = { postMessage: vi.fn() }; });
    g.webkit = { messageHandlers };
    return messageHandlers;
}

/** WebXPanel: functions called directly on the CommunicationInterface global */
export function installWebXPanel(): Record<string, ReturnType<typeof vi.fn>> {
    const communicationInterface: Record<string, ReturnType<typeof vi.fn>> = {};
    SEND.forEach(name => { communicationInterface[name] = vi.fn(); });
    g.CommunicationInterface = communicationInterface;
    return communicationInterface;
}

/** Removes everything the helpers above and the library itself put on the global object */
export function resetGlobals(): void {
    delete g.JSInterface;
    delete g.webkit;
    delete g.CommunicationInterface;
    delete g.CrComLib;
    WINDOW_RECEIVERS.forEach(name => { delete g[name]; });
}

/** Sends a resynchronization message the way the control system does */
export function receiveSync(lib: TLib, state: string, value?: object): void {
    lib.CrComLib.bridgeReceiveObjectFromNative('Csig.State_Synchronization', { id: 'test', state, value });
}
