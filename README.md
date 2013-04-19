FiddleAndTweak
==============

FiddleAndTweak is an extension for the [Critic code review system]
[critic].  It allows users to edit code via the web front-end and push
follow-up commits to reviews without needing to check the reviewed
branch out locally or even clone the repository.  It also allows users
to rebase review branches, either to rewrite the history on the branch
or by moving the branch onto a specified revision.

Installation
------------

To install the extension in a Critic system, a user would create a
directory named `CriticExtensions` in his/her `$HOME`, and clone the
FiddleAndTweak repository into that directory.  If done correctly, the
file `$HOME/CriticExtensions/FiddleAndTweak/MANIFEST` should exist.

Also, `$HOME` should be world executable, and `$HOME/CriticExtensions`
should be world readable (and directories executable) for the Critic
system to be able to find and use the extension.

For more information about Critic extensions, see the [extensions
tutorial] [tutorial].  This tutorial is available in any Critic system
that is sufficiently up-to-date to have extension support.


[critic]: https://github.com/jensl/critic "Critic on GitHub"
[tutorial]: http://critic-review.org/tutorial?item=extensions "Extensions tutorial"
