'use strict';

const path = require('path');
const fse = require('fs-extra');
const pkgDir = require('pkg-dir').sync;
const pathExists = require('path-exists').sync;
const npminstall = require('npminstall');
const formatPath = require('@one-cli/format-path');
const { getDefaultRegistry, getNpmSemverVersion, getNpmLatestVersion } = require('@one-cli/get-npm-info');

class Pacakge {
    constructor({
        targetPath,
        storeDir,
        packageName,
        packageVersion
    }) {
        this.targetPath = targetPath;
        this.storeDir = storeDir;
        this.packageName = packageName;
        this.packageVersion = packageVersion;
        this.cacheFilePathPrefix = this.packageName.replace('/', '_');
    }

    install() {
        return npminstall({
            root: this.targetPath,
            storeDir: this.storeDir,
            registry: getDefaultRegistry(),
            pkgs: [
                {
                    name: this.packageName,
                    version: this.packageVersion
                }
            ]
        })
    }

    async perpare() {
        if (this.storeDir && !pathExists(this.storeDir)) {
            await fse.mkdirp(this.storeDir);
        }
        if (this.packageVersion === 'latest') {
            this.packageVersion = await getNpmLatestVersion(this.packageName);
        }
    }

    get cacheFilePath() {
        return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`);
    }

    getSpecificCacheFilePath(packageVersion) {
        return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`);
    }

    async exist() {
        if (this.storeDir) {
            await this.perpare();
            return pathExists(this.cacheFilePath);
        } else {
            return pathExists(this.targetPath);
        }
    }

    async update() {
        await this.perpare();
        const latestPackageVersion = await getNpmLatestVersion(this.packageName);
        const latestFilePath = this.getSpecificCacheFilePath(latestPackageVersion);
        if (!pathExists(latestFilePath)) {
            await npminstall({
                root: this.targetPath,
                storeDir: this.storeDir,
                registry: getDefaultRegistry(),
                pkgs: [
                    {
                        name: this.packageName,
                        version: latestPackageVersion
                    }
                ]
            });
        }
        this.packageVersion = latestPackageVersion;
    }

    // 获取文件入口
    getRootFilePath() {
        function _getRootFilePath(targetPath) {
            const dir = pkgDir(targetPath);

            if (dir) {
                const pkgFile = require(path.resolve(dir, 'package.json'));

                if (pkgFile && pkgFile.main) {
                    return formatPath(path.resolve(dir, pkgFile.main));
                }
            }
            return null;
        }

        if (this.storeDir) {
            return _getRootFilePath(this.cacheFilePath);
        } else {
            return _getRootFilePath(this.targetPath);
        }
    }


}

module.exports = Pacakge;
