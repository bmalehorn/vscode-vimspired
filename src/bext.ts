"use strict";

import * as vscode from "vscode";
// tslint:disable-next-line
import { Range, Selection, TextEditorRevealType } from "vscode";
const { executeCommand } = vscode.commands;

let typeSubscription: vscode.Disposable | undefined;
let lastKey: string | undefined;
let zeroWidthSelecting = false;

async function cancelSelecting(): Promise<void> {
  await executeCommand("cancelSelection");
  zeroWidthSelecting = false;
}

async function toggleZeroWidthSelecting(): Promise<void> {
  const oldZeroWidthSelecting = zeroWidthSelecting;
  await cancelSelecting();
  zeroWidthSelecting = !oldZeroWidthSelecting;
}

function adjustSelecting(): void {
  if (normalSelecting()) {
    zeroWidthSelecting = false;
  }
}

function normalSelecting(): boolean {
  return vscode.window.activeTextEditor!.selections.some(
    selection => !selection.anchor.isEqual(selection.active),
  );
}

function getSelecting(): boolean {
  return normalSelecting() || zeroWidthSelecting;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("bext.enterNormal", enterNormal),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("bext.enterInsert", enterInsert),
  );
  enterNormal();
}

function enterNormal() {
  if (!typeSubscription) {
    typeSubscription = vscode.commands.registerCommand("type", onType);
  }
  setNormal(true);
}

function enterInsert() {
  if (typeSubscription) {
    typeSubscription.dispose();
    typeSubscription = undefined;
  }
  setNormal(false);
}

async function setNormal(normal: boolean): Promise<void> {
  vscode.window.activeTextEditor!.options.cursorStyle = normal
    ? vscode.TextEditorCursorStyle.Block
    : vscode.TextEditorCursorStyle.Underline;
  // executeCommand("removeSecondaryCursors");
  await executeCommand("setContext", "bext.normal", normal);
  cancelSelecting();
}

// this method is called when your extension is deactivated
export function deactivate() {
  enterInsert();
}

async function moveDown(lines: number, buffer: number = 1) {
  const editor = vscode.window.activeTextEditor!;
  const { start, end } = editor.visibleRanges[0];
  const newRange = new Range(
    start.with(Math.max(start.line + lines, 0)),
    end.with(Math.max(end.line + lines, 0)),
  );
  editor.revealRange(new Selection(newRange.start, newRange.end));

  // put active inside new revealed range
  if (editor.selection.active.compareTo(newRange.start) < 0) {
    const newPosition = newRange.start.with(newRange.start.line + buffer, 0);
    editor.selection = new Selection(
      getSelecting() ? editor.selection.anchor : newPosition,
      newPosition,
    );
  }
  if (editor.selection.active.compareTo(newRange.end) > 0) {
    const newPosition = newRange.end.with(newRange.end.line - buffer, 0);
    editor.selection = new Selection(
      getSelecting() ? editor.selection.anchor : newPosition,
      newPosition,
    );
  }
}

async function swapActiveAndAnchor() {
  const editor = vscode.window.activeTextEditor!;
  editor.selections = editor.selections.map(
    ({ anchor, active }) => new Selection(active, anchor),
  );
  editor.revealRange(
    new Selection(editor.selection.active, editor.selection.active),
    TextEditorRevealType.Default,
  );
}

async function saveSelections(callback: () => Thenable<void>) {
  const editor = vscode.window.activeTextEditor!;
  const selections = editor.selections;
  await callback();
  editor.selections = selections;
}

const keymap: Map<string, (() => Thenable<void>) | undefined> = new Map();
keymap.set("`", undefined);
keymap.set("1", () => executeCommand("workbench.action.findInFiles"));
keymap.set("2", () => executeCommand("editor.action.goToDeclaration"));
keymap.set("@", () => executeCommand("references-view.find"));
keymap.set("3", () => executeCommand("editor.action.openLink"));
keymap.set("4", undefined);
keymap.set("5", () =>
  executeCommand(getSelecting() ? "cursorTopSelect" : "cursorTop"),
);
keymap.set("6", undefined);
keymap.set("7", () => executeCommand("workbench.action.navigateBack"));
keymap.set("8", () =>
  executeCommand(getSelecting() ? "cursorBottomSelect" : "cursorBottom"),
);
keymap.set("9", async () => {
  await executeCommand("cursorLineEnd");
  await executeCommand("cursorHome");
  await executeCommand("cursorHome");
  await executeCommand("extension.smartBackspace");
});
keymap.set("0", () => executeCommand("editor.action.marker.nextInFiles"));
keymap.set(")", () => executeCommand("editor.action.marker.prevInFiles"));
keymap.set("-", undefined);
keymap.set("=", () => swapActiveAndAnchor());
keymap.set("q", () => executeCommand("editor.action.formatDocument"));
keymap.set("Q", () => executeCommand("tslint.fixAllProblems"));
keymap.set("w", async () => {
  if (!getSelecting()) {
    await executeCommand("cursorLineStart");
    await executeCommand("cursorEndSelect");
    await executeCommand("cursorEndSelect");
    await executeCommand("cursorRightSelect");
  }
  await executeCommand("editor.action.clipboardCutAction");
});
keymap.set("e", () => executeCommand("deleteLeft"));
keymap.set("r", async () => {
  await executeCommand("editor.action.insertLineAfter");
  enterInsert();
});
keymap.set("t", () => toggleZeroWidthSelecting());
keymap.set("y", () => executeCommand("editor.action.wordHighlight.next"));
keymap.set("Y", () => executeCommand("editor.action.wordHighlight.prev"));
keymap.set("u", () => moveDown(10));
keymap.set("i", () => moveDown(-10));
keymap.set("o", async () => {
  // there is no "cursorLineStartSelect"; workaround by running "cursorHomeSelect" twice
  if (getSelecting()) {
    await executeCommand("cursorHomeSelect");
    await executeCommand("cursorHomeSelect");
  } else {
    await executeCommand("cursorLineStart");
  }
});
keymap.set("O", () =>
  executeCommand(getSelecting() ? "cursorHomeSelect" : "cursorHome"),
);
keymap.set("p", async () => {
  if (getSelecting()) {
    await executeCommand("cursorEndSelect");
    await executeCommand("cursorEndSelect");
  } else {
    await executeCommand("cursorLineEnd");
  }
});
keymap.set("[", () => executeCommand("workbench.action.showCommands"));
keymap.set("]", undefined);
keymap.set("\\", undefined);
keymap.set("a", async () => {
  if (!getSelecting()) {
    await executeCommand("cursorLineStart");
    await executeCommand("cursorEndSelect");
    await executeCommand("cursorEndSelect");
    await executeCommand("cursorRightSelect");
  }
  await executeCommand("editor.action.clipboardCopyAction");
  await cancelSelecting();
});
keymap.set("s", () => executeCommand("editor.action.clipboardPasteAction"));
keymap.set("d", () => executeCommand("deleteWordLeft"));
keymap.set("f", async () => enterInsert());
keymap.set("g", undefined);
keymap.set("j", () =>
  executeCommand(getSelecting() ? "cursorDownSelect" : "cursorDown"),
);
keymap.set("k", () =>
  executeCommand(getSelecting() ? "cursorUpSelect" : "cursorUp"),
);
keymap.set("l", () =>
  executeCommand(getSelecting() ? "cursorLeftSelect" : "cursorLeft"),
);
keymap.set(";", () =>
  executeCommand(getSelecting() ? "cursorRightSelect" : "cursorRight"),
);
keymap.set("'", () => executeCommand("editor.action.commentLine"));
keymap.set("z", undefined);
keymap.set("x", () =>
  saveSelections(async () => {
    await executeCommand("editor.action.addSelectionToNextFindMatch");
    await executeCommand("editor.action.clipboardCopyAction");
  }),
);
keymap.set("c", () => executeCommand("editor.action.startFindReplaceAction"));
keymap.set("v", () => executeCommand("actions.find"));
keymap.set("b", undefined);
keymap.set("n", undefined);
keymap.set("m", () =>
  executeCommand(
    getSelecting() ? "cursorWordStartLeftSelect" : "cursorWordStartLeft",
  ),
);
keymap.set(",", () =>
  executeCommand(
    getSelecting() ? "cursorWordEndRightSelect" : "cursorWordEndRight",
  ),
);
keymap.set(".", () => executeCommand("workbench.action.focusNextGroup"));
keymap.set("/", () => executeCommand("undo"));
keymap.set("?", () => executeCommand("redo"));
keymap.set(" ", () => executeCommand("workbench.action.quickOpen"));

const hKeymap: Map<string, (() => Thenable<void>) | undefined> = new Map();
hKeymap.set("r", () => executeCommand("workbench.action.reloadWindow"));
hKeymap.set("y", () => executeCommand("rewrap.rewrapComment"));
hKeymap.set("u", () => executeCommand("insert-unicode.insertText"));
hKeymap.set("f", () => executeCommand("copyFilePath"));
hKeymap.set("p", () => executeCommand("workbench.action.gotoLine"));
hKeymap.set("x", () =>
  executeCommand("workbench.action.closeEditorsInOtherGroups"),
);
hKeymap.set("b", () => executeCommand("gitlens.toggleFileBlame"));
hKeymap.set("m", () => executeCommand("workbench.action.maximizeEditor"));
hKeymap.set("z", async () => {
  await executeCommand("workbench.action.focusSecondEditorGroup");
  await executeCommand("workbench.action.quickOpen");
});
hKeymap.set("s", () => executeCommand("editor.action.sortLinesAscending"));
hKeymap.set("n", () => executeCommand("editor.action.rename"));

/////////////////
//
// to bind:
//
// todo:
// - find file at point
// - previous / next terminal
// - jump into / out of cmd-j menu

async function onType(event: { text: string }): Promise<void> {
  adjustSelecting();
  if (lastKey === "h") {
    const callback = hKeymap.get(event.text);
    if (callback) {
      await callback();
    }
  } else {
    const callback = keymap.get(event.text);
    if (callback) {
      await callback();
    }
  }
  adjustSelecting();
  lastKey = event.text;
}
