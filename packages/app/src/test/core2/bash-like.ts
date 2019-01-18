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

import { ISuite } from '@test/lib/common'
import * as common from '@test/lib/common' // tslint:disable-line:no-duplicate-imports
import * as ui from '@test/lib/ui'
const { cli, selectors, sidecar } = ui

import { unlinkSync, rmdirSync } from 'fs'

/** expect the given folder within the help tree */
export const header = folder => `Shell Docs
/
${folder}`

describe('shell commands', function (this: ISuite) {
  before(common.before(this))
  after(common.after(this))

  it('should have an active repl', () => cli.waitForRepl(this.app))

  it('should give 404 for unknown outer command', () => cli.do(`ibmcloudo target`, this.app)
    .then(cli.expectError(404))
    .catch(common.oops(this)))

  // these two are useful as a pair; git usage responds with exit code
  // 1, whereas ibmcloud responds with exit code 0
  it('should give usage for git', () => cli.do(`git`, this.app)
    .then(cli.expectError(1, 'usage: git'))
    .catch(common.oops(this)))
  it('should give usage for ibmcloud', () => cli.do(`ibmcloud`, this.app)
    .then(cli.expectError(500, header('ibmcloud')))
    .catch(common.oops(this)))

  if (!process.env.LOCAL_OPENWHISK) {
    it('should give ok for known outer command', () => cli.do(`ibmcloud target`, this.app)
       .then(cli.expectOK)
       .catch(common.oops(this)))
  }

  it('should answer which ls with /bin/ls', () => cli.do(`which ls`, this.app)
    .then(cli.expectOKWithCustom({ expect: '/bin/ls' }))
    .catch(common.oops(this)))

  it('should echo hi', () => cli.do(`echo hi`, this.app)
    .then(cli.expectOKWithCustom({ expect: 'hi' }))
    .catch(common.oops(this)))

  it('should change working directory', () => cli.do(`cd data`, this.app)
    .then(cli.expectOK)
    .catch(common.oops(this)))

  it('should list core/', () => cli.do(`ls`, this.app)
    .then(cli.expectOKWithCustom({ expect: 'core/' }))
    .catch(common.oops(this)))

  // clean up possible previous test leftovers
  try {
    unlinkSync('data/foo bar/testTmp')
  } catch (err) {
    // ok, we're just cleaning up from previous runs
  }
  try {
    rmdirSync('data/foo bar/foo2 bar2')
  } catch (err) {
    // ok, we're just cleaning up from previous runs
  }
  try {
    rmdirSync('data/foo bar')
  } catch (err) {
    // ok, we're just cleaning up from previous runs
  }

  /* it('should list directory properly that contains prefix matches', () => cli.do(`ls @demos`, this.app)
    .then(cli.expectOKWithCustom({ expect: 'try-retain.js' }))
    .catch(common.oops(this)))
  it('should list directory properly that contains prefix matches', () => cli.do(`ls @demos`, this.app)
    .then(cli.expectOKWithCustom({ expect: 'retain.js' }))
    .catch(common.oops(this)))
  it('should list directory properly that contains prefix matches', () => cli.do(`ls @demos`, this.app)
    .then(cli.expectOKWithCustom({ expect: 'try.js' }))
    .catch(common.oops(this))) */

  it('should mkdir with spaces', () => cli.do(`mkdir "foo bar"`, this.app)
    .then(cli.expectOK)
    .catch(common.oops(this)))
  it('should fail to mkdir again', () => cli.do(`mkdir "foo bar"`, this.app)
    .then(cli.expectError(409))
    .catch(common.oops(this)))

  it('should echo ho to a file', () => cli.do(`echo ho > "foo bar"/testTmp`, this.app)
    .then(cli.expectOK)
    .catch(common.oops(this)))
  it('should cat that file', () => cli.do(`cat "foo bar"/testTmp`, this.app)
    .then(cli.expectOKWithCustom({ expect: 'ho' }))
    .catch(common.oops(this)))
  it('should rm that file', () => cli.do(`rm "foo bar"/testTmp`, this.app)
    .then(cli.expectOK)
    .catch(common.oops(this)))

  it('should mkdir a subdir with spaces', () => cli.do(`mkdir "foo bar"/"foo2 bar2"`, this.app)
    .then(cli.expectOK)
    .catch(common.oops(this)))
  it('should list the new directory with spaces', () => cli.do(`lls "foo bar"`, this.app) // test the lls synonym for ls
    .then(cli.expectOKWithCustom({ expect: 'foo2 bar2' }))
    .catch(common.oops(this)))
  it('should rmdir a subdir with spaces', () => cli.do(`rmdir "foo bar"/"foo2 bar2"`, this.app)
    .then(cli.expectOK)
    .catch(common.oops(this)))
  it('should rmdir a dir with spaces', () => cli.do(`rmdir "foo bar"`, this.app)
    .then(cli.expectOK)
    .catch(common.oops(this)))
})