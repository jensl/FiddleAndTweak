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
  var data = JSON.parse(read());

  writeln("200");
  writeln();

  var review_data = critic.storage.get(format("review-%d", data.review_id));
  var edits;

  if (review_data)
    review_data = JSON.parse(review_data);
  else
    review_data = { files: {} };

  function finish()
  {
    critic.storage.set(format("review-%d", data.review_id), JSON.stringify(review_data));
    writeln(JSON.stringify({ status: "ok" }));
  }

  var path;

  if ("path" in data)
    path = data.path;
  else
    path = critic.File.find(data.file_id).path;

  if (review_data.files[path])
  {
    if (data.mode != "discard" && data.sha1 != review_data.files[path].sha1)
    {
      writeln("error:different versions of the file edited");
      return;
    }

    edits = review_data.files[path].edits;

    for (var index = 0; index < edits.length; ++index)
    {
      var edit = edits[index];
      if (edit.lineIndex + edit.lineCount < data.lineIndex || edit.lineIndex >= data.lineIndex + data.lineCount)
        continue;

      if (edit.lineIndex == data.lineIndex && edit.lineCount == data.lineCount)
        if (data.mode == "refine")
        {
          edit.lines = data.lines;
          finish();
          return;
        }
        else if (data.mode == "discard")
        {
          edits.splice(index, 1);
          finish();
          return;
        }

      writeln("error: overlapping edits in the file");
      return;
    }
  }
  else
    review_data.files[path] = { sha1: data.sha1, edits: edits = [] };

  edits.push({ lineIndex: data.lineIndex,
               lineCount: data.lineCount,
               lines: data.lines });

  finish();
}
