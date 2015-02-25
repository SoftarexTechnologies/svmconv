/**
 * @copyright Infostroy Ltd, 2015
 * @author Serge Glazun <t4gr1m@gmail.com>
 * @version 0.2
 */

var fn = require('./extFunctions');
  
/**
 * Version info
 *
 * @param {DataView} stream
 * @param {objcet}   parser
 *
 * @returns {object}
 */
module.exports.VersionCompat = VersionCompat = function(stream, offset) {
    return {
        version: stream.getUint16(offset, true)     || 0,
        length : stream.getUint32(offset + 2, true) || 0
    };
};

/**
 *
 * @param {DataView} stream
 * @param {object}   parser
 *
 * @returns {object}
 */
module.exports.Fraction = Fraction = function(stream, offset) {
    return {
        numerator  : stream.getUint32(offset, true)     || 1,
        denominator: stream.getUint32(offset + 4, true) || 1
    };
};

/**
 * Point
 *
 * @param {DataView} stream
 * @param {object}   parser
 *
 * @returns {object}
 */
module.exports.Point = Point = function(stream, offset) {
    return {
        x: stream.getInt32(offset, true)     || 0,
        y: stream.getInt32(offset + 4, true) || 0
    };
 };

/**
 * 33b length
 *
 * @param {DataView} stream
 * @param {object}   parser
 *
 * @returns {object}
 */
module.exports.MapMode = MapMode = function(stream, offset) {
    return {
        version : VersionCompat(stream, offset),
        unit    : stream.getUint16(offset + 6, true) || 0,
        origin  : Point(stream, offset + 8),
        scaleX  : Fraction(stream, offset + 16),
        scaleY  : Fraction(stream, offset + 24),
        isSimple: stream.getUint8(offset + 32)
    };
};

/**
 * SVM file header
 * 55b length
 *
 * @param {DataView} stream
 * @param {object}   parser
 *
 * @returns {object}
 */
module.exports.SvmHeader = function(stream, offset) {
    return {
        versionCompat  : VersionCompat(stream, offset),
        compressionMode: stream.getUint32(offset + 6, true),
        mapMode        : MapMode(stream, offset + 10),
        width          : stream.getUint32(offset + 43, true),
        height         : stream.getUint32(offset + 47, true),
        actionCount    : stream.getUint32(offset + 51, true)
    };
};

/**
 * Font settings
 *
 * @param {string}         fontName
 * @param {integer}        fontSize
 * @param {integer|string} fontWeight
 *
 * @returns {object}
 */
module.exports.Font = function(fontName, fontSize, fontWeight) {
    return {
        fontName  : fontName   || 'Arial',
        fontSize  : fontSize   || 14,
        fontWeight: fontWeight || 400
    };
};

/**
 * Rectangle
 *
 * @param {DataView} stream
 * @param {object}   parser
 *
 * @returns {object}
 */
module.exports.Rect = function(stream, offset) {
    return {
        left  : stream.getInt32(offset, true),
        top   : stream.getInt32(offset + 4, true),
        width : stream.getInt32(offset + 8, true),
        height: stream.getInt32(offset + 12, true)
    };
};

/**
 * Polygon
 *
 * @param {DataView} stream
 * @param {object}   parser
 *
 * @returns {array}
 */
module.exports.Polygon = function(stream, offset) {
    var pointsCount = stream.getUint16(offset, true);
    offset += 2;
    var polygon = {
        points: [],
        offset: offset
    };

    for (var i = 0; i < pointsCount; ++i) {
        var x = stream.getInt32(offset, true);
        offset += 4;
        var y = stream.getInt32(offset, true);
        offset += 4;

        polygon.points.push({
            x: x,
            y: y
        });
        polygon.offset = offset;
    };

    return polygon;
};

/**
 * Parse string data from stream
 *
 * @param {DataView} stream
 * @param {object}   parser
 * @param {string}   string
 *
 * @returns {string}
 */
module.exports.parseString = function(stream, offset, string) {
    var length = stream.getUint16(offset, true);
    offset += 2;

    for (var i = 0; i < length; ++i) {
        var ch  = stream.Uint8(offset);
        offset += 1;
        string += String.fromCharCode(ch);
    };

    return string;
};