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
    function simpleMoveRebase()
    {
      var content = $("<div class='enabletracking' title='Simple Move Rebase'>" +
                      "<p><b>Upstream branch name:</b><br><input></p></div>");
      var upstream_name = content.find("input");

      upstream_name
        .val("refs/heads/master");

      function finished(result)
      {
        if (result)
          location.href = "/r/" + critic.review.id;
      }

      function perform()
      {
        var operation = new critic.Operation(
          { action: "rebase review",
            url: "FiddleAndTweak/performrebase",
            data: { review_id: critic.review.id,
                    upstream: upstream_name.val().trim() },
            wait: "Performing rebase...",
            callback: finished });

        operation.execute();
      }

      function cancel()
      {
        content.dialog("close");
      }

      var buttons = {
        "Perform Rebase": perform,
        "Cancel": cancel
      };

      content.dialog({ width: 400,
                       buttons: buttons });
    }

    addShowEdits();

    if ($(".buttonscope-rebase").size() == 0)
      $("button.preparerebase").wrap("<span class=buttonscope-rebase></span>");

    critic.buttons.add({ title: "Simple Move Rebase",
                         onclick: simpleMoveRebase,
                         scope: "rebase" });

    critic.buttons.add({ title: "Interactive History Rewrite",
                         href: "/FiddleAndTweak/rebase?review=" + critic.review.id,
                         scope: "rebase" });
  });
