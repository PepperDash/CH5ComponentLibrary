// // Copyright (C) 2023 to the present, Crestron Electronics, Inc.
// // All rights reserved.
// // No part of this software may be reproduced in any form, machine
// // or natural, without the express written consent of Crestron Electronics.
// // Use of this source code is subject to the terms of the Crestron Software License Agreement
// // under which you licensed this source code.

// import { Ch5SignalFactory, Ch5Uid, publishEvent } from '../ch5-core';
// import { Ch5MutationObserver } from '../ch5-common/ch5-mutation-observer';
// import isEmpty from 'lodash/isEmpty';
// import { TCh5ShowType } from '../ch5-common/interfaces';
// import { Ch5SignalElementAttributeRegistryEntries } from "../ch5-common/ch5-signal-attribute-registry";
// import { isNotNil } from '../ch5-common/utils';
// import * as util from '../ch5-common/utils';
// import { ICh5PropertySettings } from '../ch5-core/ch5-property';
// import { Ch5Properties } from '../ch5-core/ch5-properties';
// import { Ch5BaseLog } from './ch5-base-log';
// import { Ch5Config } from '../ch5-common/ch5-config';
// // import { Ch5BaseClass } from './ch5-base-copy';
// import { ICh5CommonAttributesForDir } from '../ch5-common/interfaces/common/i-ch5-common-attributes-dir';
// import { ICh5CommonAttributesForId } from '../ch5-common/interfaces/common/i-ch5-common-attributes-id';
// import { ICh5CommonAttributesForNoShowType } from '../ch5-common/interfaces/common/i-ch5-common-attributes-noshowtype';
// import { ICh5CommonAttributesForReceiveStateHidePulse } from '../ch5-common/interfaces/common/i-ch5-common-attributes-receivestatehidepulse';
// import { ICh5CommonAttributesForReceiveStateShow } from '../ch5-common/interfaces/common/i-ch5-common-attributes-receivestateshow';
// import { ICh5CommonAttributesForReceiveStateShowPulse } from '../ch5-common/interfaces/common/i-ch5-common-attributes-receivestateshowpulse';
// import { ICh5CommonAttributesForSendEventOnShow } from '../ch5-common/interfaces/common/i-ch5-common-attributes-sendeventonshow';
// import { ICh5CommonAttributesForShow } from '../ch5-common/interfaces/common/i-ch5-common-attributes-show';

// export interface ICh5CommonProperties {
// 	debug: ICh5PropertySettings,
// 	dir: ICh5PropertySettings,
// 	id: ICh5PropertySettings,
// 	noshowType: ICh5PropertySettings,
// 	receiveStateShow: ICh5PropertySettings,
// 	receiveStateShowPulse: ICh5PropertySettings,
// 	receiveStateHidePulse: ICh5PropertySettings,
// 	sendEventOnShow: ICh5PropertySettings,
// 	show: ICh5PropertySettings,
// 	trace: ICh5PropertySettings
// }

// export abstract class Ch5Base extends HTMLElement implements ICh5CommonAttributesForDir,
// 	ICh5CommonAttributesForShow,
// 	ICh5CommonAttributesForSendEventOnShow,
// 	ICh5CommonAttributesForReceiveStateHidePulse,
// 	ICh5CommonAttributesForReceiveStateShowPulse,
// 	ICh5CommonAttributesForReceiveStateShow,
// 	ICh5CommonAttributesForNoShowType,
// 	ICh5CommonAttributesForId {

// 	//#region Variables

// 	public static readonly DIRECTION: string[] = ['ltr', 'rtl'];

// 	public static readonly NO_SHOW_TYPES: TCh5ShowType[] = ['display', 'visibility', 'remove'];

// 	public static ELEMENT_NAME = "Ch5Base";
// 	protected COMPONENT_NAME = "Ch5Base";

// 	public static COMPONENT_PROPERTIES: ICh5PropertySettings[] = [];
// 	public static readonly BASE_COMPONENT_PROPERTIES: ICh5PropertySettings[] = [
// 		{
// 			default: "",
// 			name: "id",
// 			removeAttributeOnNull: true,
// 			type: "string",
// 			valueOnAttributeEmpty: "",
// 			isObservableProperty: true
// 		},
// 		{
// 			default: Ch5Base.DIRECTION[0],
// 			name: "dir",
// 			removeAttributeOnNull: true,
// 			type: "string",
// 			valueOnAttributeEmpty: Ch5Base.DIRECTION[0],
// 			isObservableProperty: true
// 		},
// 		{
// 			default: true,
// 			name: "show",
// 			nameForSignal: "receiveStateShow",
// 			removeAttributeOnNull: true,
// 			type: "boolean",
// 			valueOnAttributeEmpty: true,
// 			isObservableProperty: true
// 		},
// 		{
// 			default: false,
// 			name: "debug",
// 			removeAttributeOnNull: true,
// 			type: "boolean",
// 			valueOnAttributeEmpty: true,
// 			isObservableProperty: true
// 		},
// 		{
// 			default: false,
// 			name: "trace",
// 			removeAttributeOnNull: true,
// 			type: "boolean",
// 			valueOnAttributeEmpty: true,
// 			isObservableProperty: true
// 		},
// 		{
// 			default: Ch5Base.NO_SHOW_TYPES[0],
// 			enumeratedValues: Ch5Base.NO_SHOW_TYPES,
// 			name: "noshowType",
// 			removeAttributeOnNull: true,
// 			type: "enum",
// 			valueOnAttributeEmpty: Ch5Base.NO_SHOW_TYPES[0],
// 			isObservableProperty: true
// 		},
// 		{
// 			default: "",
// 			isSignal: true,
// 			name: "receiveStateShow",
// 			signalType: "boolean",
// 			removeAttributeOnNull: true,
// 			type: "string",
// 			valueOnAttributeEmpty: "",
// 			isObservableProperty: true
// 		},
// 		{
// 			default: "",
// 			isSignal: true,
// 			name: "receiveStateShowPulse",
// 			signalType: "boolean",
// 			removeAttributeOnNull: true,
// 			type: "string",
// 			valueOnAttributeEmpty: "",
// 			isObservableProperty: true
// 		},
// 		{
// 			default: "",
// 			isSignal: true,
// 			name: "receiveStateHidePulse",
// 			signalType: "boolean",
// 			removeAttributeOnNull: true,
// 			type: "string",
// 			valueOnAttributeEmpty: "",
// 			isObservableProperty: true
// 		},
// 		{
// 			default: "",
// 			isSignal: true,
// 			name: "sendEventOnShow",
// 			signalType: "boolean",
// 			removeAttributeOnNull: true,
// 			type: "string",
// 			valueOnAttributeEmpty: "",
// 			isObservableProperty: true
// 		}
// 	];

// 	public static readonly COMMON_PROPERTIES: ICh5CommonProperties = {
// 		debug: Ch5Base.getCommonProperty("debug"),
// 		dir: Ch5Base.getCommonProperty("dir"),
// 		id: Ch5Base.getCommonProperty("id"),
// 		noshowType: Ch5Base.getCommonProperty("noshowType"),
// 		receiveStateShow: Ch5Base.getCommonProperty("receiveStateShow"),
// 		receiveStateShowPulse: Ch5Base.getCommonProperty("receiveStateShowPulse"),
// 		receiveStateHidePulse: Ch5Base.getCommonProperty("receiveStateHidePulse"),
// 		sendEventOnShow: Ch5Base.getCommonProperty("sendEventOnShow"),
// 		show: Ch5Base.getCommonProperty("show"),
// 		trace: Ch5Base.getCommonProperty("trace")
// 	};

// 	protected _ch5Properties: Ch5Properties;
// 	protected componentProperties: ICh5PropertySettings[] = [];

// 	protected _nextSiblingIndexInParentChildNodes: number = 0;

// 	protected _onrelease: {} = {};
// 	protected _onpress: {} = {};

// 	// element is visible or not
// 	public elementIsVisible: boolean = true;

// 	// Ch5 internal unique ID
// 	protected _crId: string = '';

// 	// CSS class name for noshowtype = visibility
// 	private readonly CSS_CLASS_FOR_HIDE_VISIBILITY = 'ch5-hide-vis';

// 	// CSS class name for noshowtype = none
// 	private readonly CSS_CLASS_FOR_HIDE_DISPLAY = 'ch5-hide-dis';

// 	// Cached parent element. Used in the case when noshowType is set to remove and the component has to be reattached to the DOM
// 	protected _cachedParentEl: Node | null = null;

// 	/**
// 	 * Cached sibling element. The one that immediately follows the current element. Used in the case when noshowType
// 	 * is set to remove and the component has to be reattached to the DOM
// 	 */
// 	protected _cachedNextSibling: Node | null = null;

// 	protected _isDetachedFromDom: boolean = false;
// 	/**
// 	 * When noshowType is 'remove' and the element was removed from the DOM this gets set to true
// 	 * If this is true then the component will not unsubscribe from signals on removal from DOM ( as a consequence of a show signal change)
// 	 */
// 	protected _keepListeningOnSignalsAfterRemoval = false;

// 	protected _isInstantiated: boolean = false;

// 	/**
// 	 * Whenever the target meets a threshold specified for the IntersectionObserver,
// 	 * the callback is invoked. The callback receives a list of IntersectionObserverEntry objects
// 	 */
// 	public elementIntersectionEntry: IntersectionObserverEntry = {} as IntersectionObserverEntry;

// 	public logger: Ch5BaseLog;

// 	private _commonMutationObserver: Ch5MutationObserver = {} as Ch5MutationObserver;

// 	private static getCommonProperty(name: string) {
// 		// The parse and stringify are to be checked if required or not
// 		return JSON.parse(JSON.stringify(Ch5Base.BASE_COMPONENT_PROPERTIES.find((data: ICh5PropertySettings) => data.name === name)));
// 	}

// 	//#endregion

// 	//#region Getters and Setters

// 	public set dir(value: string) {
// 		this._ch5Properties.set<string>("dir", value);
// 	}
// 	public get dir(): string {
// 		return this._ch5Properties.get<string>("dir");
// 	}

// 	public set id(value: string) {
// 		this._ch5Properties.set<string>("id", value, () => {

// 		});
// 	}
// 	public get id(): string {
// 		return this._ch5Properties.get<string>("id");
// 	}

// 	public set receiveStateShow(value: string) {
// 		this._ch5Properties.set("receiveStateShow", value, null, () => {
// 			this.updateForChangeInShowStatus();
// 		});
// 	}
// 	public get receiveStateShow(): string {
// 		return this._ch5Properties.get<string>('receiveStateShow');
// 	}

// 	public set receiveStateShowPulse(value: string) {
// 		this._ch5Properties.set("receiveStateShowPulse", value, null, () => {
// 			// if (null !== recSig) {
// 			// 	const _newVal = (newVal as never as { repeatdigital: boolean }).repeatdigital !== undefined ? (newVal as never as { repeatdigital: boolean }).repeatdigital : newVal;
// 			// 	if ((recSig.prevValue as never as { repeatdigital: boolean }).repeatdigital !== undefined) {
// 			// 		if (false === (recSig.prevValue as never as { repeatdigital: boolean }).repeatdigital && true === _newVal) {
// 			// 			this.setAttribute('show', 'true');
// 			// 		}
// 			// 		return;
// 			// 	}
// 			// 	if (false === recSig.prevValue && true === _newVal) {
// 			// 		this.setAttribute('show', 'true');
// 			// 	}
// 			// }
// 		});
// 	}
// 	public get receiveStateShowPulse(): string {
// 		return this._ch5Properties.get<string>('receiveStateShowPulse');
// 	}

// 	public set receiveStateHidePulse(value: string) {
// 		this._ch5Properties.set("receiveStateHidePulse", value, null, () => {
// 			// if (null !== recSig) {
// 			// 	if (false === recSig.prevValue && true === newVal) {
// 			// 		this.setAttribute('show', 'false');
// 			// 	}
// 			// } else {
// 			// 	this.logger.log(' subs callback for signalReceiveHidePulse: ', this._subKeySigReceiveHidePulse, ' recSig is null');
// 			// }

// 		});
// 	}
// 	public get receiveStateHidePulse(): string {
// 		return this._ch5Properties.get<string>('receiveStateHidePulse');
// 	}

// 	public set sendEventOnShow(value: string) {
// 		this._ch5Properties.set("sendEventOnShow", value, null, () => {
// 			// this.handleSendEventOnShow();
// 		});
// 	}
// 	public get sendEventOnShow(): string {
// 		return this._ch5Properties.get<string>('sendEventOnShow');
// 	}

// 	public set show(value: boolean) {
// 		this._ch5Properties.set<boolean>("show", value, () => {
// 			this.updateForChangeInShowStatus();
// 		});
// 	}
// 	public get show(): boolean {
// 		return this._ch5Properties.get<boolean>("show");
// 	}

// 	public set noshowType(value: TCh5ShowType) {
// 		this._ch5Properties.set<TCh5ShowType>("noshowType", value, () => {
// 			this.updateForChangeInShowStatus();
// 		});
// 	}
// 	public get noshowType(): TCh5ShowType {
// 		return this._ch5Properties.get<TCh5ShowType>("noshowType");
// 	}

// 	public set debug(value: boolean) {
// 		this._ch5Properties.set<boolean>("debug", value, () => {
// 			this.logger.isDebugEnabled = this.debug;
// 		});
// 	}
// 	public get debug(): boolean {
// 		return this._ch5Properties.get<boolean>("debug");
// 	}

// 	public set trace(value: boolean) {
// 		this._ch5Properties.set<boolean>("trace", value, () => {
// 			this.logger.isTraceEnabled = this.trace;
// 		});
// 	}
// 	public get trace(): boolean {
// 		return this._ch5Properties.get<boolean>("trace");
// 	}

// 	// public set sigNameSendOnShow(value: string) {
// 	// 	this.logger.log('set sigNameSendOnShow(\'' + value + '\')');
// 	// 	value = this._checkAndSetStringValue(value);
// 	// 	if ('' === value || value === this._sigNameSendOnShow) {
// 	// 		return;
// 	// 	}

// 	// 	this._sigNameSendOnShow = value;
// 	// 	this.setAttribute('sendeventonshow', value);

// 	// 	this._sigSendOnShow = Ch5SignalFactory.getInstance().getBooleanSignal(this._sigNameSendOnShow);

// 	// }

// 	public set onpress(callback: {}) {
// 		this._onpress = callback;
// 	}
// 	public get onpress(): {} {
// 		return this._onpress;
// 	}

// 	public set onrelease(callback: {}) {
// 		this._onrelease = callback;
// 	}
// 	public get onrelease(): {} {
// 		return this._onrelease;
// 	}

// 	protected get util() {
// 		return util;
// 	}
// 	//#endregion

// 	//#region Lifecycle Hooks

// 	public constructor(componentInputProperties: ICh5PropertySettings[]) {
// 		super();

// 		this.componentProperties = componentInputProperties;
// 		Ch5Base.COMPONENT_PROPERTIES = componentInputProperties;
// 		this._crId = Ch5Uid.getUid();
// 		// pick from attribute to start with
// 		this.logger = new Ch5BaseLog(this.COMPONENT_NAME, true, false, this._crId);
// 		this._ch5Properties = new Ch5Properties(this, this.componentProperties);

// 		this.logger.start('constructor()');
// 		// console.log( "!this._isInstantiated",!this._isInstantiated);
// 		// if (!this._isInstantiated) {
// 		// 	this.createInternalHtml();
// 		// }
// 		// this._isInstantiated = true;
// 	}

// 	/**
// 	 * Called when the Ch5QrCode component is first connected to the DOM
// 	 */
// 	public connectedCallback() {
// 		// this.logger.start('connectedCallback()');
// 		// // WAI-ARIA Attributes
// 		// if (!this.hasAttribute('role')) {
// 		// 	this.setAttribute('role', Ch5RoleAttributeMapping.ch5QrCode);
// 		// }
// 		// // if (this._elContainer.parentElement !== this) {
// 		// // 	this._elContainer.classList.add('ch5-qrcode');
// 		// // 	this.appendChild(this._elContainer);
// 		// // }
// 		// this.initAttributes();
// 		// this.initCommonMutationObserver(this);

// 		// // customElements.whenDefined(Ch5Base.ELEMENT_NAME).then(() => {
// 		// // 	this.componentLoadedEvent(Ch5Base.ELEMENT_NAME, this.id);
// 		// // });
// 		// this.logger.stop();
// 	}

// 	public disconnectedCallback() {
// 		this.logger.start('disconnectedCallback()');
// 		this.unsubscribeFromSignals();
// 		this.logger.stop();
// 	}

// 	//#endregion

// 	//#region Other Methods

// 	/**
// 	 * Returns the internal ch5 unique identifier assigned to the component
// 	 */
// 	public getCrId(): string {
// 		return this._crId;
// 	}

// 	public static get observedAttributes(): string[] {
// 		const inheritedObsAttrs: ICh5PropertySettings[] = Ch5Base.COMPONENT_PROPERTIES;
// 		const newObsAttrs: string[] = [];
// 		for (let i: number = 0; i < inheritedObsAttrs.length; i++) {
// 			if (inheritedObsAttrs[i].isObservableProperty === true) {
// 				newObsAttrs.push(inheritedObsAttrs[i].name.toLowerCase());
// 			}
// 		}
// 		return newObsAttrs;
// 	}

// 	public attributeChangedCallback(attr: string, oldValue: string, newValue: string): void {
// 		this.logger.log('attributeChangedCallback("' + attr + '","' + oldValue + '","' + newValue + '")');
// 		if (oldValue !== newValue) {
// 			const attributeChangedProperty = Ch5Base.COMPONENT_PROPERTIES.find((property: ICh5PropertySettings) => { return property.name.toLowerCase() === attr.toLowerCase() && property.isObservableProperty === true });
// 			if (attributeChangedProperty) {
// 				const thisRef: any = this;
// 				const key = attributeChangedProperty.name;
// 				thisRef[key] = newValue;
// 			}
// 		}
// 		this.logger.stop();
// 	}

// 	protected updateForChangeInShowStatus() {
// 		this.logger.log("updateForChangeInShowStatus()");
// 		const targetElement: HTMLElement = this;

// 		if (this.hasAttribute('noshowtype')) {
// 			this.noshowType = this.getAttribute('noshowtype') as TCh5ShowType;
// 		} else {
// 			this.noshowType = 'display';
// 		}

// 		if (false === this.show) {
// 			this.handleHide(targetElement);
// 		} else {
// 			this.handleShow(targetElement);
// 		}
// 	}

// 	protected handleHide(targetElement: HTMLElement) {
// 		this.beforeHandlingHide();
// 		this.logger.log('handleHide');
// 		this.sendShowSignal(false);

// 		switch (this.noshowType) {
// 			case 'visibility':
// 				targetElement.classList.add(this.CSS_CLASS_FOR_HIDE_VISIBILITY);
// 				targetElement.classList.remove(this.CSS_CLASS_FOR_HIDE_DISPLAY);
// 				break;
// 			case 'display':
// 				targetElement.classList.add(this.CSS_CLASS_FOR_HIDE_DISPLAY);
// 				targetElement.classList.remove(this.CSS_CLASS_FOR_HIDE_VISIBILITY);
// 				break;
// 			case 'remove':
// 				targetElement.classList.remove(this.CSS_CLASS_FOR_HIDE_DISPLAY);
// 				targetElement.classList.remove(this.CSS_CLASS_FOR_HIDE_VISIBILITY);
// 				if (null !== this.parentElement && undefined !== this.parentElement) {
// 					this._cachedParentEl = this.parentElement;
// 					this.logger.log('removes element from DOM due to change in show signal, cached parent element')
// 					if (null !== this.nextElementSibling && undefined !== this.nextElementSibling) {
// 						this._nextSiblingIndexInParentChildNodes = (Array.from(this.parentElement.childNodes)).findIndex(item => item === this.nextElementSibling)
// 						this._cachedNextSibling = this.nextElementSibling;
// 						this.logger.log(' cached sibling element')
// 					}
// 					this._keepListeningOnSignalsAfterRemoval = true;
// 					this._isDetachedFromDom = true;
// 					this.parentElement.removeChild(this);
// 				}
// 				break;
// 		}
// 		this.afterHandlingHide();
// 	}

// 	protected handleShow(targetElement: HTMLElement) {
// 		this.beforeHandlingShow();
// 		this.logger.log('handleShow');
// 		targetElement.classList.remove(this.CSS_CLASS_FOR_HIDE_DISPLAY);
// 		targetElement.classList.remove(this.CSS_CLASS_FOR_HIDE_VISIBILITY);

// 		if (null !== this._cachedParentEl && typeof this._cachedParentEl !== 'undefined') {
// 			const cp = this._cachedParentEl;
// 			this._cachedParentEl = null;

// 			if (null !== this._cachedNextSibling
// 				&& typeof this._cachedNextSibling !== 'undefined'
// 				&& cp === this._cachedNextSibling.parentElement) {
// 				const cs = this._cachedNextSibling;
// 				this._cachedNextSibling = null;
// 				cp.insertBefore(this, cs);
// 				this.logger.log(' inserted element before cached sibling due to change in show signal')
// 				this._keepListeningOnSignalsAfterRemoval = false;

// 			} else {
// 				if (this._nextSiblingIndexInParentChildNodes) {
// 					const cs = cp.childNodes[this._nextSiblingIndexInParentChildNodes];
// 					cp.insertBefore(this, cs);
// 				} else {
// 					cp.appendChild(this);
// 				}
// 				this.logger.log(' appended element to parent due to change in show signal')
// 				this._keepListeningOnSignalsAfterRemoval = false;
// 			}
// 			this._isDetachedFromDom = false;
// 		}

// 		this.sendShowSignal(true);
// 		this.afterHandlingShow();
// 	}

// 	public updateElementVisibility(visible: boolean) {
// 		this.elementIsVisible = visible;
// 	}

// 	/**
// 	 * Placeholder method. If needed can be overridden in child classes
// 	 */
// 	protected beforeHandlingShow() {
// 		// this.logger.log('common - beforeHandlingShow()');
// 		return;
// 	}

// 	/**
// 	 * Placeholder method. If needed can be overridden in child classes
// 	 */
// 	protected afterHandlingShow() {
// 		// this.logger.log('common - afterHandlingShow()');
// 		return;
// 	}

// 	/**
// 	 * Placeholder method. If needed can be overridden in child classes
// 	 */
// 	protected beforeHandlingHide() {
// 		// this.logger.log('common - beforeHandlingHide()');
// 		return;
// 	}

// 	/**
// 	 * Placeholder method. If needed can be overridden in child classes
// 	 */
// 	protected afterHandlingHide() {
// 		// this.logger.log('common - afterHandlingHide()');
// 		return;
// 	}

// 	/**
// 	 * Initializes the values of the common attributes, taking into account the attribute values declared in the HTML
// 	 */
// 	protected initAttributes() {
// 		this.applyPreConfiguredAttributes();

// 		const thisRef: any = this;
// 		for (let i: number = 0; i < this.componentProperties.length; i++) {
// 			if (this.componentProperties[i].isObservableProperty === true) {
// 				if (this.hasAttribute(this.componentProperties[i].name.toLowerCase())) {
// 					const key = this.componentProperties[i].name;
// 					thisRef[key] = this.getAttribute(key);
// 				}
// 			}
// 		}
// 		// if (this.hasAttribute('disabled') && !this.hasAttribute('customclassdisabled') && this.ignoreAttributes.includes('disabled') === false) {
// 		// 	this.disabled = this.getAttribute('disabled') as unknown as boolean;
// 		// }
// 		// if (this.hasAttribute('show') && this.ignoreAttributes.includes('show') === false) {
// 		// 	this.show = this.getAttribute('show') as unknown as boolean;
// 		// }

// 	}

// 	public static getSignalElementAttributeRegistryEntries(customComponentProperties: ICh5PropertySettings[]): Ch5SignalElementAttributeRegistryEntries {
// 		const signalAttributeTypes: Ch5SignalElementAttributeRegistryEntries = {};
// 		for (let i = 0; i < customComponentProperties.length; i++) {
// 			if (customComponentProperties[i].isSignal === true) {
// 				const inputObject: any = {};

// 				if (customComponentProperties[i].name.toLowerCase().startsWith("receive")) {
// 					inputObject.direction = "state";
// 				} else if (customComponentProperties[i].name.toLowerCase().startsWith("send")) {
// 					inputObject.direction = "event";
// 				}
// 				inputObject.contractName = true;
// 				if (customComponentProperties[i].signalType === "string") {
// 					inputObject.stringJoin = 1;
// 				} else if (customComponentProperties[i].signalType === "boolean") {
// 					inputObject.booleanJoin = 1;
// 				} else if (customComponentProperties[i].signalType === "number") {
// 					inputObject.numericJoin = 1;
// 				}
// 				signalAttributeTypes[customComponentProperties[i].name.toLowerCase()] = inputObject;
// 			}
// 		}
// 		return signalAttributeTypes;
// 	}

// 	protected sendShowSignal(value: boolean) {
// 		this.logger.log('sendEventOnShow ' + value + ' ' + this.sendEventOnShow);
// 		if ('' !== this.sendEventOnShow) {
// 			const sig = Ch5SignalFactory.getInstance().getBooleanSignal(this.sendEventOnShow);
// 			if (null !== sig) {
// 				sig.publish(value);
// 			}
// 		}
// 	}

// 	// Applies pre-configured attributes to the current element if those attributes are not already present
// 	protected applyPreConfiguredAttributes(): void {
// 		const preConfiguredAttributes = Ch5Config.getAttributesForElement(this);
// 		for (const attrName in preConfiguredAttributes) {
// 			if (preConfiguredAttributes.hasOwnProperty(attrName)) {
// 				if (!this.hasAttribute(attrName)) {
// 					this.setAttribute(attrName, preConfiguredAttributes[attrName]);
// 				}
// 			}
// 		}
// 	}

// 	/**
// 	 * Clean the component content
// 	 * To avoid items duplication when a component is cloned
// 	 *
// 	 * @return {void}
// 	 */
// 	protected contentCleanUp(): void {
// 		if (this.children.length) {
// 			const children = Array.from(this.children);
// 			children.forEach(item => item.nodeName !== 'TEMPLATE' && item.remove());
// 		}
// 	}

// 	protected unsubscribeFromSignals() {
// 		if (false === this._keepListeningOnSignalsAfterRemoval) {
// 			// this.clearBooleanSignalSubscription(this._receiveStateEnable, this._subKeySigReceiveEnable);
// 			// this._receiveStateEnable = '';
// 			// this.clearBooleanSignalSubscription(this._receiveStateShow, this._subKeySigReceiveShow);
// 			// this._receiveStateShow = '';
// 			// this.clearBooleanSignalSubscription(this._receiveStateShowPulse, this._subKeySigReceiveShowPulse);
// 			// this._receiveStateShowPulse = '';
// 			// this.clearBooleanSignalSubscription(this._receiveStateHidePulse, this._subKeySigReceiveHidePulse);
// 			// this._receiveStateHidePulse = '';
// 			// this.clearStringSignalSubscription(this._receiveStateCustomStyle, this._subKeySigReceiveCustomStyle);
// 			// this._receiveStateCustomStyle = '';
// 			// this.clearStringSignalSubscription(this._receiveStateCustomClass, this._subKeySigReceiveCustomClass);
// 			// this._receiveStateCustomClass = '';
// 		}
// 		this._ch5Properties.unsubscribe();
// 	}

// 	protected componentLoadedEvent(elementName: string, idValue: string) {
// 		publishEvent('object', elementName, { loaded: true, id: idValue });
// 		// publishEvent('object', `ch5-list:${this.id}`, { loaded: true, id: this.id });
// 	}

// 	/**
// 	 * Initialize common mutation observer used in each component for checking component visibility
// 	 *
// 	 * @param element
// 	 */
// 	public initCommonMutationObserver(element: Ch5Base) {
// 		this._commonMutationObserver = new Ch5MutationObserver(this);
// 		this._commonMutationObserver.isConnected = true;

// 		let target = element as HTMLElement;
// 		while (Ch5MutationObserver.checkElementValidity(target)) {
// 			this._commonMutationObserver.observe(target);
// 			target = target.parentNode as HTMLElement;
// 		}
// 	}

// 	public disconnectCommonMutationObserver() {
// 		if (isNotNil(this._commonMutationObserver) && !isEmpty(this._commonMutationObserver)) {
// 			this._commonMutationObserver.disconnectObserver();
// 		}
// 	}

// 	//#endregion

// }

