# Sidebar Peek: Partner Center copy-paste sheet

## Properties page
- **Category:** Entertainment
- **Website:** https://github.com/bilginn7/sidebar-peek
- **Support contact:** https://github.com/bilginn7/sidebar-peek/issues
- **Mature content:** leave unchecked

## Privacy page
**Single purpose description**
> Shows a small live preview of a Twitch channel's stream when the user hovers over that channel in the twitch.tv left sidebar.

**Permission justification: storage**
> Saves the user's own preview settings (player size, which info to show, hover delay) so they persist between sessions. Nothing else is stored.

**Host access justification (twitch.tv, player.twitch.tv)** *(only if asked)*
> www.twitch.tv: detects hovering over sidebar channels and shows the preview popup. player.twitch.tv: runs inside the embedded preview player only, to start muted playback and apply the user's display settings.

**Are you using remote code?** No, I am not using remote code.

**Data usage:** select no data categories. The extension does not collect, transmit or sell user data.

**Privacy policy URL:** https://github.com/bilginn7/sidebar-peek/blob/main/PRIVACY.md

## Store listing (English)
**Extension name / short description:** taken from the manifest automatically.

**Description** (paste as-is, ~1,150 characters)
```
Sidebar Peek lets you see what a channel is streaming before you click it.

Hover over any channel in the left sidebar on twitch.tv and a small live preview pops up next to it. Move the mouse away and it closes. Click the channel as usual to open it.

FEATURES
• Live, muted preview of the stream right next to the sidebar
• Instant feel: a live thumbnail appears immediately and the video fades in as soon as it plays
• Recently watched previews stay ready, so hovering again is instant
• Stream title, game and viewer count under the video (can be turned off)
• "Video only" mode that hides all buttons and overlays on top of the preview
• Adjustable player size and hover delay
• Optional: skip the content-warning screen in previews (off by default, 18+ only)

PRIVACY
Sidebar Peek does not collect or send any personal data. Your settings are stored in your browser. The preview is loaded directly from Twitch's own embedded player.

Sidebar Peek is an independent project and is not affiliated with or endorsed by Twitch Interactive, Inc.
```

**Search terms** (max 7 terms, 30 characters each)
```
stream preview
hover preview
live preview
sidebar
streamer
picture in picture
channel preview
```

**Images**
- Extension logo: `logo-300x300.png`
- Small promotional tile: `small-promo-tile-440x280.png`
- Screenshots: take 2–4 yourself at **1280 × 800** (see the steps in the chat)

## Notes for certification (on the Publish screen)
```
How to test:
1. Install the extension and open https://www.twitch.tv (no login needed).
2. Make sure the left sidebar is expanded (it shows "Recommended Channels" when logged out).
3. Hover over a live channel for about a quarter second; a muted preview appears to the right.
4. Click the toolbar icon to open settings (size, video-only mode, title info, hover delay, keep-warm, skip content warnings).
The extension only runs on www.twitch.tv and inside the Twitch embedded player it creates. No account or data collection.
```
