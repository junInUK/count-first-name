const express = require('express');
const app = express();
const cors = require('cors');
const fs = require('fs');
const sd = require('silly-datetime');
const readline = require('readline');
const stream = require('stream');
const dotenv = require('dotenv');
const config = dotenv.config();
let name_count_objects = [];

app.use(cors());

const input_file = process.env.INPUT_FILE;
const output_file = process.env.OUTPUT_FILE;
const first_name_file = process.env.FIRST_NAME_FILE;

async function initFirstName(){
    name_count_objects = [];
    const category = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
    category.reverse();

    for(let i=0;i<category.length;i++){
        let item = new Object();
        item.category = category[i];
        item.first_name = [];
        name_count_objects.push(item);
    }

    const nameFileStream = fs.createReadStream(first_name_file);
    const nameLines = readline.createInterface({
        input: nameFileStream,
        crlfDelay: Infinity
    });
    
    for await(const line of nameLines){
        let first_letter = line.substr(0,1);
        let item = new Object();
        item.name = line;
        item.count = 0;
        let found = false;
        for(let i=0;i<name_count_objects.length;i++){
            if(first_letter.toUpperCase() == name_count_objects[i].category){
                for(let j=0;j<name_count_objects[i].first_name.length;j++){
                    if(name_count_objects[i].first_name[j].name == item.name){
                        found = true;
                    }
                }
                if(!found){
                    name_count_objects[i].first_name.push(item);
                }
            }
        }
    }
    for(let i=0;i<name_count_objects.length;i++){
        name_count_objects[i].first_name.sort();       
        name_count_objects[i].first_name.reverse();
    }
    return name_count_objects;
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
            let word = res[i];
            let first_letter = word.substr(0,1);
            let last_char = word.substr(word.length-1,1);
            let asc = last_char.charCodeAt();
            //  if the last character wasn't letter
            if( asc <= 64 || (asc>=91&&asc<=96) || asc>=123){
                word = word.substr(0,word.length-1);
            }
            for(let j=0;j<name_count_objects.length;j++){
                if(first_letter.toUpperCase() == name_count_objects[j].category){
                //    console.log("find category!");
                    for(let k=0;k<name_count_objects[j].first_name.length;k++){
                        if(word.toLowerCase() == name_count_objects[j].first_name[k].name.toLowerCase()){
                            console.log("find first name!");
                            name_count_objects[j].first_name[k].count = 
                                parseInt(name_count_objects[j].first_name[k].count) + 1;
                        }
                    }
                }
            }
        }
    }
    return name_count_objects;
}

async function writeOutputFile(){
    const outputFileStream = fs.createWriteStream(output_file);
    outputFileStream.write("");
    for(let i = 0; i<name_count_objects.length; i++){
        for(let j=0; j<name_count_objects[i].first_name.length; j++){
            let str = name_count_objects[i].first_name[j].name + ":" 
                + name_count_objects[i].first_name[j].count + "\r\n";
            outputFileStream.write(str);
        }
    }
}

async function processLine(){
    name_count_objects = [];
    const fileStream = fs.createReadStream(output_file);
    const lines = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity //  transfer '\r\n' to single line return
    });
    let i = 0;
    for await (const line of lines){
        let res = line.split(":");
        console.log(res);
        let item = new Object();
        item.name = res[0];
        item.count = res[1];
        name_count_objects.push(item);
    }
    return name_count_objects;
}

function getCountByName(name){
   
    console.log("getCountByName:"+name);
    console.log("name_count_objects size:"+name_count_objects.length);
    let first_letter = name.substr(0,1);
    let result = new Object();
    for(let i=0;i<name_count_objects.length;i++){
        if(name_count_objects[i].category.toLowerCase() == first_letter.toLowerCase()){
            for(let j=0;j<name_count_objects[i].first_name.length; j++){
                if(name_count_objects[i].first_name[j].name.toLowerCase() == name.toLowerCase()){
                    result = name_count_objects[i].first_name[j];
                    return result;
                }
            }
        }
    }
   
    result.name = name;
    result.count = 0;
    return result;
}

app.get('/', function(req, res){
    console.time("count name");
    initFirstName()
    .then((result) => {
        countFirstName()
        .then((re)=>{
            console.timeEnd("count name");
            res.json(re);
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
