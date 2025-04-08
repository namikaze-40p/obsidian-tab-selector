# Obsidian Tab Selector

This is an [Obsidian](https://obsidian.md/) plugin which can quickly switch tabs in various ways.

Switch tabs in the following ways:

- `Go to previous/next tab`: Move between tabs like in most apps
- `Open tab selector`: Use a modal to switch tabs with keeping the keyboard home position
- `Show tab shortcuts`: Switch tabs with simple keyboard shortcuts, no modal needed
- `Search tabs`: Find and open tabs by name

## How to use

### `Go to previous/next tab`: Move between tabs like in most apps

1. Set up the `Go to previous/next tab` command in the plugin's settings.
    1. In the default configuration, each command are as follows.
        1. Tab Selector: Go to previous tab: `^Tab` or `Ctrl + Tab`
        1. Tab Selector: Go to next tab: `^⇧Tab` or `Ctrl + Shift + Tab`
    1. Don't use shortcut keys reserved by the OS. OS shortcut keys take precedence and don't work properly.
        1. In case MacOS, `⌘Tab` and `⌥Tab` etc… can't use.
1. Set hotkeys to match the command settings implemented above.
1. From then on you can switch tabs using hotkeys.

![demo](https://raw.githubusercontent.com/namikaze-40p/obsidian-tab-selector/main/demo/ver-0.5.0/switch-tab-in-history.gif)

### `Open tab selector`: Use a modal to switch tabs with keeping the keyboard home position

1. Call the modal in one of the following ways.
    1. Using hotkey. (**recommend**)
    1. Click the icon(`Open tab selector`) from the [Ribbon](https://help.obsidian.md/User+interface/Ribbon).
    1. Selecting `Tab Selector: Open tab selector` from the command palette.
1. Select the tab you want to switch to in one of the following ways.
    1. Press the one-letter key displayed to the left of the tab name. (**recommend**)
    1. Move the cursor with arrow keys and select the tab.
    1. Click on the tab name with the mouse cursor.
1. If you want to close a tab, you can do in one of the following ways.
    1. Hold down the `Control` key, press the one-letter key displayed to the left of the tab name.
    1. Move the cursor with arrow keys and press `Backspace` or `Delete` key.
    1. Click on the `X` button with the mouse cursor.

![demo](https://raw.githubusercontent.com/namikaze-40p/obsidian-tab-selector/main/demo/switch-tab.gif)

### `Show tab shortcuts`: Switch tabs with simple keyboard shortcuts, no modal needed

> [!NOTE]
>
> This command is available on PC or tablet devices. It’s not available on smartphones.

1. Call the modal in one of the following ways.
    1. Using hotkey. (**recommend**)
    1. Selecting `Tab Selector: Show tab shortcuts` from the command palette.
1. Press the one-letter key displayed under the tab name.

![demo](https://raw.githubusercontent.com/namikaze-40p/obsidian-tab-selector/main/demo/ver-0.6.0/switch-tab-without-modal.gif)

### `Search tabs`: Find and open tabs by name

1. Call the modal in one of the following ways.
    1. Using hotkey. (**recommend**)
    1. Selecting `Tab Selector: Search tabs` from the command palette.
1. Enter keywords to find a tab.
1. Select the tab you wish to open in one of the following ways.
    1. Move the cursor with arrow keys and select the item.
    1. Click on the item name with the mouse cursor.

![demo](https://raw.githubusercontent.com/namikaze-40p/obsidian-tab-selector/main/demo/ver-0.7.0/search-tabs.gif)

## Installation

You can find and install this plugin through Obsidian’s Community Plugins Browser.  
For detailed steps or alternative installation methods, click [here](https://github.com/namikaze-40p/obsidian-tab-selector/blob/main/docs/installation.md).
