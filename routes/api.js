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
  
  return new Promise((resolve) => {
    
    setTimeout(() => {
      
      request({uri: api + '&symbol=' + symbol, json: true}).then((res) => {
        if(res['Error Message'])
          resolve({result: false, name: symbol});
        else resolve({result: Object.entries(res['Time Series (5min)'])[0][1]["1. open"], name: symbol });
      });
      
    }, 20 * 1000);
    
  });
  
}

function getStockAndLike(data, like, req){
  return Stock.findOne({ stock: data.name} )
  .then((stock) => {
    if(!stock) return (new Stock({ stock: data.name, price: data.result })).save();
    return stock;
  })
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
              getStockAndLike(data, like, req).then(stock => res.json({stockData: stock}));
            })
          .catch((err) => res.send(err.message));
        }
      else 
        {
          Promise.all([getPrice(stock[0]), getPrice(stock[1])])
          .then(([stock1, stock2]) => {
            
            if(!stock1.result || !stock2.result)
              return res.send('stock not found');
            
            Promise.all([ getStockAndLike(stock1, like, req), getStockAndLike(stock2, like, req) ])
            .then(([result_stock1, result_stock2]) => {
              res.json({
                stockData: [
                  { rel_likes: result_stock1.likes.length - result_stock2.likes.length, stock: result_stock1.stock, price: result_stock1.price },
                  { rel_likes: result_stock2.likes.length - result_stock1.likes.length, stock: result_stock2.stock, price: result_stock2.price }
                ]
              })
            });
            
          })
          .catch((err) => res.send(err.message));
        }
    
    });
    
};
