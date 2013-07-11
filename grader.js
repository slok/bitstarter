#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

// Simple url checker
var validURL = function(url) {
    var urlOk = url.match(/https?:\/\/.*\..+/) !== null;
    if(!urlOk) {
        console.log("%s Isn't a valid url", url);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return url;
};


// Cheerio utils --------
var cheerioHtmlFile = function(htmlfile) {
    return cheerioHtmlString(fs.readFileSync(htmlfile));
};

var cheerioHtmlString = function(str) {
    return cheerio.load(str);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};


// HTML checker utils --------
var checkHtmlUrl= function(url, checksfile, callback) {
    rest.get(url).on('complete', function(data) {
      msg = cheerioHtmlString(data);
      result = checkHtml(msg, checksfile);
      callback(result);
    });
};

var checkHtmlFile = function(htmlfile, checksfile, callback) {
    msg = cheerioHtmlFile(htmlfile);
    result = checkHtml(msg, checksfile);
    callback(result);
};

var checkHtml = function($, checksfile) {
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url>', 'url to index.html', clone(validURL))
        .parse(process.argv);


    // Decouple the callback to a var to not repeat code in each func.
    var myCallback = function(result){
      console.log(JSON.stringify(result, null, 4));
    };

    if (program.url !== undefined ){
      checkHtmlUrl(program.url, program.checks, myCallback);
    }else{
      checkHtmlFile(program.file, program.checks, myCallback);
    }


} else {
    exports.checkHtmlFile = checkHtmlFile;
}