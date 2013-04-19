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

var is_saving_state = false;
var save_state_queued = false;

function getState() {
  var main_commits = [];

  $(".commit").each(
    function (index, element) {
      element = $(element);

      var followups = [];

      element.find(".followup").each(
        function (index, element) {
          element = $(element);

          var type;
          switch (element.find(".heading").text()) {
            case "Squash:":
              type = "squash";
              break;
            default:
              type = "fixup";
          }

          var skip = element.find("> .skip input").is(":checked");

          followups.push({ sha1: element.attr("critic-sha1"),
                           type: type,
                           author: element.attr("critic-author"),
                           message: element.attr("critic-message"),
                           skip: skip });
        });

      var skip = element.find("> .skip input").is(":checked");

      main_commits.push({ sha1: element.attr("critic-sha1"),
                          author: element.attr("critic-author"),
                          message: element.attr("critic-message"),
                          followups: followups,
                          skip: skip });
    });

  var state = { main_commits: main_commits };
  var target_branch = $("#targetbranch");

  if (target_branch.size() != 0)
    state.target_branch = target_branch.val();

  return state;
}

function saveState(reset) {
  if (is_saving_state) {
    save_state_queued = function () { saveState(reset); };
    return;
  }

  var state;

  if (reset === true)
    state = { main_commits: [] };
  else
    state = getState();

  function finished() {
    is_saving_state = false;
    if (save_state_queued) {
      save_state_queued();
      save_state_queued = null;
    }
    if (reset)
      location.reload();
  }

  var operation = new critic.Operation(
    { action: "save state",
      url: "FiddleAndTweak/storerebasestate",
      data: { review_id: critic.review.id,
              state: state },
      callback: finished });

  operation.execute();
}

function perform() {
  function finished(result) {
    if (result)
      location.replace("/r/" + critic.review.id);
  }

  var operation = new critic.Operation(
    { action: "perform rebase",
      url: "FiddleAndTweak/performrebase",
      data: { review_id: critic.review.id,
              state: getState() },
      wait: "Performing rebase...",
      callback: finished });

  operation.execute();
}

function dragItem(event, container) {
  var commit = container.children(".commit, .followup");

  if (commit.size() == 0)
    return $("<div class=spacer></div>");

  var index = commit.attr("critic-index");
  var sha1 = commit.attr("critic-sha1");
  var message = commit.attr("critic-message");

  var dragitem = $("<div class=dragitem>" +
                   "<span class=heading>Commit:</span>" +
                   "<span class=sha1>" +
                   "<a href=" + sha1 + "?review=" + critic.review.id + ">" + sha1 + "</a>" +
                   " [" + index + "]</span>" +
                   "</div>");

  var match = /^(?:(?:fixup|squash)![^\n]+\n+)?(.+)$/m.exec(message);
  if (match[1].trim())
    dragitem.append("<div class=text>" + critic.html.escape(match[1]) + "</div>");

  return dragitem;
}

function convertCommitToFollowUp(commit) {
  var index = commit.attr("critic-index");
  var sha1 = commit.attr("critic-sha1");
  var message = commit.attr("critic-message");
  var followups = commit.find(".followups > .container");
  var skip = commit.find("> .skip input").is(":checked") ? " checked" : "";
  var match = /^(?:(fixup|squash)![^\n]+\n+)?(([^\n]*)[^]*)$/.exec(message);
  var type;

  switch (match[1]) {
    case "squash":
      type = "Squash";
      break;
    default:
      type = "Fixup";
  }

  commit
    .empty()
    .removeClass("commit")
    .addClass("followup")
    .append("<div class=skip><label><input type=checkbox" + skip + ">" +
            "Skip this commit</label></div>" +
            "<span class=heading>" + type + ":</span>" +
            "<span class=sha1>" +
            "<a href=" + sha1 + "?review=" + critic.review.id + ">" + sha1 + "</a>" +
            " [" + index + "]</span>");

  skipInteraction(commit);

  if (match[3].trim()) {
    commit.append("<div class=text>" + critic.html.escape(match[3]) + "</div>");

    if (match[1] == "squash") {
      var main_commit = commit.parents(".commit");
      var text = main_commit.find("> .message > .text");
      var message = (text.text().trim() + "\n\n" +
                     '# <squash sha1="' + sha1 + '">\n\n' +
                     match[3].trim() + "\n\n" +
                     "# </squash>");

      text.text(message);
      main_commit.attr("critic-message", message);
    }
  }

  commit.parents(".followups > .container").after(followups);
}

function convertFollowUpToCommit(commit) {
  var index = commit.attr("critic-index");
  var sha1 = commit.attr("critic-sha1");
  var message = commit.attr("critic-message");
  var author = commit.attr("critic-author");
  var skip = commit.find("> .skip input").is(":checked") ? " checked" : "";

  commit
    .empty()
    .removeClass("followup")
    .addClass("commit")
    .append("<div class=skip><label><input type=checkbox" + skip + ">" +
            "Skip this commit</label></div>" +
            "<div class=sha1><span class=heading>SHA-1:</span>" +
            "<span class=sha1>" +
            "<a href=" + sha1 + "?review=" + critic.review.id + ">" + sha1 + "</a>" +
            " [" + index + "]</span></div>" +
            "<div class=author><span class=heading>Author:</span>" +
            "<span class=author>" + critic.html.escape(author) + "</span></div>" +
            "<div class=message><span class=heading>Message:</span>" +
            "<div class=text>" + critic.html.escape(message) + "</div></div>" +
            "<div class=followups-container><span class=heading>Follow-ups:</span>" +
            "<div class=followups>" +
            "<div class='spacer before'></div>" +
            "<div class='spacer after'></div>" +
            "</div></div>");

  followupsSortable(commit.find(".followups"));
  authorEditable(commit);
  messageEditable(commit);
  skipInteraction(commit);

  var regexp = new RegExp('# <squash sha1="' + sha1 + '">\n[^]*?\n# </squash>\n?\n?');

  $(".commit").each(
    function (index, element) {
      element = $(element);

      var text = element.find(".message > .text");
      var old_message = text.text();
      var new_message = old_message.replace(regexp, "");

      if (old_message != new_message) {
        element.attr("critic-message", new_message.trim());
        text.text(new_message.trim());
      }
    });
}

function adjustCommits() {
  $(".commits > .container > .followup").each(
    function (index, element) {
      convertFollowUpToCommit($(element));
    });

  $(".followups > .container > .commit").each(
    function (index, element) {
      convertCommitToFollowUp($(element));
    });
}

function adjustFollowups() {
  $(".followups").each(function (index, element) {
    element = $(element);
    element.children(".spacer.before").prependTo(element);
    element.children(".spacer.after").appendTo(element);
  });
}

function followupsSortable(followups) {
  followups.sortable({
    axis: "y",
    connectWith: ".commits, .followups",
    helper: dragItem,
    stop: function (event, ui) {
      if (ui.item.is(".spacer")) {
        followups.sortable("cancel");
      } else {
        adjustCommits();
        adjustFollowups();
        saveState();
      }
    }
  });
}

function do_nothing() {
}

var reset_current_editing = do_nothing;

function authorEditable(commits) {
  commits.find("span.author")
    .click(
      function (ev) {
        var element = $(ev.currentTarget);

        if (element.closest(".skipped").size())
          return;

        reset_current_editing();

        reset_current_editing = function () {
          var commit = input.parents(".commit");
          var author = input.val();
          var element = $("<span class=author></span>");

          element.text(author);
          commit.attr("critic-author", author);
          input.replaceWith(element);

          authorEditable(commit);
          saveState();

          reset_current_editing = do_nothing;
        };

        var input = $("<input class=author>");

        input
          .val(element.text())
          .attr("size", 80)
          .click(function (ev) { ev.stopPropagation(); });

        element.replaceWith(input);
        input.focus();

        ev.stopPropagation();
      })
    .mousedown(
      function (ev) {
        ev.stopPropagation();
      });
}

function messageEditable(commits) {
  commits.find("> div.message > div.text")
    .click(
      function (ev) {
        var text = $(ev.currentTarget);

        if (text.closest(".skipped").size())
          return;

        reset_current_editing();

        reset_current_editing = function () {
          var commit = textarea.parents(".commit");
          var message = textarea.val();
          var text = $("<div class=text></div>");

          text.text(message);
          commit.attr("critic-message", message);
          textarea.replaceWith(text);

          messageEditable(commit);
          saveState();

          reset_current_editing = do_nothing;
        };

        var textarea = $("<textarea></textarea>");
        var message = text.text();

        textarea
          .val(message.trim())
          .attr("cols", 70)
          .attr("rows", Math.max(5, message.trim().split("\n").length))
          .click(function (ev) { ev.stopPropagation(); });

        text.replaceWith(textarea);
        textarea.focus();

        ev.stopPropagation();
      })
    .mousedown(
      function (ev) {
        ev.stopPropagation();
      });
}

function skipInteraction(commits) {
  commits.find("> .skip input").change(
    function (ev) {
      var input = $(ev.currentTarget);
      var commit = input.closest(".commit, .followup");

      if (input.is(":checked"))
        commit.addClass("skipped");
      else
        commit.removeClass("skipped");

      saveState();
    });
  commits.find("> .skip label").mousedown(
    function (ev) {
      ev.stopPropagation();
    });
}

$(function () {
  $("#targetbranch").change(saveState);

  $(".commits").sortable({
    axis: "y",
    connectWith: ".followups",
    helper: dragItem,
    stop: function (event, ui) {
      if (ui.item.is(".spacer")) {
        $(".commits").sortable("cancel");
      } else {
        adjustCommits();
        adjustFollowups();
        saveState();
      }
    }
  });

  $(".skip input:checked").each(
    function (index, element) {
      element = $(element);
      element.closest(".commit, .followup").addClass("skipped");
    });

  var commits = $(".commit");
  var followups = $(".followup");

  followupsSortable($(".followups"));
  authorEditable(commits);
  messageEditable(commits);
  skipInteraction(commits);
  skipInteraction(followups);

  critic.buttons.add({ scope: "global",
                       title: "Reset State",
                       onclick: function () {
                         saveState(true);
                       }});

  critic.buttons.add({ scope: "global",
                       title: "Perform Rebase",
                       onclick: function () {
                         reset_current_editing();
                         perform();
                       }});

  $(document).click(function () {
    reset_current_editing();
  });
});
