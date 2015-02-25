/**
 * @copyright Infostroy Ltd, 2015
 * @author Serge Glazun <t4gr1m@gmail.com>
 * @version 0.2
 */

/**
 *
 * @param {DOM node} context
 *
 * @constructor
 *
 * @returns {Painter}
 */
var Painter = function(context) {
    this.backgroundMode = 0; // Qt::TransparentMode = 0, Qt::OpaqueMode = 1
    this.background     = '#fff';
    this.context        = context;
    this.matrix         = false;
    this.brushOrigin    = [0, 0];
    this.font           = 'Arial';
    this.brush          = { color: 'rgb(255,255,255);', enabled: 0};
    this.pen            = { color: 'rgb(0,0,0);', weight: 1, enabled: 0 };
    this.fontstyle      = 'rgb(0,0,0);';
    // TODO: add rest from http://qt-project.org/doc/qt-4.8/qpainter.html#settings
    return this;
};

/**
 * Method must push a copy of the current drawing state onto the drawing state stack
 *
 * @returns {Painter.prototype}
 */
Painter.prototype.save = function() {
    this.context.save();
    return this;
};

/**
 * Method must pop the top entry in the drawing state stack, and reset the drawing state it describes. If there is no saved state, the method must do nothing.
 *
 * @returns {Painter.prototype}
 */
Painter.prototype.restore = function() {
    this.context.restore();
    return this;
};

/**
 * Set font
 *
 * @param {string} font
 *
 * @returns {Painter.prototype}
 */
Painter.prototype.setFont = function(font) {
    this.font = font;
    return this;
};

/**
 * Method must add the scaling transformation described by the arguments to the transformation matrix.<br>
 * The <b>sx<b/> argument represents the scale factor in the horizontal direction and <br>
 * the <b>sy</b> argument represents the scale factor in the vertical direction. The factors are multiples.
 *
 * @param {integer} sx
 * @param {integer} sy
 *
 * @returns {Painter.prototype}
 */
Painter.prototype.scale = function(sx, sy) {
    this.context.scale(sx, sy);
    return this;
};

/**
 * The transform(a, b, c, d, e, f) method must replace the current transformation matrix with the result of multiplying the current transformation matrix with the matrix described by:<br>
 * <table>
 *   <tr><td>a</td><td>c</td><td>e</td></tr>
 *   <tr><td>b</td><td>d</td><td>f</td></tr>
 *   <tr><td>0</td><td>0</td><td>1</td></tr>
 * </table>
 *
 * @param {array} transform
 *
 * @returns {Painter.prototype}
 */
Painter.prototype.transform = function(transform) {
    this.context.transform(transform);
    return this;
};

/**
 * The translate(x, y) method must add the translation transformation described by the arguments to the transformation matrix.<br>
 * The <b>x</b> argument represents the translation distance in the horizontal direction<br>
 * and the <b>y</b> argument represents the translation distance in the vertical direction. The arguments are in coordinate space units
 *
 * @param {integer} x
 * @param {integer} y
 *
 * @returns {Painter.prototype}
 */
Painter.prototype.translate = function(x, y) {
    this.context.translate(x, y);
    return this;
};

/**
 * Get current translation matrix
 *
 * @returns {array}
 */
Painter.prototype.getTranslate = function() {
    return this.matrix;
};

/**
 * Draw rectangle
 *
 * @param {object} rect
 *
 * @returns {Painter.prototype}
 */
Painter.prototype.drawRect = function(rect, scale) {
    if (this.pen.enabled) {
        this.context.strokeStyle = rgb2hex(this.pen.color);
    }
    this.context.rect(rect.left / scale, rect.top / scale, rect.width / scale, rect.height / scale);
    if (this.pen.enabled) {
        this.context.stroke();
    }
    return this;
};

/**
 * Draw polyline
 *
 * @param {array} polyline
 *
 * @returns {Painter.prototype}
 */
Painter.prototype.drawPolyline = function(polyline, scale) {
    // Start point
    if (this.pen.enabled) {
        this.context.strokeStyle = rgb2hex(this.pen.color);
    }
    this.context.lineWidth   = this.pen.weight;

    for (var line_id = 0; line_id < polyline.length; line_id++) {
        this.context.beginPath();
        this.context.moveTo(
            Math.round(polyline[line_id].x / scale) + 0.5,
            Math.round(polyline[line_id].y / scale) + 0.5
        );

        if (polyline[line_id + 1]) {
            this.context.lineTo(
                Math.round(polyline[line_id + 1].x / scale) + 0.5,
                Math.round(polyline[line_id + 1].y / scale) + 0.5
            );
        } else {
            this.context.lineTo(
                Math.round(polyline[line_id].x / scale) + 0.5,
                Math.round(polyline[line_id].y / scale) + 0.5
            );
        }
        this.context.stroke();
    }

    return this;
};

/**
 * Draw polygon
 *
 * @param {array} polygon
 *
 * @returns {Painter.prototype}
 */
Painter.prototype.drawPolygon = function(polygon, scale) {
    // Start point
    if (this.pen.enabled) {
        this.context.strokeStyle = rgb2hex(this.pen.color);
    }

    if (this.brush.enabled) {
        this.context.fillStyle = rgb2hex(this.brush.color);
    }

    this.context.lineWidth = this.pen.weight;
    this.context.moveTo(
        Math.round(polygon[0].x / scale) + 0.5,
        Math.round(polygon[0].y / scale) + 0.5
    );
    this.context.beginPath();

    for (var line_id = 1; line_id < polygon.length; line_id++) {
        this.context.lineTo(
            Math.round(polygon[line_id].x / scale) + 0.5,
            Math.round(polygon[line_id].y / scale) + 0.5
        );
    }

    this.context.closePath();

    if (this.pen.enabled) {
        this.context.stroke();
    }

    if (this.brush.enabled) {
        this.context.fill();
    }

    return this;
};

/**
 * Write text on canvas
 *
 * @param {object} position
 * @param {string} text
 *
 * @returns {Painter.prototype}
 */
Painter.prototype.drawText = function(position, text) {
    this.context.font      = this.font;
    this.context.fillStyle = rgb2hex(this.fontstyle);
    this.context.fillText(text, position.x, position.y);
    return this;
};

/**
 * Get current context
 * 
 * @returns {DOMnode}
 */
Painter.prototype.getContext = function() {
    return this.context;
};

/**
 * RGB to HEX color
 * 
 * @param {string} rgb
 * 
 * @returns {String}
 */
function rgb2hex(rgb) {
    rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
    return (rgb && rgb.length === 4) ? "#" +
        ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : '';
};

module.exports = Painter;