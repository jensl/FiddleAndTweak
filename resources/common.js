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

var added_ShowEdits_button = false;

function editLines(mode, data)
{
  var request_data = { review_id: critic.review.id,
                       repository_id: critic.repository.id,
                       sha1: data.sha1,
                       lineIndex: data.lineIndex,
                       lineCount: data.lineCount,
                       mode: mode };

  if ("path" in data)
    request_data.path = data.path;
  else
    request_data.file_id = data.file_id;

  function openDialog(result)
  {
    if (!result)
      return;

    var dialog = $("<div class='editlines' title='Edit Lines'><div class='text'><textarea></textarea></div></div>");

    dialog.find("textarea").val(result.lines.join("\n"));

    function resize()
    {
      var textarea = dialog.find("textarea");
      var text = dialog.find(".text");
      var available = dialog.innerHeight();

      available -= parseInt(dialog.css("padding-top")) + parseInt(dialog.css("padding-bottom"));
      available -= parseInt(text.css("margin-top")) + parseInt(text.css("padding-top")) + parseInt(text.css("padding-bottom")) + parseInt(text.css("margin-bottom"));

      dialog.find("textarea").height(available);
    }

    function save()
    {
      request_data.lines = dialog.find("textarea").val().split(/\n/g);

      function finish(result)
      {
        if (result)
        {
          if (mode == "initial" && !added_ShowEdits_button)
          {
            critic.buttons.add({ title: "Show Edits",
                                 href: "/FiddleAndTweak/showedits?review=" + critic.review.id,
                                 scope: "global" });
            added_ShowEdits_button = true;
          }

          dialog.dialog("close");

          if (mode == "refine")
            location.reload();
        }
      }

      var operation = new critic.Operation({ action: "save edit",
                                             url: "FiddleAndTweak/savelines",
                                             data: request_data,
                                             wait: "Saving edit ...",
                                             callback: finish });

      operation.execute();
    }

    function cancel()
    {
      dialog.dialog("close");
    }

    dialog.dialog({ width: 800, height: 400,
                    buttons: { Save: save,
                               Cancel: cancel },
                    closeOnEscape: false,
                    resize: resize });

    resize();

    success = true;
  }

  if (mode == "initial")
  {
    var operation = new critic.Operation({ action: "get lines",
                                           url: "FiddleAndTweak/getlines",
                                           data: request_data,
                                           callback: openDialog });

    operation.execute();
  }
  else
    openDialog(data);

  return true;
}

function addShowEdits()
{
  function handleReviewState(result)
  {
    if (result && result.files && Object.keys(result.files).length != 0)
    {
      critic.buttons.add({ title: "Show Edits",
                           href: "/FiddleAndTweak/showedits?review=" + critic.review.id,
                           scope: "global" });
      added_ShowEdits_button = true;
    }
  }

  if (critic.review)
  {
    var operation = new critic.Operation(
      { action: "fetch review state",
        url: "FiddleAndTweak/reviewstate",
        data: { review_id: critic.review.id },
        callback: handleReviewState });

    operation.execute();
  }
}
