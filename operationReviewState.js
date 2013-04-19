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
  var review_data = JSON.parse(critic.storage.get(format("review-%d", data.review_id)) || "{}");

  review_data.status = "ok";

  writeln("200");
  writeln("Content-Type: text/json");
  writeln();
  write(JSON.stringify(review_data));
}
