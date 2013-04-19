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

function MainCommit(commit, author, message, skip) {
  this.commit = commit;
  this.author = author || format("%s <%s>", commit.author.fullname, commit.author.email);
  this.message = message || commit.message;
  this.followups = [];
  this.skip = !!skip;
}

MainCommit.prototype.addFollowUp = function (followup) {
  this.followups.push(followup);

  if (followup.type == "squash") {
    this.message = format('%s\n\n# <squash sha1="%s">\n\n%s\n\n# </squash>\n',
                          this.message.trim(),
                          followup.commit.sha1,
                          /^(?:(?:fixup|squash)![^\n]+\n+)?(.*)$/m.exec(followup.message)[1].trim(),
                          followup.commit.sha1);
  }
};

MainCommit.prototype.getMessage = function () {
  var lines = [];

  this.message.split("\n").forEach(
    function (line) {
      if (!line.trim()) {
        if (lines.length == 0 || lines[lines.length - 1].trim())
          lines.push("");
      } else if (!/^#/.test(line)) {
        lines.push(line);
      }
    });

  if (lines[lines.length - 1].trim())
    lines.push("");

  return lines.join("\n");
};

MainCommit.prototype.toJSON = function () {
  return { sha1: this.commit.sha1,
           author: this.author,
           message: this.message,
           followups: this.followups.map(
             function (followup) { return followup.toJSON(); }),
           skip: this.skip };
};

MainCommit.fromJSON = function (review, value) {
  var main_commit = new MainCommit(review.branch.commits[value.sha1],
                                   value.author, value.message, value.skip);
  main_commit.followups = value.followups.map(
    FollowUp.fromJSON.bind(null, review));
  return main_commit;
};

function FollowUp(commit, type, author, message, skip) {
  this.commit = commit;
  this.type = type;
  this.author = author || format("%s <%s>", commit.author.fullname, commit.author.email);
  this.message = message || commit.message;
  this.skip = !!skip;
}

FollowUp.prototype.toJSON = function () {
  return { sha1: this.commit.sha1,
           type: this.type,
           author: this.author,
           message: this.message,
           skip: this.skip };
};

FollowUp.fromJSON = function (review, value) {
  return new FollowUp(review.branch.commits[value.sha1], value.type,
                      value.author, value.message, value.skip);
};
