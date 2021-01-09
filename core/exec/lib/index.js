'use strict';

const path = require('path');
const log = require('@one-cli/log');
const Package = require('@one-cli/package');

const SETTINGS = {
    init: '@one-cli/init',
};

const CACHE_DIR = 'dependencies';

async function exec() {
    let targetPath = process.env.CLI_TARGET_PATH;
    let storeDir = '';
    const homePath = process.env.CLI_HOME_PATH;
    log.verbose('targetPath', targetPath);
    log.verbose('homePath', homePath);

    const cmd = arguments[arguments.length - 1];
    const cmdName = cmd.name();
    const packageName = SETTINGS[cmdName];
    const packageVersion = 'latest';

    let pkg;

    if (!targetPath) {
        targetPath = path.resolve(homePath, CACHE_DIR);
        storeDir = path.resolve(targetPath, 'node_modules');
        log.verbose('targetPath', targetPath);
        log.verbose('storeDir', storeDir);

        pkg = new Package({
            targetPath,
            storeDir,
            packageName,
            packageVersion
        });


        if (await pkg.exist()) {
            await pkg.update();
        } else {
            await pkg.install();
        }

    } else {
        pkg = new Package({
            targetPath,
            packageName,
            packageVersion
        });
    }

    const rootFile = pkg.getRootFilePath();
    if (rootFile) {
        require(rootFile).apply(null, arguments);
    }
}

module.exports = exec;

