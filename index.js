#!/usr/bin/env node

const process = require('process');
const fs = require('fs');
const program = require('commander');
const xlfHandler = require('./xlf-handler');

function parseFileContent(fileName, allItems) {
    const fileContent = fs.readFileSync(fileName).toString();
    const parser = xlfHandler.createParser(fileContent);

    for (const item of parser.parse(fileContent)) {
        allItems.push({ ...item, fileName });
    }

    return parser.getLocale();
}

function cherryPickLocalization(masterFile, featureFile, outputFile) {
    
    const masterItems = [];
    parseFileContent(masterFile, masterItems);

    var featureItems = [];
    const locale = parseFileContent(featureFile, featureItems);

    masterItems.forEach(element => {
        const isfound = featureItems.find(t => t.id === element.id);
        if (!isfound) {
            featureItems.push(element);
        }
    });

    featureItems.map(element => {
        const isfound = masterItems.find(t => t.id === element.id);
        if (element.text !== isfound.text) {
            element.transElement.elements[0].text = isfound.text;
        }
    });


    if (featureItems.length) {
        let outputPath = featureFile;
        if(outputFile) {
            outputPath = outputFile
        }

        const convertedContent = xlfHandler.save(featureItems, locale);
        fs.writeFileSync(outputPath, convertedContent);
    }
}

program
    .name('xlf-cherry-pick')
    .version('0.0.1')
    .addHelpText(
        'before',
        'Xlf-Cherry-Pick 0.0.1\n' +
        'Put missing translation elements. Supports XLF 1.2\n'
    )
    .usage('[options] <input files such as *.xlf, messages.xlf>')
    .option('-m --master <master>', 'Master file name')
    .option('-f --feature <feature>', 'Feature file name')
    .option('-o --output <output>', 'Output file name')
    .addHelpText('after', '\n --master and --feature option is required')
    .parse(process.argv);

const options = program.opts();
if (program.args === 0 || (!options.master && !options.feature)) {
    program.help();
}

try {
    cherryPickLocalization(options.master, options.feature, options.output);
} catch (err) {
    process.exitCode = 1;
}