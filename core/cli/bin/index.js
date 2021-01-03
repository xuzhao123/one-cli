#! /usr/bin/env node

const utils = require('@one-cli/utils');
utils();

const importLocal = require('import-local');

if (importLocal(__filename)) {
    require("npmlog").info("cli", "using local version of one-cli");
} else {
    require('../lib')(process.argv.slice(2));
}
