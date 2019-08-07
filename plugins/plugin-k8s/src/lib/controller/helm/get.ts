/*
 * Copyright 2019 IBM Corporation
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

import { safeDump } from 'js-yaml'
import { exec } from 'child_process'

import { EvaluatorArgs } from '@kui-shell/core/models/command'
import { MetadataBearing } from '@kui-shell/core/models/entity'
import { MetadataBearingByReference } from '@kui-shell/core/webapp/views/sidecar'

import { _helm } from '../kubectl'
import pickHelmClient from '../../util/discovery/helm-client'

const basic = /REVISION:\s+(\S+)[\n\r]+RELEASED:\s+([^\n\r]+)[\n\r]+CHART:\s+(\S+)/

const debug = Debug('k8s/controller/helm/get')

function getBasicInfo(releaseName: string): Promise<MetadataBearing> {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    const helm = await pickHelmClient(process.env)
    const cmd = `${helm} get ${releaseName}`
    debug('cmd', cmd)

    exec(cmd, { shell: process.env._SHELL ? process.env._SHELL : undefined }, (err, stdout, stderr) => {
      if (stderr) {
        console.error(stderr)
      }
      if (err) {
        reject(err)
      } else {
        const match = stdout.match(basic)
        const revision = match[1]
        const creationTimestamp = match[2]
        const chart = match[3]

        resolve({
          kind: 'helm',
          metadata: {
            name: chart,
            generation: revision,
            creationTimestamp
          }
        })
      }
    })
  })
}

export default async function helmGet(args: EvaluatorArgs) {
  const idx = args.argvNoOptions.indexOf('get')

  const maybeVerb = args.argvNoOptions[idx + 1]
  if (maybeVerb === 'hooks' || maybeVerb === 'manifest' || maybeVerb === 'notes' || maybeVerb === 'values') {
    debug('delegating to underlining helm')
    return _helm(args)
  }

  const releaseName = maybeVerb
  debug('releaseName', releaseName)
  const basicInfo = await getBasicInfo(releaseName)

  const response: MetadataBearingByReference = {
    type: 'custom',
    isEntity: true,
    kind: 'helm',
    createdOnString: 'Released on ',
    content: safeDump(basicInfo),
    resource: basicInfo,
    contentType: 'yaml',
    modes: [
      { mode: 'Summary', direct: args.command, defaultMode: true },
      { mode: 'status', direct: `helm status ${releaseName}`, leaveBottomStripeAlone: true },
      { mode: 'hooks', direct: `helm get hooks ${releaseName}`, leaveBottomStripeAlone: true },
      { mode: 'manifest', direct: `helm get manifest ${releaseName}`, leaveBottomStripeAlone: true },
      { mode: 'values', direct: `helm get values ${releaseName}`, leaveBottomStripeAlone: true },
      { mode: 'notes', direct: `helm get notes ${releaseName}`, leaveBottomStripeAlone: true }
    ]
  }

  return response
}
