import * as mycolorpicker from "@raghavendradabbir/mycolorpicker";
import { Subject } from "rxjs";
import Ch5ColorUtils from "../ch5-common/utils/ch5-color-utils";

export class ColorPicker {

  private joe: any = null;

  /**
   * An RxJs observable for the colorChanged property.
   */
  public colorChanged: Subject<number[]>;

  constructor(public pickerId: string, newColor: string) {
    this.colorChanged = new Subject<number[]>();
    try {
      // 'currentColor',
      // 'hex'
      this.joe = mycolorpicker.hsl(this.pickerId, newColor, [
      ]).on('change', (c: any) => {
        // const complement = this.invertHex(c.hex());
        const thisColorDiv = document.getElementById(this.pickerId);
        if (thisColorDiv) {
          const queryObj = thisColorDiv.querySelectorAll<HTMLElement>('.oned')[0].querySelectorAll<HTMLElement>('.shape')[0];
          queryObj.style.backgroundColor = "#d8d8d8"; // c.css();
          queryObj.style.borderColor = "#696969"; // complement;
          const extrasObject = thisColorDiv.querySelectorAll<HTMLElement>('.extras')[0];
          extrasObject.style.display = "none";
        }
        const colorObj: any = Ch5ColorUtils.rgbToObj(c.css());
        this.colorChanged?.next([colorObj.red, colorObj.green, colorObj.blue]);
      }).update();
      
      // this.joe.set =  (c: any) => {
      //   console.log("C", c);
      // }
    } catch (e) {
      // Do Nothing
    }
  }

  private invertHex(hex: string) {
    return '#' + hex.match(/[a-f0-9]{2}/ig)?.map(e => (255 - parseInt(e, 16) || 0).toString(16).replace(/^([a-f0-9])$/, '0$1')).join(''); // (Number(`0x1${hex}`) ^ 0xFFFFFF).toString(16).substr(1).toUpperCase()
  }

  public setColor(newColor: string) {
    try {
      this.joe.set(newColor);
    } catch (e) {
      // Do Nothing
    }
  }

  public get picker() {
    return this.joe;
  }

}