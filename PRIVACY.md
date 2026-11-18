# Privacy Policy: Sidebar Peek

_Last updated: 18 November 2026_

Sidebar Peek is a browser extension that shows a live preview of a Twitch channel when you hover over it in the twitch.tv sidebar.

## Data we collect
**None.** Sidebar Peek does not collect, store, sell or share any personal information, browsing history or usage data. The developer does not run any server and receives no data from the extension.

## Data stored on your device
Your preview settings (player size, display options, hover delay) are saved with the browser's extension storage (`chrome.storage.sync`). If you have browser sync turned on, your browser may sync these settings between your own devices. They are never sent to the developer.

## Network requests
To show a preview, your browser connects directly to Twitch's own services, the same ones twitch.tv uses:
- `player.twitch.tv`: Twitch's embedded video player
- `static-cdn.jtvnw.net`: the stream's preview thumbnail
- `gql.twitch.tv`: the stream title, game and viewer count (only if you keep that option on)
- `usher.ttvnw.net`: the video stream itself

These requests are handled by Twitch under Twitch's own privacy policy: https://www.twitch.tv/p/legal/privacy-notice/

## Contact
Questions about this policy: open an issue at https://github.com/bilginn7/sidebar-peek/issues

## Changes
If this policy changes, the updated version will be posted at this address with a new date.
