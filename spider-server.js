// 使用phantomjs做搜索引擎server，将需要做SEO的链接动态解析后返回，
// 具体参考：http://phantomjs.org/api/webserver/
// https://github.com/ariya/phantomjs/
// http://npm.taobao.org/dist/phantomjs/

// 导入包
var fs = require("fs");
var webpage = require('webpage');
var server = require('webserver').create();
var system = require('system');

// 配置信息
var remoteServer = "http://www.lunxue.cc";

// 常量信息
var startFlag = "++++++++";
var endFlag = "-------";
var caddyRewritePrefix = "/spider";
var subfixMap = {
    "css": "text/css",
    "html": "text/html",
    "ico": "image/x-icon",
    "png": "image/png",
    "jpg": "image/jpg",
    "jpeg": "image/jpeg",
    "js": "application/x-javascript"
};

// 获取url中的文件名
function getFileName(path) {
    var tmp = path.split("/");
    return tmp[tmp.length - 1].split("?")[0];
}

// 获取文件后缀名
function getFileSubfix(filename) {
    var tmp = filename.split(".");
    return tmp[tmp.length - 1];
}

// 获取ContentType
function getContentType(url) {
    var subfix = getFileSubfix(getFileName(url));
    if (!subfixMap[subfix] || subfixMap[subfix].length === 0) {
        return "";
    }
    return subfixMap[subfix];
}

// 获取渲染后的内容
function getAjaxPage(url, render, res) {
    console.log(startFlag);
    console.log("+ begin render ajax page.");
    url = url.replace(caddyRewritePrefix, "");
    var remoteUrl = remoteServer + url;
    console.log(url, " -> ", remoteUrl, ": ", getContentType(url));
    page = webpage.create();
    //page.content = page.frameContent = "";  // 清空初始化数据
    page.open(remoteUrl, function (status) {
        if (status !== 'success') {
            console.log("Failed to get url: ", remoteUrl);
        } else {
            if (getContentType(url).length !== 0) {
                phantom.outputEncoding = "utf8";
                render(res, getContentType(url), page.content);
            } else {
                console.log("ignore");
                res.close();
            }
            console.log(endFlag);
        }
    });
}

// 处理响应
function renderAjaxPage(res, contentType, content) {
    res.statusCode = 200;
    res.headers = {"Cache": "no-cache", "Content-Type": contentType};
    res.write(content);
    res.close();
}

// 主过程
if (system.args.length !== 2) {
    console.log("Usage: server.js <some port>");
    phantom.exit(1);
}

var port = system.args[1];
var listening = server.listen(port, function (req, res) {
    console.log("Get http request: ", JSON.stringify(req, null, 4));
    getAjaxPage(req.url, renderAjaxPage, res);
});