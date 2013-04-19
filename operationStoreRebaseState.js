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

function main(method, path, query, headers) {
  var data = JSON.parse(read());
  var review = new critic.Review(data.review_id);

  critic.storage.set(format("rebase-state-%d", review.id),
                     JSON.stringify(data["state"]));

  writeln("200");
  writeln("Content-Type: text/json");
  writeln();
  writeln(JSON.stringify({ status: "ok" }));
}
