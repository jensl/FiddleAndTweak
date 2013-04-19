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

function main(method, path, query, headers)
{
  var user_data = JSON.parse(critic.storage.get("user-data") || "{}");
  var data = JSON.parse(read());

  var review = new critic.Review(data.review_id);
  var review_data = critic.storage.get(format("review-%d", review.id));

  writeln("200");
  writeln();

  if (review_data)
    review_data = JSON.parse(review_data);

  if (!review_data || Object.keys(review_data.files).length == 0)
  {
    write(JSON.stringify({ status: "failure",
                           code: "nochanges",
                           title: "No edits to perform!",
                           message: "You have no edits in this review." }));
    return;
  }

  var workcopy = review.branch.getWorkCopy();
  var files = review_data.files;

  for (var path in files)
  {
    var version = review.branch.head.getFile(path);

    if (version.sha1 != files[path].sha1)
    {
      write(JSON.stringify({ status: "failure",
                             code: "incompatible",
                             title: "Stale edit!",
                             message: format("The file %s has been changed in the review since you edited it.", path) }));
      return;
    }

    var edits = files[path].edits.sort(function (a, b) { switch (true) { case a.lineIndex < b.lineIndex: return -1; case a.lineIndex > b.lineIndex: return 1; default: return 0; } });

    if (edits.length)
    {
      var file = new IO.File(workcopy.path + "/" + path, "w");
      var old_lines = version.lines;
      var old_index = 0;

      for (var edit_index = 0; edit_index < edits.length; ++edit_index)
      {
        var edit = edits[edit_index];

        while (old_index < edit.lineIndex)
          file.write(old_lines[old_index++] + "\n");

        for (var line_index = 0; line_index < edit.lines.length; ++line_index)
          file.write(edit.lines[line_index] + "\n");

        old_index += edit.lineCount;
      }

      while (old_index < old_lines.length)
        file.write(old_lines[old_index++] + "\n");

      file.close();

      workcopy.run("add", path);
    }
  }

  var name = user_data["git.config.user.name"] || critic.User.current.fullname;
  var email = user_data["git.config.user.email"] || critic.User.current.email;
  var message;

  if (data.mode == "push")
    message = data.message;
  else
    message = "Preview of edits made via FiddleAndTweak.";

  workcopy.run("commit", "-m" + message,
               { GIT_AUTHOR_NAME: name, GIT_AUTHOR_EMAIL: email,
                 GIT_COMMITTER_NAME: name, GIT_COMMITTER_EMAIL: email });

  var sha1 = workcopy.run("rev-parse", "HEAD").trim();

  if (data.mode == "push")
  {
    var remote = "origin";
    var ref = review.branch.name;

    if (review.trackedBranch && !review.trackedBranch.disabled)
    {
      remote = review.trackedBranch.remote;
      ref = review.trackedBranch.name;
    }

    try
    {
      workcopy.run("push", remote, format("%s:refs/heads/%s", sha1, ref));
    }
    catch (error)
    {
      write(JSON.stringify({ status: "failure",
                             code: "pushrejected",
                             title: "Push rejected!",
                             message: format("<pre>%s</pre>", critic.html.escape(error.message)) }));
      return;
    }

    review_data.files = {};

    critic.storage.set(format("review-%d", review.id), JSON.stringify(review_data));
  }
  else
    workcopy.run("push", "origin", format("%s:refs/keepalive/%s", sha1, sha1));

  write(JSON.stringify({ status: "ok", sha1: sha1 }));
}
