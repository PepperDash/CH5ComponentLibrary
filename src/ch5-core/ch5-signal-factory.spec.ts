// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadLib, resetGlobals, TLib } from '../test-helpers';
import {fail} from "assert";

import {Ch5SignalFactory} from "../ch5-core";
describe('Ch5SignalFactory', () => {

    describe("#init",() => {
        it('boolean signal is false by default', () => {
            const sig = Ch5SignalFactory.getInstance().getBooleanSignal('sig1');

            if (null !== sig){
                expect(sig.value).to.be.equal(false);
            }else{
                fail('null signal');
            }
        });
        it('number signal is 0 by default', () => {
            const sig = Ch5SignalFactory.getInstance().getNumberSignal('sig2');

            if (null !== sig){
                expect(sig.value).to.be.equal(0);
            }else{
                fail('null signal');
            }

        });
        it('string signal is "" by default', () => {
            const sig = Ch5SignalFactory.getInstance().getStringSignal('sig3');

            if (null !== sig){
                expect(sig.value).to.be.equal('');
            }else{
                fail('null signal');
            }
        });
        it('object signal is {} by default', () => {
            const sig = Ch5SignalFactory.getInstance().getObjectSignal('sig4');

            if (null !== sig){
                expect(sig.value).to.be.an('object').that.is.empty; // tslint:disable-line:no-unused-expression
            }else{
                fail('null signal');
            }
        });
    });
});
describe('Ch5SignalFactory lookups', () => {
    let C: TLib['CrComLib'];

    beforeEach(async () => {
        C = (await loadLib()).CrComLib;
    });

    afterEach(() => {
        resetGlobals();
    });

    it('is a singleton', () => {
        expect(C.Ch5SignalFactory.getInstance()).toBe(C.Ch5SignalFactory.getInstance());
    });

    it('returns the same signal for the same name and type', () => {
        const f = C.Ch5SignalFactory.getInstance();
        expect(f.getBooleanSignal('a')).toBe(f.getBooleanSignal('a'));
    });

    it('keeps signals of different types with the same name apart', () => {
        const f = C.Ch5SignalFactory.getInstance();
        f.getBooleanSignal('a')!.publish(true);
        f.getNumberSignal('a')!.publish(7);
        expect(f.getBooleanSignal('a')!.value).toBe(true);
        expect(f.getNumberSignal('a')!.value).toBe(7);
        expect(f.getStringSignal('a')!.value).toBe('');
    });

    it('returns null instead of creating when createNewIfNotFound is false', () => {
        const f = C.Ch5SignalFactory.getInstance();
        expect(f.getBooleanSignal('missing', false)).toBeNull();
        expect(f.getNumberSignal('missing', false)).toBeNull();
        expect(f.getStringSignal('missing', false)).toBeNull();
        expect(f.getObjectSignal('missing', false)).toBeNull();
        f.getBooleanSignal('there');
        expect(f.getBooleanSignal('there', false)).not.toBeNull();
    });

    it('returns null for an undefined name', () => {
        expect(C.Ch5SignalFactory.getInstance().getBooleanSignal(undefined as any)).toBeNull();
    });

    it('getObjectAsBooleanSignal returns the boolean signal', () => {
        const f = C.Ch5SignalFactory.getInstance();
        expect(f.getObjectAsBooleanSignal('a')).toBe(f.getBooleanSignal('a'));
    });

    it('getStates exposes the signals grouped by type', () => {
        const f = C.Ch5SignalFactory.getInstance();
        const sig = f.getStringSignal('mine');
        const states = f.getStates();
        expect(Object.keys(states).sort()).toEqual(['boolean', 'number', 'object', 'string']);
        expect(states.string.mine).toBe(sig);
    });

    it('creates the built in signals while the library loads', () => {
        const states = C.Ch5SignalFactory.getInstance().getStates();
        expect(Object.keys(states.boolean)).toEqual([]);
        expect(Object.keys(states.number)).toEqual([]);
        expect(Object.keys(states.string)).toEqual([]);
        expect(Object.keys(states.object).sort()).toEqual([
            'Csig.HeartbeatRequest',
            'Csig.HeartbeatResponse',
            'Csig.Platform_Info',
            'Csig.State_Synchronization',
        ]);
    });

    it('clearSignals(false) drops every signal', () => {
        const f = C.Ch5SignalFactory.getInstance();
        f.getBooleanSignal('a');
        f.clearSignals(false);
        expect(f.getBooleanSignal('a', false)).toBeNull();
        expect(f.getObjectSignal('Csig.Platform_Info', false)).toBeNull();
    });

    it('clearSignals(true) keeps the object signals', () => {
        const f = C.Ch5SignalFactory.getInstance();
        f.getBooleanSignal('a');
        f.clearSignals(true);
        expect(f.getBooleanSignal('a', false)).toBeNull();
        expect(f.getObjectSignal('Csig.Platform_Info', false)).not.toBeNull();
    });

    it('clear() discards the instance', () => {
        const before = C.Ch5SignalFactory.getInstance();
        before.getBooleanSignal('a');
        C.Ch5SignalFactory.clear();
        const after = C.Ch5SignalFactory.getInstance();
        expect(after).not.toBe(before);
        expect(after.getBooleanSignal('a', false)).toBeNull();
        expect(before.getBooleanSignal('a')).toBeNull();
    });
});
