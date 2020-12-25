#!/usr/bin/env node
const shell = require('shelljs');
const program = require('commander');
const inquirer = require('inquirer');
const download = require('download-git-repo');
const ora = require('ora');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const spinner = ora();
const cheerio = require('cheerio');
program.version('1.0.0', '-v, --version')
    .parse(process.argv);
console.log(program.args)
let dir = program.args[0];

const questions = [{
    type: 'input',
    name: 'name',
    message: '请输入项目名称',
    default: dir,
    validate: (name) => {
        if (/^[a-z]+/.test(name)) {
            return true;
        } else {
            return '项目名称必须以小写字母开头';
        }
    }
}
]
// 交互 用户输入答案
inquirer.prompt(questions).then((answers) => {
    // 初始化模板文件
    downloadTemplate(answers);
})

function downloadTemplate(params) {
    spinner.start('loading');
    console.log(params)
    let isHasDir = fs.existsSync(path.resolve(dir));
    if (isHasDir) {
        spinner.fail('当前目录已存在!');
        return false;
    }
    // 开始下载模板文件
    download('direct:https://code.aliyun.com/wx-web/wx-admin-manager.git', dir, {clone: true}, function (err) {
        if (err) {
            spinner.fail(err);
        }
        ;
        updateTemplateFile(params);
    })
}

function updateTemplateFile(params) {
    let {name, description} = params;
    params.version = '1.0.0';
    const arr = params.name.split('-');
    const projectName = arr.reduce((prev, cuur, index) => {
        const str = cuur[0].toUpperCase() + cuur.slice(1);
        return prev + str;
    }, '')
    changeText('/src/index.html', projectName, 'WxAdminManager');
    changeText('/src/app/app.component.html', projectName, 'WxAdminManager');
    fs.readFile(`${path.resolve(dir)}/package.json`, (err, buffer) => {
        if (err) {
            console.log(chalk.red(err));
            return false;
        }
        shell.rm('-f', `${path.resolve(dir)}/.git`);
        shell.rm('-f', `${path.resolve(dir)}/CHANGELOG.md`);
        let packageJson = JSON.parse(buffer);
        Object.assign(packageJson, params);
        fs.writeFileSync(`${path.resolve(dir)}/package.json`, JSON.stringify(packageJson, null, 2));
        fs.writeFileSync(`${path.resolve(dir)}/README.md`, `# ${name}\n> ${description}`);
        spinner.succeed('创建完毕');
        installDep();
    });
}

function installDep() {
    shell.cd(dir);
    shell.exec('git init')
    shell.echo('-e', '\n');
    shell.exec('npm install', {fatal: true}, function (code, stdout, stderr) {
        /*if (stderr) {
            console.error("安装失败，请运行 npm install 命令重新安装依赖！")
            spinner.fail("Error")
            return
        }*/
        spinner.succeed('安装完成！')
    });
    spinner.start("正在安装依赖···");

}
function changeText(filePath, content, target){
     filePath = `${path.resolve(dir)}${filePath}`;
    fs.readFile(filePath, (err, data) => {
        data = data.toString();
        data = data.replace(target, content);
        fs.writeFileSync(`${filePath}`, data)
    })
}
