const fs = require('fs');
const cheerio = require('cheerio');
const separator = ' ';

/**
 * Rename the files within "path" to a non-hashed name
 * @param {String} path The path to start the search
 */
const renameFilesRec = (path) => {
    const files = fs.readdirSync(path, { withFileTypes: true });

    for (let k = 0; k < files.length; k++) {
        try {
            const file = files[k];
            const ext = file.name.split('.')[1];

            if (file.isDirectory()) {
                renameFilesRec(path + '\\' + file.name);
            } else {
                let newName = file.name;

                if (ext !== 'js') {

                    if (ext === 'html') {
                        newName = file.name
                            .split(separator)
                            .filter((e, i, arr) => (i + 1) < arr.length)
                            .join(separator) + '.html'
                    }
                    fs.renameSync(`${path}\\${file.name}`, `${path}\\${newName}`);
                }

            }
        } catch (error) {
            console.log(error);
        }


    }
};

/**
 * Rename the directories within "path" to a non-hashed name
 * @param {String} path The path to start the search
 */
const renameDirsRec = (path) => {
    const listing = fs.readdirSync(path, { withFileTypes: true });

    for (let k = 0; k < listing.length; k++) {
        const item = listing[k];

        if (item.isDirectory()) {
            if (item.name.length > 15) {
                const newName = item.name.split(separator)
                    .filter((e, i, arr) => (i + 1) < arr.length)
                    .join(separator);

                fs.renameSync(`${path}\\${item.name}`, `${path}\\${newName}`);
                renameDirsRec(`${path}\\${newName}`);
            }
        }
    }
};

/**
 * Rename the html links and image src to match unhashed dirs and files names
 * @param {String} path The path to start the search
 */
const renameHtmlLinksAndSrcs = (path) => {
    const files = fs.readdirSync(path, { withFileTypes: true });

    for (let k = 0; k < files.length; k++) {
        const file = files[k];

        if (file.isFile() && file.name.includes('.html')) {
            const content = fs.readFileSync(`${path}\\${file.name}`).toString();
            const $ = cheerio.load(content);

            let links = $('a');
            for (let i = 0; i < links.length; i++) {
                const link = links[i];

                let addrs = link.attribs.href;
                let segments = addrs.split('/');
                addrs = segments.map(segment => {
                    if (segment.length > 15) {
                        let sg = segment.split('%20');
                        sg.pop();
                        return sg.join('%20');
                    } else {
                        return segment;
                    }
                }).join('/');
                if (!addrs.includes('.')) {
                    addrs += '.' + link.attribs.href.split('.')[1];
                }
                links[i].attribs.href = addrs;
                // console.log(addrs);
            }

            let imgs = $('img');
            
            for (let j = 0; j < imgs.length; j++) {
                const img = imgs[j];

                let src = img.attribs.src;

                if (!src.includes('http')) {
                    let segments = src.split('/');
                    const name = segments.pop();
                    src = segments.map(segment => {
                        if (segment.length > 15) {
                            let sg = segment.split('%20');
                            sg.pop();
                            return sg.join('%20');
                        } else {
                            return segment;
                        }
                    }).join('/') + '/' + name;
                    imgs[j].attribs.src = src;
                    console.log(src);
                }
            }

            fs.writeFileSync(`${path}\\${file.name}`, $.html());
        } else {
            if (file.isDirectory()) {
                renameHtmlLinksAndSrcs(`${path}\\${file.name}`);
            }
        }
    }

}

module.exports = {
    renameDirsRec,
    renameFilesRec,
    renameHtmlLinksAndSrcs
};