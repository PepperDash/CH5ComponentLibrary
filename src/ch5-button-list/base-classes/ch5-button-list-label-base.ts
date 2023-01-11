import { Ch5Log } from "../../ch5-common/ch5-log";
import { Ch5ButtonList } from "./../ch5-button-list";
import { Ch5ButtonListMode } from "./../ch5-button-list-mode";
import { Ch5RoleAttributeMapping } from "../../utility-models/ch5-role-attribute-mapping";
import { ICh5ButtonListLabelDocumentation } from "./../interfaces/i-ch5-button-list-label-documentation";
import { Ch5ButtonListModeState } from "../ch5-button-list-mode-state";

export class Ch5ButtonListLabelBase extends Ch5Log implements ICh5ButtonListLabelDocumentation {

  //#region Variables

  public static ELEMENT_NAME = 'ch5-button-list-label';

  //#endregion

  //#region Component Lifecycle

  public constructor() {
    super();
    this.logger.start('constructor()', Ch5ButtonListLabelBase.ELEMENT_NAME);
    this.logger.stop();
  }

  /**
   * Called when the Ch5ButtonListLabel component is first connected to the DOM
   */
  public connectedCallback() {
    this.logger.start('connectedCallback()', Ch5ButtonListLabelBase.ELEMENT_NAME);

    if (!(this.parentElement instanceof Ch5ButtonList || this.parentElement instanceof Ch5ButtonListMode || this.parentElement instanceof Ch5ButtonListModeState)) {
      throw new Error(`Invalid parent element for ch5-button-list-label.`);
    }
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', Ch5RoleAttributeMapping.ch5ButtonListLabel);
    }
    this.setAttribute('data-ch5-id', this.getCrId());
    this.initAttributes();
    this.logger.stop();
  }

  public disconnectedCallback() {
    this.logger.start('disconnectedCallback()', Ch5ButtonListLabelBase.ELEMENT_NAME);
    this.logger.stop();
  }

  //#endregion

}
