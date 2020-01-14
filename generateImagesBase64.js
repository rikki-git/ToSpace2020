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

    let count = 0;
    let save = "const AppTexturesGenerated = {\n";
    //listing all files using forEach
    files.forEach(function (file) {
        // Do whatever you want to do with the file
        console.log("FILE: " + file);
        fs.readFile("textures" + "/" + file, 'binary', function (error, data) {
            if (error) {
                console.log(error);
                return;
            }
            var buf = new Buffer(data, 'binary');
            var string = "data:image/png;base64," + buf.toString('base64');

            let token = file.replace('.png', '');
            count++;
            save += token + ": \"" + string + "\",\n";

            if (count == files.length) {
                save += "invalid: \"\" }";
                fs.writeFileSync("generatedTextures.js", save);
            }
        });
    });
});