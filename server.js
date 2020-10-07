const express = require('express');
const app = express();
const cors = require('cors');
const fs = require('fs');
const readline = require('readline');
const stream = require('stream');
const dotenv = require('dotenv');
const config = dotenv.config();

let nameMap = new Map();

app.use(cors());

const input_file = process.env.INPUT_FILE;
const output_file = process.env.OUTPUT_FILE;
const first_name_file = process.env.FIRST_NAME_FILE;

async function initFirstName(){
    nameMap.clear();
    const nameFileStream = fs.createReadStream(first_name_file);
    const nameLines = readline.createInterface({
        input: nameFileStream,
        crlfDelay: Infinity
    });
    
    for await(const line of nameLines){
        let item = new Object();
        item.name = line.toLowerCase();
        item.count = 0;
        let found = false;
        if(!nameMap.has(item.name)){
            nameMap.set(item.name, 0);
        }
    }
    return nameMap;
}

async function countFirstName(){
    const inFileStream = fs.createReadStream(input_file);
    const inLines = readline.createInterface({
        input: inFileStream,
        crlfDelay: Infinity
    });
    for await(const line of inLines){
        console.log(line);
        let res = line.split(" ");
        for(let i = 0;i<res.length;i++){
            let word = res[i].toLowerCase();
            let first_letter = word.substr(0,1);
            let last_char = word.substr(word.length-1,1);
            let asc = last_char.charCodeAt();
            //  if the last character wasn't letter
            if( asc <= 64 || (asc>=91&&asc<=96) || asc>=123){
                word = word.substr(0,word.length-1);
            }
            if(nameMap.has(word)){
                let count = parseInt(nameMap.get(word)) + 1; 
                nameMap.set(word, count);
            }
        }
    }
    return nameMap;
}

async function writeOutputFile(){
    const outputFileStream = fs.createWriteStream(output_file);
    outputFileStream.write("");
    let arrayObj = Array.from(nameMap);
    arrayObj.sort(function(a,b){return a[0].localeCompare(b[0])});
    arrayObj.reverse();
    let result = new Map(arrayObj.map(item=>[item[0], item[1]]));
    for(let [key, value] of result){
        let str = key + ":" + value + "\r\n";
        outputFileStream.write(str);
    }
}

function getCountByName(name){
    let result = new Object();
    let nameLower = name.toLowerCase();
    result.name = nameLower;
    result.count = 0;
    if(nameMap.has(nameLower)){
        result.count = nameMap.get(nameLower);
    }
    return result;
}
        
app.get('/', function(req, res){
    console.time("count name");
    initFirstName()
    .then((tempMap) => {
        countFirstName()
        .then((re)=> {
            console.timeEnd("count name");
            res.json({message:"process finished!"});
            writeOutputFile();
        })
        .catch(console.error);
    })
    .catch(console.error);
});

app.get('/:name',function(req,res){
    const name = req.params.name;
    result = getCountByName(name);
    res.json(result);
})

const port = process.env.PORT || 3000;

app.listen(port, 
    () => console.log("App running on port " + port));
