/* -*- mode: js; js-indent-level: 2; indent-tabs-mode: nil -*-

 Copyright 2013 Jens Lindström, Opera Software ASA

 Licensed under the Apache License, Version 2.0 (the "License"); you may not
 use this file except in compliance with the License.  You may obtain a copy of
 the License at

   http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 License for the specific language governing permissions and limitations under
 the License.

*/

"use strict";

function main(path, query)
{
  if (query.params.review)
  {
    writeln("stylesheet %s", JSON.stringify("/extension-resource/FiddleAndTweak/common.css"));
    writeln("stylesheet %s", JSON.stringify("/extension-resource/FiddleAndTweak/showcommit.css"));
    writeln("script %s", JSON.stringify("/extension-resource/FiddleAndTweak/common.js"));
    writeln("script %s", JSON.stringify("/extension-resource/FiddleAndTweak/showcommit.js"));

    if (query.params.editspreview == "yes")
      writeln("script %s", JSON.stringify("/FiddleAndTweak/editspreview.js?review=" + query.params.review));
  }
}
