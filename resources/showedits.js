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

function previewDiff()
{
  function finish(result)
  {
    if (result)
      location.href = "/showcommit?sha1=" + result.sha1 + "&review=" + critic.review.id + "&editspreview=yes";
  }

  var operation = new critic.Operation({ action: "perform edits",
                                         url: "FiddleAndTweak/performedits",
                                         data: { review_id: critic.review.id,
                                                 mode: "preview" },
                                         wait: "Preparing preview; please wait...",
                                         callback: finish });

  operation.execute();
}

function refineEdit(edit)
{
  editLines("refine", edit);
}

function discardEdits(edits)
{
  function discardOne()
  {
    var edit = edits.pop();

    var operation = new critic.Operation(
      { action: "discard edit",
        url: "FiddleAndTweak/savelines",
        data: { review_id: critic.review.id,
                repository_id: critic.repository.id,
                path: edit.path,
                sha1: edit.sha1,
                lineIndex: edit.lineIndex,
                lineCount: edit.lineCount,
                mode: "discard" },
        callback: finishedOne });

    operation.execute();
  }

  function finishedOne(result)
  {
    if (result && edits.length)
      discardOne();
    else
      location.reload();
  }

  discardOne();
}
