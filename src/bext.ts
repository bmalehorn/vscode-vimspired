"use strict";

import * as vscode from "vscode";
// tslint:disable-next-line
import { Range, Selection, TextEditorRevealType } from "vscode";
const { executeCommand } = vscode.commands;
import { pickBy } from "lodash";

let typeSubscription: vscode.Disposable | undefined;
let lastKey: string | undefined;
let zeroWidthSelecting = false;

async function cancelSelection(): Promise<void> {
  await executeCommand("cancelSelection");
  zeroWidthSelecting = false;
}

async function toggleSelection(): Promise<void> {
  const oldZeroWidthSelecting = zeroWidthSelecting;
  await cancelSelection();
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

let keymap: IKeymap = {};

function updateKeymapFromConfiguration(): void {
  const userKeybindings =
    vscode.workspace.getConfiguration("bext.keybindings") || {};
  const safeKeybindings = pickBy(
    userKeybindings,
    value =>
      isString(value) ||
      isStringList(value) ||
      isUndefined(value) ||
      isWhenSelecting(value),
  );

  keymap = { ...defaultKeymap, ...safeKeybindings };
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
  context.subscriptions.push(
    vscode.commands.registerCommand("bext.toggleSelection", toggleSelection),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("bext.moveDown", moveDown),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("bext.moveUp", moveUp),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "bext.swapActiveAndAnchor",
      swapActiveAndAnchor,
    ),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("bext.copyWord", copyWord),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("bext.cancelSelection", cancelSelection),
  );

  vscode.workspace.onDidChangeConfiguration(updateKeymapFromConfiguration);
  updateKeymapFromConfiguration();

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
  cancelSelection();
}

// this method is called when your extension is deactivated
export function deactivate() {
  enterInsert();
}

function moveDown(): Promise<void> {
  return _moveDown(10);
}

function moveUp(): Promise<void> {
  return _moveDown(-10);
}

async function _moveDown(lines: number, buffer: number = 1) {
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

async function copyWord(): Promise<void> {
  await saveSelections(async () => {
    await executeCommand("editor.action.addSelectionToNextFindMatch");
    await executeCommand("editor.action.clipboardCopyAction");
  });
}

interface IBranch {
  whenSelecting: Action;
  default: Action;
}

type Action = string | string[] | (() => Thenable<void>) | undefined | IBranch;

interface IKeymap {
  [key: string]: Action;
}
const defaultKeymap: IKeymap = {
  "`": undefined,
  "1": "workbench.action.findInFiles",
  "2": "editor.action.goToDeclaration",
  "@": "references-view.find",
  "3": "editor.action.openLink",
  "4": "removeSecondaryCursors",
  "5": { whenSelecting: "cursorTopSelect", default: "cursorTop" },
  "6": undefined,
  "7": "workbench.action.navigateBack",
  "8": {
    whenSelecting: "cursorBottomSelect",
    default: "cursorBottom",
  },
  "9": [
    "cursorLineEnd",
    "cursorHome",
    "cursorHome",
    "extension.smartBackspace",
  ],
  "0": "editor.action.marker.nextInFiles",
  ")": "editor.action.marker.prevInFiles",
  "-": undefined,
  "=": "bext.swapActiveAndAnchor",
  q: "editor.action.formatDocument",
  Q: "tslint.fixAllProblems",
  w: {
    whenSelecting: "editor.action.clipboardCutAction",
    default: [
      "cursorLineStart",
      "cursorEndSelect",
      "cursorEndSelect",
      "cursorRightSelect",
      "editor.action.clipboardCutAction",
    ],
  },
  e: "deleteLeft",
  r: ["editor.action.insertLineAfter", "bext.enterInsert"],
  t: "bext.toggleSelection",
  y: "editor.action.wordHighlight.next",
  Y: "editor.action.wordHighlight.prev",
  u: "bext.moveDown",
  i: "bext.moveUp",
  o: {
    // there is no "cursorLineStartSelect"; workaround by running "cursorHomeSelect" twice
    whenSelecting: ["cursorHomeSelect", "cursorHomeSelect"],
    default: "cursorLineStart",
  },
  O: { whenSelecting: "cursorHomeSelect", default: "cursorHome" },
  p: {
    whenSelecting: "cursorEndSelect",
    default: "cursorLineEnd",
  },
  "[": "workbench.action.showCommands",
  "]": undefined,
  "\\": undefined,
  a: {
    whenSelecting: [
      "editor.action.clipboardCopyAction",
      "bext.cancelSelection",
    ],
    default: [
      "cursorLineStart",
      "cursorEndSelect",
      "cursorEndSelect",
      "cursorRightSelect",
      "editor.action.clipboardCopyAction",
      "bext.cancelSelection",
    ],
  },
  s: "editor.action.clipboardPasteAction",
  d: "deleteWordLeft",
  f: "bext.enterInsert",
  g: undefined,
  j: { whenSelecting: "cursorDownSelect", default: "cursorDown" },
  k: { whenSelecting: "cursorUpSelect", default: "cursorUp" },
  l: { whenSelecting: "cursorLeftSelect", default: "cursorLeft" },
  ";": { whenSelecting: "cursorRightSelect", default: "cursorRight" },
  "'": "editor.action.commentLine",
  z: undefined,
  x: "bext.copyWord",
  c: "editor.action.startFindReplaceAction",
  v: "actions.find",
  b: undefined,
  n: undefined,
  m: {
    whenSelecting: "cursorWordStartLeftSelect",
    default: "cursorWordStartLeft",
  },
  ",": {
    whenSelecting: "cursorWordEndRightSelect",
    default: "cursorWordEndRight",
  },
  ".": "workbench.action.focusNextGroup",
  "/": "undo",
  "?": "redo",
  " ": "workbench.action.quickOpen",
};

const hKeymap: IKeymap = {
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
// https://github.com/foxundermoon/vs-shell-format/blob/master/package.json

function isString(x: any): x is string {
  return typeof x === "string";
}

function isStringList(x: any): x is string[] {
  return Array.isArray(x) && x.every(element => isString(element));
}

function isUndefined(x: any): x is undefined {
  return typeof x === "undefined";
}

function isWhenSelecting(x: any): x is IBranch {
  return typeof x === "object" && "whenSelecting" in x && "default" in x;
}

async function evalAction(action: Action): Promise<void> {
  if (isString(action)) {
    await executeCommand(action);
  } else if (isStringList(action)) {
    for (const command of action) {
      await executeCommand(command);
    }
  } else if (isUndefined(action)) {
    // do nothing
  } else if (isWhenSelecting(action)) {
    if (getSelecting()) {
      await evalAction(action.whenSelecting);
    } else {
      await evalAction(action.default);
    }
  } else {
    await action();
  }
}

async function onType(event: { text: string }): Promise<void> {
  adjustSelecting();

  const action = lastKey === "h" ? hKeymap[event.text] : keymap[event.text];
  evalAction(action);

  adjustSelecting();
  lastKey = event.text;
}
