/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
const mongoose = require('mongoose');
const request = require('request-promise');

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});
mongoose.connect(CONNECTION_STRING);

const schema = mongoose.Schema({
  stock: {
    type: String,
    required: true
  },
  price: Number,
  likes: [ String ]
}, {versionKey: false});

schema.methods.toJSON = function(){
  const obj = this.toObject();
  obj.likes = obj.likes.length;
  return obj;
}

const Stock = mongoose.model('Stock', schema);

const api = 'https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&interval=5min&apikey=' + process.env.APIKEY_AV;

function getPrice(symbol)
{
  return request({uri: api + '&symbol=' + symbol, json: true}).then((res) => {
    if(res['Error Message'])
      return {result: false, stock: symbol};
    else {
      return {result: Object.entries(res['Time Series (5min)'])[0][1]["1. open"], stock: symbol };
    }
  });
}

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(function (req, res){
    
      if(!req.query.stock) res.send('stock required');
    
      let stock = Array.isArray(req.query.stock) ? req.query.stock : [req.query.stock];
      const like = req.query.like === 'true' ? true : false;
      stock = stock.map(stock => stock.toLowerCase());
    
      if(stock.length == 1)
        {
          getPrice(stock[0])
          .then((data) => {
            if(!data.result) return res.send('stock not found');
            
            Stock.findOneAndUpdate({stock: stock[0]}, { $set: { price: data.result } }, {upsert: true}, function(err, stock){
              
              if(err) return res.send('mongodb error');
              if(!Array.isArray(stock.likes)) stock.likes = [];
              if(like && stock.likes.indexOf(req.clientIp) == -1)
                {
                  stock.likes.push(req.clientIp);
                  stock.save(function(err, stock){
                    if(err) return res.send('mongodb error');
                    return res.json(stock.toJSON());
                  })
                }
                
              res.json(stock.toJSON());
              
            });
          })
        }
      else 
        {
          
        }
    
    });
    
};
