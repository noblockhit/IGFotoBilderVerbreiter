const loginBtn = $("#loginBtn");

// Add an event listener to send an IPC event when the button is clicked
loginBtn.on("click", async () => {
    // Send a message to the main process with the event name and optional data
    const account = await window.renderer.sendLoginMessage();
    
    // var accessToken = loginResponse.accessToken;
    // const account = msalInstance.getAllAccounts()[0];
    // const decodedToken = JSON.parse(atob(accessToken.split('.')[1]));
    // globalAccessToken = accessToken;
    loginBtn.text(`Logged in as ${account.name} (${account.username})`);
});

allImages = [];
globalAccessToken = null;

class Image {
    constructor(name, container, base64) {
        this.name = name;
        this._container = container;
        this.base64 = base64;
    }

    remove() {
        this._container.remove();
        allImages.splice(allImages.indexOf(this), 1);
    }
}

codeTextArea = $("#code");
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
            // Override F5 key
            // Execute the code (You need to define a function to execute the code)
            console.log("Executing code...");
            var code = cm.getValue();
            var wrapped = `(async () => {${code}})();`;
            eval(wrapped);
        },
    },
});
editor.setSize("100%", "100%");
editor.setValue(
    "//NEVER PASTE UNALANYZED FOREIGN CODE\n" +
        "//Example code\n" +
        "for (var i = 0; i < allImages.length; i++) {\n" +
        "    var img = allImages[i];\n" +
        '    console.log("sending " + img.name);\n' +
        '    await sendEmail("richard.galfi@wg.nuernberg.de", "Eine test Email direkt aus dem Script", "Hier ist eine test Email und hier auch noch der urspruengliche Name der Datei: " + img.name, img.name, img.base64)\n' +
        "    await sleep(2);\n" +
        "}\n"
);

uploadFilesInput = $("#uploadFilesInput");
fileContainer = $("#fileContainer");

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

                    // Add file name to the file div
                    var fileName = $("<p>").text(file.name);
                    fileDiv.append(flexLineBreak);
                    fileDiv.append(fileName);

                    // Append the file div to the file container
                    fileContainer.append(fileDiv);
                    allImages.push(new Image(file.name, fileDiv, base64Data));
                };

                // Read the selected file as a data URL
                reader.readAsDataURL(file);
            })(files[i]); // Pass 'file' as an argument to the closure
        }
    }
});

async function sendEmail(emailAddr, subject, textContent, imageName = null, imageAttachmentBytes = null) {
    // add an image attachment to the email
    await window.renderer.sendEmail({emailAddr, subject, textContent, imageName, imageAttachmentBytes});
}

function sleep(secs) {
    return new Promise(resolve => setTimeout(resolve, secs*1000));
}
