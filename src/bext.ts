'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand("bext.enterNormal", enterNormal));
    context.subscriptions.push(vscode.commands.registerCommand("bext.enterInsert", enterInsert));
    context.subscriptions.push(vscode.commands.registerCommand("bext.openLine", openLine));
    enterNormal();
}

function enterNormal() {
    setNormal({ normal: true });
}

function enterInsert() {
    setNormal({ normal: false });
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

interface SetNormalArgs {
    normal: boolean;
}

function setNormal(args: SetNormalArgs) {
    const { normal } = args;
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    editor.options.cursorStyle = normal ?
        vscode.TextEditorCursorStyle.Block :
        vscode.TextEditorCursorStyle.Underline;
    vscode.commands.executeCommand("setContext", "bext.normal", normal);
    vscode.commands.executeCommand("setContext", "bext.insert", !normal);
}

// this method is called when your extension is deactivated
export function deactivate() {
}