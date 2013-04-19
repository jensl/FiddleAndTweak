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
  var review = new critic.Review(parseInt(query.params.review));
  var user_data = JSON.parse(critic.storage.get("user-data") || "{}");
  var review_state = JSON.parse(critic.storage.get(format("rebase-state-%d", review.id)) || "{}");
  var commits = review.branch.commits;
  var indeces = {}, included = {};
  var main_commits = [], followups = [];

  writeln("200");
  writeln("Content-Type: text/html");
  writeln();

  if (review_state.main_commits) {
    main_commits = review_state.main_commits.map(
      MainCommit.fromJSON.bind(null, review)).filter(
        function (main_commit) {
          return main_commit.commit;
        });

    main_commits.forEach(
      function (main_commit) {
        var commit = main_commit.commit;
        included[commit.sha1] = true;
        var match = /^(fixup|squash)!\s+([^\n]+)/.exec(commit.message);
        if (!match)
          main_commits[/^[^\n]+/.exec(commit.message)[0]] = main_commit;
        main_commits[commit.sha1] = main_commit;
        main_commit.followups.forEach(
          function (followup) {
            var commit = followup.commit;
            included[commit.sha1] = true;
          });
      });
  }

 commits_loop:
  for (var index1 = 1; index1 <= commits.length; ++index1) {
    var commit = commits[commits.length - index1];

    if (commit.parents.length > 1)
      continue;

    indeces[commit.sha1] = index1;

    if (included[commit.sha1])
      continue;

    var main_commit = new MainCommit(commit);

    var followup_match = /^(fixup|squash)!\s+([^\n]+)/.exec(commit.message);
    if (followup_match) {
      var followup = new FollowUp(commit, followup_match[1]);
      var reference = followup_match[2];

      if (reference in main_commits) {
        main_commits[reference].addFollowUp(followup);
        followups.push(followup);
        followups[commit.sha1] = followup;
        continue commits_loop;
      } else if (/^[0-9A-Fa-f]{4,40}$/.test(reference)) {
        for (var index2 = 0; index2 < main_commits.length; ++index2) {
          var main_commit = main_commits[index2];
          if (main_commit.commit.sha1.substring(0, reference.length) == reference) {
            main_commit.addFollowUp(followup);
            followups.push(followup);
            followups[commit.sha1] = followup;
            continue commits_loop;
          }
        }
      }
    } else {
      main_commits[/^[^\n]+/.exec(commit.message)[0]] = main_commit;
    }

    var revert_match = /^Revert \"(.*?)\"\n\nThis reverts commit ([0-9a-f]{40})\./.exec(commit.message);
    if (revert_match) {
      var reverted_subject = revert_match[1];
      var reverted_sha1 = revert_match[2];

      if (reverted_sha1 in commits) {
        if (reverted_sha1 in main_commits) {
          main_commits[reverted_sha1].skip = true;
          main_commit.skip = true;
        } else if (reverted_sha1 in followups) {
          followups[reverted_sha1].skip = true;
          main_commit.skip = true;
        }
      }
    }

    main_commits.push(main_commit);
    main_commits[commit.sha1] = main_commit;
  }

  critic.html.writeStandardHeader(
    format("History rewrite (r/%d)", review.id),
    { stylesheets: ["/extension-resource/FiddleAndTweak/common.css",
                    "/extension-resource/FiddleAndTweak/rebase.css"],
      scripts: ["/extension-resource/FiddleAndTweak/common.js",
                "/extension-resource/FiddleAndTweak/rebase.js"],
      review: review });

  var plt = new critic.html.PaleYellowTable(format("History rewrite (r/%d)", review.id));
  var supported = true;

  if (review.trackedBranch && !review.trackedBranch.disabled) {
    var name;

    if (review_state.target_branch) {
      name = review_state.target_branch;
    } else {
      var match = /(.+[-_\/])(\d+)$/.exec(review.trackedBranch.name);
      if (match)
        name = format("%s%d", match[1], parseInt(match[2]) + 1);
      else
        name = review.trackedBranch.name;
    }

    plt.addItem({ name: "Target branch",
                  value: format("<input id=targetbranch value='%s' size=%d> in %s",
                                name, parseInt(name.length * 1.5), review.trackedBranch.remote),
                  description: "Branch to push result to and then update the review to track." });
  }

  if (supported) {
    var html = "<div class=commits>";

    main_commits.forEach(
      function (main_commit) {
        var commit = main_commit.commit;
        var commit_index = indeces[commit.sha1];
        var skip = main_commit.skip ? " checked" : "";

        html += "<div class=container>";
        html += format("<div class=commit critic-index=%d critic-sha1=%s " +
                       "critic-message='%s' critic-author='%s'>",
                       commit_index, commit.sha1,
                       critic.html.escape(main_commit.message),
                       critic.html.escape(main_commit.author));
        html += format("<div class=skip><label><input type=checkbox%s>" +
                       "Skip this commit</label></div>",
                       skip);
        html += format("<div class=sha1><span class=heading>SHA-1:</span>" +
                       "<span class=sha1><a href=%s>%s</a> [%d]</span></div>",
                       format("/%s?review=%d", commit.sha1, review.id),
                       commit.sha1, commit_index);
        html += format("<div class=author><span class=heading>Author:</span>" +
                       "<span class=author>%s</span></div>",
                       critic.html.escape(main_commit.author));
        html += format("<div class=message><span class=heading>Message:</span>" +
                       "<div class=text>%s</div></div>",
                       critic.html.escape(main_commit.message));

        html += "<div class=followups-container><span class=heading>Follow-ups:</span>";
        html += "<div class=followups>";
        html += "<div class='spacer before'></div>";

        main_commit.followups.forEach(
          function (followup) {
            var commit = followup.commit;
            var commit_index = indeces[commit.sha1];
            var type;

            if (followup.type == "fixup")
              type = "Fixup";
            else
              type = "Squash";

            var skip = followup.skip ? " checked" : "";

            html += "<div class=container>";
            html += format("<div class=followup critic-index=%d critic-sha1=%s " +
                           "critic-message='%s' critic-author='%s'>",
                           commit_index, commit.sha1,
                           critic.html.escape(followup.message),
                           critic.html.escape(followup.author));
            html += format("<div class=skip><label><input type=checkbox%s>" +
                           "Skip this commit</label></div>",
                           skip);
            html += format("<span class=heading>%s:</span>" +
                           "<span class=sha1><a href=%s>%s</a> [%d]</span>",
                           type,
                           format("/%s?review=%d", commit.sha1, review.id),
                           commit.sha1, commit_index);

            var match = /^[^\n]+\n+(.+)$/m.exec(followup.message);

            if (match) {
              html += format("<div class=text>%s</div>",
                             critic.html.escape(match[1]));
            }

            html += "</div>"; // <div class=followup>
            html += "</div>"; // <div class=container>
          });

        html += "<div class='spacer after'></div>";
        html += "</div>"; // <div class=followups>
        html += "</div>"; // <div class=followups-container>

        html += "</div>"; // <div class=commit>
        html += "</div>"; // <div class=container>
      });

    html += "</div>"; // <div class=commits>

    plt.addItem({ html: html });

    try {
      plt.addItem({ separator: true });
    } catch (error) {
      /* Might not be supported. */
    }

    plt.addItem({ html: "<div class=hint>Use drag-and-drop to reorder commits.  Click author and message fields to edit.</div>" });
  }

  plt.write();

  critic.html.writeStandardFooter();
}
