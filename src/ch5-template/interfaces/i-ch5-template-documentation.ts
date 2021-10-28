// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

import { ICh5TemplateAttributes } from ".";
import { ICh5Common } from "../../ch5-common/interfaces";

/**
 * @name Ch5 Template
 * @isattribute false
 * @tagName ch5-template
 * @role template
 * @description ch5-template create new instances of the user provided <template>.
 * @componentVersion 1.0.0
 * @documentation
 * [
 *   "`ch5-template` element",
 *   "***",
 *   "The primary functionality of this component is to create new instances ",
 *   "of the user-provided <template> and to substitute event and state names ",
 *   "where indicated by the developer.  ",
 *   "Upon completion of creating a new instance of the the user-provided ",
 *   "<template>, a container element is provided with a unique ",
 *   "id attribute that is unique across all created instances.  ",
 *   "Each top level element provided in user-provided <template> will ",
 *   "also be provided a unique id, unless the element already has an id. "
 * ]
 * @snippets
 * [
 *   {
 *       "prefix": "ch5-template:default",
 *       "description": "Crestron Ch5-Template (default)",
 *       "body": [
 *           "<ch5-template templateId=\"[provideTemplateId]\" context=\"[original]:[replacement]\"></ch5-template>"
 *      ]
 *     }
 * ]
 *
 */
 export interface ICh5TemplateDocumentation extends ICh5Common, ICh5TemplateAttributes {
}