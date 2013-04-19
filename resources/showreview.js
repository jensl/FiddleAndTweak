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
    addShowEdits();

    if ($(".buttonscope-rebase").size() == 0)
      $("button.preparerebase").wrap("<span class=buttonscope-rebase></span>");

    critic.buttons.add({ title: "Interactive History Rewrite",
                         href: "/FiddleAndTweak/rebase?review=" + critic.review.id,
                         scope: "rebase" });
  });
