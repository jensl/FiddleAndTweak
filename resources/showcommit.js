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

function pushToReview()
{
  var fixup = "", message = "";

  function fixupHeader(commit)
  {
    if (FiddleAndTweak.fixupStyle == "sha1")
      return "fixup! " + commit.sha1 + "\n\n";
    else
      return "fixup! " + commit.summary + "\n\n";
  }

  if (FiddleAndTweak.commits.length > 1)
  {
    fixup = "<b>Fixup of:</b><br><select width=100% style='background-color: white; font-family: monospace'><option value=''>Select a reference commit</option>";

    for (var index = 0; index < FiddleAndTweak.commits.length; ++index)
    {
      var commit = FiddleAndTweak.commits[index];
      var summary = commit.summary;

      if (summary.length > 75)
        summary = summary.substring(0, 72) + "...";

      fixup += "<option value='" + critic.html.escape(fixupHeader(commit), true) + "'>" + critic.html.escape(summary) + "</option>";
    }

    fixup += "</select><br>";
  }
  else if (FiddleAndTweak.commits.length == 1)
    message = fixupHeader(FiddleAndTweak.commits[0]);

  var dialog = $("<div title='Push To Review'>" + fixup + "<b>Commit message:</b><br><textarea cols=75 rows=10 style='font-family: monospace'>" + message + "</textarea></div>");
  var select = dialog.find("select");
  var textarea = dialog.find("textarea");

  select.change(function ()
                {
                  var message = textarea.val();
                  message = message.replace(/^fixup! [^\n]*\n{0,2}/, "");
                  if (select.val())
                    message = select.val() + message;
                  textarea.val(message);
                });

  function push()
  {
    function finish(result)
    {
      if (result)
      {
        dialog.dialog("close");
        location.href = "/showcommit?sha1=" + result.sha1 + "&review=" + critic.review.id;
      }
    }

    var operation = new critic.Operation({ action: "perform edits",
                                           url: "FiddleAndTweak/performedits",
                                           data: { review_id: critic.review.id,
                                                   mode: "push",
                                                   message: dialog.find("textarea").val() },
                                           wait: "Pushing changes; please wait...",
                                           callback: finish });

    operation.execute();
  }

  function cancel()
  {
    dialog.dialog("close");
  }

  $(document.body).append(dialog);

  dialog.dialog({ width: Math.max(400, select.width(), textarea.width()) + 100,
                  buttons: { "Push Changes": push, Cancel: cancel } });
}

function commentDialogHook(data)
{
  if (data.context == "file")
    return [{ title: "Edit Code", callback: function () { return editLines("initial", data); } }];
  else
    return null;
}

$(function ()
  {
    if (location.href.indexOf("&editspreview=yes") != -1)
      critic.buttons.add({ title: "Push To Review", onclick: "pushToReview()", scope: "global" });
    else if (critic.review)
      addShowEdits();

    critic.hooks.add("create-comment", commentDialogHook);
    critic.hooks.add("display-comment", commentDialogHook);
  });
