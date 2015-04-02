# StarView Metafile converter

 [![npm version](https://badge.fury.io/js/svmconv.svg)](https://www.npmjs.com/package/svmconv) [![Dependency Status](https://david-dm.org/Infostroy/svmconv.svg)](https://david-dm.org/Infostroy/svmconv)

## Installation

	npm install svmconv

## Important information

SVM file contains plots rendered into BITMAP file w/o alpha channel.
This causes that the resulting file placed onto canvas with black background.
To fix this - **all points that have color rgb(0, 0, 0) are changed to rgb(255, 255, 255)**.

Please note this when converting svm.

## Usage

```js
var Parser = require('svmconv')
  , fs     = require('fs');

fs.open('Source.svm', 'r', function(err, fd) {
    fs.fstat(fd, function(err, stats) {
        var bufferSize = stats.size,
            chunkSize  = 512,
            buffer     = new Buffer(bufferSize),
            bytesRead  = 0;

        while (bytesRead < bufferSize) {
            if ((bytesRead + chunkSize) > bufferSize) {
                chunkSize = (bufferSize - bytesRead);
            }
            fs.read(fd, buffer, bytesRead, chunkSize, bytesRead);
            bytesRead += chunkSize;
        }

        var parser = new Parser();
        parser.parse(buffer, 'Source.svm', true);
        fs.close(fd);
    });
});
```

or

```js
...
    // set 'render to file' flag as false
    parser.parse(buffer, 'Source.svm', false);
...
```

## License 

The MIT License (MIT)

Copyright (c) 2015, Infostroy Ltd.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.