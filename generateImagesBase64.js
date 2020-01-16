//requiring path and fs modules
const path = require('path');
const fs = require('fs');
//joining path of directory
const directoryPath = path.join(__dirname, 'textures');
//passsing directoryPath and callback function
fs.readdir(directoryPath, function (err, files) {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }

    files.sort(function (a, b) {
        return a.localeCompare(b);
    });

    let count = 0;
    let strings = {};

    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        // Do whatever you want to do with the file
        console.log("FILE: " + file);
        fs.readFile("textures" + "/" + file, 'binary', function (error, data) {
            if (error) {
                console.log(error);
                return;
            }

            let buf = new Buffer(data, 'binary');
            let string = "data:image/png;base64," + buf.toString('base64');
            let token = file.replace('.png', '');
            strings[file] = token + ": \"" + string + "\",\n";
            count++;

            if (count == files.length) {
                let save = "const AppTexturesGenerated = {\n";
                for (let j = 0; j < files.length; j++) {
                    let file = files[j];
                    let fileData = strings[file];
                    save += fileData;
                }
                save += "invalid: \"\" }";
                fs.writeFileSync("generatedTextures.js", save);
            }
        });
    }
});