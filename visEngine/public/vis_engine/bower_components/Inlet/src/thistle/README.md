Thistle is an HSL color picker. [Try it out](http://nornagon.github.com/thistle)!

![A screenshot of the color picker](http://i.imgur.com/CdbYg.png)

Inspired by Brandon Mathis's excellent [hslpicker](http://hslpicker.com).

# API

## example

```html
<script src='http://nornagon.github.com/thistle/thistle.js'></script>
<script>
  var picker = new thistle.Picker('rgb(129,34,203)')
  document.body.appendChild(picker.el)
  picker.on('changed', function() {
    document.body.style.backgroundColor = picker.getCSS()
  })
</script>
```

## creating a picker

#### new thistle.Picker(color)
Creates a picker object but doesn't attach it to the DOM. You're free to put it
wherever you like in your page, animate it, hide it, whatever. The argument
`color` can be either a string representing a CSS color like `#fff`,
`mediumseagreen`, `hsl(34,20%,45%)` or `rgb(234,221,193)`, or an object
specifying hsl components like `{h:231, s:1, l:0.5}`.

## presenting a picker

You can add the picker to the DOM by attaching `picker.el` somewhere, or you
can use one of the convenient `presentModal` methods instead.

#### picker.presentModalBeneath(element)
Adds the picker to the DOM, animates it into being just underneath `element`,
and creates a modalness that means if the user clicks anywhere except inside
the picker, the picker will be dismissed.

#### picker.presentModal(x, y, color)
Just like `picker.presentModalBeneath`, but you get to choose the precise x,y
coordinates at which the picker will appear.

## events

Once you have created your picker object, you can listen to events on it.

#### picker.on('changed', function() { ... })
Fired when the user changes the color. To figure out what the current color is,
use one of the color getters described below (`getCSS()` is a pretty handy one.)

#### picker.on('closed', function() { ... })
If you present the picker modally, you can listen to the `'closed'` event to be
notified when the user dismisses the picker.

## properties

To fetch the current color of the picker, you can enquire with any of
`picker.getRGB()`, `picker.getHSL()` or `picker.getCSS()`.

- `picker.getRGB()` returns an object like `{r:0.5, g:0.3, b:0.9}`.
- `picker.getHSL()` returns an object like `{h:180, s:0.5, l:0.5}`.
- `picker.getCSS()` will return a string describing the color in CSS format
  (e.g. `'hsl(300, 24%, 80%)'`), which you can assign to, say,
  `element.style.backgroundColor`.

You can also set the colors using the related `setRGB()`, `setHSL()` and
`setCSS()` methods.

```javascript
picker.setCSS('mintcream')
picker.setCSS('#d8bfd8')
picker.setRGB(1.0, 0.4, 0.0)
picker.setHSL(45, 0.9, 0.6)
```

Amusingly, 'thistle' is a [valid CSS color](http://dev.w3.org/csswg/css3-color/#svg-color).
