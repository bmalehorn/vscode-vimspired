'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

console.log("@@@ hello world");

let typeSubscription: vscode.Disposable | undefined;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand("bext.sayHello", sayHello));
    context.subscriptions.push(vscode.commands.registerCommand("bext.enterNormal", enterNormal));
    context.subscriptions.push(vscode.commands.registerCommand("bext.enterInsert", enterInsert));
    context.subscriptions.push(vscode.commands.registerCommand("bext.openLine", openLine));
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

interface IEvent {
    text: string;
}

function onType(event: IEvent) {

    console.log("@@@ type e = ", JSON.stringify(event), event);



    if (event.text === "j") {
        vscode.commands.executeCommand("cursorDown");
    } else if (event.text === "k") {
        vscode.commands.executeCommand("cursorUp");
    } else if (event.text === "f") {
        enterInsert();
    }
}

function enterInsert() {
    if (typeSubscription) {
        typeSubscription.dispose();
        typeSubscription = undefined;
    }
    setNormal(false);
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

function setNormal(normal: boolean) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    editor.options.cursorStyle = normal ?
        vscode.TextEditorCursorStyle.Block :
        vscode.TextEditorCursorStyle.Underline;
    vscode.commands.executeCommand("setContext", "bext.normal", normal);
}

// this method is called when your extension is deactivated
export function deactivate() {
}