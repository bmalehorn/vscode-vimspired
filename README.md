# Brian's EXTension

Bext is an extension that makes it easy for you to write your own vim-like keybindings.

Here's a small example:

```json
"bext.keybindings": {
  "i": "bext.enterInsert",

  "h": "cursorLeft",
  "j": "cursorDown",
  "k": "cursorUp",
  "l": "cursorRight"
}
```

In this example,
you can press `i` to enter insert mode,
`hjkl` to move around,
and finally `Escape` to return to normal mode.

Unlike vim modes, you start with a blank slate - get creative and make your very own key layout!

## Keybindings by Example

The `bext.keybindings` object accepts a few different values for the keybindings.

### Single Command: `string`

```json
{
  "h": "cursorLeft"
}
```

This executes the VSCode command `cursorLeft`.
You can find a list of all commands by pressing `Ctrl-K Ctrl-S`.
For instance, I found this command because `LeftArrow` key is normally bound to `cursorLeft`.

### Sequence of Commands: `string[]`

```json
{
  "o": ["editor.action.insertLineAfter", "bext.enterInsert"]
}
```

Executes the list of commands in sequence.

### Leader Key: `{ [key: string]: Action }`

```json
{
  "g": { "q": "rewrap.rewrapComment" }
}
```

Pressing `g q` will run the command `rewrap.rewrapComment`.

### Highlighting: `{selecting: Action, default: Action}`

```json
{
  "h": { "selecting": "cursorLeftSelect", "default": "cursorLeft" }
}
```

If text is highlighted, runs the first command.
Otherwise, runs the second command.

In the above example,
if you already highlighted text,
pressing `h` would move the cursor without canceling the selection.
This is the same behavior as `Shift + LeftArrow`.

## Similar Projects

- [Xah Fly Keys](http://ergoemacs.org/misc/ergoemacs_vi_mode.html)
- [NieuMode](https://github.com/appledelhi/neiumode)
