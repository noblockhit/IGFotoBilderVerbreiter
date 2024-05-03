const loginBtn = $("#loginBtn");
const uploadFilesInput = $("#uploadFilesInput");
const uploadFilesLabel = $("#uploadFilesLabel");
const codeEditorContainer = $("#code-editor-container");
const codeTextArea = $("#code");
const fileContainer = $("#fileContainer");
const terminalTextarea = $("#terminalTextarea");
const tenantIdInput = $("#tenantId");
const clientIdInput = $("#clientId");
var removeFileButtons = $(".removeFileButton");


let loggedIn = false;

loginBtn.on("click", async () => {
    if (!loggedIn) {
        const account = await window.renderer.sendLoginMessage({ tenantId: tenantIdInput.val(), clientId: clientIdInput.val() });
        loginBtn.text(`Logout from ${account.name} (${account.username})`);
    } else {
        await window.renderer.sendLogoutMessage();
        loginBtn.text("Login with Microsoft");
    }
    loggedIn = !loggedIn;
});

// event when is focused and enter is pressed
uploadFilesLabel.on("keydown", function (e) {
    if (e.key === "Enter") {
        uploadFilesInput.click();
    }
});


fileContainer.on('focus', '.removeFileButton', function (e) {
    $(this).parent()[0].scrollIntoView({
        block: 'nearest'    // Nearest alignment
    });
});

fileContainer.on('click', '.removeFileButton', function (e) {
    for (var i = 0; i < allImages.length; i++) {
        if (allImages[i]._container[0] === $(this).parent()[0]) {
            allImages[i].remove();
            break;
        }
    }
});

fileContainer.on('keydown', '.removeFileButton', function (e) {
    if (e.key === "Escape") {
        codeEditorContainer.focus();
    }
});


allImages = [];
globalAccessToken = null;

class Image {
    constructor(path, name, container, base64) {
        this.path = path;
        this.name = name;
        this._container = container;
        this.base64 = base64;
    }

    remove() {
        this._container.remove();
        allImages.splice(allImages.indexOf(this), 1);
    }
}

async function evaluateAsyncCode(code, onComplete) {
    try {
        await eval(code);  // Wait for async operations to complete
        if (onComplete) {
            onComplete();  // Call the callback when done
        }
    } catch (error) {
        log(`An error occured: ${error.message}`);
        onComplete();
    }
}

var editor = CodeMirror.fromTextArea(codeTextArea[0], {
    lineNumbers: true, // Enable line numbers
    mode: "javascript", // Set syntax highlighting mode
    tabSize: 4, // Set tab size to 4 spaces
    indentUnit: 4, // Set indentation unit to 4 spaces
    indentWithTabs: false, // Replace tabs with spaces
    theme: "3024-night", // Use a predefined theme (e.g., default)
    styleActiveLine: true, // Highlight the active line
    matchBrackets: true, // Match brackets
    autoCloseBrackets: true, // Automatically close brackets
    autoCloseTags: true, // Automatically close HTML tags
    lineWrapping: true, // Enable line wrapping
    extraKeys: {
        Tab: function (cm) {
            // Replace tabs with spaces
            var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
            cm.replaceSelection(spaces);
        },
        F5: function (cm) {
            const start = performance.now();

            function onEvalComplete() {
                const end = performance.now();
                const duration = (end - start).toFixed(2);
                log(`Code executed in ${duration}ms`);
            }

            log("Executing code:");
            var code = cm.getValue();
            var wrapped = `(async () => {${code}})();`

            evaluateAsyncCode(wrapped, onEvalComplete);
        },
        Esc: function (cm) {
            codeEditorContainer.focus();
        }
    },
});
editor.setSize("100%", "100%");
editor.setValue(
    "//NEVER PASTE UNALANYZED FOREIGN CODE\n" +
    "//Example code\n" +
    "for (var i = 0; i < allImages.length; i++) {\n" +
    "    var img = allImages[i];\n" +
    '    print("sending " + img.name);\n' +
    '    await sendEmail("richard.galfi@wg.nuernberg.de", "Eine test Email direkt aus dem Script", "Hier ist eine test Email und hier auch noch der urspruengliche Name der Datei: " + img.name, img.name, img.base64);\n' +
    "    await sleep(2);\n" +
    "}\n"
);

codeEditorContainer.on("keydown", function (e) {
    if (e.key === "Enter") {
        setTimeout(() => {
            editor.focus();
        }, 50);
    }
});


terminalTextarea.val(terminalTextarea.val() + "Click in the code editor and press F5 to run your code...\n\n");

uploadFilesInput.on("change", async function (e) {
    var files = e.target.files;

    // Check if any files are selected
    if (files && files.length > 0) {
        // Clear the file container
        $("#file-container").empty();

        // Loop through each selected file
        for (var i = 0; i < files.length; i++) {
            // Use a closure to capture the value of 'file' for each iteration
            (function (file) {
                // Create a FileReader object
                var reader = new FileReader();

                // Set up onload event handler to display file details
                reader.onload = function (e) {
                    // Get the base64 encoding of the image
                    var base64Data = e.target.result.split(",")[1];

                    // Create a div to hold file details
                    var fileDiv = $("<div>");
                    fileDiv.addClass("file-div");


                    var removeButton = $(`<button class="removeFileButton" aria-label="Remove file" tabindex="${allImages.length + 1000}">&times;</button>`);
                    fileDiv.append(removeButton);

                    var flexLineBreak = $("<div>");
                    flexLineBreak.addClass("flex-line-break");

                    // Check if the file is an image
                    if (file.type && file.type.indexOf("image") !== -1) {
                        // Create an image element for preview
                        var imgElement = $("<img>").attr(
                            "src",
                            e.target.result
                        );
                        imgElement.addClass("preview-image");
                        fileDiv.append(imgElement);
                    }
                    console.log(file.path);
                    // Add file name to the file div
                    var fileName = $("<p>").text(file.name);
                    fileDiv.append(flexLineBreak);
                    fileDiv.append(fileName);

                    fileContainer.append(fileDiv);
                    allImages.push(new Image(file.path, file.name, fileDiv, base64Data));
                };

                // Read the selected file as a data URL
                reader.readAsDataURL(file);
            })(files[i]); // Pass 'file' as an argument to the closure
        }
    }
});

function recursiveIterate(dict, callback) {
    for (const key in dict) {
        if (dict.hasOwnProperty(key)) {  // Check if the key is part of the object and not inherited
            const value = dict[key];
            callback(key, value);  // Perform an operation on key-value pairs

            // Check if the value is an object (or array), indicating that we should recurse
            if (typeof value === "object" && value !== null) {
                recursiveIterate(value, callback);  // Recursive call
            }
        }
    }
}
// A helper function to truncate strings if they exceed a certain length
function truncateString(str, maxLength) {
    if (typeof str === 'string' && str.length > maxLength) {
        return str.substring(0, maxLength) + '...';
    }
    return str;
}

function avoidCircularRefs() {
    const seen = new Set();
    return function (key, value) {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return "[Circular]";  // Indicate circular reference
            }
            seen.add(value);
        }
        return value;
    };
}

// A helper function to convert large integers to scientific notation if needed
function formatInteger(value, threshold) {
    if (typeof value === 'number' && Number.isInteger(value) && Math.abs(value) >= threshold) {
        return value.toExponential(Math.log10(threshold) - 6);  // Convert to scientific notation
    }
    return value;
}

// A custom replacer function for JSON.stringify
function advancedReplacer(maxStringLength = 20, largeIntegerThreshold = 1e6) {
    const avoidCircular = avoidCircularRefs();  // To avoid circular references

    return function (key, value) {
        // First, handle circular references
        value = avoidCircular(key, value);

        // Truncate long strings
        if (typeof value === 'string') {
            return truncateString(value, maxStringLength);
        }

        // Convert large integers to scientific notation
        if (typeof value === 'number' && Number.isInteger(value)) {
            return formatInteger(value, largeIntegerThreshold);
        }

        // Additional type-based handling
        if (typeof value === 'boolean') {
            return value ? "True" : "False";  // Display booleans as "True" or "False"
        }

        if (value instanceof Date) {
            return value.toISOString();  // Format dates as ISO strings
        }

        return value;  // Default behavior
    };
}

let logCount = 1;

// A custom logger function that JSON stringifies an object with the custom replacer
print = log = (...args) => {
    full_string = "";
    for (const obj of args) {

        full_string += JSON.stringify(obj, advancedReplacer(100, 1e12), 2) + " ";
    }  // Pretty-print with 2 spaces indentation
    if (full_string === undefined) {
        return;
    }
    terminalTextarea.val(`${terminalTextarea.val()}${logCount}: ${full_string.replaceAll("\n", "\n   ")}\n`);
    terminalTextarea.scrollTop(terminalTextarea[0].scrollHeight);
    logCount++;
}



async function sendEmail(emailAddr, subject, textContent, imageName = null, imageAttachmentBytes = null) {
    // add an image attachment to the email
    return await window.renderer.sendEmail({ emailAddr, subject, textContent, imageName, imageAttachmentBytes });
}

function sleep(secs) {
    return new Promise(resolve => setTimeout(resolve, secs * 1000));
}

async function updateCachedData() {
    const data = await window.renderer.sendGetCacheMessage();
    tenantIdInput.val(data.tenantId);
    clientIdInput.val(data.clientId);
}

updateCachedData();