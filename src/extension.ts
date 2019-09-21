"use strict";

// tslint:disable-next-line
import * as vscode from "vscode";
// tslint:disable-next-line
import { Selection, TextEditorRevealType } from "vscode";
const { executeCommand } = vscode.commands;
import { pickBy, values } from "lodash";

type Action = FlatAction | FlatAction[];

type FlatAction = string | IBranch | ICommand | IKeymap;

interface IBranch {
  selecting?: Action;
  default: Action;
}

interface ICommand {
  command: string;
  args?: {};
}

interface IKeymap {
  [key: string]: Action;
}

let typeSubscription: vscode.Disposable | undefined;
let zeroWidthSelecting = false;
let rootKeymap: IKeymap = {};
let normalMode = true;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("vimspired.toggle", toggle),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("vimspired.enterNormal", enterNormal),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("vimspired.enterInsert", enterInsert),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vimspired.toggleSelection",
      toggleSelection,
    ),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vimspired.swapActiveAndAnchor",
      swapActiveAndAnchor,
    ),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("vimspired.copyWord", copyWord),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vimspired.cancelSelection",
      cancelSelection,
    ),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(updateFromConfig),
  );
  updateFromConfig();

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(updateCursor),
  );
  context.subscriptions.push(
    vscode.window.onDidChangeVisibleTextEditors(events =>
      events.forEach(updateCursor),
    ),
  );

  enterNormal();
}

// this method is called when your extension is deactivated
export function deactivate() {
  enterInsert();
}

function toggle() {
  if (normalMode) {
    enterInsert();
  } else {
    enterNormal();
  }
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

function updateCursor(editor: vscode.TextEditor | undefined): void {
  if (!editor) {
    return;
  }
  editor.options.cursorStyle = normalMode
    ? vscode.TextEditorCursorStyle.Block
    : vscode.TextEditorCursorStyle.Underline;
}

async function setNormal(normal: boolean): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  await executeCommand("setContext", "vimspired.normal", normal);
  normalMode = normal;
  updateCursor(editor);
  cancelSelection();
}

function updateFromConfig(): void {
  const userKeybindings =
    vscode.workspace.getConfiguration("vimspired.keybindings") || {};
  rootKeymap = pickBy(userKeybindings, isAction);
  keymap = rootKeymap;
}

function isAction(x: any): x is Action {
  return (
    isString(x) ||
    isBranch(x) ||
    isCommand(x) ||
    isKeymap(x) ||
    isFlatActionList(x)
  );
}

function isString(x: any): x is string {
  return typeof x === "string";
}

function isFlatActionList(x: any): x is FlatAction[] {
  return Array.isArray(x) && x.every(element => isAction(element));
}

function isBranch(x: any): x is IBranch {
  if (x === null || typeof x !== "object" || !x.default) {
    return false;
  }
  if (x.selecting && !isAction(x.selecting)) {
    return false;
  }
  if (!isAction(x.default)) {
    return false;
  }
  return true;
}

function isCommand(x: any): x is ICommand {
  return (
    x !== null &&
    typeof x === "object" &&
    typeof x.command === "string" &&
    (x.args === undefined || typeof x.args === "object")
  );
}

function isKeymap(x: any): x is IKeymap {
  return (
    x !== null &&
    typeof x === "object" &&
    !isBranch(x) &&
    !isCommand(x) &&
    values(x).every(isAction)
  );
}

async function evalAction(action: Action | undefined): Promise<void> {
  keymap = rootKeymap;
  if (isString(action)) {
    await executeCommand(action);
  } else if (isFlatActionList(action)) {
    for (const subAction of action) {
      await evalAction(subAction);
    }
  } else if (isBranch(action)) {
    if (getSelecting() && action.selecting) {
      await evalAction(action.selecting);
    } else if (!getSelecting()) {
      await evalAction(action.default);
    }
  } else if (isCommand(action)) {
    if (action.args) {
      await executeCommand(action.command, action.args);
    } else {
      await executeCommand(action.command);
    }
  } else if (isKeymap(action)) {
    keymap = action;
  }
}

/////////////////
// todo:
// - record video in screencast mode
// - fixup cursorStyle on editor focus
// - use "type": "branch" instead of "default" presence

let keymap: IKeymap = rootKeymap;

async function onType(event: { text: string }): Promise<void> {
  adjustSelecting();

  const action = keymap[event.text];
  evalAction(action);
}

/////////////////////////
// commands

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
