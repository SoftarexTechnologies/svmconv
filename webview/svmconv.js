/**
 * @copyright Infostroy Ltd, 2015
 * @author Serge Glazun <t4gr1m@gmail.com>
 * @version 0.3
 */

var offset        = 0
  , SCALING_COEFF = 26.9
  , ActionNames   = [
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

Uint8 = function(stream) {
    var data = stream.getUint8(offset);
    offset  += 1;
    return data;
};

Uint16 = function(stream) {
    var data = stream.getUint16(offset, true);
    offset  += 2;
    return data;
};

Uint32 = function(stream) {
    var data = stream.getUint32(offset, true);
    offset  += 4;
    return data;
};

Int32 = function(stream) {
    var data = stream.getInt32(offset, true);
    offset  += 4;
    return data;
};

VersionCompat = function(data) {
    return {
        version: Uint16(data) || 0,
        length : Uint32(data) || 0
    };
};

Fraction = function(data) {
    return {
        numerator  : Uint32(data) || 1,
        denominator: Uint32(data) || 1
    };
};

Point = function(data) {
    return {
        x: Int32(data) || 0,
        y: Int32(data) || 0
    };
 };

MapMode = function(data) {
    return {
        version : VersionCompat(data),
        unit    : Uint16(data) || 0,
        origin  : Point(data),
        scaleX  : Fraction(data),
        scaleY  : Fraction(data),
        isSimple: Uint8(data)
    };
};

SvmHeader = function(data) {
    this.versionCompat   = VersionCompat(data);
    this.compressionMode = Uint32(data);
    this.mapMode         = MapMode(data);
    this.width           = Uint32(data);
    this.height          = Uint32(data);
    this.actionCount     = Uint32(data);

    return this;
};

getColor = function(int32data) {
    var a = int32data >> 24 & 0xff
      , r = int32data >> 16 & 0xff
      , g = int32data >> 8  & 0xff
      , b = int32data >> 0  & 0xff;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ');';
};

parseString = function(data, startFrom) {
    var length = data.getUint16(startFrom, true)
      , string = ''
      , startFrom = parseInt(startFrom) + 2;

    for (var i = 0; i < length; i++) {
        var ch  = data.getUint8(startFrom + i);
        string += String.fromCharCode(ch);
    };

    return {
        string: string,
        length: length
    };
};

parsePolygon = function(stream, offset) {
    var pointsCount = stream.getUint16(offset, true)
      , polygon     = {
        points: [],
        offset: offset
    };
    offset += 2;
    for (var i = 0; i < pointsCount; ++i) {
        var x = Math.round(stream.getInt32(offset, true));
        offset += 4;
        var y = Math.round(stream.getInt32(offset, true));
        offset += 4;
        polygon.points.push({
            x: x,
            y: y
        });
        polygon.offset = offset;
    }
    return polygon;
};

convertSVM = function() {
    var reader = new FileReader();
    reader.readAsArrayBuffer(document.getElementById('file').files[0]);
    var ab = '';
    reader.onload = function(e) {
        ab = e.target.result;
        var dv = new DataView(ab);

        offset = 6;
        var header   = new SvmHeader(dv)
          , canvas   = document.getElementById('canvas').getContext('2d')
          , xPainter = new Painter(canvas);

        document.getElementById('canvas').setAttribute('width', Math.round(header.width / SCALING_COEFF));
        document.getElementById('canvas').setAttribute('height', Math.round(header.height / SCALING_COEFF));

        for (var action = 0; action < header.actionCount; ++action) {

            var actionType = Uint16(dv)
              , version    = Uint16(dv)
              , totalSize  = Uint32(dv)
              , dataArray  = new Uint8Array(totalSize)
              , name;

            if (actionType === 0) {
                name = ActionNames[0];
            } else if (100 <= actionType && actionType !== 512) {
                name = ActionNames[actionType - 99];
            } else if (actionType === 512) {
                name = "META_COMMENT_ACTION";
            } else {
                name = "(out of bounds)";
            }

            var curr_offset = offset;

            for (var idx = offset, item_idx = 0; item_idx < totalSize; idx++, item_idx++) {
                dataArray[item_idx] = Uint8(dv);
            };
            dataArray = new DataView(dataArray.buffer);

            // Parse all actions.
            switch (name) {
                case 'META_RECT_ACTION':
                    var rect = {};
                    rect.left   = dataArray.getUint32(0, true);
                    rect.top    = dataArray.getUint32(4, true);
                    rect.width  = dataArray.getUint32(8, true);
                    rect.height = dataArray.getUint32(12, true);
                    xPainter.drawRect(rect, SCALING_COEFF);
                    break;
                case 'META_POLYLINE_ACTION':
                    var polygon = parsePolygon(dataArray, 0).points;
                    xPainter.drawPolyline(polygon, SCALING_COEFF);
                    break;
                case 'META_POLYGON_ACTION':
                    var polygon = parsePolygon(dataArray, 0).points;
                    xPainter.drawPolygon(polygon, SCALING_COEFF);
                    break;
                case 'META_POLYPOLYGON_ACTION':
                    var polyOffset = 0
                      , polyCount  = dataArray.getUint16(polyOffset, true)
                      , polyList   = new Array(polyCount);
                    polyOffset += 2;

                    for (var i = 0; i < polyCount; i++) {
                        var poly    = parsePolygon(dataArray, polyOffset);
                        polyList[i] = poly.points;
                        polyOffset += poly.offset;
                        xPainter.drawPolygon(polyList[i], SCALING_COEFF);
                    }
                    break;
                case 'META_TEXTARRAY_ACTION':
                    var dxArray = false
                      , string  = {
                            startPoint: {
                                x: dataArray.getInt32(0, true) / SCALING_COEFF,
                                y: dataArray.getInt32(4, true) / SCALING_COEFF
                            },
                            text : ''
                        }
                      , string_len = dataArray.getUint16(8, true)
                      , local_offs = 12;

                      for (var i = 0; i < string_len * 2; i += 2) {
                        string.text += String.fromCharCode(dataArray.getUint16(local_offs + i, true));
                      }
                      xPainter.drawText(string.startPoint, string.text);
                    break;
                case 'META_BMPEXSCALE_ACTION':
                        GetStringFromArray = function(array) {
                            var string = '';
                            for (var i = 0; i < array.length; i++) {
                                string += String.fromCharCode(array[i]);
                            }
                            return string;
                        };

                        BufferToImage = function(buffer, start, length) {
                            var imageArray      = new Uint8Array(buffer, start, length)
                            var stringFromArray = GetStringFromArray(imageArray)
                            var base64String    = window.btoa(stringFromArray)
                            var srcStr          = "data:image/bmp;base64," + base64String;

                            return srcStr;
                        };

                        var bmWidth  = dataArray.getUint32(18, true)
                          , bmpSize  = dataArray.getUint32(2, true)
                          , bmHeight = dataArray.getUint32(22, true)
                          , img      = new Image();

                        var xy = {
                            x: (Math.round(header.width / SCALING_COEFF) - bmWidth) / 2 - 15,
                            y: (Math.round(header.height / SCALING_COEFF) - bmHeight) / 2 - 10
                        };

                        img.src    = BufferToImage(ab, curr_offset, bmpSize);
                        img.onload = function() {
                            var cnv = document.createElement('canvas');
                            cnv.setAttribute('width',  bmWidth);
                            cnv.setAttribute('height', bmHeight);
                            var ctx = cnv.getContext('2d');
                            ctx.drawImage(img, 0, 0);

                            var frame = ctx.getImageData(0, 0, bmWidth, bmHeight)
                              , l     = frame.data.length / 4;
                            for (var i = 0; i < l; i++) {
                                var r = frame.data[i * 4 + 0];
                                var g = frame.data[i * 4 + 1];
                                var b = frame.data[i * 4 + 2];

                                if (g < 50 && r < 50 && b < 50) {
                                    frame.data[i * 4 + 3] = 0;
                                }
                            }
                            xPainter.getContext().putImageData(frame, xy.x, xy.y);
                        };
                    break;
                case 'META_LINECOLOR_ACTION':
                    xPainter.pen.color   = getColor(dataArray.getUint32(0, true))
                    xPainter.pen.enabled = dataArray.getUint8(4);
                    break;
                case 'META_FILLCOLOR_ACTION':
                    xPainter.brush.color   = getColor(dataArray.getUint32(0, true))
                    xPainter.brush.enabled = dataArray.getUint8(4);
                    break;
                case 'META_TEXTCOLOR_ACTION':
                    xPainter.fontstyle = getColor(dataArray.getUint32(0, true));
                    break;
                case 'META_FONT_ACTION':
                    var font = {};

                    font.version   = dataArray.getUint16(0, true);
                    font.totalSize = dataArray.getUint32(2, true);
                    font.family    = parseString(dataArray, 6);
                    xPainter.setFont('14px ' + font.family.string);
                    break;
                case 'META_TEXTFILLCOLOR_ACTION'        :
                case 'META_TEXTALIGN_ACTION'            :
                case 'META_MAPMODE_ACTION'              :
                case 'META_NULL_ACTION'                 :
                case 'META_PIXEL_ACTION'                :
                case 'META_POINT_ACTION'                :
                case 'META_LINE_ACTION'                 :
                case 'META_PUSH_ACTION'                 :
                case 'META_POP_ACTION'                  :
                case 'META_RASTEROP_ACTION'             :
                case 'META_TRANSPARENT_ACTION'          :
                case 'META_EPS_ACTION'                  :
                case 'META_REFPOINT_ACTION'             :
                case 'META_TEXTLINECOLOR_ACTION'        :
                case 'META_TEXTLINE_ACTION'             :
                case 'META_FLOATTRANSPARENT_ACTION'     :
                case 'META_GRADIENTEX_ACTION'           :
                case 'META_LAYOUTMODE_ACTION'           :
                case 'META_TEXTLANGUAGE_ACTION'         :
                case 'META_OVERLINECOLOR_ACTION'        :
                case 'META_RENDERGRAPHIC_ACTION'        :
                case 'META_COMMENT_ACTION'              :
                case 'META_TEXT_ACTION'                 :
                case 'META_ROUNDRECT_ACTION'            :
                case 'META_ELLIPSE_ACTION'              :
                case 'META_ARC_ACTION'                  :
                case 'META_PIE_ACTION'                  :
                case 'META_CHORD_ACTION'                :
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
                case 'META_ISECTRECTCLIPREGION_ACTION'  :
                case 'META_ISECTREGIONCLIPREGION_ACTION':
                case 'META_MOVECLIPREGION_ACTION'       :
                default:
                    break;
            }
        }
    };
}