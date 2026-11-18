# Sidebar Peek

A Microsoft Edge extension for twitch.tv: hover a channel in the left sidebar and a small, muted live preview of the stream pops up next to it, so you can see what they're streaming before you open it.

![Sidebar Peek](store/small-promo-tile-440x280.png)

## Features
- Live, muted preview next to the sidebar
- Instant feel: a live thumbnail shows immediately and the video fades in once it plays
- Recently watched previews stay ready (re-hovering is instant)
- Stream title, game and viewer count under the video (optional)
- "Video only" mode that hides Twitch's overlay on the preview
- Adjustable player size, hover delay and keep-warm time
- Optional: skip the content-warning screen in previews (off by default)

## Install (developer mode)
1. Download or clone this repo.
2. Open `edge://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and select the `extension` folder.
4. Open twitch.tv and hover a channel in the sidebar.

Click the toolbar icon to open the settings.

## Repo layout
| Path | What |
|---|---|
| `extension/` | The extension itself (Manifest V3) |
| `store/` | Edge Add-ons store assets and listing text |
| `PRIVACY.md` | Privacy policy |

## Privacy
Sidebar Peek collects no data. See [PRIVACY.md](PRIVACY.md).

---
Sidebar Peek is an independent project and is not affiliated with or endorsed by Twitch Interactive, Inc.
