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
  var review = new critic.Review(parseInt(query.params.review));
  var review_data = critic.storage.get(format("review-%d", review.id));

  if (review_data)
    review_data = JSON.parse(review_data);

  writeln("200");
  writeln("Content-Type: text/html");
  writeln();

  critic.html.writeStandardHeader(format("Edits in r/%d", review.id),
                                  { stylesheets: ["/extension-resource/FiddleAndTweak/common.css",
                                                  "/extension-resource/FiddleAndTweak/showedits.css"],
                                    scripts: ["/extension-resource/FiddleAndTweak/common.js",
                                              "/extension-resource/FiddleAndTweak/showedits.js"],
                                    review: review });

  var files, modified = false;

  if (review_data)
  {
    files = review_data.files;

    for (var path in files)
      if (files[path].edits.length == 0)
      {
        delete files[path];
        modified = true;
      }
  }

  if (!review_data || Object.keys(review_data.files).length == 0)
    write("<div class=message><h1>No edits in r/%d!</h1></div>", review.id);
  else
  {
    var plt = new critic.html.PaleYellowTable(format("Edits in r/%d", review.id));
    var counter = 0, valid = true;

    for (var path in files)
    {
      try { var version = review.branch.head.getFile(path); } catch (e) { throw JSON.stringify(path); }

      if (version.sha1 != files[path].sha1)
      {
        var edits = files[path].edits;
        var edits_script = "", edits_list = [];

        for (var edit_index = 0; edit_index < edits.length; ++edit_index)
        {
          var edit = edits[edit_index];
          var index = counter++;

          edits_script += format("var edit%(index)d = {"
                               +   "path: %(path)s,"
                               +   "sha1: %(sha1)s,"
                               +   "lineIndex: %(lineIndex)d,"
                               +   "lineCount: %(lineCount)d,"
                               +   "lines: null"
                               + "};",
                                 { path: JSON.stringify(path),
                                   sha1: JSON.stringify(files[path].sha1),
                                   lineIndex: edit.lineIndex,
                                   lineCount: edit.lineCount,
                                   index: index });
          edits_list.push(format("edit%d", index));
        }

        plt.addHeading(path);
        plt.addItem({ html: format("<script type=text/javascript>%(script)s</script>"
                                 + "<table class=edit>"
                                 +   "<tbody class=message><tr><td colspan=2>"
                                 +     "<b style=color:red>Edited version of file is not current!</b>"
                                 +   "</td></tr></tbody>"
                                 +   "<tbody class=buttons><tr><td colspan=2>"
                                 +     "<button onclick='discardEdits([%(list)s]);'>Discard All Edits</button>"
                                 +   "</td></tr></tbody>"
                                 + "</table>",
                                   { script: edits_script,
                                     list: edits_list.join(",") })
                    });

        valid = false;
      }
      else
      {
        var edits = files[path].edits.sort(function (a, b) { switch (true) { case a.lineIndex < b.lineIndex: return -1; case a.lineIndex > b.lineIndex: return 1; default: return 0; } });

        if (edits.length != 0)
        {
          plt.addHeading(path);

          var new_delta = 0;

          for (var edit_index = 0; edit_index < edits.length; ++edit_index)
          {
            var edit = edits[edit_index];
            var old_lines = version.lines.slice(edit.lineIndex, edit.lineIndex + edit.lineCount);
            var old_html = "";

            for (var line_index = 0; line_index < old_lines.length; ++line_index)
            {
              var row_class;

              if (line_index == 0)
                if (old_lines.length == 1)
                  row_class = " class='first last'";
                else
                  row_class = " class=first";
              else if (line_index == old_lines.length - 1)
                row_class = " class=last";
              else
                row_class = "";

              old_html += format("<tr%s><td class=linenr>%d</td><td class=line>%s</td></tr>",
                                 row_class, edit.lineIndex + line_index + 1, critic.html.escape(old_lines[line_index]));
            }

            var new_lines = edit.lines;
            var new_html = "";

            if (typeof new_lines == "string")
              new_lines = new_lines.split(/\n/g);

            for (var line_index = 0; line_index < new_lines.length; ++line_index)
            {
              var row_class;

              if (line_index == 0)
                if (new_lines.length == 1)
                  row_class = " class='first last'";
                else
                  row_class = " class=first";
              else if (line_index == new_lines.length - 1)
                row_class = " class=last";
              else
                row_class = "";

              new_html += format("<tr%s><td class=linenr>%d</td><td class=line>%s</td></tr>",
                                 row_class, edit.lineIndex + line_index + new_delta + 1, critic.html.escape(new_lines[line_index]));
            }

            new_delta += new_lines.length - old_lines.length;

            plt.addItem({ html: format("<script type=text/javascript>"
                                     +   "var edit%(index)d = {"
                                     +     "path: %(path)s,"
                                     +     "sha1: %(sha1)s,"
                                     +     "lineIndex: %(lineIndex)d,"
                                     +     "lineCount: %(lineCount)d,"
                                     +     "lines: %(lines)s"
                                     +   "};"
                                     + "</script>"
                                     + "<table class=edit>"
                                     +   "<tbody class=old>%(oldHTML)s</tbody>"
                                     +   "<tbody class=spacer>"
                                     +     "<tr><td colspan=2>&nbsp;</td></tr>"
                                     +   "</tbody>"
                                     +   "<tbody class=new>%(newHTML)s</tbody>"
                                     +   "<tbody class=buttons><tr><td colspan=2>"
                                     +     "<button onclick='refineEdit(edit%(index)d);'>Refine Edit</button>"
                                     +     "<button onclick='discardEdits([edit%(index)d]);'>Discard Edit</button>"
                                     +   "</td></tr></tbody>"
                                     + "</table>",
                                       { path: JSON.stringify(path),
                                         sha1: JSON.stringify(version.sha1),
                                         lineIndex: edit.lineIndex,
                                         lineCount: edit.lineCount,
                                         lines: JSON.stringify(new_lines),
                                         oldHTML: old_html,
                                         newHTML: new_html,
                                         index: counter++ })
                        });
          }
        }
      }
    }

    plt.write();

    if (valid)
      write("<script>$(function () { critic.buttons.add({ title: \"Preview Diff\", onclick: \"previewDiff();\", scope: \"global\" }); });</script>");
  }

  critic.html.writeStandardFooter();

  if (modified)
    critic.storage.set(format("review-%d", review.id), JSON.stringify(review_data));
}
