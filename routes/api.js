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

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(function (req, res){
      const stock = req.query.stock;
      const like = req.body.like;
    
      function getPrice(symbol)
      {
        return request.get(api + '&symbol=' + symbol).then((res) => {
          if(res['Error Message'])
            return 
        });
      }
    
      request
      .get(api + '&symbol=MSFT')
      .then((res) => {
        console.log(res);
      })
    
    });
    
};
