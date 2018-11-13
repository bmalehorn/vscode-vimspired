'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
const { executeCommand } = vscode.commands;

let typeSubscription: vscode.Disposable | undefined;
let lastKey: string | undefined;
let selecting: boolean = false;

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
    typeSubscription = vscode.commands.registerCommand("type", onType);
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
    selecting = false;
    editor.options.cursorStyle = normal ?
        vscode.TextEditorCursorStyle.Block :
        vscode.TextEditorCursorStyle.Underline;
    executeCommand("setContext", "bext.normal", normal);
}

// this method is called when your extension is deactivated
export function deactivate() {
    enterInsert();
}

interface IEvent {
    text: string;
}

const keymap: Map<string, Thenable<{} | undefined>> = new Map();
keymap.set("`", Promise.resolve(undefined));

function onType(event: IEvent) {
    console.log("event = ", JSON.stringify(event));

    executeCommand("getContext", "textInputFocus", (result: any) => {
        console.log("@@@ result = ", result);
    });
    // {
    //     "key": "shift+right",
    //     "command": "cursorRightSelect",
    //     "when": "textInputFocus"
    //   }

    if (false) {

    } else if (lastKey === "h" && event.text === "m") {
        executeCommand("workbench.action.maximizeEditor");
    } else if (lastKey === "h" && event.text === "x") {
        executeCommand("workbench.action.closeAllEditors");
    } else if (event.text === "`") {
    } else if (event.text === "1") {
        executeCommand("workbench.action.findInFiles");
    } else if (event.text === "2") {
    } else if (event.text === "3") {
    } else if (event.text === "4") {
    } else if (event.text === "5") {
        if (selecting) {
            executeCommand("cursorTopSelect");
        } else {
            executeCommand("cursorTop");
        }
    } else if (event.text === "6") {
    } else if (event.text === "7") {
        executeCommand("cursorUndo");
    } else if (event.text === "8") {
        if (selecting) {
            executeCommand("cursorBottomSelect");
        } else {
            executeCommand("cursorBottom");
        }
    } else if (event.text === "9") {
    } else if (event.text === "0") {
        executeCommand("editor.action.marker.nextInFiles");
    } else if (event.text === ")") {
        executeCommand("editor.action.marker.prevInFiles");
    } else if (event.text === "-") {
    } else if (event.text === "=") {

    } else if (event.text === "q") {
        executeCommand("tslint.fixAllProblems");
    } else if (event.text === "Q") {
        executeCommand("editor.action.formatDocument");
    } else if (event.text === "w") {
        if (selecting) {
            executeCommand("editor.action.clipboardCutAction");
        } else {
            executeCommand("cursorLineStart")
                .then(() => executeCommand("editor.action.copyLinesDownAction"))
                .then(() => executeCommand("editor.action.clipboardCutAction"));
        }
    } else if (event.text === "e") {
        executeCommand("deleteLeft");
    } else if (event.text === "r") {
        openLine();
    } else if (event.text === "t") {
        selecting = true;
    } else if (event.text === "y") {
    } else if (event.text === "u") {
        executeCommand("cursorPageDown");
    } else if (event.text === "i") {
        executeCommand("cursorPageUp");
    } else if (event.text === "o") {
        executeCommand("cursorLineStart");
    } else if (event.text === "O") {
        executeCommand("cursorHome");
    } else if (event.text === "p") {
        executeCommand("cursorLineEnd");
    } else if (event.text === "[") {
        executeCommand("workbench.action.showCommands");
    } else if (event.text === "]") {
    } else if (event.text === "\\") {

    } else if (event.text === "a") {
        executeCommand("editor.action.clipboardCopyAction");
    } else if (event.text === "s") {
        executeCommand("editor.action.clipboardPasteAction");
    } else if (event.text === "d") {
        executeCommand("deleteWordLeft");
    } else if (event.text === "f") {
        enterInsert();
    } else if (event.text === "g") {
    } else if (event.text === "j") {
        executeCommand("cursorDown");
    } else if (event.text === "k") {
        executeCommand("cursorUp");
    } else if (event.text === "l") {
        executeCommand("cursorLeft");
    } else if (event.text === ";") {
        executeCommand("cursorRight");
    } else if (event.text === "'") {
        executeCommand("editor.action.commentLine");

    } else if (event.text === "z") {
    } else if (event.text === "x") {
    } else if (event.text === "c") {
    } else if (event.text === "v") {
        executeCommand("actions.find");
    } else if (event.text === "b") {
    } else if (event.text === "n") {
    } else if (event.text === "m") {
        executeCommand("cursorWordStartLeft");
    } else if (event.text === ",") {
        executeCommand("cursorWordEndRight");
    } else if (event.text === "/") {
        executeCommand("undo");
    } else if (event.text === "?") {
        executeCommand("redo");

    } else if (event.text === " ") {
        executeCommand("workbench.action.quickOpen");

    } else if (event.text === "") {
        executeCommand("editor.action.goToDeclaration");
    } else if (event.text === "") {
        executeCommand("workbench.action.reloadWindow");
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

