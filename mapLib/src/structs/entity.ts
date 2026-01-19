/**
 * Entity is an attribute container with a parent.
 * It also keeps an array of event functions.
 */

import {Entity as E} from '@msagl/core/dist/structs/entity'

export abstract class Entity extends E{

  /** sets the attribute at the given position */
  setAttrProp(position: number, key: string, val: any) {
    const attributes = this.getAttr(position)
    if (attributes) {
      // if (key === 'feature') {
      //   val.entity = this
      // }
      attributes[key] = val
    }
    // force push
    // else {
    //   this.setAttr(position, {[key]: val})
    // }
  }

}
