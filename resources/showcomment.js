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

$(function ()
  {
    addShowEdits();

    function edit(ev)
    {
      var chain_id = parseInt($(ev.currentTarget).parents(".comment-chain").attr("id").substring(1));
      var chain = commentChainById[chain_id];
      var lines = chain.lines;

      editLines("initial", { file_id: lines.file,
                             sha1: lines.sha1,
                             lineIndex: lines.firstLine - 1,
                             lineCount: lines.lastLine - lines.firstLine + 1 });
    }

    critic.buttons.add({ title: "Edit Code",
                         onclick: edit,
                         scope: "comment" });
  });
