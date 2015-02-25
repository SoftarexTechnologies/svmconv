/**
 * @copyright Infostroy Ltd, 2015
 * @author Serge Glazun <t4gr1m@gmail.com>
 * @version 0.2
 */

/**
 * Debug console output
 *
 * @type Boolean
 */
var DEBUG = false;

/**
 * Canvas scale
 *
 * @type Number
 */
var SCALE = 26.9;

/**
 * @type {Array}
 * @readonly
 * @enum {string}
 */
var ActionNames = [
    "META_NULL_ACTION",
    "META_PIXEL_ACTION",
    "META_POINT_ACTION",
    "META_LINE_ACTION",
    "META_RECT_ACTION",
    "META_ROUNDRECT_ACTION",
    "META_ELLIPSE_ACTION",
    "META_ARC_ACTION",
    "META_PIE_ACTION",
    "META_CHORD_ACTION",
    "META_POLYLINE_ACTION",
    "META_POLYGON_ACTION",
    "META_POLYPOLYGON_ACTION",
    "META_TEXT_ACTION",
    "META_TEXTARRAY_ACTION",
    "META_STRETCHTEXT_ACTION",
    "META_TEXTRECT_ACTION",
    "META_BMP_ACTION",
    "META_BMPSCALE_ACTION",
    "META_BMPSCALEPART_ACTION",
    "META_BMPEX_ACTION",
    "META_BMPEXSCALE_ACTION",
    "META_BMPEXSCALEPART_ACTION",
    "META_MASK_ACTION",
    "META_MASKSCALE_ACTION",
    "META_MASKSCALEPART_ACTION",
    "META_GRADIENT_ACTION",
    "META_HATCH_ACTION",
    "META_WALLPAPER_ACTION",
    "META_CLIPREGION_ACTION",
    "META_ISECTRECTCLIPREGION_ACTION",
    "META_ISECTREGIONCLIPREGION_ACTION",
    "META_MOVECLIPREGION_ACTION",
    "META_LINECOLOR_ACTION",
    "META_FILLCOLOR_ACTION",
    "META_TEXTCOLOR_ACTION",
    "META_TEXTFILLCOLOR_ACTION",
    "META_TEXTALIGN_ACTION",
    "META_MAPMODE_ACTION",
    "META_FONT_ACTION",
    "META_PUSH_ACTION",
    "META_POP_ACTION",
    "META_RASTEROP_ACTION",
    "META_TRANSPARENT_ACTION",
    "META_EPS_ACTION",
    "META_REFPOINT_ACTION",
    "META_TEXTLINECOLOR_ACTION",
    "META_TEXTLINE_ACTION",
    "META_FLOATTRANSPARENT_ACTION",
    "META_GRADIENTEX_ACTION",
    "META_LAYOUTMODE_ACTION",
    "META_TEXTLANGUAGE_ACTION",
    "META_OVERLINECOLOR_ACTION",
    "META_RENDERGRAPHIC_ACTION",
    "META_COMMENT_ACTION"
];

/**
 * @private
 */
var fn      = require('./extFunctions')
  , Structs = require('./SvmStructs')
  , fs      = require('fs')
  , Canvas  = require('canvas');

/**
 * SVM file parser
 *
 * @constructor
 */
var SvmParser = function() {
    /**
     * Graphics renderer
     *
     * @public
     */
    this.mBackend = 0;
    /**
     * Stream caret position
     *
     * @public
     */
    this.offset = 0;

    return this;
};

/**
 * Set graphics rendering backend
 *
 * @param {object} backend
 *
 * @returns {SvmParser.prototype}
 */
SvmParser.prototype.setBackend = function(backend) {
    // Canvas backend
    this.mBackend = backend;

    return this;
};

/**
 * Parse uploaded SVM file and render it to standard graphics
 *
 * @param {ArrayBuffer} data
 *
 * @returns {Boolean|SvmParser.prototype}
 */
SvmParser.prototype.parse = function(data, fileName, writeToFs) {
    if (data.toString('utf8', 0, 8).indexOf('VCLMTF') === -1) {
        return false;
    }

    var buffer  = toArrayBuffer(data)
      , stream  = new DataView(buffer)
      , header  = new Structs.SvmHeader(stream, 6)
      , canv    = new Canvas(header.width / SCALE + 10, header.height / SCALE + 10)
      , canvas  = canv.getContext('2d')
      , Painter = require('./Painter');

    this.setBackend(new Painter(canvas));

    if (DEBUG) {
        console.info("================ SVM HEADER ================");
        console.log("version, length: %d, %d", header.versionCompat.version, header.versionCompat.length);
        console.log("compressionMode: %d",     header.compressionMode);
        console.log("mapMode: Origin: %s",     JSON.stringify(header.mapMode.origin));
        console.log("scaleX: %d, %d",          header.mapMode.scaleX.numerator, header.mapMode.scaleX.denominator);
        console.log("scaleY: %d, %d",          header.mapMode.scaleY.numerator, header.mapMode.scaleY.denominator);
        console.log("size: %d, %d",            header.width, header.height);
        console.log("actionCount: %d",         header.actionCount);
        console.info("================ SVM HEADER ================");
    }

    this.offset = 61;

    for (var action = 0; action < header.actionCount; ++action) {
        // SVM action
        var actionType = stream.getUint16(this.offset, true);
        this.offset   += 2;
        // Action version (?)
        var version    = stream.getUint16(this.offset, true);
        this.offset   += 2;
        // Action dataset block size
        var totalSize  = stream.getUint32(this.offset, true);
        this.offset   += 4;
        var dataArray  = new Uint8Array(totalSize)
          , actionName;

        if (actionType === 0) {
            actionName = ActionNames[0];
        } else if (100 <= actionType && actionType !== 512) {
            actionName = ActionNames[actionType - 99];
        } else if (actionType === 512) {
            // e.g. XPATHFILL_SEQ_BEGIN, sections boundaries comments
            actionName = "META_COMMENT_ACTION";
        } else {
            actionName = "(out of bounds)";
        }

        var curr_offset = this.offset;
        for (var item_idx = 0; item_idx < totalSize; item_idx++) {
            dataArray[item_idx] = stream.getUint8(this.offset);
            this.offset++;
        }

        if (DEBUG) {
            console.log('actionType: %d | %s',    actionType, actionName);
            console.log('version: %d',            version);
            console.log('totalSize: %d',          totalSize);
            console.log('offset: %d, length: %d', this.offset, stream.byteLength);
            console.log('dataArray: %s',          JSON.stringify(dataArray));
        }

        if (dataArray.buffer.byteLength === 0 && DEBUG) {
            console.log('------------------------------------------------');
            continue;
        }

        // Create new DataView from filtered dataset buffer (Uint8Array -> DataView)
        dataArray = new DataView(dataArray.buffer);

        switch (actionName) {
            case 'META_RECT_ACTION':
                this.mBackend.drawRect(Structs.Rect(dataArray, 0), SCALE);
                break;
            case 'META_POLYLINE_ACTION':
                this.mBackend.drawPolyline(
                    Structs.Polygon(dataArray, 0).points,
                    SCALE
                );
                break;
            case 'META_POLYGON_ACTION':
                this.mBackend.drawPolygon(
                    Structs.Polygon(dataArray, 0).points,
                    SCALE
                );
                break;
            case 'META_POLYPOLYGON_ACTION':
                var polyCount  = dataArray.getUint16(0, true)
                  , polyOffset = 2
                  , polyList   = new Array(polyCount);

                for (var i = 0; i < polyCount; i++) {
                    var poly    = Structs.Polygon(dataArray, polyOffset);
                    polyList[i] = poly.points;

                    polyOffset.offset += poly.offset;
                    this.mBackend.drawPolygon(poly.points, SCALE);
                }
                break;
            case 'META_TEXTARRAY_ACTION':
                var string  = {
                        startPoint: {
                            x: dataArray.getInt32(0, true) / SCALE,
                            y: dataArray.getInt32(4, true) / SCALE
                        },
                        text : ''
                    }
                  , string_len = dataArray.getUint16(8, true)
                  , local_offs = 12;

                for (var i = 0; i < string_len * 2; i += 2) {
                    string.text += String.fromCharCode(dataArray.getUint16(local_offs + i, true));
                }

                this.mBackend.drawText(string.startPoint, string.text);
                break;
            case 'META_BMPEXSCALE_ACTION':
                var bmWidth   = dataArray.getUint32(18, true)
                  , bmHeight  = dataArray.getUint32(22, true)
                  , bitCount  = dataArray.getUint16(28, true)
                  , stride    = Math.floor((bitCount * bmWidth + 31) / 32) * 4
                  , pixels    = new Uint8Array(buffer, curr_offset + 54)
                  , cnv       = new Canvas(bmWidth, bmHeight)
                  , ctx       = cnv.getContext('2d')
                  , imageData = ctx.createImageData(bmWidth, bmHeight)
                  , canvasxy  = {
                        x: (Math.round(header.width  / SCALE) - bmWidth)  / 2 - 15,
                        y: (Math.round(header.height / SCALE) - bmHeight) / 2 - 10
                    };

                // Draw image from temp canvas and swap black to white
                // (SVM bitmaps have no alpha, so we have black bg, not transparent)
                for (var y = 0; y < bmHeight; ++y) {
                    for (var x = 0; x < bmWidth; ++x) {
                        var index1 = (x + bmWidth * (bmHeight - y)) * 4
                          , index2 = x * 3 + stride * y
                          , r = pixels[index2 + 2]
                          , g = pixels[index2 + 1]
                          , b = pixels[index2];

                        // Transfer pixels from bitmap to png
                        imageData.data[index1]     = pixels[index2 + 2];
                        imageData.data[index1 + 1] = pixels[index2 + 1];
                        imageData.data[index1 + 2] = pixels[index2];
                        imageData.data[index1 + 3] = 255;

                        if (g === 0 && r === 0 && b === 0) {
                            imageData.data[index1 + 3] = 0;
                        }
                    }
                }

                this.mBackend.getContext().putImageData(imageData, canvasxy.x, canvasxy.y);
                break;
            case 'META_LINECOLOR_ACTION':
                this.mBackend.pen.color   = fn.getLineColor(dataArray.getUint32(0, true));
                this.mBackend.pen.enabled = dataArray.getUint8(4);
                break;
            case 'META_FILLCOLOR_ACTION':
                this.mBackend.brush.color   = fn.getColor(dataArray.getUint32(0));
                this.mBackend.brush.enabled = dataArray.getUint8(4);
                break;
            case 'META_TEXTCOLOR_ACTION':
                this.mBackend.fontstyle = fn.getColor(dataArray.getUint32(0, true));
                break;
            case 'META_FONT_ACTION':
                var font = {};

                font.version   = fn.getColor(dataArray.getUint16(0, true));
                font.totalSize = fn.getColor(dataArray.getUint32(2, true));
                font.family    = parseString(dataArray, 6);
                this.mBackend.setFont('14px ' + font.family.string);
                break;

            /** @TODO: implement this later if necessary **/
            case 'META_TEXTFILLCOLOR_ACTION'        :
            case 'META_TEXTALIGN_ACTION'            :
            case 'META_MAPMODE_ACTION'              :
            case 'META_PUSH_ACTION'                 :
            case 'META_LAYOUTMODE_ACTION'           :
            case 'META_TEXTLANGUAGE_ACTION'         :
            case 'META_OVERLINECOLOR_ACTION'        :
            case 'META_POP_ACTION'                  :
            case 'META_RASTEROP_ACTION'             :
            case 'META_TRANSPARENT_ACTION'          :
            case 'META_EPS_ACTION'                  :
            case 'META_REFPOINT_ACTION'             :
            case 'META_TEXTLINECOLOR_ACTION'        :
            case 'META_TEXTLINE_ACTION'             :
            case 'META_GRADIENTEX_ACTION'           :
            case 'META_FLOATTRANSPARENT_ACTION'     :
            case 'META_NULL_ACTION'                 :
            case 'META_PIXEL_ACTION'                :
            case 'META_POINT_ACTION'                :
            case 'META_LINE_ACTION'                 :
            case 'META_ROUNDRECT_ACTION'            :
            case 'META_ELLIPSE_ACTION'              :
            case 'META_ARC_ACTION'                  :
            case 'META_TEXT_ACTION'                 :
            case 'META_PIE_ACTION'                  :
            case 'META_STRETCHTEXT_ACTION'          :
            case 'META_TEXTRECT_ACTION'             :
            case 'META_BMP_ACTION'                  :
            case 'META_BMPSCALE_ACTION'             :
            case 'META_BMPSCALEPART_ACTION'         :
            case 'META_BMPEX_ACTION'                :
            case 'META_BMPEXSCALEPART_ACTION'       :
            case 'META_MASK_ACTION'                 :
            case 'META_MASKSCALE_ACTION'            :
            case 'META_MASKSCALEPART_ACTION'        :
            case 'META_GRADIENT_ACTION'             :
            case 'META_HATCH_ACTION'                :
            case 'META_WALLPAPER_ACTION'            :
            case 'META_CLIPREGION_ACTION'           :
            case 'META_MOVECLIPREGION_ACTION'       :
            case 'META_ISECTRECTCLIPREGION_ACTION'  :
            case 'META_ISECTREGIONCLIPREGION_ACTION':
            case 'META_CHORD_ACTION'                :
            case 'META_RENDERGRAPHIC_ACTION'        :
            case 'META_COMMENT_ACTION'              :
            default:
                break;
        }

        if (DEBUG) {
            console.log('-------------------------------------------------------');
        }
    }

    // Write to filesystem or return base64
    if (writeToFs) {
        var imageData   = this.mBackend.getContext().canvas.toDataURL()
          , imageBuffer = decodeBase64Image(imageData);
        fs.writeFile(fileName + '.png', imageBuffer.data, function(err) {});
        return this;
    } else {
        return this.mBackend.getContext().canvas.toDataURL();
    }
};

/**
 * Decodes base64 uri to base64 Buffer
 *
 * @param {string} dataString
 *
 * @returns {Buffer}
 */
function decodeBase64Image(dataString) {
  var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
    response = {};

  if (matches.length !== 3) {
    return new Error('Invalid input string');
  }

  response.type = matches[1];
  response.data = new Buffer(matches[2], 'base64');

  return response;
};

/**
 * Parse text
 *
 * @param {DataView} data
 * @param {integer}  startFrom
 *
 * @returns {object}
 */
parseString = function(data, startFrom) {
    var length    = data.getUint16(startFrom, true)
      , string    = ''
      , startFrom = parseInt(startFrom, 10) + 2;

    for (var i = 0; i < length; i++) {
        var ch  = data.getUint8(startFrom + i);
        string += String.fromCharCode(ch);
    };

    return {
        string: string,
        length: length
    };
};

/**
 * Convert node.js Buffer to ArrayBuffer
 *
 * @param {Buffer} buffer
 *
 * @returns {ArrayBuffer}
 */
toArrayBuffer = function(buffer) {
    var ab   = new ArrayBuffer(buffer.length)
      , view = new Uint8Array(ab);

    for (var i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }

    return view.buffer;
};

module.exports = SvmParser;