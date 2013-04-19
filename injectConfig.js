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

function main()
{
  var user_data = JSON.parse(critic.storage.get("user-data") || "{}");

  var preferences = [
    { url: "/FiddleAndTweak/storepreference",
      name: "git.config.user.name",
      type: "string",
      value: user_data["git.config.user.name"] || critic.User.current.fullname,
      default: critic.User.current.fullname,
      description: "Name to use when creating commits; corresponding to the 'git config' setting 'user.name'." },

    { url: "/FiddleAndTweak/storepreference",
      name: "git.config.user.email",
      type: "string",
      value: user_data["git.config.user.email"] || critic.User.current.email,
      default: critic.User.current.email,
      description: "Email to use when creating commits; corresponding to the 'git config' setting 'user.email'." },

    { url: "/FiddleAndTweak/storepreference",
      name: "fixup.style",
      type: [{ value: "sha1", title: "fixup! <SHA-1>" },
             { value: "summary", title: "fixup! <summary>" }],
      value: user_data["fixup.style"] || "sha1",
      default: "sha1",
      description: "Style of \"fixup! ...\" commit message header to use." }
  ];

  for (var index = 0; index < preferences.length; ++index)
    writeln("preference %s", JSON.stringify(preferences[index]));
}
