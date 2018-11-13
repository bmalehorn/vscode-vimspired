'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
const { executeCommand } = vscode.commands;

let typeSubscription: vscode.Disposable | undefined;
let lastKey: string | undefined;
let selecting: boolean = false;

function setSelecting(newSelecting: boolean): Thenable<{} | undefined> {
    return executeCommand("workbench.action.terminal.clearSelection")
        .then(() => {
            selecting = newSelecting;
            return Promise.resolve(undefined);
        });
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand("bext.sayHello", sayHello));
    context.subscriptions.push(vscode.commands.registerCommand("bext.enterNormal", enterNormal));
    context.subscriptions.push(vscode.commands.registerCommand("bext.enterInsert", enterInsert));
    console.log("@@@ activate!!!");
    enterNormal();
}

function sayHello() {
    vscode.window.showInformationMessage("Hello World!");
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

function setNormal(normal: boolean) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    editor.options.cursorStyle = normal ?
        vscode.TextEditorCursorStyle.Block :
        vscode.TextEditorCursorStyle.Underline;
    executeCommand("setContext", "bext.normal", normal)
        .then(() => setSelecting(false));
}

// this method is called when your extension is deactivated
export function deactivate() {
    enterInsert();
}

interface IEvent {
    text: string;
}

const keymap: Map<string, (() => Thenable<{} | undefined>) | undefined> = new Map();
keymap.set("`", undefined);
keymap.set("1", () => executeCommand("workbench.action.findInFiles"));
keymap.set("2", undefined);
keymap.set("3", undefined);
keymap.set("4", undefined);
keymap.set("5", () => executeCommand(selecting ? "cursorTopSelect" : "cursorTop"));
keymap.set("6", undefined);
keymap.set("7", () => executeCommand("cursorUndo"));
keymap.set("8", () => executeCommand(selecting ? "cursorBottomSelect" : "cursorBottom"));
keymap.set("9", undefined);
keymap.set("0", () => executeCommand("editor.action.marker.nextInFiles"));
keymap.set(")", () => executeCommand("editor.action.marker.prevInFiles"));
keymap.set("-", undefined);
keymap.set("=", undefined);
keymap.set("q", () => executeCommand("tslint.fixAllProblems"));
keymap.set("Q", () => executeCommand("editor.action.formatDocument"));
keymap.set("w", () => {
    if (selecting) {
        return executeCommand("editor.action.clipboardCutAction")
            .then(() => setSelecting(false));
    } else {
        return executeCommand("cursorLineStart")
            .then(() => executeCommand("cursorDownSelect"))
            .then(() => executeCommand("editor.action.clipboardCutAction"))
            .then(() => setSelecting(false));
    }
});
keymap.set("e", () => executeCommand("deleteLeft"));
keymap.set("r", () => {
    openLine();
    return Promise.resolve(undefined);
});
keymap.set("t", () => {
    setSelecting(!selecting);
    return Promise.resolve(undefined);
});
keymap.set("y", undefined);
keymap.set("u", () => executeCommand(selecting ? "cursorPageDownSelect" : "cursorPageDown"));
keymap.set("i", () => executeCommand(selecting ? "cursorPageUpSelect" : "cursorPageUp"));
keymap.set("o", () => {
    // there is no "cursorLineStartSelect"; workaround by running "cursorHomeSelect" twice
    if (selecting) {
        return executeCommand("cursorHomeSelect")
            .then(() => executeCommand("cursorHomeSelect"));
    } else {
        return executeCommand("cursorLineStart");
    }
});
keymap.set("O", () => executeCommand(selecting ? "cursorHomeSelect" : "cursorHome"));
keymap.set("p", () => executeCommand(selecting ? "cursorLineEndSelect" : "cursorLineEnd"));
keymap.set("[", () => executeCommand("workbench.action.showCommands"));
keymap.set("]", undefined);
keymap.set("\\", undefined);
keymap.set("a", () => {
    if (selecting) {
        return executeCommand("editor.action.clipboardCopyAction")
            .then(() => setSelecting(false));
    } else {
        return executeCommand("cursorLineStart")
            .then(() => executeCommand("cursorDownSelect"))
            .then(() => executeCommand("editor.action.clipboardCopyAction"))
            .then(() => setSelecting(false));
    }
});
keymap.set("s", () => executeCommand("editor.action.clipboardPasteAction"));
keymap.set("d", () => executeCommand("deleteWordLeft"));
keymap.set("f", () => {
    enterInsert();
    return Promise.resolve(undefined);
});
keymap.set("g", undefined);
keymap.set("j", () => executeCommand(selecting ? "cursorDownSelect" : "cursorDown"));
keymap.set("k", () => executeCommand(selecting ? "cursorUpSelect" : "cursorUp"));
keymap.set("l", () => executeCommand(selecting ? "cursorLeftSelect" : "cursorLeft"));
keymap.set(";", () => executeCommand(selecting ? "cursorRightSelect" : "cursorRight"));
keymap.set("'", () => executeCommand("editor.action.commentLine"));
keymap.set("z", undefined);
keymap.set("x", undefined);
keymap.set("c", undefined);
keymap.set("v", () => executeCommand("actions.find"));
keymap.set("b", undefined);
keymap.set("n", undefined);
keymap.set("m", () => executeCommand(selecting ? "cursorWordStartLeftSelect" : "cursorWordStartLeft"));
keymap.set(",", () => executeCommand(selecting ? "cursorWordEndRightSelect" : "cursorWordEndRight"));
keymap.set("/", () => executeCommand("undo"));
keymap.set("?", () => executeCommand("redo"));
keymap.set(" ", () => executeCommand("workbench.action.quickOpen"));

const hKeymap: Map<string, (() => Thenable<{} | undefined>) | undefined> = new Map();
hKeymap.set("m", () => executeCommand("workbench.action.maximizeEditor"));
hKeymap.set("x", () => executeCommand("workbench.action.closeAllEditors"));
hKeymap.set("r", () => executeCommand("workbench.action.reloadWindow"));

//     executeCommand("editor.action.goToDeclaration");
//     executeCommand("workbench.action.reloadWindow");

function onType(event: IEvent) {

    if (lastKey === "h") {
        const callback = hKeymap.get(event.text);
        if (callback) {
            callback();
        }
    } else {
        const callback = keymap.get(event.text);
        if (callback) {
            callback();
        }
    }
    lastKey = event.text;
}


function openLine() {
    // TODO: go to end of line, *then* newline
    // TODO: indent after newline
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    editor.edit((editBuilder) => {
        editBuilder.insert(editor.selection.start, "\n");
    });
    enterInsert();
}

