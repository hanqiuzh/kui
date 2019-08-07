/*
 * Copyright 2018 IBM Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { language } from './file-types'
import { save, revert } from './persisters'

/**
 * Prepare a response for the REPL. Consumes the output of
 * updateEditor
 *
 */
export const respondToRepl = (extraModes = [], displayOptions = []) => ({ getEntity, editor, content, eventBus }) => ({
  type: 'custom',
  content,
  controlHeaders: ['.header-right-bits'],
  displayOptions: [`entity-is-${getEntity().type}`, 'edit-mode'].concat(displayOptions),
  badges: [{ title: language(getEntity().exec.kind), css: 'is-kind-like' }],
  noZoom: true,
  modes: [save({ getEntity, editor, eventBus }), revert({ getEntity, editor, eventBus })].concat(
    extraModes.map(modeFn => modeFn({ getEntity, editor, eventBus }))
  )
})
