'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    console.log('Congratulations, your extension "bext" is now active!');

    context.subscriptions.push(vscode.commands.registerCommand("bext.enterNormal", enterNormal));
    context.subscriptions.push(vscode.commands.registerCommand("bext.enterInsert", enterInsert));
    context.subscriptions.push(vscode.commands.registerCommand("bext.keypressK", keypressK));
    enterNormal();
}

function enterNormal() {
    setNormal({ normal: true });
}

function enterInsert() {
    setNormal({ normal: false });
}

function keypressK() {
    console.log("it's happening");
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    editor.edit((editBuilder) => {
        // during selection there are multiple cursors;
        // avoid this weirdness
        if (!editor.selection.isEmpty) {
            return;
        }
        const position = editor.selection.active;
        editBuilder.insert(position, "k");
    });
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