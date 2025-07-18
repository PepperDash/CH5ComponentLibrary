// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

import { Ch5Common } from "../ch5-common/ch5-common";
import { Ch5CommonInput } from "../ch5-common-input";
import { Ch5Signal, Ch5SignalFactory } from "../ch5-core";
import { target, Options, create, API } from "nouislider";
import { Ch5PressableSlider } from "../ch5-common/ch5-pressable-slider";
import HtmlCallback from "../ch5-common/utils/html-callback";
import { Ch5RoleAttributeMapping } from "../utility-models";
import { TCh5SliderHandleShape, TCh5SliderOrientation, TCh5SliderSize, TCh5SliderHandleSize, TCh5SliderStretch, TCh5SliderToolTipShowType, TCh5SliderToolTipDisplayType, TCh5SliderHandle, } from './interfaces/t-ch5-slider';
import _ from "lodash";
import { Ch5SignalAttributeRegistry, Ch5SignalElementAttributeRegistryEntries } from '../ch5-common/ch5-signal-attribute-registry';
import { Ch5Properties } from "../ch5-core/ch5-properties";
import { ICh5PropertySettings } from "../ch5-core/ch5-property";
import { Ch5SliderTitleLabel } from "./ch5-slider-title-label";
import { ICh5SliderAttributes } from "./interfaces";
import { Subscription } from "rxjs";
import { resizeObserver } from "../ch5-core/resize-observer";

export interface IRcbSignal {
	rcb: {
		time: number,
		value: number,
		startt?: number,
		startv?: number
	};
}

export interface IRcbUpdateValue {
	oldValue?: number;
	newValue: number;
}

export class Ch5Slider extends Ch5CommonInput implements ICh5SliderAttributes {

	//#region "Variables"

	public static ELEMENT_NAME: string = 'ch5-slider';

	public static readonly SIGNAL_ATTRIBUTE_TYPES: Ch5SignalElementAttributeRegistryEntries = {
		...Ch5Common.SIGNAL_ATTRIBUTE_TYPES,
		sendeventonchange: { direction: "event", numericJoin: 1, contractName: true },
		sendeventonchangehigh: { direction: "event", numericJoin: 1, contractName: true },
		receivestatevalue: { direction: "state", numericJoin: 1, contractName: true },
		receivestatevaluehigh: { direction: "state", numericJoin: 1, contractName: true },
		receivestateshowonoffonly: { direction: "state", booleanJoin: 1, contractName: true },
		sendeventonupper: { direction: "event", booleanJoin: 1, contractName: true },
		receivestateupper: { direction: "state", booleanJoin: 1, contractName: true },
		sendeventonlower: { direction: "event", booleanJoin: 1, contractName: true },
		receivestatelower: { direction: "state", booleanJoin: 1, contractName: true },
		sendeventonhandleclick: { direction: "event", booleanJoin: 1, contractName: true }
	};

	public static readonly MIN_VALUE: number = 0;
	public static readonly MAX_VALUE: number = 65535;
	public static readonly DEFAULT_STEP: number = 1;

	public static readonly HANDLE_SHAPE: TCh5SliderHandleShape[] = ['rounded-rectangle', 'rectangle', 'circle', 'oval'];
	public static readonly ORIENTATION: TCh5SliderOrientation[] = ['horizontal', 'vertical'];
	public static readonly SIZE: TCh5SliderSize[] = ['regular', 'x-small', 'small', 'large', 'x-large'];
	public static readonly HANDLE_SIZE: TCh5SliderHandleSize[] = ['regular', 'x-small', 'small', 'large', 'x-large'];
	public static readonly STRETCH: TCh5SliderStretch[] = ['both', 'height', 'width'];
	public static readonly TOOL_TIP_SHOW_TYPE: TCh5SliderToolTipShowType[] = ['off', 'on', 'auto'];
	public static readonly TOOL_TIP_DISPLAY_TYPE: TCh5SliderToolTipDisplayType[] = ['%', 'value'];

	public static readonly COMPONENT_DATA: any = {
		HANDLE_SHAPE: {
			default: Ch5Slider.HANDLE_SHAPE[0],
			values: Ch5Slider.HANDLE_SHAPE,
			key: 'handleShape',
			attribute: 'handleShape',
			classListPrefix: '--shape--'
		},
		ORIENTATION: {
			default: Ch5Slider.ORIENTATION[0],
			values: Ch5Slider.ORIENTATION,
			key: 'orientation',
			attribute: 'orientation',
			classListPrefix: '--orientation--'
		},
		SIZE: {
			default: Ch5Slider.SIZE[0],
			values: Ch5Slider.SIZE,
			key: 'size',
			attribute: 'size',
			classListPrefix: '--size--'
		},
		HANDLE_SIZE: {
			default: Ch5Slider.HANDLE_SIZE[0],
			values: Ch5Slider.HANDLE_SIZE,
			key: 'handleSize',
			attribute: 'handleSize',
			classListPrefix: '--handle-size--'
		},
		STRETCH: {
			default: Ch5Slider.STRETCH[0],
			values: Ch5Slider.STRETCH,
			key: 'stretch',
			attribute: 'stretch',
			classListPrefix: '--stretch--'
		},
		TOOL_TIP_SHOW_TYPE: {
			default: Ch5Slider.TOOL_TIP_SHOW_TYPE[0],
			values: Ch5Slider.TOOL_TIP_SHOW_TYPE,
			key: 'toolTipShowType',
			attribute: 'toolTipShowType',
			classListPrefix: '--tooltip--'
		},
		TOOL_TIP_DISPLAY_TYPE: {
			default: Ch5Slider.TOOL_TIP_DISPLAY_TYPE[0],
			values: Ch5Slider.TOOL_TIP_DISPLAY_TYPE,
			key: 'toolTipDisplayType',
			attribute: 'toolTipDisplayType',
			classListPrefix: '--tooltip-display-type-'
		},
		ON_OFF_ONLY: {
			default: false,
			values: [true, false],
			key: 'onOffOnly',
			attribute: 'onOffOnly',
			classListPrefix: '--on-off-only-'
		}
	};

	public static readonly COMPONENT_PROPERTIES: ICh5PropertySettings[] = [
		{
			default: 0,
			name: "min",
			removeAttributeOnNull: true,
			type: "number",
			valueOnAttributeEmpty: 0,
			numberProperties: {
				min: -65535,
				max: 65534,
				conditionalMin: -65535,
				conditionalMax: 65534,
				conditionalMinValue: -65535,
				conditionalMaxValue: 65534
			},
			isObservableProperty: true
		},
		{
			default: 65535,
			name: "max",
			removeAttributeOnNull: true,
			type: "number",
			valueOnAttributeEmpty: 65535,
			numberProperties: {
				min: -65534,
				max: 65535,
				conditionalMin: -65534,
				conditionalMax: 65535,
				conditionalMinValue: -65534,
				conditionalMaxValue: 65535
			},
			isObservableProperty: true
		},
		{
			default: "",
			name: "ticks",
			removeAttributeOnNull: true,
			type: "string",
			valueOnAttributeEmpty: "",
			isObservableProperty: true,
		},
		{
			default: Ch5Slider.HANDLE_SHAPE[0],
			enumeratedValues: Ch5Slider.HANDLE_SHAPE,
			name: "handleShape",
			removeAttributeOnNull: true,
			type: "enum",
			valueOnAttributeEmpty: Ch5Slider.HANDLE_SHAPE[0],
			isObservableProperty: true
		},
		{
			default: false,
			name: "range",
			removeAttributeOnNull: true,
			type: "boolean",
			valueOnAttributeEmpty: true,
			isObservableProperty: true
		},
		{
			default: Ch5Slider.ORIENTATION[0],
			enumeratedValues: Ch5Slider.ORIENTATION,
			name: "orientation",
			removeAttributeOnNull: true,
			type: "enum",
			valueOnAttributeEmpty: Ch5Slider.ORIENTATION[0],
			isObservableProperty: true

		},
		{
			default: Ch5Slider.SIZE[0],
			enumeratedValues: Ch5Slider.SIZE,
			name: "size",
			removeAttributeOnNull: true,
			type: "enum",
			valueOnAttributeEmpty: Ch5Slider.SIZE[0],
			isObservableProperty: true
		},
		{
			default: Ch5Slider.HANDLE_SIZE[0],
			enumeratedValues: Ch5Slider.HANDLE_SIZE,
			name: "handleSize",
			removeAttributeOnNull: true,
			type: "enum",
			valueOnAttributeEmpty: Ch5Slider.HANDLE_SIZE[0],
			isObservableProperty: true
		},
		{
			default: "",
			enumeratedValues: Ch5Slider.STRETCH,
			name: "stretch",
			removeAttributeOnNull: true,
			type: "enum",
			valueOnAttributeEmpty: Ch5Slider.STRETCH[0],
			isObservableProperty: true
		},
		{
			default: false,
			name: "noHandle",
			removeAttributeOnNull: true,
			type: "boolean",
			valueOnAttributeEmpty: true,
			isObservableProperty: true
		},
		{
			default: 1,
			name: "step",
			removeAttributeOnNull: true,
			type: "number",
			valueOnAttributeEmpty: null,
			numberProperties: {
				min: 1,
				max: 65535,
				conditionalMin: 1,
				conditionalMax: 65535,
				conditionalMinValue: 1,
				conditionalMaxValue: 65535
			},
			isObservableProperty: true
		},
		{
			default: false,
			name: "showTickValues",
			removeAttributeOnNull: true,
			type: "boolean",
			valueOnAttributeEmpty: false,
			isObservableProperty: true
		},
		{
			default: Ch5Slider.TOOL_TIP_SHOW_TYPE[0],
			enumeratedValues: Ch5Slider.TOOL_TIP_SHOW_TYPE,
			name: "toolTipShowType",
			removeAttributeOnNull: true,
			type: "enum",
			valueOnAttributeEmpty: Ch5Slider.TOOL_TIP_SHOW_TYPE[0],
			isObservableProperty: true
		},
		{
			default: Ch5Slider.TOOL_TIP_DISPLAY_TYPE[0],
			enumeratedValues: Ch5Slider.TOOL_TIP_DISPLAY_TYPE,
			name: "toolTipDisplayType",
			removeAttributeOnNull: true,
			type: "enum",
			valueOnAttributeEmpty: Ch5Slider.TOOL_TIP_DISPLAY_TYPE[0],
			isObservableProperty: true
		},
		{
			default: false,
			name: "tapSettable",
			removeAttributeOnNull: true,
			type: "boolean",
			valueOnAttributeEmpty: true,
			isObservableProperty: true
		},
		{
			default: "",
			isSignal: true,
			name: "receiveStateValue",
			signalType: "object",
			removeAttributeOnNull: true,
			type: "string",
			valueOnAttributeEmpty: "",
			isObservableProperty: true
		},
		{
			default: "",
			isSignal: true,
			name: "receiveStateValueHigh",
			signalType: "object",
			removeAttributeOnNull: true,
			type: "string",
			valueOnAttributeEmpty: "",
			isObservableProperty: true
		},
		{
			default: 0,
			name: "value",
			nameForSignal: "receiveStateValue",
			removeAttributeOnNull: true,
			type: "number",
			valueOnAttributeEmpty: null,
			numberProperties: {
				min: -65535,
				max: 65535,
				conditionalMin: -65535,
				conditionalMax: 65535,
				conditionalMinValue: -65535,
				conditionalMaxValue: 65535
			},
			isObservableProperty: true
		},
		{
			default: 65535,
			name: "valueHigh",
			nameForSignal: "receiveStateValueHigh",
			removeAttributeOnNull: true,
			type: "number",
			valueOnAttributeEmpty: null,
			numberProperties: {
				min: -65534,
				max: 65535,
				conditionalMin: -65534,
				conditionalMax: 65535,
				conditionalMinValue: -65534,
				conditionalMaxValue: 65535
			},
			isObservableProperty: true
		},
		{
			default: false,
			name: "onOffOnly",
			nameForSignal: "receiveStateShowOnOffOnly",
			removeAttributeOnNull: true,
			type: "boolean",
			valueOnAttributeEmpty: false,
			isObservableProperty: true
		},
		{
			default: "",
			isSignal: true,
			name: "receiveStateShowOnOffOnly",
			signalType: "boolean",
			removeAttributeOnNull: true,
			type: "string",
			valueOnAttributeEmpty: "",
			isObservableProperty: true
		},
		{
			default: "",
			isSignal: true,
			name: "sendEventOnUpper",
			signalType: "boolean",
			removeAttributeOnNull: true,
			type: "string",
			valueOnAttributeEmpty: "",
			isObservableProperty: true
		},
		{
			default: "",
			isSignal: true,
			name: "sendEventOnLower",
			signalType: "boolean",
			removeAttributeOnNull: true,
			type: "string",
			valueOnAttributeEmpty: "",
			isObservableProperty: true
		},
		{
			default: "",
			isSignal: true,
			name: "sendEventOnChange",
			signalType: "number",
			removeAttributeOnNull: true,
			type: "string",
			valueOnAttributeEmpty: "",
			isObservableProperty: true
		},
		{
			default: "",
			isSignal: true,
			name: "sendEventOnChangeHigh",
			signalType: "number",
			removeAttributeOnNull: true,
			type: "string",
			valueOnAttributeEmpty: "",
			isObservableProperty: true
		},
		{
			default: "",
			isSignal: true,
			name: "sendEventOnHandleClick",
			signalType: "boolean",
			removeAttributeOnNull: true,
			type: "string",
			valueOnAttributeEmpty: "",
			isObservableProperty: true
		}
	];

	public static readonly OFFSET_THRESHOLD: number = 30;

	private _render = this.debounce(() => {
		this.createSlider();
	}, 25);

	private _ch5Properties: Ch5Properties;
	private isAdvancedSlider: boolean = false;

	/**
	 * Component internal HTML elements
	 */
	private _elContainer: HTMLElement = {} as HTMLElement;
	private _elTitleContainer: HTMLElement = {} as HTMLElement;
	private _elSliderContainer: HTMLElement = {} as HTMLElement;
	private _elOnContainer: HTMLElement = {} as HTMLElement;
	private _elOffContainer: HTMLElement = {} as HTMLElement;
	private _innerContainer: HTMLElement = {} as HTMLElement;
	private _tgtEls: NodeListOf<HTMLElement>[] = [];
	private _tooltip: NodeListOf<HTMLElement> = {} as NodeListOf<HTMLElement>;
	private _titlePresent: number = -1;
	private _userLowValue: number = -1;
	private _userHighValue: number = -1;

	private isResizeInProgress: boolean = false;
	private readonly RESIZE_DEBOUNCE: number = 500;

	public primaryCssClass = 'ch5-slider';

	/**
	 * Reflects render state
	 * Used to avoid calling _render() multiple times in setter methods
	 */
	private _wasRendered: boolean = false;

	private isSliderStarted: boolean = false;
	private sliderTouch: any = null;
	private _isPressedSubscription: Subscription | null = null;
	private _repeatDigitalInterval: number | null = null;

	private _receiveStateValueSignal: string = '';
	private _subReceiveValueId: string = '';
	private _subReceiveAnalogValueId: string = '';

	private _receiveStateValueSignalHigh: string = '';
	private _subReceiveValueHighId: string = '';
	private _subReceiveAnalogValueHighId: string = '';

	/**
	 * COMPONENT EVENTS
	 *
	 * slider - custom event.
	 * slidestart - custom event
	 * slideend - custom event
	 * focus - custom
	 * blur - custom
	 * change - custom
	 * dirty - custom
	 * press - custom
	 * release - custom
	 */

	/**
	 * Ch5PressableSlider manager
	 *
	 * @private
	 * @type {(Ch5PressableSlider | null)}
	 * @memberof Ch5Image
	 */
	private _pressable: Ch5PressableSlider | null = null;


	/**
	 * This event is useful when you specifically want to listen to a handle being dragged, but want to ignore other updates to the slider value.
	 * This event also fires on a change by a 'tap'. In most cases, the 'update' is the better choice.
	 *
	 * @type {Event}
	 */
	public sliderEvent: Event = {} as Event;

	/**
	 * This event fires when a handle is clicked (mousedown, or the equivalent touch events).
	 *
	 * @type {Event}
	 */
	public sliderStartEvent: Event = {} as Event;

	/**
	 * This event is the opposite of the 'start' event.
	 * If fires when a handle is released (mouseup etc), or when a slide is canceled due to other reasons (such as mouse cursor leaving the browser window).
	 *
	 * @type {Event}
	 */
	public sliderEndEvent: Event = {} as Event;

	/**
	 * If fires when a handle is focus
	 *
	 * @type {Event}
	 */
	public focusEvent: Event = {} as Event;

	/**
	 * If fires when a handle loses focus
	 *
	 * @type {Event}
	 */
	public blurEvent: Event = {} as Event;

	/**
	 * Event change: Fires when the component's value changes due to user interaction.
	 *
	 * @type {Event}
	 */
	public changeEvent: Event = {} as Event;

	/**
	 * Event dirty: Fires when the component is on feedbackMode='submit' and displayed value is different than the actual value
	 * @type {Event}
	 */
	public dirtyEvent: Event = {} as Event;

	/**
	 * Event dirty: Fires when the component is on feedbackMode='submit' and displayed value is the actual value
	 * @type {Event}
	 */
	public cleanEvent: Event = {} as Event;

	/**
	 * This property stores the valueHigh which comes from signal or initial valueHigh
	 *
	 * @type {string | number}
	 * @protected
	 */
	protected _cleanValueHigh: (string | number) = '' as (string | number);

	/**
	 * Contains the changed valueHigh
	 *
	 * @type {string | number}
	 * @protected
	 */
	protected _dirtyValueHigh: (string | number) = '' as (string | number);

	/**
	 * Defines the timeout between the user change the high handle(second handle) and the time the slider will check if the value is equal with the value from the signal
	 * @protected
	 * @type {(number|null)}
	 */
	protected _dirtyTimerHandleHigh: number | null = null;

	protected _cleanLow: boolean = true;
	protected _dirtyLow: boolean = false;
	protected _cleanHigh: boolean = true;
	protected _dirtyHigh: boolean = false;

	/**
	 * rcb properties
	 */
	private _animationTimer: number | undefined = undefined;
	private _tooltipValueFromSignal: number | undefined = undefined;
	private _tooltipHighValueFromSignal: number | undefined = undefined;
	private _rcbSignalValue: IRcbSignal | undefined = undefined;
	private _rcbSignalValueHigh: IRcbSignal | undefined = undefined;
	private _animatingHandle = {
		0: false,
		1: false
	};

	//#endregion

	//#region "Attribute Getters and Setters"

	public set range(value: boolean) {
		this._ch5Properties.set<boolean>("range", value, () => {
			this._render();
		});
	}
	public get range(): boolean {
		return this._ch5Properties.get<boolean>("range");
	}

	public set showTickValues(value: boolean) {
		this._ch5Properties.set<boolean>("showTickValues", value, () => {
			this._render();
		});
	}
	public get showTickValues(): boolean {
		return this._ch5Properties.get<boolean>("showTickValues");
	}

	public set tapSettable(value: boolean) {
		this._ch5Properties.set<boolean>("tapSettable", value, () => {
			this._render();
		});
	}
	public get tapSettable(): boolean {
		return this._ch5Properties.get<boolean>("tapSettable");
	}
	public set handleShape(value: TCh5SliderHandleShape) {
		this._ch5Properties.set<TCh5SliderHandleShape>("handleShape", value, () => {
			this.handleHandleShape();
		});
	}
	public get handleShape(): TCh5SliderHandleShape {
		return this._ch5Properties.get<TCh5SliderHandleShape>("handleShape");
	}

	public set value(value: number) {
		this._ch5Properties.set<number>("value", value, () => {
			this.handleValue();
			this.setCleanValue(this.value);
		});
	}
	public get value(): number {
		return this._ch5Properties.get<number>("value");
	}

	public get valueHigh(): number {
		return this._ch5Properties.get<number>("valueHigh");
	}
	public set valueHigh(value: number) {
		this._ch5Properties.set<number>("valueHigh", value, () => {
			this.handleValueHigh();
			this._cleanValueHigh = this.valueHigh;
		});
	}

	public set noHandle(value: boolean) {
		this._ch5Properties.set<boolean>("noHandle", value, () => {
			this.handleTapSettable();
		});
	}
	public get noHandle(): boolean {
		return this._ch5Properties.get<boolean>("noHandle");
	}

	public get max(): number {
		return this._ch5Properties.get<number>("max");
	}
	public set max(value: number) {
		this._ch5Properties.set<number>("max", value, () => {
			this.handleMax();
		});
	}
	public get min(): number {
		return this._ch5Properties.get<number>("min");
	}
	public set min(value: number) {
		this._ch5Properties.set<number>("min", value, () => {
			this.handleMin();
		});
	}

	public set orientation(value: TCh5SliderOrientation) {
		this._ch5Properties.set<TCh5SliderOrientation>("orientation", value, () => {
			this.handleOrientation();
		});
	}
	public get orientation(): TCh5SliderOrientation {
		return this._ch5Properties.get<TCh5SliderOrientation>("orientation");
	}

	public set size(value: TCh5SliderSize) {
		this._ch5Properties.set<TCh5SliderSize>("size", value, () => {
			this.sizeHandler();
		});
	}
	public get size(): TCh5SliderSize {
		return this._ch5Properties.get<TCh5SliderSize>("size");
	}
	public set handleSize(value: TCh5SliderHandleSize) {
		this._ch5Properties.set<TCh5SliderHandleSize>("handleSize", value, () => {
			this.handleHandleSize();
		});
	}
	public get handleSize(): TCh5SliderHandleSize {
		return this._ch5Properties.get<TCh5SliderHandleSize>("handleSize");
	}

	public set step(value: number) {
		this._ch5Properties.set<number>("step", value, () => {
			if (this.ticks) {
				this.step = 1;
			}
			this.handleMax();
		});
	}
	public get step(): number {
		return this._ch5Properties.get<number>("step");
	}

	public set stretch(value: TCh5SliderStretch) {
		this._ch5Properties.set<TCh5SliderStretch>("stretch", value, () => {
			this.handleStretch();
		});
	}
	public get stretch(): TCh5SliderStretch {
		return this._ch5Properties.get<TCh5SliderStretch>("stretch");
	}

	public set ticks(value: string) {
		this._ch5Properties.set<string>("ticks", value, () => {
			if (this.ticks) {
				this._elContainer.classList.add("ch5-slider-ticks");
			} else {
				this._elContainer.classList.remove("ch5-slider-ticks");
			}
			this._render();
		});
	}
	public get ticks(): string {
		return this._ch5Properties.get<string>("ticks");
	}

	public set toolTipShowType(value: TCh5SliderToolTipShowType) {
		this._ch5Properties.set<TCh5SliderToolTipShowType>("toolTipShowType", value, () => {
			this.handleToolTipShowType();
			// subscribe to analog value if tooltip is on
			if (this.toolTipShowType === Ch5Slider.TOOL_TIP_SHOW_TYPE[1]) {
				this.subscribeToAnalogSignal();
				this.subscribeToAnalogHighSignal();
			} else {
				this.unsubscribeFromAnalogSignals();
			}
		});
	}
	public get toolTipShowType(): TCh5SliderToolTipShowType {
		return this._ch5Properties.get<TCh5SliderToolTipShowType>("toolTipShowType");
	}

	public set toolTipDisplayType(value: TCh5SliderToolTipDisplayType) {
		this._ch5Properties.set<TCh5SliderToolTipDisplayType>("toolTipDisplayType", value, () => {
			this.handleToolTipDisplayType();
		});
	}
	public get toolTipDisplayType(): TCh5SliderToolTipDisplayType {
		return this._ch5Properties.get<TCh5SliderToolTipDisplayType>("toolTipDisplayType");
	}

	public set sendEventOnChange(value: string) {
		this._ch5Properties.set("sendEventOnChange", value);
	}
	public get sendEventOnChange(): string {
		return this._ch5Properties.get<string>('sendEventOnChange');
	}

	public set sendEventOnChangeHigh(value: string) {
		this._ch5Properties.set("sendEventOnChangeHigh", value);
	}
	public get sendEventOnChangeHigh(): string {
		return this._ch5Properties.get<string>('sendEventOnChangeHigh');
	}

	public set sendEventOnHandleClick(value: string) {
		this._ch5Properties.set("sendEventOnHandleClick", value);
	}
	public get sendEventOnHandleClick(): string {
		return this._ch5Properties.get<string>('sendEventOnHandleClick');
	}

	public get receiveStateValue(): string {
		// The internal property is changed if/when the element is removed from DOM
		// Returning the attribute instead of the internal property preserves functionality
		return this._attributeValueAsString('receivestatevalue');
	}
	public set receiveStateValue(value: string) {
		if ('' === value
			|| this._receiveStateValueSignal === value
			|| null === value
			|| undefined === value) {
			return;
		}

		// clean up old subscription
		if (this._receiveStateValueSignal !== ''
			&& this._receiveStateValueSignal !== undefined
			&& this._receiveStateValueSignal !== null) {

			const oldSignalName: string = Ch5Signal.getSubscriptionSignalName(this._receiveStateValueSignal);
			const oldSignal: Ch5Signal<object> | null = Ch5SignalFactory.getInstance().getObjectSignal(oldSignalName);

			if (oldSignal !== null) {
				oldSignal.unsubscribe(this._subReceiveValueId);
			}
		}

		// setup new subscription.
		this._receiveStateValueSignal = value;

		const recSignalName: string = Ch5Signal.getSubscriptionSignalName(this._receiveStateValueSignal);
		const receiveSignal: Ch5Signal<object> | null = Ch5SignalFactory.getInstance().getObjectSignal(recSignalName);

		if (receiveSignal === null) {
			return;
		}

		this._subReceiveValueId = receiveSignal.subscribe((object: any) => {
			if (undefined === object ||
				!object.hasOwnProperty('rcb') ||
				!object.rcb.hasOwnProperty('value') ||
				!receiveSignal.hasChangedSinceInit()) {
				return;
			}

			const rcb = (object as IRcbSignal).rcb;
			const animationDuration = rcb.time;
			let newValue: number = rcb.value;
			if (this.min < 0 && newValue > 0x7FFF) {
				newValue -= 0x10000;
			}

			this._rcbSignalValue = {
				'rcb': {
					'value': newValue,
					'time': animationDuration,
					'startv': undefined !== rcb.startv ? rcb.startv : this.value,
					'startt': undefined !== rcb.startt ? rcb.startt : Date.now()
				}
			};

			this.setCleanValue(newValue);
			this._wasRendered = false;
			this._ch5Properties.setForSignalResponse<number>("value", newValue, () => {
				// to handleValue 
			});
			this._wasRendered = true;

			if (this._dirtyTimerHandle === null) {
				if (this._wasRendered && animationDuration === 0) {
					this._render();
					this._tooltipValueFromSignal = newValue;
					this._adjustTooltipValue(TCh5SliderHandle.VALUE);
				} else {
					this._setSliderValue(newValue, TCh5SliderHandle.VALUE, animationDuration);

				}
				// set first handle as clean
				this._setCleanLow();

				// set component state as clean
				this.setClean();
			}
		});
	}

	public get receiveStateValueHigh(): string {
		// The internal property is changed if/when the element is removed from DOM
		// Returning the attribute instead of the internal property preserves functionality
		return this._attributeValueAsString('receivestatevaluehigh');
	}
	public set receiveStateValueHigh(value: string) {
		if (Ch5Common.isNil(value) || this._receiveStateValueSignalHigh === value) {
			return;
		}

		// clean up old subscription
		if (this._receiveStateValueSignalHigh !== ''
			&& this._receiveStateValueSignalHigh !== undefined
			&& this._receiveStateValueSignalHigh !== null) {

			const oldSignalName: string = Ch5Signal.getSubscriptionSignalName(this._receiveStateValueSignalHigh);
			const oldSignal: Ch5Signal<object> | null = Ch5SignalFactory.getInstance().getObjectSignal(oldSignalName);

			if (oldSignal !== null) {
				oldSignal.unsubscribe(this._subReceiveValueHighId);
			}
		}
		// setup new subscription.
		this._receiveStateValueSignalHigh = value;
		const recSignalName: string = Ch5Signal.getSubscriptionSignalName(this._receiveStateValueSignalHigh);
		const receiveSignal: Ch5Signal<object> | null = Ch5SignalFactory.getInstance().getObjectSignal(recSignalName);

		if (receiveSignal === null) {
			return;
		}

		this._subReceiveValueHighId = receiveSignal.subscribe((object: any) => {
			if (undefined === object ||
				!object.hasOwnProperty('rcb') ||
				!object.rcb.hasOwnProperty('value') ||
				!receiveSignal.hasChangedSinceInit()) {
				return;
			}

			const rcb = (object as IRcbSignal).rcb;
			const animationDuration = rcb.time;
			let newValue: number = rcb.value;
			if (this.min < 0 && newValue > 0x7FFF) {
				newValue -= 0x10000;
			}

			this._rcbSignalValueHigh = {
				'rcb': {
					'value': newValue,
					'time': animationDuration,
					'startv': undefined !== rcb.startv ? rcb.startv : this.valueHigh,
					'startt': undefined !== rcb.startt ? rcb.startt : Date.now()
				}
			};

			this._cleanValueHigh = newValue;
			this._wasRendered = false;
			this._ch5Properties.setForSignalResponse<number>("valueHigh", newValue, () => {
				// handle highValue
			});
			this._wasRendered = true;
			if (this._dirtyTimerHandleHigh === null) {
				if (this._wasRendered && animationDuration === 0) {
					this._render();
					this._tooltipHighValueFromSignal = newValue;
					this._adjustTooltipValue(TCh5SliderHandle.HIGHVALUE);
				} else {
					this._setSliderValue(newValue, TCh5SliderHandle.HIGHVALUE, animationDuration);
				}
				// set first handle as clean
				this._setCleanHigh();

				// set component state as clean
				this.setClean();
			}
		});
	}

	public set onOffOnly(value: boolean) {
		this._ch5Properties.set<boolean>("onOffOnly", value, () => {
			this.handleOnOffOnly();
		});
	}
	public get onOffOnly(): boolean {
		return this._ch5Properties.get<boolean>("onOffOnly");
	}

	public set receiveStateShowOnOffOnly(value: string) {
		this._ch5Properties.set("receiveStateShowOnOffOnly", value, null, (newValue: boolean) => {
			this._ch5Properties.setForSignalResponse<boolean>("onOffOnly", newValue, () => {
				this.handleOnOffOnly();
			});
		});
	}
	public get receiveStateShowOnOffOnly(): string {
		return this._ch5Properties.get<string>('receiveStateShowOnOffOnly');
	}

	public set sendEventOnUpper(value: string) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		this._ch5Properties.set("sendEventOnUpper", value, null, (newValue: boolean) => {
			if (this.toolTipDisplayType === "%") {
				this.toolTipShowType = "off";
			}
		});
	}
	public get sendEventOnUpper(): string {
		return this._ch5Properties.get<string>('sendEventOnUpper');
	}

	public set sendEventOnLower(value: string) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		this._ch5Properties.set("sendEventOnLower", value, null, (newValue: boolean) => {
			if (this.toolTipDisplayType === "%") {
				this.toolTipShowType = "off";
			}
		});
	}
	public get sendEventOnLower(): string {
		return this._ch5Properties.get<string>('sendEventOnLower');
	}

	//#endregion

	//#region "Life Cycle Hooks"

	constructor() {
		super();
		this.logger.start('Ch5Slider.constructor()');
		if (!this._wasInstatiated) {
			this.createInternalHtml();
		}
		this._wasInstatiated = true;
		this._ch5Properties = new Ch5Properties(this, Ch5Slider.COMPONENT_PROPERTIES);
		this.eventBinding();
		this.logger.stop();
	}

	/**
	 * Respond to attribute changes.
	 */
	public static get observedAttributes(): string[] {
		const inheritedObsAttrs = Ch5Common.observedAttributes;
		const newObsAttrs: string[] = [];
		for (let i: number = 0; i < Ch5Slider.COMPONENT_PROPERTIES.length; i++) {
			if (Ch5Slider.COMPONENT_PROPERTIES[i].isObservableProperty === true) {
				newObsAttrs.push(Ch5Slider.COMPONENT_PROPERTIES[i].name.toLowerCase());
			}
		}
		const ch5SliderAttributes: string[] = [
			'feedbackmode',
			'signalvaluesynctimeout',
			'dir'
		];
		return inheritedObsAttrs.concat(newObsAttrs.concat(ch5SliderAttributes));
	}

	public static registerSignalAttributeTypes() {
		Ch5SignalAttributeRegistry.instance.addElementAttributeEntries(Ch5Slider.ELEMENT_NAME, Ch5Slider.SIGNAL_ATTRIBUTE_TYPES);
	}

	/**
	 * 	Called every time the element is inserted into the DOM.
	 *  Useful for running setup code, such as fetching resources or rendering.
	 */
	public connectedCallback() {
		this.logger.start('Ch5Slider.connectedCallback()');

		// WAI-ARIA Attributes
		if (!this.hasAttribute('role')) {
			this.setAttribute('role', Ch5RoleAttributeMapping.ch5Slider);
		}

		// set data-ch5-id
		this.setAttribute('data-ch5-id', this.getCrId());
		this._pressable = new Ch5PressableSlider(this._innerContainer, {
			cssTargetElement: this._innerContainer,
			cssPressedClass: this.primaryCssClass + '--pressed'
		});

		Promise.all([customElements.whenDefined('ch5-slider')]).then(() => {
			this.cacheComponentChildrens();
			const existingSliderElement = this.querySelector('.noUi-target');

			if (existingSliderElement instanceof HTMLElement) {
				existingSliderElement.remove();
			}

			if (this._elContainer.parentElement !== this) {
				this.appendChild(this._elContainer);
			}

			this.initAttributes();
			this.updateCssClasses();

			if (!this._wasRendered ||
				'undefined' === typeof (this._innerContainer as target).noUiSlider ||
				null === (this._innerContainer as target).noUiSlider) {
				this._renderPromise()
					.then(() => {
						this._wasRendered = true;
						window.setTimeout(() => {
							this._applySignalReceivedBeforeRender();
						}, 0);
					});
			}
			// attach event listeners
			this.attachEventListeners();

			this.initCommonMutationObserver(this);
			// init clean values
			this.setCleanValue(this.value);
			this._cleanValueHigh = this.valueHigh;
		});
		this.titleHelper();
		this.onOffButtonHelper();
		this.handleOnOffOnly();
		if (this._innerContainer.isConnected === false) {
			this._elSliderContainer.insertBefore(this._innerContainer as Node, this._elOnContainer as Node);
		}
		this.logger.stop();
	}
	protected eventBinding() {
		// events binding
		this._onFocus = this._onFocus.bind(this);
		this._onBlur = this._onBlur.bind(this);
		this._onSliderSlide = this._onSliderSlide.bind(this);
		this._onSliderStart = this._onSliderStart.bind(this);
		this._onSliderStop = this._onSliderStop.bind(this);
		this._onSliderChange = this._onSliderChange.bind(this);
		this._stopRcbAnimation = this._stopRcbAnimation.bind(this);
		this._onMouseLeave = this._onMouseLeave.bind(this);
		this._onTouchMoveEnd = this._onTouchMoveEnd.bind(this);
		this.sendEventOnHandleClickHandle = this.sendEventOnHandleClickHandle.bind(this);
	}

	private setCleanValue(value: string | number) {
		this._cleanValue = value;
	}

	/**
	 * Called every time the element is removed from the DOM.
	 * Useful for running clean up code.
	 */
	public disconnectedCallback() {
		this.logger.start('Ch5Slider.disconnectedCallback()');
		this.removeEvents();
		this.unsubscribeFromSignals();

		// destroy slider
		const innerContainer: any = this._innerContainer as target;
		if (!_.isNil(innerContainer) && !_.isNil(innerContainer.noUiSlider)) {
			innerContainer.noUiSlider.destroy();
		}

		// remove press events from pressable
		if (null !== this._pressable) {
			this._pressable.destroy();
		}

		// disconnect common mutation observer
		this.disconnectCommonMutationObserver();
		this.logger.stop();
	}

	/**
	 * Called when an HTML attribute is changed, added or removed
	 */
	public attributeChangedCallback(attr: string, oldValue: string, newValue: string): void {
		this.logger.start("attributeChangedCallback", this.primaryCssClass);
		if (oldValue !== newValue) {
			this.logger.log('ch5-slider attributeChangedCallback("' + attr + '","' + oldValue + '","' + newValue + '")');
			const attributeChangedProperty = Ch5Slider.COMPONENT_PROPERTIES.find((property: ICh5PropertySettings) => { return property.name.toLowerCase() === attr.toLowerCase() && property.isObservableProperty === true });
			if (attributeChangedProperty) {
				const thisRef: any = this;
				const key = attributeChangedProperty.name;
				thisRef[key] = newValue;
			} else {
				super.attributeChangedCallback(attr, oldValue, newValue);
			}
		}
		this.logger.stop();
	}

	/**
	 * Unsubscribe signals
	 */
	public unsubscribeFromSignals() {
		super.unsubscribeFromSignals();
		this.unsubscribeFromObjectSignals();
		this.unsubscribeFromAnalogSignals();
	}

	/**
	 * Clear the content of component in order to avoid duplication of elements
	 */
	private clearComponentContent() {
		const containers = this.getElementsByTagName("div");
		Array.from(containers).forEach((container) => {
			container.remove();
		});
	}

	//#endregion

	//#region "Other Methods"

	/**
	 * Returns css class when disabled
	 *
	 * @return {string}
	 */
	public getCssClassDisabled(): string {
		return this.primaryCssClass + '--disabled';
	}

	/**
	 * METHODS
	 *
	 * - submit
	 * - reset
	 * - getDirty - inherit
	 */

	/**
	 * Submit the value ( send a signal )
	 */
	public submit(): void {
		this.logger.start('Ch5Slider.submit()');

		// send signal for first handle
		if (this.feedbackMode === 'submit' && this._dirtyLow === true) {
			this._submitted = true;

			this._setDirtyHandler(TCh5SliderHandle.VALUE);
			this._sendValueForChangeSignal(this._userLowValue);
		}

		// send signal for second handle
		if (this.feedbackMode === 'submit' && this.range === true && this._dirtyHigh === true) {
			this._submitted = true;

			this._setDirtyHandler(TCh5SliderHandle.HIGHVALUE);
			this._sendHighValueForChangeSignal(this._userHighValue);
		}
		this.logger.stop();
	}

	/**
	 * Reset value | valueHigh property and set component as clean
	 */
	public reset(): void {
		this.logger.start('Ch5Slider.reset()');

		if (this._dirtyLow) {
			this._setSliderValue(
				Number(this._cleanValue),
				TCh5SliderHandle.VALUE
			);
			this.value = Number(this._cleanValue);
			this._setCleanLow();
		}

		if (this._dirtyHigh) {
			this._setSliderValue(Number(this._cleanValueHigh), TCh5SliderHandle.HIGHVALUE);
			this.valueHigh = Number(this._cleanValueHigh);
			this._setCleanHigh();
		}

		this.setClean();
		this.logger.stop();
	}

	/**
	 * Set component as clean
	 * If range=true then the component is set to clean state if both handles are clean
	 *
	 * @return {void}
	 */
	public setClean(): void {
		if (this._cleanLow && this._cleanHigh) {
			this._clean = true;
			this._dirty = false;
			this._submitted = false;

			// fire clean event
			if (this.feedbackMode === 'submit') {
				/**
				 * Fired when the component's becomes clean.
				 *
				 * @event clean
				 */
				this.dispatchEvent(
					this.cleanEvent = new CustomEvent('clean', {
						bubbles: true,
						cancelable: false
					})
				);

				if (this.onclean instanceof HtmlCallback) {
					this.onclean.run({} as Event);
				} else if (this.onclean instanceof Function) {
					this.onclean();
				}
			}
		}
	}

	/**
	 * Make input dirty, in generally when the input value is changed
	 *
	 * @fires dirty
	 * @return {void}
	 */
	public setDirty(): void {
		super.setDirty();

		if (this.feedbackMode === 'submit') {
			/**
			 * Fired when the component's value changes due to user interaction.
			 *
			 * @event dirty
			 */
			this.dispatchEvent(
				this.dirtyEvent = new CustomEvent('dirty', {
					bubbles: true,
					cancelable: false
				})
			);

			if (this.ondirty instanceof HtmlCallback) {
				this.ondirty.run({} as Event);
			} else if (this.ondirty instanceof Function) {
				this.ondirty();
			}
		}
	}

	/**
	 * Set dirty value based on handle
	 * @param handle
	 * @param value
	 */
	protected setDirtyValue(handle: TCh5SliderHandle, value: (number | string)[]): void {
		switch (handle) {
			case TCh5SliderHandle.VALUE:
				this._setDirtyLow();
				this._dirtyValue = Number(value[handle]);
				break;
			case TCh5SliderHandle.HIGHVALUE:
				this._setDirtyHigh();
				this._dirtyValueHigh = Number(value[handle]);
				break;
			default:
				break;
		}
	}

	// required for disable slider also
	protected updateForChangeInDisabledStatus() {
		super.updateForChangeInDisabledStatus();
		if (this.disabled === true) {
			this._innerContainer.setAttribute('disabled', 'true');
		} else {
			this._innerContainer.removeAttribute('disabled');
		}
	}

	/**
	 * Creates the internal html element of the component
	 *
	 * @protected
	 */
	protected createInternalHtml() {
		this.logger.start('createInternalHtml()');
		this.clearComponentContent();
		this._elContainer = document.createElement('div');
		this._elOnContainer = document.createElement('div');
		this._elOnContainer.classList.add('slider-on-button');
		this._elOffContainer = document.createElement('div');
		this._elOffContainer.classList.add('slider-off-button');
		this._innerContainer = document.createElement('div');
		this._elTitleContainer = document.createElement('div');
		this._elTitleContainer.classList.add('ch5-title-container');
		this._elSliderContainer = document.createElement('div');
		this._elSliderContainer.classList.add('ch5-slider-button-container');
		this._elContainer.classList.add('ch5-slider');
		this._elSliderContainer.appendChild(this._elOffContainer);
		this._elSliderContainer.appendChild(this._innerContainer);
		this._elSliderContainer.appendChild(this._elOnContainer);
		this._elContainer.appendChild(this._elTitleContainer);
		this._elContainer.appendChild(this._elSliderContainer);
		this.logger.stop();
	}

	/**
	 * Called to initialize all attributes
	 * @protected
	 */
	protected initAttributes() {
		super.initAttributes();

		const thisRef: any = this;
		for (let i: number = 0; i < Ch5Slider.COMPONENT_PROPERTIES.length; i++) {
			if (Ch5Slider.COMPONENT_PROPERTIES[i].isObservableProperty === true) {
				if (this.hasAttribute(Ch5Slider.COMPONENT_PROPERTIES[i].name.toLowerCase())) {
					const key = Ch5Slider.COMPONENT_PROPERTIES[i].name;
					thisRef[key] = this.getAttribute(key);
				}
			}
		}
		if (this._innerContainer.isConnected === false) {
			this._elSliderContainer.insertBefore(this._innerContainer as Node, this._elOnContainer as Node);
		}
	}

	/**
	 * Apply css classes for attrs inherited from common (e.g. customClass, customStyle )
	 * @protected
	 */
	protected updateCssClasses() {
		this.logger.start('UpdateCssClass');
		super.updateCssClasses();
		this.handleTapSettable();

		this._elContainer.classList.add(Ch5Slider.ELEMENT_NAME + Ch5Slider.COMPONENT_DATA.HANDLE_SHAPE.classListPrefix + this.handleShape);

		this._elContainer.classList.add(Ch5Slider.ELEMENT_NAME + Ch5Slider.COMPONENT_DATA.ORIENTATION.classListPrefix + this.orientation);

		// if (this.onOffOnly !== true) {
		this._elContainer.classList.add(Ch5Slider.ELEMENT_NAME + Ch5Slider.COMPONENT_DATA.SIZE.classListPrefix + this.size);
		// }

		this._elContainer.classList.add(Ch5Slider.ELEMENT_NAME + Ch5Slider.COMPONENT_DATA.ON_OFF_ONLY.classListPrefix + this.onOffOnly);

		// this._elContainer.classList.add(Ch5Slider.ELEMENT_NAME + Ch5Slider.COMPONENT_DATA.SIZE.classListPrefix + this.size);

		this._elContainer.classList.add(Ch5Slider.ELEMENT_NAME + Ch5Slider.COMPONENT_DATA.HANDLE_SIZE.classListPrefix + this.handleSize);

		// this._elContainer.classList.add(Ch5Slider.ELEMENT_NAME + Ch5Slider.COMPONENT_DATA.STRETCH.classListPrefix + this.stretch);

		this._elContainer.classList.add(Ch5Slider.ELEMENT_NAME + Ch5Slider.COMPONENT_DATA.TOOL_TIP_SHOW_TYPE.classListPrefix + this.toolTipShowType);

		// this._elContainer.classList.add(Ch5Slider.ELEMENT_NAME + Ch5Slider.COMPONENT_DATA.TOOL_TIP_DISPLAY_TYPE.classListPrefix + this.toolTipDisplayType);

		this.logger.stop();
	}

	/**
	 * Called to bind proper listeners
	 * @protected
	 */
	protected attachEventListeners() {
		super.attachEventListeners();
		if (this._innerContainer.querySelector('.noUi-handle') !== null) {
			this._innerContainer.addEventListener('mouseleave', this._onMouseLeave);
			this._innerContainer.addEventListener('touchmove', this._onMouseLeave);
		}
		// init pressable
		if (null !== this._pressable) {
			this._pressable.init();
			this._subscribeToPressableIsPressed();
		}
		if (this.stretch) {
			resizeObserver(this.parentElement as HTMLElement, this.onWindowResizeHandler.bind(this));
		}
	}

	/**
	 * Removes listeners
	 * @protected
	 */
	public removeEvents() {
		super.removeEventListeners();

		// Focus | Blur events
		// TODO: remove tabindex from handle(.noUi-handle)
		if (null !== this._innerContainer.querySelector('.noUi-handle')) {
			const noUiHandle = this._innerContainer.querySelector('.noUi-handle') as HTMLElement;
			noUiHandle.removeEventListener('focus', this._onFocus);
			noUiHandle.removeEventListener('blur', this._onBlur);
			noUiHandle.removeEventListener('click', this.sendEventOnHandleClickHandle);
			this._innerContainer.removeEventListener('mouseleave', this._onMouseLeave);
			this._innerContainer.removeEventListener('touchmove', this._onMouseLeave);
			noUiHandle.removeEventListener('pointermove', (event) => { event.stopPropagation() });
		}
		if (!_.isNil(this._pressable)) {
			this._unsubscribeFromPressableIsPressed();
		}
	}

	/**
	 * @private
	 * @returns {HTMLElement}
	 */
	protected getTargetElementForCssClassesAndStyle(): HTMLElement {
		return this._elContainer;
	}

	private createSlider() {
		// if (!this._wasRendered) {
		this._renderPromise().then(() => {
			// this._wasRendered = true;
			window.setTimeout(() => {
				this._applySignalReceivedBeforeRender();
			}, 0);
		});
		// }
	}

	/**
	 * Render the slide
	 *
	 * @private
	 * @returns {Promise<void>}
	 * @memberof Ch5Slider
	 */
	private _renderPromise(): Promise<API> {
		// TODO: find a way to not render the slider again when an attribute is changing and just update slider options
		return new Promise((resolve, reject) => {
			if (this._innerContainer === null || this._innerContainer === undefined) {
				return reject(false);
			}

			// noUiSlider.Options
			const options = this._parsedSliderOptions();

			// create noUiSlider
			try {
				if (!Ch5Common.isNil((this._innerContainer as target).noUiSlider)) {
					(this._innerContainer as target)?.noUiSlider?.destroy();
				}
				const slider = create(this._innerContainer, options);
				// Slide related events
				(this._innerContainer as target)?.noUiSlider?.on('slide', this._onSliderChange);
				(this._innerContainer as target)?.noUiSlider?.on('start', this._onSliderStart);
				(this._innerContainer as target)?.noUiSlider?.on('end', this._onSliderStop);
				const noUiHandle = this._innerContainer.querySelector('.noUi-handle') as HTMLElement;
				noUiHandle.addEventListener('focus', this._onFocus);
				noUiHandle.addEventListener('blur', this._onBlur);
				noUiHandle.addEventListener('click', this.sendEventOnHandleClickHandle);
				noUiHandle.addEventListener('pointermove', (event) => { event.stopPropagation() });
				// store internal slider elements
				this._tgtEls = [];
				this._tgtEls.push(this._innerContainer.querySelectorAll('.noUi-connect'));
				this._tgtEls.push(this._innerContainer.querySelectorAll('.noUi-origin'));

				this._tooltip = this._innerContainer.querySelectorAll('.noUi-tooltip');

				resolve(slider);
			} catch (error) {
				reject(error);
			}
		});
	}

	private onWindowResizeHandler() {
		// since stretch has no default value, should fire stretchHandler only if required
		if (!this.isResizeInProgress) {
			this.isResizeInProgress = true;
			setTimeout(() => {
				if (this.stretch) {
					this.stretchHandler();
					this._render();
				}
				this.isResizeInProgress = false; // reset debounce once completed
			}, this.RESIZE_DEBOUNCE);
		}
	}

	private _subscribeToPressableIsPressed() {
		const REPEAT_DIGITAL_PERIOD = 400;
		// const MAX_REPEAT_DIGITALS = 30000 / REPEAT_DIGITAL_PERIOD;
		if (this._isPressedSubscription === null && this._pressable !== null) {
			this._isPressedSubscription = this._pressable.observablePressed.subscribe((value: any) => {
				if (value.pressed === false) {
					if (this._repeatDigitalInterval !== null) {
						window.clearInterval(this._repeatDigitalInterval as number);
					}
					this.handleSendEvent(value.range, false);
				}
				else {
					this.handleSendEvent(value.range, true);
					if (this._repeatDigitalInterval !== null) {
						window.clearInterval(this._repeatDigitalInterval as number);
					}
					// let numRepeatDigitals = 0;
					this._repeatDigitalInterval = window.setInterval(() => {
						this.handleSendEvent(value.range, true);
						// if (++numRepeatDigitals >= MAX_REPEAT_DIGITALS) {
						// 	window.clearInterval(this._repeatDigitalInterval as number);
						// 	this.handleSendEvent(value.range, false);
						// }
					}, REPEAT_DIGITAL_PERIOD);
				}
			});
		}
	}

	private _unsubscribeFromPressableIsPressed() {
		if (this._repeatDigitalInterval !== null) {
			window.clearInterval(this._repeatDigitalInterval as number);
		}
		if (this._isPressedSubscription !== null) {
			this._isPressedSubscription.unsubscribe();
			this._isPressedSubscription = null;
		}
	}

	private _setSliderValue(value: number, handle: TCh5SliderHandle, time?: number): void {
		if (!_.isNil(this._innerContainer) && !_.isNil((this._innerContainer as target).noUiSlider)) {
			const animationLength: number = time !== undefined ? Math.round(time) : 0;
			if (value < this.min)
				value = this.min;
			else if (value > this.max)
				value = this.max;
			let slideValue: number | (null | number)[] = [value, null];
			if (handle === TCh5SliderHandle.HIGHVALUE) {
				if (value < this.value)
					value = this.value + 1;
				else if (value > this.max)
					value = this.max;
				slideValue = [null, value];
			}

			if (isNaN(animationLength) || animationLength <= 0 || animationLength > 120000) {
				// set value, no animation.
				this._stopRcbAnimation(handle);
				(this._innerContainer as target)?.noUiSlider?.set(slideValue as (number | string)[]);
			} else {
				(this._innerContainer as target)?.noUiSlider?.set(slideValue as (number | string)[]);
				// this is needed because when slider value is set also tooltip value is set
				// so we need to keep tooltip value from analog singal in order for animation to be consistent
				this._adjustTooltipValue(handle)

				this._startRcbAnimation(animationLength, handle);
			}
		}
	}

	/**
	 * COMPONENT EVENTS HANDLERS
	 */

	/**
	 * Runs when user slides the handle
	 *
	 * @private
	 * @param {string[]} value
	 * @param {number} handle
	 *
	 * @fires slider
	 */
	private _onSliderSlide(value: string[], handle: number): void {
		this.logger.start('Ch5Slider._onSliderSlide()');

		/**
		 * Fired when the component's handle start to slide.
		 *
		 * @event slider
		 */
		this.dispatchEvent(
			this.sliderEvent = new CustomEvent('slider', {
				bubbles: true,
				cancelable: false,
				detail: {
					handle,
					value
				}
			})
		);
		this.logger.stop();
	}

	/**
	 * Runs when user start to slide the handle
	 *
	 * @private
	 * @param {string[]} value
	 * @param {number} handle
	 *
	 * @fires slidestart
	 */
	private _onSliderStart(value: (number | string)[], handle: number): void {
		this.logger.start('Ch5Slider._onSliderStart()');
		this._innerContainer.removeEventListener('touchmove', this._onTouchMoveEnd);
		this._innerContainer.addEventListener('touchmove', this._onMouseLeave);
		/**
		 * Fired when the component's handle start to slide.
		 *
		 * @event slidestart
		 */
		this.dispatchEvent(
			this.sliderStartEvent = new CustomEvent('slidestart', {
				bubbles: true,
				cancelable: false,
				detail: {
					handle,
					value
				}
			})
		);
		this.isSliderStarted = true;
		this.logger.stop();
	}

	/**
	 * Runs when user ends sliding the handle
	 *
	 * @private
	 * @param {string[]} value
	 * @param {number} handle
	 *
	 * @fires slideend
	 */
	private _onSliderStop(value: (number | string)[], handle: number): void {
		this.logger.start('Ch5Slider._onSliderStop()');
		this.isSliderStarted = false;
		this.sliderTouch = null;
		// Fired when the component's handle end to slide.
		this.dispatchEvent(
			this.sliderEndEvent = new CustomEvent('slideend', {
				bubbles: true,
				cancelable: false,
				detail: {
					handle,
					value
				}
			})
		);
		this.logger.stop();
	}

	/**
	 * Runs when user interacts with component in a way that changes the value
	 *
	 * Set component value based on handle value and send value signal.
	 * Fires 'slider' and 'dirty' events
	 *
	 * @param value
	 * @param handle
	 *
	 * @fires change
	 * @fires dirty
	 *
	 * @private
	 */
	private _onSliderChange(value: (number | string)[], handle: number): void {
		this.logger.start('Ch5Slider._onSliderChange()');

		// set component value | valueHigh based on handle
		this._applyHandleValueToComponent(handle, value);

		// send value signal
		if (undefined !== value
			&& this._feedbackMode === 'direct'
		) {
			this._sendHandleValueSignal(handle, value);
		}

		// temporarily disabled
		/**
		 * Fired when the component's handle changes due to user interaction.
		 *
		 * @event change
		 */

		/**
		 * Fired when the component's handle start to slide.
		 *
		 * @event slider
		 */
		this.dispatchEvent(
			this.sliderEvent = new CustomEvent('slider', {
				bubbles: true,
				cancelable: false,
				detail: {
					handle,
					value
				}
			})
		);

		// set dirty flag and fire dirty event
		if (!this._dirty) {
			// set dirty flag and fire dirty event
			this.setDirty();
		}

		// set dirty value based on handle
		if (this._dirty) {
			/* coverity[var_deref_model] */
			this.setDirtyValue(handle, value);
		}

		// set component as clean if handle/handles are back to inital state
		this._maybeSetComponentClean();
		this.logger.stop();
	}

	/**
	 *
	 * @private
	 * @param {Event} inEvent
	 */
	private _onFocus(inEvent: Event): void {
		this.logger.start('Ch5Slider._onFocus()');
		if (inEvent.cancelable) {
			inEvent.preventDefault();
		}
		inEvent.stopPropagation();

		this.dispatchEvent(
			this.focusEvent = new CustomEvent('focus', {
				bubbles: true,
				cancelable: false,
			})
		);
		this.logger.stop();
	}

	private _onTouchMoveEnd(inEvent: any): void {
		this.isSliderStarted = false;
		if (inEvent.cancelable) {
			inEvent.preventDefault();
		}
		inEvent.stopPropagation();
	}

	private _onMouseLeave(inEvent: any): void {
		if (this.isSliderStarted === true) {
			const noUiHandle = this._innerContainer.querySelector('.noUi-handle') as HTMLElement;

			let eventOffsetX = null;
			let eventOffsetY = null;

			if (inEvent.type === 'touchmove') {
				if (_.isNil(this.sliderTouch)) {
					const touchToCheck = inEvent.touches[0] || inEvent.changedTouches[0];
					this.sliderTouch = {
						clientX: touchToCheck.clientX,
						clientY: touchToCheck.clientY
					};
				}

				const touch = inEvent.touches[0] || inEvent.changedTouches[0];
				eventOffsetX = touch.clientX;
				eventOffsetY = touch.clientY;
				let touchPositionValue = 0;
				let calculationValue = 0;
				if (!eventOffsetX || !eventOffsetY) return;
				if (this.orientation === 'vertical') {
					touchPositionValue = Math.abs(this.sliderTouch.clientX - eventOffsetX);
					calculationValue = this._innerContainer.clientWidth + Ch5Slider.OFFSET_THRESHOLD;
				} else {
					touchPositionValue = Math.abs(this.sliderTouch.clientY - eventOffsetY);
					calculationValue = this._innerContainer.clientHeight + Ch5Slider.OFFSET_THRESHOLD;
				} if (calculationValue < touchPositionValue) {
					this.isSliderStarted = false;
					this._innerContainer.addEventListener('touchmove', this._onTouchMoveEnd);
					this.dispatchEvent(
						this.blurEvent = new CustomEvent('touchend', {
							bubbles: false,
							cancelable: false,
						})
					);
				}

			} else {

				eventOffsetX = inEvent.clientX;
				eventOffsetY = inEvent.clientY;

				let touchPositionValue = 0;
				let calculationValue = 0;
				if (!eventOffsetX || !eventOffsetY) return;
				if (this.orientation === 'vertical') {
					touchPositionValue = Math.abs(this._innerContainer.clientLeft - eventOffsetX);
					calculationValue = this._innerContainer.clientWidth + Ch5Slider.OFFSET_THRESHOLD;
				} else {
					touchPositionValue = Math.abs(this._innerContainer.clientTop - eventOffsetY);
					calculationValue = this._innerContainer.clientHeight + Ch5Slider.OFFSET_THRESHOLD;
				}
				if (calculationValue < touchPositionValue) {
					this.isSliderStarted = false;
					this.dispatchEvent(
						this.blurEvent = new CustomEvent('mouseup', {
							bubbles: true,
							cancelable: false
						})
					);
					noUiHandle.blur();
				}
			}
		}
	}

	/**
	 *
	 * @private
	 * @param {Event} inEvent
	 */
	private _onBlur(inEvent: Event): void {
		this.logger.start('Ch5Slider._onBlur()');
		if (inEvent.cancelable) {
			inEvent.preventDefault();
		}
		inEvent.stopPropagation();

		this.dispatchEvent(
			this.blurEvent = new CustomEvent('blur', {
				bubbles: true,
				cancelable: false,
			})
		);
		this.logger.stop();
	}

	/**
	 * Apply components value based on handle number
	 * @param handle
	 * @param value
	 */
	private _applyHandleValueToComponent(handle: TCh5SliderHandle, value: (number | string)[]): void {
		switch (handle) {
			case TCh5SliderHandle.VALUE:
				this._userLowValue = Number(value[handle]);
				break;
			case TCh5SliderHandle.HIGHVALUE:
				this._userHighValue = Number(value[handle]);
				break;
			default:
				break;
		}
	}

	/**
	 * Send signal value on change
	 *
	 * @private
	 * @param {string[]} value
	 * @param {number} handle
	 */
	private _sendHandleValueSignal(handle: TCh5SliderHandle, value: (number | string)[]): void {
		const numberVal: number = Math.round(
			Number(value[handle])
		);

		switch (handle) {
			case TCh5SliderHandle.VALUE:
				// set dirty handler and send signal value for value
				this._setDirtyHandler(handle);
				this._sendValueForChangeSignal(numberVal);
				break;
			case TCh5SliderHandle.HIGHVALUE:
				// set dirty handler send signal value for high value
				this._setDirtyHandler(handle);
				this._sendHighValueForChangeSignal(numberVal);
				break;
			default:
				break;
		}
	}

	/**
	 * Send signal value on slider change
	 * @private
	 */
	private _sendValueForChangeSignal(value: number): void {
		let sigChange: Ch5Signal<number> | null = null;
		if (Ch5Common.isNotNil(this.sendEventOnChange)) {
			sigChange = Ch5SignalFactory.getInstance().getNumberSignal(this.sendEventOnChange);
			if (sigChange !== null && sigChange.value !== value) {
				sigChange.publish(value);
			}
		}
	}

	/**
	 * Send signal high value on slider change
	 * @private
	 */
	private _sendHighValueForChangeSignal(value: number): void {
		let sigChange: Ch5Signal<number> | null = null;
		if (this.range && Ch5Common.isNotNil(this.sendEventOnChangeHigh)) {
			sigChange = Ch5SignalFactory.getInstance().getNumberSignal(this.sendEventOnChangeHigh);
			if (sigChange !== null) {
				sigChange.publish(value);
			}
		}
	}

	/**
	 * Dirty handler, only set dirty handle if component has a receivestatevalue attribute
	 * @private
	 */
	private _setDirtyHandler(handle: TCh5SliderHandle) {
		this.logger.start('Ch5Slider._setDirtyHandler');

		switch (handle) {
			// dirty handler for value
			case TCh5SliderHandle.VALUE:
				if (this._dirtyTimerHandle !== null) {
					clearTimeout(this._dirtyTimerHandle);
				}

				this._dirtyTimerHandle = window.setTimeout(
					() => this._onDirtyTimerFinished(handle),
					this._signalValueSyncTimeout
				);

				break;
			// dirty handler for valueHigh
			case TCh5SliderHandle.HIGHVALUE:
				if (this._dirtyTimerHandleHigh !== null) {
					clearTimeout(this._dirtyTimerHandleHigh);
				}

				this._dirtyTimerHandleHigh = window.setTimeout(
					() => this._onDirtyTimerFinished(handle),
					this._signalValueSyncTimeout
				);
				break;
			default:
				break;
		}
		this.logger.stop();
	}

	/**
	 * This will run when no value is receive and signalValueSyncTimeout is fulfill
	 * Reset component value to cleanValue and clean state
	 *
	 * @private
	 * @param {TCh5SliderHandle} handle
	 */
	private _onDirtyTimerFinished(handle: TCh5SliderHandle) {
		this.logger.start('Ch5Slider._onDirtyTimerFinished');

		switch (handle) {
			case TCh5SliderHandle.VALUE:
				this._dirtyTimerHandle = null;

				if (this._dirtyValue !== this._cleanValue) {
					const nrCleanValue = Number(this._cleanValue);

					// set ui view value
					this._setSliderValue(nrCleanValue, TCh5SliderHandle.VALUE);
					this.value = nrCleanValue;

					this._setCleanLow();
					this._applyTooltipValue(this._tooltip[TCh5SliderHandle.VALUE], nrCleanValue);
				}
				break;
			case TCh5SliderHandle.HIGHVALUE:
				this._dirtyTimerHandleHigh = null;

				if (this._dirtyValueHigh !== this._cleanValueHigh) {
					const nrCleanValue = Number(this._cleanValueHigh);

					// set ui view value
					this._setSliderValue(nrCleanValue, TCh5SliderHandle.HIGHVALUE);
					this.valueHigh = nrCleanValue;

					this._setCleanHigh();

					this._applyTooltipValue(this._tooltip[TCh5SliderHandle.HIGHVALUE], nrCleanValue);
				}
				break;
			default:
				break;
		}
		this.setClean();
		this.logger.stop();
	}

	/**
	 * Set component as clean if handle/handles are back to initial state
	 *
	 * @private
	 */
	private _maybeSetComponentClean(): void {
		// check if component dirty value is same as initial value(clean value)
		// if so set component value as clean
		if ((this._dirtyValue === this._cleanValue)) {
			this._setCleanLow();
		}

		// check if component dirty valueHigh is same as initial valueHigh(clean valueHigh)
		// if so set component valueHigh as clean
		if ((this._dirtyValueHigh === this._cleanValueHigh)) {
			this._setCleanHigh();
		}

		// finally check if component can be set as clean
		this.setClean();
	}

	/**
	 * Verify component attributes and set slider options
	 *
	 * @private
	 */
	private _parsedSliderOptions() {
		let behaviour = this.tapSettable ? 'tap' : 'none';
		if (this.tapSettable === false) {
			if ((this.sendEventOnUpper || this.sendEventOnLower) && this.isAdvancedSlider === true) {
				behaviour = 'hover';
				if (this.toolTipDisplayType === "%") {
					this.toolTipShowType = "off";
				}
			}
		}
		// in our case is bottom to top so we need to change it to 'rtl'
		let direction = "ltr";
		if (this.orientation === 'vertical') {
			if (this.dir === "rtl") {
				direction = "ltr";
			} else {
				direction = "rtl";
			}
		} else {
			direction = this.dir;
		}

		if (Ch5Common.isNil(direction)) {
			// This is defensive code for CCIDE purpose only and should not be removed.
			direction = "ltr";
		}

		// The connect option can be used to control the bar between the handles or the edges of the slider.
		const connect = this._connectDisplayFormatter();

		// Defines the number of steps values in the slider. If you want quarters 0, 25, 50, 75, 100 then 25 is the number for step.
		// const step = Math.round( (Math.abs(this._min) + this._max) / this._step );
		const step = this.step;

		// All values on the slider are part of a range. The range has a minimum and maximum value. The minimum value cannot be equal to the maximum value.
		let range: { [key: string]: number } = { 'min': this.min, 'max': this.max };

		// This feature allows you to generate non-linear sliders
		const pips = this._parsedTicks();

		// pips options
		let pipsOptions = {};

		// override range if pips are declared. setRangeFromPips will also override min and max
		if (typeof pips === 'object') {
			// this is called before this._getRangeFromPips because it can change min and max values
			this._maybeSetMinAndMaxFromPips(pips);

			// create range object from pips
			range = this._getRangeFromPips(pips);

			pipsOptions = {
				mode: 'positions',
				density: 100,
				values: Object.keys(pips).map(value => Number(value)),
				format: {
					to: (value: any) => {
						return this.showTickValues ? value : '';
					}
				}
			}

			this.handleValue();
			this.handleValueHigh();
		}

		//  basic tooltip
		const tooltips =
			this.toolTipShowType === "off"
				? false
				: this.range ? [{ to: this._toolTipDisplayTypeFormatter.bind(this) }, { to: this._toolTipDisplayTypeFormatter.bind(this) }] : [{ to: this._toolTipDisplayTypeFormatter.bind(this) }];

		// The start option sets the number of handles and corresponding start positions.
		const start = this._getStartValue();

		// noUiSlider.Options
		return {
			start,
			animate: false,
			step,
			behaviour,
			connect,
			direction,
			range,
			orientation: this.orientation,
			pips: Object.getOwnPropertyNames(pips).length !== 0 ? pipsOptions : undefined,
			tooltips
		} as unknown as Options
	}

	/**
	 * Returns slider formatted range from a pips object
	 * This will set min and max accordingly
	 *
	 * @param {[key:number]:string } pips
	 */
	private _getRangeFromPips(pips: { [key: number]: string }): { [key: string]: number } {
		const range: { [key: string]: number; } = {};

		for (const key in pips) {
			if (pips.hasOwnProperty(key)) {
				// map min entry
				if ((Object.keys(pips)[0]) === key) {
					if (Number(key) === 0) {
						range.min = Number(this.min)
						continue;
					}
					range.min = Number(this.min);
				}

				// map max entry
				if (Object.keys(pips)[Object.keys(pips).length - 1] === key) {
					if (Number(key) === 100) {
						range.max = Number(this.max)
						continue;
					}
					range.max = Number(this.max);
				}

				range[key + '%'] = Number(pips[key]);
			}
		}

		return range;
	}

	private _maybeSetMinAndMaxFromPips(pips: { [key: number]: string }) {
		for (const key in pips) {
			if (pips.hasOwnProperty(key)) {
				// if ticks object contain entry for key = 0 then set min from key value
				if ((Object.keys(pips)[0]) === key &&
					Number(key) === 0) {
					this.min = Number(pips[key]);
				}

				// if ticks object contain entry for key = 100 then set max from key value
				if (Object.keys(pips)[Object.keys(pips).length - 1] === key &&
					Number(key) === 100) {
					this.max = Number(pips[key]);
				}
			}
		}
	}

	/**
	 * Converts _ticks into object
	 *
	 * @private
	 * @returns {(boolean| object)}
	 */
	private _parsedTicks(): boolean | { [key: number]: string } {
		if (Ch5Common.isNotNil(this.ticks)) {
			try {
				const ticksObj = JSON.parse(this.ticks);
				if (ticksObj && typeof ticksObj === "object") {
					return ticksObj;
				}
			} catch (e) {
				return false;
			}
		}
		return false;
	}

	/**
	 * Set valueHigh as dirty
	 *
	 * @private
	 */
	private _setDirtyHigh(): void {
		this._dirtyHigh = true;
		this._cleanHigh = false;
	}
	/**
	 * Set value as dirty
	 *
	 * @private
	 */
	private _setDirtyLow(): void {
		this._dirtyLow = true;
		this._cleanLow = false;
	}

	/**
	 * Set value as clean
	 *
	 * @private
	 */
	private _setCleanLow(): void {
		this._cleanLow = true;
		this._dirtyLow = false;
	}

	/**
	 * Set valueHigh as clean
	 *
	 * @private
	 */
	private _setCleanHigh(): void {
		this._cleanHigh = true;
		this._dirtyHigh = false;
	}

	/**
	 * Format ch5-slider tooltips displayed value
	 *
	 * @private
	 * @param {*} value
	 * @returns {string}
	 */
	private _toolTipDisplayTypeFormatter(value: any): string {
		if (this.toolTipDisplayType === '%') {
			return this._tooltipValueToPercent(value);
		}
		return Math.round(value).toString();
	}

	/**
	 * Format tooltip value as percent of slider range
	 *
	 * @private
	 * @param {*} value
	 * @returns {string}
	 */
	private _tooltipValueToPercent(value: any): string {
		const v: number = Math.round(value);
		if (isNaN(v)) { return value; }

		const percent: number = Math.round((100 * (v - this.min)) / (this.max - this.min));
		return percent.toString() + '%';
	}

	/**
	 * Format 'connect' noUiSlider option
	 *
	 * @private
	 * @returns {boolean[]}
	 */
	private _connectDisplayFormatter(): boolean[] {
		if (this.range === true) {
			return [false, true, false];
		}
		return [true, false]
	}

	/**
	 * Start rcb animation
	 *
	 * @private
	 * @param {number} animationLength
	 * @param {IRcbUpdateValue} value
	 * @param {TCh5SliderHandle} [handle]
	 * @memberof Ch5Slider
	 */
	private _startRcbAnimation(animationLength: number, handle: TCh5SliderHandle): void {
		const styleParams: { [key: string]: string } = {
			'transitionProperty': 'transform',
			'transitionTimingFunction': 'linear'
		};
		styleParams.transitionDuration = animationLength.toString() + 'ms';

		this._setStyleParameters(styleParams);

		// on timer, unset the style properties.
		if (this._animationTimer !== undefined) {
			window.clearTimeout(this._animationTimer);
			this._animationTimer = undefined;
		}

		// set a flag for what handle is animation
		this._animatingHandle[handle] = true;

		this._animationTimer = window.setTimeout(
			() => this._stopRcbAnimation(handle),
			animationLength
		);
	}

	/**
	 * Stop rcb animation
	 */
	private _stopRcbAnimation(handle: TCh5SliderHandle): void {
		if (this._animationTimer === undefined) {
			return;
		}

		this._animatingHandle[handle] = false;

		window.clearTimeout(this._animationTimer);
		this._animationTimer = undefined;

		const styleParams: { [key: string]: string } = {
			'transitionProperty': 'none',
			'transitionDuration': '0ms',
			'transitionTimingFunction': 'ease'
		};

		this._setStyleParameters(styleParams);
	}

	private _setStyleParameters(styleParams: { [key: string]: string }) {
		for (const elList of this._tgtEls) {
			for (const itemList of Array.from(elList)) {
				for (const styleName in styleParams) {
					if (styleParams.hasOwnProperty(styleName)) {
						const styleVal: string = styleParams[styleName];
						(itemList.style as any)[styleName] = styleVal;
					}
				}
			}
		}
	}

	/**
	 * Subscribe to analog signal. This is used for tooltip animation
	 *
	 * @private
	 * @returns
	 * @memberof Ch5Slider
	 */
	private subscribeToAnalogSignal() {
		if (this.receiveStateValue) {
			const receiveAnalogSignalName: string = Ch5Signal.getSubscriptionSignalName(this.receiveStateValue);
			const receiveAnalogSignal: Ch5Signal<number> | null = Ch5SignalFactory.getInstance().getNumberSignal(receiveAnalogSignalName);

			if (null !== receiveAnalogSignal) {
				this._subReceiveAnalogValueId = receiveAnalogSignal.subscribe((value) => {
					if (this._dirtyTimerHandle === null) {
						this._applyTooltipValue(this._tooltip[TCh5SliderHandle.VALUE], value);
					}
					this._tooltipValueFromSignal = value;
				});
			}
		}
	}

	/**
	 * Subscribe to high analog signal. This is used for tooltip animation
	 */
	private subscribeToAnalogHighSignal() {
		if (this.receiveStateValueHigh) {
			const receiveAnalogSignalName: string = Ch5Signal.getSubscriptionSignalName(this.receiveStateValueHigh);
			const receiveAnalogSignal: Ch5Signal<number> | null = Ch5SignalFactory.getInstance().getNumberSignal(receiveAnalogSignalName);

			if (null !== receiveAnalogSignal) {
				this._subReceiveAnalogValueHighId = receiveAnalogSignal.subscribe((value) => {
					if (this._dirtyTimerHandleHigh === null) {
						this._applyTooltipValue(this._tooltip[TCh5SliderHandle.HIGHVALUE], value);
					}
					this._tooltipHighValueFromSignal = value;
				});
			}
		}
	}

	/**
	 * Unsubscribe from analog signal
	 *
	 * @private
	 * @memberof Ch5Slider
	 */
	private unsubscribeFromAnalogSignals() {
		const csf = Ch5SignalFactory.getInstance();
		if ('' !== this._subReceiveAnalogValueId && '' !== this._receiveStateValueSignal) {
			const recSigValName: string = Ch5Signal.getSubscriptionSignalName(this._receiveStateValueSignal);
			const sigSelected: Ch5Signal<number> | null = csf.getNumberSignal(recSigValName);

			if (null !== sigSelected) {
				sigSelected.unsubscribe(this._subReceiveAnalogValueId);
				this._subReceiveAnalogValueId = ''
			}
		}

		if ('' !== this._subReceiveAnalogValueHighId && '' !== this._receiveStateValueSignalHigh) {
			const recSigValHighName: string = Ch5Signal.getSubscriptionSignalName(this._receiveStateValueSignalHigh);
			const sigSelected: Ch5Signal<number> | null = csf.getNumberSignal(recSigValHighName);

			if (null !== sigSelected) {
				sigSelected.unsubscribe(this._subReceiveAnalogValueHighId);
				this._subReceiveAnalogValueHighId = ''
			}
		}
	}

	/**
	 * Unsubscribe from object signal
	 *
	 * @private
	 * @memberof Ch5Slider
	 */
	private unsubscribeFromObjectSignals() {
		const csf = Ch5SignalFactory.getInstance();
		if ('' !== this._subReceiveValueId && '' !== this._receiveStateValueSignal) {
			const recSigValName: string = Ch5Signal.getSubscriptionSignalName(this._receiveStateValueSignal);
			const sigSelected: Ch5Signal<object> | null = csf.getObjectSignal(recSigValName);

			if (null !== sigSelected) {
				sigSelected.unsubscribe(this._subReceiveValueId);
				this._receiveStateValueSignal = '';
			}
		}

		if ('' !== this._subReceiveValueHighId && '' !== this._receiveStateValueSignalHigh) {
			const recSigHighValName: string = Ch5Signal.getSubscriptionSignalName(this._receiveStateValueSignalHigh);
			const sigSelected: Ch5Signal<object> | null = csf.getObjectSignal(recSigHighValName);

			if (null !== sigSelected) {
				sigSelected.unsubscribe(this._subReceiveValueHighId);
				this._receiveStateValueSignalHigh = '';
			}
		}
	}

	private _applyTooltipValue(tooltip: Element, value: number) {
		if (undefined !== tooltip
			&& null !== tooltip
		) {
			if (this.min < 0 && value > 0x7FFF) {
				value -= 0x10000;
			}
			if (value > this.max) {
				value = this.max;
			} else {
				if (value < this.min) {
					value = this.min
				}
			}
			tooltip.textContent = this._toolTipDisplayTypeFormatter(value);
		}
	}

	/**
	 * purpose of this function is to calculate the visual value of the slider
	 * while in a ramp.
	 */
	private _calculatedValueWhileInRamp(): number {
		let scalarValue = this.value;

		/*
		* Computing the scalarValue considering a linear progression
		* A line equation is y=mx+b
		* where m is the slope and b is the y intercept
		* Knowing 2 points (x1,y1) and (x2,y2) the slope is m=(y2-y1)/(x2-x1)
		*
		* In our case:
		* y2-y1 is (this._rcbSignalValue.rcb.value-this._rcbSignalValue.rcb.startv)
		* x2-x1 is rcb.time
		* x is currentTime-starttime
		* b is this._rcbSignalValue.rcb.startv
		* y is the value we want to determine ( scalarValue )
		*/
		if (undefined !== this._rcbSignalValue && undefined !== this._rcbSignalValue.rcb.startv && undefined !== this._rcbSignalValue.rcb.startt) {
			const slope = (this._rcbSignalValue.rcb.value - this._rcbSignalValue.rcb.startv) / this._rcbSignalValue.rcb.time;
			const x = (Date.now() - this._rcbSignalValue.rcb.startt);
			scalarValue = Math.round(slope * x + this._rcbSignalValue.rcb.startv);
		}

		return scalarValue;
	}

	/**
	 * purpose of this function is to calculate the visual highValue of the slider
	 * while in a ramp.
	 */
	private _calculatedHighValueWhileInRamp(): number {
		let scalarValue = this.value;

		/*
		* Computing the scalarValue considering a linear progression
		* A line equation is y=mx+b
		* where m is the slope and b is the y intercept
		* Knowing 2 points (x1,y1) and (x2,y2) the slope is m=(y2-y1)/(x2-x1)
		*
		* In our case:
		* y2-y1 is (this._rcbSignalValueHigh.rcb.value-this._rcbSignalValueHigh.rcb.startv)
		* x2-x1 is rcb.time
		* x is currentTime-starttime
		* b is this._rcbSignalValueHigh.rcb.startv
		* y is the value we want to determine ( scalarValue )
		*/
		if (undefined !== this._rcbSignalValueHigh && undefined !== this._rcbSignalValueHigh.rcb.startv && undefined !== this._rcbSignalValueHigh.rcb.startt) {
			const slope = (this._rcbSignalValueHigh.rcb.value - this._rcbSignalValueHigh.rcb.startv) / this._rcbSignalValueHigh.rcb.time;
			const x = (Date.now() - this._rcbSignalValueHigh.rcb.startt);
			scalarValue = Math.round(slope * x + this._rcbSignalValueHigh.rcb.startv);
		}

		return scalarValue;
	}

	/**
	 * Apply last value received from signal
	 * This is used if in connectedCallback in case that value signal is received before rendering the slider
	 *
	 * @private
	 * @memberof Ch5Slider
	 */
	private _applySignalReceivedBeforeRender() {
		// apply for value
		if (this._rcbSignalValue !== undefined
			&& this._rcbSignalValue.rcb.time !== 0
			&& this._rcbSignalValue.rcb.startv !== undefined
			&& this._rcbSignalValue.rcb.startt !== undefined
		) {
			this._setSliderValue(
				this._rcbSignalValue.rcb.value,
				TCh5SliderHandle.VALUE,
				this._rcbSignalValue.rcb.time - (Date.now() - this._rcbSignalValue.rcb.startt)
			);
		}

		// apply for value high
		if (this._rcbSignalValueHigh !== undefined
			&& this._rcbSignalValueHigh.rcb.time !== 0
			&& this._rcbSignalValueHigh.rcb.startv !== undefined
			&& this._rcbSignalValueHigh.rcb.startt !== undefined
		) {
			this._setSliderValue(
				this._rcbSignalValueHigh.rcb.value,
				TCh5SliderHandle.HIGHVALUE,
				this._rcbSignalValueHigh.rcb.time - (Date.now() - this._rcbSignalValueHigh.rcb.startt)
			);
		}
	}

	private _adjustTooltipValue(handle: TCh5SliderHandle) {
		// this is needed because when slider value is set also tooltip value is set
		// so we need to keep tooltip value from analog singal in order for animation to be consistent
		const index = (handle === TCh5SliderHandle.VALUE) ? TCh5SliderHandle.VALUE : TCh5SliderHandle.HIGHVALUE

		if (undefined !== this._tooltipValueFromSignal && handle === TCh5SliderHandle.VALUE) {
			this._applyTooltipValue(this._tooltip[index], this._tooltipValueFromSignal);
		}

		if (undefined !== this._tooltipHighValueFromSignal && handle === TCh5SliderHandle.HIGHVALUE) {
			this._applyTooltipValue(this._tooltip[index], this._tooltipHighValueFromSignal);
		}
	}

	/**
	 * Get start value of the slider
	 */
	private _getStartValue(): number | number[] {
		let val = this.value;
		let valHigh = this.valueHigh;
		if (this.value < this.min)
			val = this.min;
		if (this.value > this.max)
			val = this.max
		if (this.valueHigh > this.max)
			valHigh = this.max;
		if (this.valueHigh <= this.value)
			valHigh = this.value;

		let start = (this.range === false) ? val : [val, valHigh];
		this._cleanValue = val;
		if (this.range === true) {
			this._cleanValueHigh = valHigh;
		}
		// this is a edge case when signals are received before component is created
		if (!this._wasRendered) {
			start = this._getStartValueWhileInRamp();
		}

		return start;
	}
	/**
	 * Get start slider value while in ramp
	 */
	private _getStartValueWhileInRamp(): number | number[] {
		let value: number;
		let valueHigh: number;

		// received signal for value
		if (undefined !== this._rcbSignalValue
			&& undefined !== this._rcbSignalValue.rcb.startv
			&& this._rcbSignalValue.rcb.time !== 0
		) {
			value = this._calculatedValueWhileInRamp();
		} else {
			value = this.value;
		}

		// received signal for valuehigh
		if (undefined !== this._rcbSignalValueHigh
			&& undefined !== this._rcbSignalValueHigh.rcb.startv
			&& this._rcbSignalValueHigh.rcb.time !== 0
		) {
			valueHigh = this._calculatedHighValueWhileInRamp();
		} else {
			valueHigh = this.valueHigh;
		}
		if (this.value < this.min)
			value = this.min;
		if (this.value > this.max)
			value = this.max
		if (this.valueHigh > this.max)
			valueHigh = this.max;
		if (this.valueHigh <= this.value)
			valueHigh = this.value;

		this._cleanValue = value;
		if (this.range === true) {
			this._cleanValueHigh = valueHigh;
		}
		return this.range ? [value, valueHigh] : value;
	}

	private handleHandleShape() {
		Array.from(Ch5Slider.COMPONENT_DATA.HANDLE_SHAPE.values).forEach((e: any) => {
			this._elContainer.classList.remove(Ch5Slider.ELEMENT_NAME + Ch5Slider.COMPONENT_DATA.HANDLE_SHAPE.classListPrefix + e);
		});
		this._elContainer.classList.add(Ch5Slider.ELEMENT_NAME + Ch5Slider.COMPONENT_DATA.HANDLE_SHAPE.classListPrefix + this.handleShape);
	}

	private handleSendEvent(eventName: string, value: boolean): void {
		if (this.range || this.isAdvancedSlider === false || this.disabled) {
			return;
		}
		if (this.sendEventOnUpper !== '' && this.sendEventOnUpper !== null && this.sendEventOnUpper !== undefined && eventName === 'upper') {
			Ch5SignalFactory.getInstance().getBooleanSignal(this.sendEventOnUpper)?.publish(value);
		} else if (this.sendEventOnLower !== '' && this.sendEventOnLower !== null && this.sendEventOnLower !== undefined && eventName === 'lower') {
			Ch5SignalFactory.getInstance().getBooleanSignal(this.sendEventOnLower)?.publish(value);
		}
	}

	private sendEventOnHandleClickHandle(): void {
		if (this.sendEventOnHandleClick && !this.disabled) {
			Ch5SignalFactory.getInstance().getBooleanSignal(this.sendEventOnHandleClick)?.publish(true);
			Ch5SignalFactory.getInstance().getBooleanSignal(this.sendEventOnHandleClick)?.publish(false);
		}
	}

	private handleValue() {
		if (this.value > this.max) {
			this.value = this.max;
		} else if (this.value < this.min) {
			this.value = this.min;
		}

		if (this.range && this.value > this.valueHigh) {
			this.value = this.valueHigh - 1;
		}

		if (this._dirtyTimerHandle !== null) {
			clearTimeout(this._dirtyTimerHandle);
			this._dirtyTimerHandle = null;
		}
		if (this._wasRendered) {
			(this._innerContainer as target)?.noUiSlider?.set(this.value);
		}
	}

	private handleValueHigh() {
		// not allowing valueHigh to be greater than this.max
		if (this.range === false) {
			return;
		}

		if (this.valueHigh > this.max) {
			this.valueHigh = this.max;
		} else if (this.valueHigh < this.min) {
			this.valueHigh = this.min;
		}

		if (this.valueHigh <= this.value) {
			this.valueHigh = this.value;
		}

		if (this._dirtyTimerHandleHigh !== null) {
			clearTimeout(this._dirtyTimerHandleHigh);
			this._dirtyTimerHandleHigh = null;
		}

		if (this._wasRendered) {
			(this._innerContainer as target)?.noUiSlider?.set([this.value, this.valueHigh]);
		}
	}

	private handleMax() {
		if (this.max <= this.min) {
			this.max = this.min + 1;
		}
		if (this.value > this.max) {
			this.value = this.max;
		}
		// step should be honored over max when not an even divisor of max
		const numberOfSteps = (this.max - this.min) / this.step;
		const modulus = (this.max - this.min) % this.step;

		if (modulus !== 0) {
			this.max = this.min + (Math.floor(numberOfSteps) * this.step);
		}
		this._render();
	}

	private handleMin() {
		if (this.min >= this.max) {
			this.min = this.max - 1;
		}
		if (this.value < this.min) {
			this.value = this.min;
		}
		this._render();
	}

	private handleOrientation() {
		Array.from(Ch5Slider.COMPONENT_DATA.ORIENTATION.values).forEach((e: any) => {
			this._elContainer.classList.remove(Ch5Slider.ELEMENT_NAME + Ch5Slider.COMPONENT_DATA.ORIENTATION.classListPrefix + e);
		});
		this._elContainer.classList.add(Ch5Slider.ELEMENT_NAME + Ch5Slider.COMPONENT_DATA.ORIENTATION.classListPrefix + this.orientation);
		this._render();
	}

	private sizeHandler() {
		Array.from(Ch5Slider.COMPONENT_DATA.SIZE.values).forEach((e: any) => {
			this._elContainer.classList.remove(Ch5Slider.ELEMENT_NAME + Ch5Slider.COMPONENT_DATA.SIZE.classListPrefix + e);
		});
		this._elContainer.classList.add(Ch5Slider.ELEMENT_NAME + Ch5Slider.COMPONENT_DATA.SIZE.classListPrefix + this.size);
		this._render();
	}

	private handleHandleSize() {
		Array.from(Ch5Slider.COMPONENT_DATA.HANDLE_SIZE.values).forEach((e: any) => {
			this._elContainer.classList.remove(Ch5Slider.ELEMENT_NAME + Ch5Slider.COMPONENT_DATA.HANDLE_SIZE.classListPrefix + e);
		});
		this._elContainer.classList.add(Ch5Slider.ELEMENT_NAME + Ch5Slider.COMPONENT_DATA.HANDLE_SIZE.classListPrefix + this.handleSize);
		this._render();
	}

	private handleStretch() {
		Array.from(Ch5Slider.COMPONENT_DATA.STRETCH.values).forEach((e: any) => {
			this._elContainer.classList.remove(Ch5Slider.ELEMENT_NAME + Ch5Slider.COMPONENT_DATA.STRETCH.classListPrefix + e);
		});
		this._elContainer.classList.add(Ch5Slider.ELEMENT_NAME + Ch5Slider.COMPONENT_DATA.STRETCH.classListPrefix + this.stretch);
		this.stretchHandler();
		this._render();
	}

	private stretchHandler() {
		let sliderHeight = this.offsetHeight;
		let sliderWidth = this.offsetWidth;
		let titleHeight = this.offsetHeight;
		if (!this.stretch) {
			sliderHeight = 0;
			sliderWidth = 0;
		}
		if (this._elContainer && this._elContainer.style) {
			const parentElement = this.parentElement;
			if (this.stretch && this.stretch.trim().length > 0 && parentElement) {
				sliderWidth = parentElement.offsetWidth;
				sliderHeight = parentElement.offsetHeight;
				if (this._titlePresent === 1) {
					titleHeight = sliderHeight - 24;
				} else {
					titleHeight = sliderHeight;
				}
				if (this.stretch === 'height') {
					if (this.isAdvancedSlider === true) {
						this._elSliderContainer.style.height = titleHeight + 'px';
						this._elContainer.style.height = sliderHeight + 'px';
						this._elSliderContainer.style.removeProperty("width");
					} else {
						this._elContainer.style.height = sliderHeight + 'px';
					}
					this._elContainer.style.removeProperty("width");
				} else if (this.stretch === 'width') {
					if (this.isAdvancedSlider === true) {
						this._elSliderContainer.style.width = sliderWidth + 'px';
						this._elContainer.style.width = sliderWidth + 'px';
						this._elSliderContainer.style.removeProperty("height");
					} else {
						this._elContainer.style.width = sliderWidth + 'px';
					}
					this._elContainer.style.removeProperty("height");
				}
				else if (this.stretch === "both") {
					if (this.isAdvancedSlider === true) {
						this._elSliderContainer.style.width = sliderWidth + 'px';
						this._elSliderContainer.style.height = titleHeight + 'px';
						this._elContainer.style.width = sliderWidth + 'px';
						this._elContainer.style.height = sliderHeight + 'px';
					}
					else {
						this._elContainer.style.width = sliderWidth + 'px';
						this._elContainer.style.height = sliderHeight + 'px';
					}
				}
			}
		}
	}

	private handleOnOffOnly() {
		if (this.range || this.isAdvancedSlider === false) {
			Array.from(Ch5Slider.COMPONENT_DATA.ON_OFF_ONLY.values).forEach((e: any) => {
				this._elContainer.classList.remove(Ch5Slider.ELEMENT_NAME + Ch5Slider.COMPONENT_DATA.ON_OFF_ONLY.classListPrefix + String(e));
			});
		} else {
			Array.from(Ch5Slider.COMPONENT_DATA.ON_OFF_ONLY.values).forEach((e: any) => {
				this._elContainer.classList.remove(Ch5Slider.ELEMENT_NAME + Ch5Slider.COMPONENT_DATA.ON_OFF_ONLY.classListPrefix + String(e));
			});
			if (this.onOffOnly === true) {
				this._innerContainer.classList.add("ch5-hide-vis");
			} else {
				this._innerContainer.classList.remove("ch5-hide-vis");
			}
			this._elContainer.classList.add(Ch5Slider.ELEMENT_NAME + Ch5Slider.COMPONENT_DATA.ON_OFF_ONLY.classListPrefix + String(this.onOffOnly));
		}
	}

	private handleTapSettable() {
		if (this.noHandle === true) {
			this._elContainer.classList.add("nohandle");
		} else {
			this._elContainer.classList.remove("nohandle");
		}
	}

	private handleToolTipShowType() {
		Array.from(Ch5Slider.COMPONENT_DATA.TOOL_TIP_SHOW_TYPE.values).forEach((e: any) => {
			this._elContainer.classList.remove(Ch5Slider.ELEMENT_NAME + Ch5Slider.COMPONENT_DATA.TOOL_TIP_SHOW_TYPE.classListPrefix + e);
		});
		this._elContainer.classList.add(Ch5Slider.ELEMENT_NAME + Ch5Slider.COMPONENT_DATA.TOOL_TIP_SHOW_TYPE.classListPrefix + this.toolTipShowType);
		this._render();
	}

	private onOffButtonHelper() {
		let onBtn: any = null;
		let offBtn: any = null;
		if (this.range === true) {
			this._elOffContainer.classList.remove("ch5-advanced-slider-button");
			this._elOnContainer.classList.remove("ch5-advanced-slider-button");
			this.isAdvancedSlider = false;
			this._elContainer.classList.remove('ch5-advanced-slider-container');
		} else {
			const buttonSlider = this.getElementsByTagName("ch5-slider-button");
			if (buttonSlider.length === 0) {
				this._elOffContainer.classList.add("ch5-advanced-slider-button");
				this._elOnContainer.classList.add("ch5-advanced-slider-button");
				const titleSlider = this.getElementsByTagName("ch5-slider-title-label");
				if (titleSlider.length !== 0) {
					this.isAdvancedSlider = true;
					this._elContainer.classList.add('ch5-advanced-slider-container');
				} else {
					this.isAdvancedSlider = false;
					this._elContainer.classList.remove('ch5-advanced-slider-container');
				}
			} else {
				this._elOffContainer.classList.remove("ch5-advanced-slider-button");
				this._elOnContainer.classList.remove("ch5-advanced-slider-button");
				this.isAdvancedSlider = true;
				this._elContainer.classList.add('ch5-advanced-slider-container');
				Array.from(buttonSlider).forEach(btn => {
					if (btn.getAttribute("key") === 'off') {
						offBtn = btn;
						if (this.stretch && this.orientation === "horizontal") {
							btn.classList.add("ch5-slider-horizontal-stretch");
						} else if (this.orientation === "vertical" && (this.stretch === "both" || this.stretch === "width")) {
							btn.classList.add("ch5-slider-vertical-stretch");
						}
						this._elContainer.classList.add('ch5-slider-off-button');
					} else
						if (btn.getAttribute("key") === 'on') {
							onBtn = btn;
							if (this.stretch && this.orientation === "horizontal") {
								btn.classList.add("ch5-slider-horizontal-stretch");
							} else if (this.orientation === "vertical" && (this.stretch === "both" || this.stretch === "width")) {
								btn.classList.add("ch5-slider-vertical-stretch");
							}
							this._elContainer.classList.add('ch5-slider-on-button');
						}
				});
				if (onBtn) {
					this._elOnContainer.appendChild(onBtn);
				}
				if (offBtn) {
					this._elOffContainer.appendChild(offBtn);
				}
			}
		}
	}

	private titleHelper() {
		if (this.range === false) {
			const titleSlider = this.getElementsByTagName("ch5-slider-title-label");
			Array.from(titleSlider).forEach((title, index) => {
				if (index >= 1) {
					return;
				}
				if (title.parentElement instanceof Ch5Slider) {
					const sliderTtl = new Ch5SliderTitleLabel(this);
					Ch5SliderTitleLabel.observedAttributes.forEach((attr) => {
						if (title.hasAttribute(attr)) {
							sliderTtl.setAttribute(attr, title.getAttribute(attr) + '');
						}
					});
				}
				this._elContainer.classList.add('ch5-slider-title');
			});
		} else {
			this._elContainer.classList.remove('ch5-slider-title');
		}
	}

	protected helper(elem: HTMLElement, val: HTMLElement) {
		Array.from(elem.children).forEach(container => container.remove());
		elem.appendChild(val);
	}

	public setValues(elem: string, val: HTMLElement) {
		if (this.range === false) {
			if (elem === "title") {
				if (val.innerHTML !== "") {
					this._titlePresent = 1;
				} else {
					this._titlePresent = -1;
				}
				this.helper(this._elTitleContainer, val);
			} else if (elem === "on") {
				this.helper(this._elOnContainer, val);
			} else if (elem === "off") {
				this.helper(this._elOffContainer, val);
			}
		}
	}

	private handleToolTipDisplayType() {
		Array.from(Ch5Slider.COMPONENT_DATA.TOOL_TIP_DISPLAY_TYPE.values).forEach((e: any) => {
			this._elContainer.classList.remove(Ch5Slider.ELEMENT_NAME + Ch5Slider.COMPONENT_DATA.TOOL_TIP_DISPLAY_TYPE.classListPrefix + e);
		});
		this._elContainer.classList.add(Ch5Slider.ELEMENT_NAME + Ch5Slider.COMPONENT_DATA.TOOL_TIP_DISPLAY_TYPE.classListPrefix + this.toolTipDisplayType);
		this._render();
	}

	//#endregion

}

if (typeof window === "object" && typeof window.customElements === "object"
	&& typeof window.customElements.define === "function") {
	window.customElements.define(Ch5Slider.ELEMENT_NAME, Ch5Slider);
}

Ch5Slider.registerSignalAttributeTypes();
