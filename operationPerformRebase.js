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

Module.load("utilsRebase.js");

function main(method, path, query, headers) {
  var user_data = JSON.parse(critic.storage.get("user-data") || "{}");
  var data = JSON.parse(read());
  var review = new critic.Review(data.review_id);
  var work = review.branch.getWorkCopy();
  var result;

  var main_commits = data.state.main_commits.map(
    MainCommit.fromJSON.bind(null, review));

  var name = user_data["git.config.user.name"] || critic.User.current.fullname;
  var email = user_data["git.config.user.email"] || critic.User.current.email;

  try {
    work.run("reset", "--hard", review.branch.commits.upstreams[0].sha1);

    main_commits.forEach(
      function (main_commit) {
        if (main_commit.skip)
          return;

        var commit = main_commit.commit;

        try {
          work.run("cherry-pick", commit.sha1,
                   { GIT_COMMITTER_NAME: name,
                     GIT_COMMITTER_EMAIL: email });
        } catch (error) {
          throw { status: "failure",
                  code: "cherrypickfailed",
                  title: "Cherry-pick failed!",
                  message: format("Cherry-pick of %s failed.<pre class=git-output>%s</pre>",
                                  commit.sha1,
                                  critic.html.escape(work.run("diff"))) };
        }

        main_commit.followups.forEach(
          function (followup) {
            if (followup.skip)
              return;

            var commit = followup.commit;

            try {
              work.run("cherry-pick", "--no-commit", commit.sha1,
                       { GIT_COMMITTER_NAME: name,
                         GIT_COMMITTER_EMAIL: email });
            } catch (error) {
              throw { status: "failure",
                      code: "cherrypickfailed",
                      title: "Cherry-pick failed!",
                      message: format("Cherry-pick of (fixup) %s failed.<pre class=git-output>%s</pre>",
                                      commit.sha1,
                                      critic.html.escape(work.run("diff"))) };
            }

            work.run("commit", "--amend", "-C", "HEAD",
                     { GIT_COMMITTER_NAME: name,
                       GIT_COMMITTER_EMAIL: email });
          });

        work.run("commit", "--amend",
                 "--message=" + main_commit.getMessage(),
                 "--author=" + main_commit.author,
                 { GIT_COMMITTER_NAME: name,
                   GIT_COMMITTER_EMAIL: email });
      });

    review.prepareRebase({ historyRewrite: true });

    var rebase_prepared = true, tracking_disabled = false;
    try {
      if (data.state.target_branch) {
        review.trackedBranch.disable();
        tracking_disabled = true;
      }

      work.run("push", "--force", "origin", "HEAD");
      rebase_prepared = false;

      if (data.state.target_branch) {
        work.run("push", review.trackedBranch.remote,
                 format("HEAD:refs/heads/%s", data.state.target_branch));
        review.trackedBranch.enable(data.state.target_branch);
        tracking_disabled = false;
      }
    } finally {
      if (rebase_prepared)
        review.cancelRebase();

      if (tracking_disabled)
        review.trackedBranch.enable();
    }

    critic.storage.set(format("rebase-state-%d", review.id),
                       JSON.stringify({}));

    result = { status: "ok", sha1: work.run("rev-parse", "HEAD").trim() };
  } catch (error) {
    if (error.status == "failure")
      result = error;
    else
      result = { status: "error", error: error.message || String(error) || "unknown error" };
  }

  writeln("200");
  writeln("Content-Type: text/json");
  writeln();
  writeln(JSON.stringify(result));
}
