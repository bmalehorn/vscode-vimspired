'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "bext" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('bext.sayHello', () => {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World!');
    });

    context.subscriptions.push(disposable);

    let foo = vscode.commands.registerCommand("bext.foo", () => {
        vscode.window.showInformationMessage("Foo!");
    });
    context.subscriptions.push(foo);

    function setNormal(normal: boolean) {
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

    context.subscriptions.push(vscode.commands.registerCommand("bext.enterNormal", () => {
        setNormal(true);
    }));

    context.subscriptions.push(vscode.commands.registerCommand("bext.enterInsert", () => {
        setNormal(false);
    }));

    setNormal(true);
}

// this method is called when your extension is deactivated
export function deactivate() {
}