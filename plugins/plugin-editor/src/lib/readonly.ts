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

import * as Debug from 'debug'

import { showCustom } from '@kui-shell/core/webapp/views/sidecar'
import * as repl from '@kui-shell/core/core/repl'
import { Tab } from '@kui-shell/core/webapp/cli'
const debug = Debug('plugins/editor/readonly')

/**
 * Enter read-only mode
 *
 */
export const gotoReadonlyLocalFile = ({ getEntity }) => async (tab: Tab) => {
  const entity = await getEntity(tab)
  debug('readonly', entity.name, entity)
  return repl.pexec(`open ${repl.encodeComponent(entity.filepath)}`)
}

/**
 * Enter edit mode
 *
 */
export const edit = ({ getEntity, lock = undefined }) => async (tab: Tab) => {
  const { namespace, name } = await getEntity(tab)

  return repl
    .qexec(`edit "/${namespace}/${name}"`, undefined, undefined, {
      custom: { getEntity, lock }
    })
    .then(entity => showCustom(tab, entity, {}))
}

/**
 * Render a lock/unlock icon as a mode button
 *
 */
export const lockIcon = ({
  getEntity,
  mode = 'lock', // doesn't need to be translated, as we use an icon
  label = 'Done Editing',
  // icon = 'fas fa-unlock-alt',
  tooltip = 'Return to read-only mode', // TODO externalize string
  direct = gotoReadonlyLocalFile({ getEntity })
}) => ({
  mode,
  label,
  flush: 'weak', // if we have only flush:right buttons, don't let this keep us from snapping them left
  actAsButton: true,
  // fontawesome: icon,
  balloon: tooltip,
  direct
})
