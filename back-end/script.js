const express = require('express');
const app = express();
const PORT = 3000;
const path = require('path')



app.get('/',(req,res)=>{
    res.sendFile(path.resolve(__dirname) +'/index.html');
});
 
app.listen('3000',()=>{

    console.log(`server is listening on port ${3000}`);

}
)