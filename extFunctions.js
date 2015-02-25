/**
 * @copyright Infostroy Software, Ltd 2015
 * @author Serge Glazun <t4gr1m@gmail.com>
 * @version 0.1
 */

/**
 * Get color for fill and text
 * 
 * @param {integer} int32data
 * 
 * @returns {String}
 */
module.exports.getColor = function(int32data) {
    var r = int32data >> 8  & 0xff
      , g = int32data >> 16 & 0xff
      , b = int32data >> 24 & 0xff;
    return 'rgb(' + r + ',' + g + ',' + b + ');';
};

/**
 * Get line color (for polyline)
 * It's smth strange with colors order
 * 
 * @param {integer} int32data
 * 
 * @returns {String}
 */
module.exports.getLineColor = function(int32data) {
    var r = int32data >> 16  & 0xff
      , g = int32data >> 8 & 0xff
      , b = int32data >> 0 & 0xff;
    return 'rgb(' + r + ',' + g + ',' + b + ');';
};