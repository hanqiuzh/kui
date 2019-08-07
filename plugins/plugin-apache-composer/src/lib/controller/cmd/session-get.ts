/*
 * Copyright 2018-19 IBM Corporation
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

import * as repl from '@kui-shell/core/core/repl'
import { CommandRegistrar } from '@kui-shell/core/models/command'
import { ActivationListTable } from '@kui-shell/plugin-openwhisk/lib/views/cli/activations/list'

import { synonyms } from '@kui-shell/plugin-openwhisk/lib/models/synonyms'

import { sessionGet } from '../../utility/usage'
import * as view from '../../view/entity-view'

export default async (commandTree: CommandRegistrar) => {
  commandTree.listen(
    `/wsk/session/result`,
    ({ command }) => {
      return repl.qfexec(command.replace('session result', 'activation get')).then(result => result.response.result)
    },
    { usage: sessionGet('result') }
  )

  /* command handler for session get */
  commandTree.listen(
    `/wsk/session/get`,
    ({ command, parsedOptions }) => {
      if (parsedOptions.last || parsedOptions['last-failed']) {
        return repl
          .qfexec('activation list --limit 200')
          .then((activations: ActivationListTable) => activations.body)
          .then(activations => {
            return activations.find(activation => {
              if (
                activation.annotations &&
                activation.annotations.find(({ key, value }) => key === 'conductor' && value)
              ) {
                // find session
                if (parsedOptions['last-failed']) {
                  // handle 'session get --last-failed'
                  if (activation.statusCode !== 0) {
                    if (typeof parsedOptions['last-failed'] === 'string') {
                      // handle 'session get --last-failed [appName]'
                      if (activation.name === parsedOptions['last-failed']) return activation
                    } else {
                      return activation // handle 'session get --last'
                    }
                  }
                } else {
                  // handle 'session get --last'
                  if (typeof parsedOptions.last === 'string') {
                    if (activation.name === parsedOptions.last) return activation // handle 'session get --last [appName]'
                  } else {
                    return activation // handle 'session get --last'
                  }
                }
              }
            })
          })
          .then(activation => {
            return repl.qfexec(`session get ${activation.activationId}`)
          })
          .catch(err => err)
      } else {
        return repl.qfexec(command.replace('session', 'activation'))
      }
    },
    { usage: sessionGet('get') }
  )

  // override wsk activation get
  const activationGet = (await commandTree.find('/wsk/activation/get')).$
  synonyms('activations').forEach(syn => {
    commandTree.listen(
      `/wsk/${syn}/get`,
      opts => {
        if (!activationGet) {
          return Promise.reject(new Error())
        }
        const last = opts.parsedOptions.last

        if (last) {
          return repl
            .qexec(`wsk activation list --limit 1` + (typeof last === 'string' ? ` --name ${last}` : ''))
            .then((activations: ActivationListTable) => activations.body)
            .then(activations => {
              if (activations.length === 0) {
                throw new Error('No such activation found')
              } else {
                return repl.qexec(`wsk activation get ${activations[0].activationId}`)
              }
            })
        }

        return activationGet(opts)
          .then(response => view.formatSessionGet(response))
          .catch(err => {
            throw err
          })
      },
      {}
    )
  })
}
