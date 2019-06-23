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
      return {result: Object.entries(res['Time Series (5min)'])[0][1]["1. open"], name: symbol };
    }
  });
}

function getStockAndLike(data, like, req){
  Stock.findOneAndUpdate({stock: data.name}, { $set: { price: data.result, likes: [] }}, {new: true, upsert: true})
  .then((stock) => {
    if(like && stock.likes.indexOf(req.clientIp) === -1)
      {
        stock.likes.push(req.clientIp);
        return stock.save();
      }
    else
      return stock;
  });
}

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(function (req, res){
    
      if(!req.query.stock) res.send('stock required');
    
      let stock = Array.isArray(req.query.stock) ? req.query.stock : [req.query.stock];
      const like = req.query.like === 'true' ? true : false;
      stock = stock.map(stock => stock.toUpperCase());
    
      if(stock.length == 1)
        {
          getPrice(stock[0])
          .then((data) => {
              if(!data.result) return res.send('stock not found');
              return getStockAndLike(stock[0], like, req);
            })
          .then(stock => console.log(stock))
          .catch((err) => res.send(err.message));
        }
      else 
        {
          Promise.all(getPrice(stock[0], getPrice(stock[1])))
          .then(([stock1, stock2]) => {
            
            if(!stock1.result || !stock2.result)
              return res.send('stock not found');
            return Promise.all(getStockAndLike(stock[0], like), getStockAndLike(stock[1], like));
          })
          .then(([r_stock1, r_stock2]) => {
            
            res.json([r_stock1.toJSON(), r_stock2.toJSON()]);
            
          })
        }
    
    });
    
};
