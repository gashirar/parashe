const himalaya = require('himalaya');
const request = require("request");
const cheerio = require('cheerio');

let options = {
    url: process.argv[2],
    method: "GET"
};
let params = [];

request(options, function (error, response, body) {
    const $ = cheerio.load(body);
    let objectSchema = himalaya.parse(
        $('body > div.container > div > div.col-xs-12.col-sm-9.col-md-9.main > div:nth-child(4) > div > pre').html());

    recur(objectSchema, 0);

    let maxNest = 13;
    for (let p of params) {
        maxNest = (p.nestLevel > maxNest) ? p.nestLevel : maxNest;
    }
    maxNest++;
    console.log("Reference:,,,,,," + process.argv[2]);
    console.log("");
    console.log("Field,,,,,,,,,,,Use,Reserve,Reserve,Type,Description");
    for (let p of params) {
        console.log(",".repeat(p.nestLevel) + p.field + ",".repeat(maxNest - p.nestLevel) + p.type + ",", p.description.trim());
    }
});


let re = /^\((.*?)\)(.*|)$/;
function recur(objArray, nestLevel) {
    for (let obj of objArray) {
        if (obj.type === "element") {
            if (obj.tagName === "summary" || obj.tagName === "div") {
                for (let child of obj.children) {
                    if (child.type === "element" && child.tagName === "span") {
                        let des = child.attributes[0].value.replace(/\r?\n/g, '').replace(/,/g, '_');
                        let n = (obj.tagName === "summary") ? Math.max(0, nestLevel-1) : nestLevel;
                        let result = des.match(re);
                        let type, description;
                        if (result != null) {
                            type = result[1];
                            description = result[2];
                        }
                        params.push({
                            "field": child.children[0].content,
                            "nestLevel": n,
                            "type": type,
                            "description": '"' + description + '"'
                        });
                    }
                }
            } else if (obj.tagName === "details") {
                recur(obj.children, nestLevel + 1)
            }
        } else if (obj.children !== undefined) {
            recur(obj.children, nestLevel);
        }
    }
}

