FrozenBattle
=============

Extensions for Idle games

How to use
----------

## Bookmarklet install

1. Paste the *contents* (not the url) of https://raw.githubusercontent.com/Craiel/FrozenBattle/master/fb_bookmarklet_loader.js into a bookmark.
2. Load up Endless Battles.
3. Load the recently created bookmark.

## Userscript install

0. If you don't already have it, install the required browser add-on. [Tampermonkey (Chrome)](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en) or [Greasemonkey (Firefox)](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)
1. Go to http://userscripts.org/scripts/show/486944
2. Click the 'install' button in the upper right corner.
3. Load up Cookie Clicker.

Extension Contents
---------------------------

 - Adds Auto-attack mechanic based on aquired mercenaries.
 - Adds Auto-sell option.
 - Adds chance for items to be enchanted.
 - Adds a log window showing recently looted items and auto sell values.
 - Adds option to sort the inventory by type and rarity
 - Adds several different types of number formatting
 - Adds a new stats window with addon related stats
 - Adds an optional reset mechanic based on the overall levels reset with the addon active
 - Improves the Item sell price to reflect the properties better.
 
What's new
-----------

 - 2014-05-10: More auto attack options and reset mechanic
 - 2014-05-08: Notification window improved
 - 2014-05-07: Health fix, Number formatting and inventory sorting
 - 2014-05-06: Initial version

Auto attack details
-------------------
Auto attack speed starts at 10s and gets faster for every mercenary owned:
 - 10ms for footmen
 - 20ms for clerics
 - 75ms for mages
 - 150ms for thieves
 - 250ms for warlocks

Every commander owned increased the overall mercenary bonus by another 1%.

Reset details
-------------
The reset bonus accumulates levels on reset.
For every level reset you currently gain:
 - 1% bonus damage on the character stat
 - 1% bonus XP and Gold (does not apply to item sales)
