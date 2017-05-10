# RangeRover
Range selection plugin for jQuery

![RangeRover usage basic example](https://cloud.githubusercontent.com/assets/6073745/25776025/c440b76e-32c3-11e7-8e65-b4a6e6ad9571.gif)

**How to use**

There are several ways for rangeRover plugin installation:

using npm: -

using bower: -

download and unpack zip file from github repository.

Load the latest version of jQuery library and plugin's files from dist folder in the html document.

```
<script type="text/javascript" src="//code.jquery.com/jquery-latest.min.js"></script>
<script type="text/javascript" src="rangeRover/dist/jquery.rangerover.min.js"></script>
<link rel="stylesheet" href="rangeRover/dist/jquery.rangerover.min.css">
```

##### RangeRover usage basic example.

```html
  <div id="range"></div>
```

```javascript
$("#range").rangeRover({
    range: true,
    mode: 'categorized',
    data: [
        {
          name: 'Lenin',
          start: 1917,
          end: 1923,
          color: '#6d99ff',
          size: 20
        },
        {
          name: 'Stalin',
          start: 1923,
          end: 1953,
          color: '#ff0000',
          size: 30
        },
        {
          name: 'Khrushchev',
          start: 1953,
          end: 1964,
          color: '#ffcc66',
          size: 25
        },
        {
          name: 'Brezhnev',
          start: 1964,
          end: 1982,
          color: '#6bf442',
          size: 10
      },
      {
        name: 'Dissolution',
        start: 1982,
        end: 1991,
        color: '#cccccc',
        size: 15
    }]
  });
```

#### Options
|  Option   | Default value  | Description  |
|-----------|----------------|--------------|
| range     |       false      | Enable range selection, default is single selection |
| mode      |      "plain"     | Following modes are available - "categorized", "plain" |
| data      | no default value | array containing range's data |

`data` option should be object for `mode: plain` and array of object for `mode: categorized`.

**Following properties are required in data's object**
* `start` - start number
* `end` - end number
* `color` - color of period

**Optional properties**
* `name` - will be displayed on period
* `exclude` - object { start: Number, end Number } or plain Number of values which shouldn't be available for selection in plugin.

#### Events
* `onChange` - called when new item selected, function receive - selected value.

#### Methods
* `select` - call to specify selected value.

#### Examples
Basic example

```javascript
$("#range").rangeRover({
    data: {
          start: 1917,
          end: 1923
        }
  });
```

![RangeRover usage basic example](https://cloud.githubusercontent.com/assets/6073745/25885202/367a3f20-3568-11e7-8927-cb95eecf9df4.gif)
