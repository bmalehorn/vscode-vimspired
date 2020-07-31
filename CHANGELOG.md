# Change Log

## 6.4.0

- selection is preserved when entering & exiting normal mode

## 6.3.3

- fixed an issue where `vimspired.toggleSelecting` would disable multiple cursors
- fixed an issue where multiple cursors would be disabled when toggling insert mode

## 6.3.2

- added documentation for `vimspired.normal` context variable

## 6.3.1

- added install count badges to README

## 6.3.0

- added `vimspired.insertCursorStyle` and `vimspired.normalCursorStyle` settings
- changed insert cursor style to `line` by default

## 6.2.0

- added support for `{command: string, args: {}}`

## 6.1.7

- added my config to README.md

## 6.1.6

- remove undocumented `vimspired.moveDown` and `vimspired.moveUp`

## 5.0.4

- don't upload build files on publish
- https://code.visualstudio.com/api/working-with-extensions/bundling-extension

## 5.0.3

- updated build to webpack

## 5.0.2

- fixed an issue causing cursor to display as underline after opening a
  vertical split

## 5.0.0

- added support for leader key. Example:

```json
{
  "g": { "q": "rewrap.rewrapComment" }
}
```

Pressing `g q` will run the command `rewrap.rewrapComment`.

## 1.0.0

- released on github
