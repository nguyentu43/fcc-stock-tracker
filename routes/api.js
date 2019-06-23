/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
const request = require('request-promise');

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});
const api = 'https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&interval=5min&apikey=' + process.env.APIKEY_AV;

function getPrice(symbol)
{
  return request({uri: api + '&symbol=' + symbol, json: true}).then((res) => {
    if(res['Error Message'])
      return {[symbol]: false};
    else {
      return {[symbol]: Object.entries(res['Time Series (5min)'])[0][1]["1. open"] };
    }
  });
}

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(function (req, res){
    
      if(!req.body.stock) res.send('stock required');
    
      const stock = Array.isArray(req.query.stock) ? req.query.stock : [req.query.stock];
      const like = req.query.like === 'true' ? true : false;
    
      if(stock)
    
    });
    
};
