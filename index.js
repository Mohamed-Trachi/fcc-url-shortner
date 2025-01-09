require('dotenv').config();
const express = require('express');
const cors = require('cors');
const URL =require('url').URL
const dns=require('dns')
const mongoose=require('mongoose');
const { url } = require('inspector');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// database

const urlShema=new mongoose.Schema({
  original_url : {type:String,required:true},
  short_url : {type:Number,required:true,unique:true}
})

const UrlModel=mongoose.model('URL',urlShema)

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl',async (req,res)=>{
  let  original_url
  let url
  try {
    
    original_url=new URL(req.body.url)
    dns.lookup(original_url.host, async (err, address, family) => {
      if (err) {
        return res.json({ error: 'invalid url' })
      }

      url=await UrlModel.findOne({original_url:original_url.href})
      
      if(url){
        return res.json({ original_url:url.original_url , short_url:url.short_url })
      }

      let short_url
      do {
        short_url=Math.floor(Math.random()*1000);
      } while(await UrlModel.findOne({short_url}))
      
      url=new UrlModel({original_url:original_url.href,short_url})
      await url.save()

      res.json({ original_url:original_url.href , short_url })
    });

  } catch (error) {
    return res.json({ error: 'invalid url' })
  }
})

app.get('/api/shorturl/:short_url',async (req,res)=>{
  const {short_url}=req.params
  const url=await UrlModel.findOne({short_url})

  if(!url){
    return res.json({ error: 'invalid url' })
  }

  res.redirect(url.original_url);
})

mongoose.connect(process.env.MONGO_URI).then(()=>{
  app.listen(port, function() {
    console.log(`Listening on port ${port}`);
  });
}).catch(err=>{
  console.log(err);
})
