import { Ch5Common } from "../ch5-common/ch5-common";
import { Ch5RoleAttributeMapping } from "../utility-models/ch5-role-attribute-mapping";
import { Ch5SignalAttributeRegistry, Ch5SignalElementAttributeRegistryEntries } from "../ch5-common/ch5-signal-attribute-registry";
import { TCh5TextHorizontalAlignment, TCh5TextVerticalAlignment, } from './interfaces/t-ch5-text';
import { ICh5TextAttributes } from './interfaces/i-ch5-text-attributes';
import { Ch5Properties } from "../ch5-core/ch5-properties";
import { ICh5PropertySettings } from "../ch5-core/ch5-property";
import { resizeObserver } from "../ch5-core/resize-observer";
import { subscribeInViewPortChange } from "../ch5-core";

export class Ch5Text extends Ch5Common implements ICh5TextAttributes {

  //#region Variables

  public static readonly HORIZONTAL_ALIGNMENT: TCh5TextHorizontalAlignment[] = ['center', 'left', 'right'];
  public static readonly VERTICAL_ALIGNMENT: TCh5TextVerticalAlignment[] = ['middle', 'top', 'bottom'];
  public static readonly COMPONENT_DATA: any = {
    HORIZONTAL_ALIGNMENT: {
      default: Ch5Text.HORIZONTAL_ALIGNMENT[0],
      values: Ch5Text.HORIZONTAL_ALIGNMENT,
      key: 'horizontalAlignment',
      attribute: 'horizontalAlignment',
      classListPrefix: '--horizontal-alignment-'
    },
    VERTICAL_ALIGNMENT: {
      default: Ch5Text.VERTICAL_ALIGNMENT[0],
      values: Ch5Text.VERTICAL_ALIGNMENT,
      key: 'verticalAlignment',
      attribute: 'verticalAlignment',
      classListPrefix: '--vertical-alignment-'
    },
  };
  public static readonly SIGNAL_ATTRIBUTE_TYPES: Ch5SignalElementAttributeRegistryEntries = {
    ...Ch5Common.SIGNAL_ATTRIBUTE_TYPES,
    receivestatelabel: { direction: "state", stringJoin: 1, contractName: true },
    receivestatescriptlabelhtml: { direction: "state", stringJoin: 1, contractName: true },
  };

  public static readonly COMPONENT_PROPERTIES: ICh5PropertySettings[] = [
    {
      default: Ch5Text.HORIZONTAL_ALIGNMENT[0],
      enumeratedValues: Ch5Text.HORIZONTAL_ALIGNMENT,
      name: "horizontalAlignment",
      removeAttributeOnNull: true,
      type: "enum",
      valueOnAttributeEmpty: Ch5Text.HORIZONTAL_ALIGNMENT[0],
      isObservableProperty: true,
    },
    {
      default: Ch5Text.VERTICAL_ALIGNMENT[0],
      enumeratedValues: Ch5Text.VERTICAL_ALIGNMENT,
      name: "verticalAlignment",
      removeAttributeOnNull: true,
      type: "enum",
      valueOnAttributeEmpty: Ch5Text.VERTICAL_ALIGNMENT[0],
      isObservableProperty: true,
    },
    {
      default: false,
      name: "multilineSupport",
      removeAttributeOnNull: true,
      type: "boolean",
      valueOnAttributeEmpty: true,
      isObservableProperty: true,
    },
    {
      default: false,
      name: "truncateText",
      removeAttributeOnNull: true,
      type: "boolean",
      valueOnAttributeEmpty: true,
      isObservableProperty: true,
    },
    {
      default: "",
      name: "label",
      nameForSignal: "receiveStateLabel",
      removeAttributeOnNull: true,
      type: "string",
      valueOnAttributeEmpty: "",
      isObservableProperty: true,
    },
    {
      default: "",
      isSignal: true,
      name: "receiveStateLabel",
      signalType: "string",
      removeAttributeOnNull: true,
      type: "string",
      valueOnAttributeEmpty: "",
      isObservableProperty: true,
    },
    {
      default: "",
      isSignal: true,
      name: "receiveStateScriptLabelHtml",
      signalType: "string",
      removeAttributeOnNull: true,
      type: "string",
      valueOnAttributeEmpty: "",
      isObservableProperty: true,
    },
    {
      default: "",
      name: "labelInnerHtml",
      removeAttributeOnNull: true,
      type: "string",
      valueOnAttributeEmpty: "",
      isObservableProperty: true,
    },
  ];

  public static readonly ELEMENT_NAME = 'ch5-text';

  public primaryCssClass = 'ch5-text';

  private _ch5Properties: Ch5Properties;
  private _elContainer: HTMLElement = {} as HTMLElement;
  private _elSpan: HTMLElement = {} as HTMLElement;
  public templateElement: HTMLTemplateElement = {} as HTMLTemplateElement;
  private scriptLabelHtml: string = '';

  //#endregion

  //#region Getters and Setters


  public set horizontalAlignment(value: TCh5TextHorizontalAlignment) {
    this._ch5Properties.set<TCh5TextHorizontalAlignment>("horizontalAlignment", value, () => {
      this.handleHorizontalAlignment();
    });
  }
  public get horizontalAlignment(): TCh5TextHorizontalAlignment {
    return this._ch5Properties.get<TCh5TextHorizontalAlignment>("horizontalAlignment");
  }

  public set verticalAlignment(value: TCh5TextVerticalAlignment) {
    this._ch5Properties.set<TCh5TextVerticalAlignment>("verticalAlignment", value, () => {
      this.handleVerticalAlignment();
    });
  }
  public get verticalAlignment(): TCh5TextVerticalAlignment {
    return this._ch5Properties.get<TCh5TextVerticalAlignment>("verticalAlignment");
  }

  public set multilineSupport(value: boolean) {
    this._ch5Properties.set<boolean>("multilineSupport", value, () => {
      this.debounceHandleMultilineSupport();
    });
  }

  public debounceHandleMultilineSupport = this.debounce(() => {
    this.handleMultilineSupport();
  }, 150);

  public get multilineSupport(): boolean {
    return this._ch5Properties.get<boolean>("multilineSupport");
  }

  public set truncateText(value: boolean) {
    this._ch5Properties.set<boolean>("truncateText", value, () => {
      this.handleTruncateText();
    });
  }
  public get truncateText(): boolean {
    return this._ch5Properties.get<boolean>("truncateText");
  }

  public set label(value: string) {
    this._ch5Properties.set<string>("label", value, () => {
      this.label = this._getTranslatedValue('label', this.label);
      this.handleLabel();
    });
  }
  public get label(): string {
    return this._ch5Properties.get<string>("label");
  }

  public set receiveStateLabel(value: string) {
    this._ch5Properties.set("receiveStateLabel", value, null, (newValue: string) => {
      this._ch5Properties.setForSignalResponse<string>("label", newValue, () => {
        this.handleLabel();
      });
    });
  }
  public get receiveStateLabel(): string {
    return this._ch5Properties.get<string>('receiveStateLabel');
  }

  public set labelInnerHtml(value: string) {
    this._ch5Properties.set<string>("labelInnerHtml", value, () => {
      this.handleLabel();
    });
  }
  public get labelInnerHtml(): string {
    return this._ch5Properties.get<string>("labelInnerHtml");
  }

  public set receiveStateScriptLabelHtml(value: string) {
    this._ch5Properties.set("receiveStateScriptLabelHtml", value, null, (newValue: string) => {
      this.scriptLabelHtml = newValue;
      this.handleLabel();
    });
  }
  public get receiveStateScriptLabelHtml(): string {
    return this._ch5Properties.get<string>("receiveStateScriptLabelHtml");
  }



  //#endregion

  //#region Static Methods

  public static registerSignalAttributeTypes() {
    Ch5SignalAttributeRegistry.instance.addElementAttributeEntries(Ch5Text.ELEMENT_NAME, Ch5Text.SIGNAL_ATTRIBUTE_TYPES);
  }

  public static registerCustomElement() {
    if (typeof window === "object"
      && typeof window.customElements === "object"
      && typeof window.customElements.define === "function"
      && window.customElements.get(Ch5Text.ELEMENT_NAME) === undefined) {
      window.customElements.define(Ch5Text.ELEMENT_NAME, Ch5Text);
    }
  }

  //#endregion

  //#region Component Lifecycle

  public constructor() {
    super();
    this.logger.start('constructor()', Ch5Text.ELEMENT_NAME);
    this.ignoreAttributes = ["appendclasswheninviewport", "receivestateshowpulse", "receivestatehidepulse", "sendeventonshow",];
    if (!this._wasInstatiated) {
      this.createInternalHtml();
    }
    this._wasInstatiated = true;
    this._ch5Properties = new Ch5Properties(this, Ch5Text.COMPONENT_PROPERTIES);
    this.updateCssClass();
  }

  public static get observedAttributes(): string[] {
    const inheritedObsAttrs = Ch5Common.observedAttributes;
    const newObsAttrs: string[] = [];
    for (let i: number = 0; i < Ch5Text.COMPONENT_PROPERTIES.length; i++) {
      if (Ch5Text.COMPONENT_PROPERTIES[i].isObservableProperty === true) {
        newObsAttrs.push(Ch5Text.COMPONENT_PROPERTIES[i].name.toLowerCase());
      }
    }
    return inheritedObsAttrs.concat(newObsAttrs);
  }

  public attributeChangedCallback(attr: string, oldValue: string, newValue: string): void {
    this.logger.start("attributeChangedCallback", this.primaryCssClass);
    if (oldValue !== newValue) {
      this.logger.log('ch5-text attributeChangedCallback("' + attr + '","' + oldValue + '","' + newValue + '")');
      const attributeChangedProperty = Ch5Text.COMPONENT_PROPERTIES.find((property: ICh5PropertySettings) => { return property.name.toLowerCase() === attr.toLowerCase() && property.isObservableProperty === true });
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
   * Called when the Ch5Text component is first connected to the DOM
   */
  public connectedCallback() {
    this.logger.start('connectedCallback()', Ch5Text.ELEMENT_NAME);
    subscribeInViewPortChange(this, () => {
      if (this.elementIsInViewPort) {
        this.debounceHandleMultilineSupport();
      }
    });
    // WAI-ARIA Attributes
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', Ch5RoleAttributeMapping.ch5Text);
    }
    if (this._elContainer.parentElement !== this) {
      this._elContainer.classList.add('ch5-text');
      this.appendChild(this._elContainer);
    }
    this.attachEventListeners();
    this.initAttributes();
    this.initCommonMutationObserver(this);

    customElements.whenDefined('ch5-text').then(() => {
      this.componentLoadedEvent(Ch5Text.ELEMENT_NAME, this.id);
      this.handleLabel(); // This is important in case where label is missing in parent and template tag exists
    });
    this.logger.stop();
  }

  public disconnectedCallback() {
    this.logger.start('disconnectedCallback()');
    this.removeEventListeners();
    this.unsubscribeFromSignals();
    this.logger.stop();
  }

  //#endregion

  //#region Protected / Private Methods

  protected createInternalHtml() {
    this.logger.start('createInternalHtml()');
    this.clearComponentContent();
    this._elContainer = document.createElement('div');
    this._elSpan = document.createElement('span');
    this._elSpan.classList.add(this.primaryCssClass + '--span');
    this._elContainer.appendChild(this._elSpan);
    this.logger.stop();
  }

  protected initAttributes() {
    super.initAttributes();

    const thisRef: any = this;
    for (let i: number = 0; i < Ch5Text.COMPONENT_PROPERTIES.length; i++) {
      if (Ch5Text.COMPONENT_PROPERTIES[i].isObservableProperty === true) {
        if (this.hasAttribute(Ch5Text.COMPONENT_PROPERTIES[i].name.toLowerCase())) {
          const key = Ch5Text.COMPONENT_PROPERTIES[i].name;
          thisRef[key] = this.getAttribute(key);
        }
      }
    }
  }

  protected attachEventListeners() {
    super.attachEventListeners();
    resizeObserver(this._elContainer, this.onWindowResizeHandler.bind(this));
  }

  protected removeEventListeners() {
    super.removeEventListeners();
    // TODO - destroy resize observer
  }

  protected unsubscribeFromSignals() {
    super.unsubscribeFromSignals();
    this._ch5Properties.unsubscribe();
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

  private handleHorizontalAlignment() {
    Array.from(Ch5Text.COMPONENT_DATA.HORIZONTAL_ALIGNMENT.values).forEach((e: any) => {
      this._elSpan.classList.remove(this.primaryCssClass + Ch5Text.COMPONENT_DATA.HORIZONTAL_ALIGNMENT.classListPrefix + e);
    });
    this._elSpan.classList.add(this.primaryCssClass + Ch5Text.COMPONENT_DATA.HORIZONTAL_ALIGNMENT.classListPrefix + this.horizontalAlignment);
  }

  private handleVerticalAlignment() {
    Array.from(Ch5Text.COMPONENT_DATA.VERTICAL_ALIGNMENT.values).forEach((e: any) => {
      this._elContainer.classList.remove(this.primaryCssClass + Ch5Text.COMPONENT_DATA.VERTICAL_ALIGNMENT.classListPrefix + e);
    });
    this._elContainer.classList.add(this.primaryCssClass + Ch5Text.COMPONENT_DATA.VERTICAL_ALIGNMENT.classListPrefix + this.verticalAlignment);
  }

  private handleMultilineSupport() {
    ['true', 'false'].forEach((e: any) => {
      this._elSpan.classList.remove(this.primaryCssClass + '--multiline-support-' + e);
    });
    this._elSpan.classList.add(this.primaryCssClass + '--multiline-support-' + this.multilineSupport.toString());
    if (this.multilineSupport) {
      this.fitEllipsisForMultiline();
    }
  }

  private handleTruncateText() {
    ['true', 'false'].forEach((e: any) => {
      this._elSpan.classList.remove(this.primaryCssClass + '--truncate-text-' + e);
    });
    this._elSpan.classList.add(this.primaryCssClass + '--truncate-text-' + this.truncateText.toString());
    if (this.multilineSupport) {
      this.fitEllipsisForMultiline();
    } else {
      this._elSpan.style.removeProperty('word-wrap');
      this._elSpan.style.removeProperty('display');
      this._elSpan.style.removeProperty('max-height');
    }
  }

  private handleLabel() {
    if (!(this.templateElement instanceof HTMLTemplateElement)) {
      this.templateElement = this.getElementsByTagName('template')[0] as HTMLTemplateElement;
    }
    Array.from(this._elSpan.children).forEach(container => container.remove());

    this._elSpan.innerText = '';
    if (this.receiveStateScriptLabelHtml !== null && this.receiveStateScriptLabelHtml.trim() !== "") {
      this._elSpan.innerHTML = this.decodeInnerHTMLForAttribute(this.scriptLabelHtml);
    } else if (this.receiveStateLabel !== null && this.receiveStateLabel.trim() !== "") {
      this._elSpan.innerText = this.label;
    } else if (Ch5Common.isNotNil(this.labelInnerHtml)) {
      this._elSpan.innerHTML = this.decodeInnerHTMLForAttribute(this.labelInnerHtml);
    } else if (this.templateElement instanceof HTMLTemplateElement) {
      const documentContainer: HTMLTemplateElement = document.createElement('template');
      documentContainer.innerHTML = this.templateElement.innerHTML;
      this._elSpan.appendChild(((documentContainer as HTMLTemplateElement).content));
    } else {
      this._elSpan.innerText = this.label;
    }
  }

  private decodeInnerHTMLForAttribute(innerHTML: string) {
    return innerHTML.replace('&amp;', "&")
      .replace('&lt;', "<")
      .replace('&gt;', ">")
      .replace('&quot;', '/"')
      .replace("&apos;", "/'");
  }

  private updateCssClass() {
    this.logger.start('UpdateCssClass');
    super.updateCssClasses();
    this._elSpan.classList.add(this.primaryCssClass + Ch5Text.COMPONENT_DATA.HORIZONTAL_ALIGNMENT.classListPrefix + this.horizontalAlignment);
    this._elContainer.classList.add(this.primaryCssClass + Ch5Text.COMPONENT_DATA.VERTICAL_ALIGNMENT.classListPrefix + this.verticalAlignment);
    this._elSpan.classList.add(this.primaryCssClass + '--multiline-support-' + this.multilineSupport.toString());
    this._elSpan.classList.add(this.primaryCssClass + '--truncate-text-' + this.truncateText.toString());
    this.logger.stop();
  }

  protected getTargetElementForCssClassesAndStyle(): HTMLElement {
    return this._elContainer;
  }

  public getCssClassDisabled() {
    return this.primaryCssClass + '--disabled';
  }

  public fitEllipsisForMultiline() {
    let numberOfLines = 0;
    const lineHeight = this.getLineHeightSuper(this._elSpan);
    const topAndBottomPadding = 20;
    const containerHeight = this.getContainerHeight(this._elContainer) - topAndBottomPadding;
    if (containerHeight < lineHeight) {
      numberOfLines = 1
    } else {
      numberOfLines = Math.floor(containerHeight / lineHeight);
    }
    if (this.truncateText) {
      this._elSpan.setAttribute("style", "-webkit-line-clamp:" + numberOfLines);
    } else {
      this._elSpan.setAttribute("style", "max-height: " + (numberOfLines * lineHeight) + "px" + ";");
      // this._elSpan.setAttribute("style", "max-height: " + (numberOfLines * lineHeight) + "px" + ";word-wrap: break-word; display: flex;");
    }
  }

  // TODO - why is this public and not used
  public getLineHeight(el: HTMLElement) {
    return window.getComputedStyle(el).lineHeight;
  }

  // TODO - why is this public 
  public getLineHeightSuper(element: HTMLElement) {
    const oldHtml = element.innerHTML;
    element.innerHTML = "&nbsp;";
    const lineHeight = element.offsetHeight;
    element.innerHTML = oldHtml;
    return lineHeight;
  }

  public getContainerHeight(element: HTMLElement) {
    return element.clientHeight;
  }

  private onWindowResizeHandler() {
    this.debounceHandleMultilineSupport();
  }

  //#endregion

}

Ch5Text.registerCustomElement();
Ch5Text.registerSignalAttributeTypes();
