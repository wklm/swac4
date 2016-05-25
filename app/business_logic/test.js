/**
 * Created by wojtek on 5/25/16.
 */
var _ = require('lodash');


var a = [1,2,1,1,2], b = [1,1,1,1];
console.log(_.difference(b, a).length === 0);