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

type Keymap = {
  [key: string]: string | Array<string> | (() => Thenable<void>) | undefined;
};
const keymap: Keymap = {
  "`": undefined,
  "1": "workbench.action.findInFiles",
  "2": "editor.action.goToDeclaration",
  "@": "references-view.find",
  "3": "editor.action.openLink",
  "4": "removeSecondaryCursors",
  "5": () => executeCommand(getSelecting() ? "cursorTopSelect" : "cursorTop"),
  "6": undefined,
  "7": "workbench.action.navigateBack",
  "8": () =>
    executeCommand(getSelecting() ? "cursorBottomSelect" : "cursorBottom"),
  "9": [
    "cursorLineEnd",
    "cursorHome",
    "cursorHome",
    "extension.smartBackspace",
  ],
  "0": "editor.action.marker.nextInFiles",
  ")": "editor.action.marker.prevInFiles",
  "-": undefined,
  "=": () => swapActiveAndAnchor(),
  q: "editor.action.formatDocument",
  Q: "tslint.fixAllProblems",
  w: async () => {
    if (!getSelecting()) {
      await executeCommand("cursorLineStart");
      await executeCommand("cursorEndSelect");
      await executeCommand("cursorEndSelect");
      await executeCommand("cursorRightSelect");
    }
    await executeCommand("editor.action.clipboardCutAction");
  },
  e: "deleteLeft",
  r: async () => {
    await executeCommand("editor.action.insertLineAfter");
    enterInsert();
  },
  t: () => toggleZeroWidthSelecting(),
  y: "editor.action.wordHighlight.next",
  Y: "editor.action.wordHighlight.prev",
  u: () => moveDown(10),
  i: () => moveDown(-10),
  o: async () => {
    // there is no "cursorLineStartSelect"; workaround by running "cursorHomeSelect" twice
    if (getSelecting()) {
      await executeCommand("cursorHomeSelect");
      await executeCommand("cursorHomeSelect");
    } else {
      await executeCommand("cursorLineStart");
    }
  },
  O: () => executeCommand(getSelecting() ? "cursorHomeSelect" : "cursorHome"),
  p: async () => {
    if (getSelecting()) {
      await executeCommand("cursorEndSelect");
      await executeCommand("cursorEndSelect");
    } else {
      await executeCommand("cursorLineEnd");
    }
  },
  "[": "workbench.action.showCommands",
  "]": undefined,
  "\\": undefined,
  a: async () => {
    if (!getSelecting()) {
      await executeCommand("cursorLineStart");
      await executeCommand("cursorEndSelect");
      await executeCommand("cursorEndSelect");
      await executeCommand("cursorRightSelect");
    }
    await executeCommand("editor.action.clipboardCopyAction");
    await cancelSelecting();
  },
  s: "editor.action.clipboardPasteAction",
  d: "deleteWordLeft",
  f: async () => enterInsert(),
  g: undefined,
  j: () => executeCommand(getSelecting() ? "cursorDownSelect" : "cursorDown"),
  k: () => executeCommand(getSelecting() ? "cursorUpSelect" : "cursorUp"),
  l: () => executeCommand(getSelecting() ? "cursorLeftSelect" : "cursorLeft"),
  ";": () =>
    executeCommand(getSelecting() ? "cursorRightSelect" : "cursorRight"),
  "'": "editor.action.commentLine",
  z: undefined,
  x: () =>
    saveSelections(async () => {
      await executeCommand("editor.action.addSelectionToNextFindMatch");
      await executeCommand("editor.action.clipboardCopyAction");
    }),
  c: "editor.action.startFindReplaceAction",
  v: "actions.find",
  b: undefined,
  n: undefined,
  m: () =>
    executeCommand(
      getSelecting() ? "cursorWordStartLeftSelect" : "cursorWordStartLeft",
    ),
  ",": () =>
    executeCommand(
      getSelecting() ? "cursorWordEndRightSelect" : "cursorWordEndRight",
    ),
  ".": "workbench.action.focusNextGroup",
  "/": "undo",
  "?": "redo",
  " ": "workbench.action.quickOpen",
};

const hKeymap: Keymap = {
  r: "workbench.action.reloadWindow",
  y: "rewrap.rewrapComment",
  u: "insert-unicode.insertText",
  f: "copyFilePath",
  p: "workbench.action.gotoLine",
  x: "workbench.action.closeEditorsInOtherGroups",
  b: "gitlens.toggleFileBlame",
  m: "workbench.action.maximizeEditor",
  z: ["workbench.action.focusSecondEditorGroup", "workbench.action.quickOpen"],
  s: "editor.action.sortLinesAscending",
  n: "editor.action.rename",
};

/////////////////
//
// to bind:
//
// todo:
// - find file at point
// - previous / next terminal
// - jump into / out of cmd-j menu

function isString(x: any): x is string {
  return typeof x === "string";
}

function isStringList(x: any): x is Array<string> {
  return Array.isArray(x) && x.every(element => isString(element));
}

function isUndefined(x: any): x is undefined {
  return typeof x === "undefined";
}

async function onType(event: { text: string }): Promise<void> {
  adjustSelecting();
  const binding = lastKey === "h" ? hKeymap[event.text] : keymap[event.text];

  if (isString(binding)) {
    await executeCommand(binding);
  } else if (isStringList(binding)) {
    for (const command in binding) {
      await executeCommand(command);
    }
  } else if (isUndefined(binding)) {
    // do nothing
  } else {
    await binding();
  }

  adjustSelecting();
  lastKey = event.text;
}
