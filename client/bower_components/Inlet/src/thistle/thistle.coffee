################################################################
## Color tools

hueToRGB = (m1, m2, h) ->
  h = if h < 0 then h + 1 else if h > 1 then h - 1 else h
  if h * 6 < 1 then return m1 + (m2 - m1) * h * 6
  if h * 2 < 1 then return m2
  if h * 3 < 2 then return m1 + (m2 - m1) * (0.66666 - h) * 6
  return m1

# h,s,l and r,g,b in [0,1]
hslToRGB = (h, s, l) ->
  m2 = if l <= 0.5 then l * (s + 1) else l + s - l*s
  m1 = l * 2 - m2
  r: hueToRGB m1, m2, h+0.33333
  g: hueToRGB m1, m2, h
  b: hueToRGB m1, m2, h-0.33333

# r,g,b and s,l in [0,1], h in [0,360]
rgbToHSL = (r, g, b) ->
  max = Math.max(r, g, b)
  min = Math.min(r, g, b)
  diff = max - min
  sum = max + min

  h =
    if min is max then 0
    else if r is max then ((60 * (g - b) / diff) + 360) % 360
    else if g is max then (60 * (b - r) / diff) + 120
    else (60 * (r - g) / diff) + 240

  l = sum / 2

  s =
    if l is 0 then 0
    else if l is 1 then 1
    else if l <= 0.5 then diff / sum
    else diff / (2 - sum)

  {h, s, l}

hslToCSS = (h, s, l, a) ->
  if a?
    'hsla('+fmod(Math.round(h*180/Math.PI),360)+','+Math.round(s*100)+'%,'+Math.round(l*100)+'%,'+a+')'
  else
    'hsl('+fmod(Math.round(h*180/Math.PI),360)+','+Math.round(s*100)+'%,'+Math.round(l*100)+'%)'

# r,g,b in [0,255]
cssColorToRGB = (cssColor) ->
  s = document.createElement('span')
  document.body.appendChild(s)
  s.style.backgroundColor = cssColor
  rgb = getComputedStyle(s).backgroundColor
  document.body.removeChild(s)
  m = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(rgb)
  if !m
    m = /^rgba\((\d+), (\d+), (\d+), ([\d.]+)\)$/.exec(rgb)
  r = parseInt(m[1]); g = parseInt(m[2]); b = parseInt(m[3])
  if m[4]
    return {r:r/255, g:g/255, b:b/255, a:parseFloat(m[4])}
  return {r:r/255, g:g/255, b:b/255}

isValidCSSColor = (cssColor) ->
  s = document.createElement('span')
  document.body.appendChild(s)
  s.style.backgroundColor = cssColor
  ret = s.style.backgroundColor.length > 0
  s.remove()
  return ret

################################################################
## misc tools

style = (tag, styles) ->
  for n,v of styles
    tag.style[n] = v
  tag

fmod = (x, m) ->
  x = x % m
  x += m if x < 0
  x

map = (v, min, max) -> min+(max-min)*Math.min(1,Math.max(0,v))

################################################################

class HSLCircle
  constructor: (@radius, @width, @lightness) ->
    radius = @radius
    width = @width

    canvas = @canvas = document.createElement 'canvas'
    canvas.width = canvas.height = radius * 2
    ctx = canvas.getContext '2d'

    imgdata = ctx.createImageData canvas.width, canvas.height
    data = imgdata.data
    for y in [0...canvas.height]
      for x in [0...canvas.width]
        dy = y-radius
        dx = x-radius
        d = Math.sqrt(dy*dy+dx*dx)
        if d > radius+1.5
          continue
        # d<10 maps to 0
        # 10<=d<radius-width maps to [0,1]
        # d>=radius-width maps to 1
        d -= 10
        s = Math.max 0, Math.min 1, d / (radius-width/2-10)
        h = Math.atan2(dy, dx) / (Math.PI*2)
        {r, g, b} = hslToRGB h, s, @lightness
        data[(y*canvas.width+x)*4+0] = r*255
        data[(y*canvas.width+x)*4+1] = g*255
        data[(y*canvas.width+x)*4+2] = b*255
        data[(y*canvas.width+x)*4+3] = 255

    ctx.putImageData imgdata, 0, 0

  drawHSLCircle: (canvas, saturation) ->
    canvas.width = canvas.height = 2*@radius
    ctx = canvas.getContext '2d'
    width = @width
    radius = @radius

    highlighted_r = map saturation, width, radius

    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.beginPath()
    ctx.arc radius, radius, radius, 0, Math.PI*2
    ctx.fill()

    ctx.fillStyle = 'black'
    ctx.beginPath()
    ctx.arc radius, radius, highlighted_r, 0, Math.PI*2
    ctx.arc radius, radius, highlighted_r - width, 0, Math.PI*2, true
    ctx.fill()

    ctx.globalCompositeOperation = 'source-in'

    ctx.drawImage @canvas, 0, 0
    ctx.restore()


# |color|: {h:[0-360],s:[0-1],l:[0-1]} or 'lightblue' or '#fef' or 'hsl(180,50%,20%)'
# returns {h:[0-2pi],s:[0-1],l:[0-1]}
normalizeColor = (color) ->
  if typeof color is 'string'
    color = cssColorToRGB color

  if color.r? and color.g? and color.b?
    color = rgbToHSL color.r, color.g, color.b
    color.h = color.h * Math.PI/180
  else if color.h? and color.s? and color.l?
    color.h = color.h * Math.PI/180

  color

class Picker
  radius = 80
  width = 25

  constructor: (color) ->
    @color = normalizeColor color

    @refColor = @color

    @el = makeRoot()

    @circleContainer = @el.appendChild makeCircle.call @
    @lSlider = @el.appendChild makeLightnessSlider.call @
    @colorPreview = @el.appendChild makeColorPreview.call @

    attachEvents.call @

    # Bump the buttons to get it to show
    @setLightness @color.l

  setHue: (h) ->
    @color.h = h

    r = map(@color.s, width, radius) - width / 2
    oR = radius - width / 2
    style @hueKnob,
      # TODO: the 6 here is the padding of the root, we should find a better
      # way
      left: Math.round(oR + Math.cos(h)*r + 6 - 1) + 'px'
      top: Math.round(oR + Math.sin(h)*r + 6 - 1) + 'px'
    @colorPreview.style.backgroundColor =
      @lKnob.style.backgroundColor = @hueKnob.style.backgroundColor =
        hslToCSS(@color.h, @color.s, @color.l)

    b = hslToCSS(@color.h, @color.s, 0.5)
    @lSlider.style.backgroundImage = '-webkit-linear-gradient(bottom, black, '+b+' 50%, white)'
    @lSlider.style.backgroundImage = '-moz-linear-gradient(bottom, black, '+b+' 50%, white)'

    @emit 'changed'

  setSaturation: (s) ->
    @color.s = s
    @circle.drawHSLCircle @circleCanvas, s
    @setHue @color.h

  setLightness: (l) ->
    @color.l = l
    @circle = new HSLCircle radius, width, l
    @lKnob.style.top = (1-l) * @lSlider._height - 11 + 'px'
    @setSaturation @color.s

  # takes h in [0-360], s,l in [0-1]
  setHSL: (h, s, l) ->
    @color.h = fmod(h,360) * Math.PI/180
    @color.s = Math.max 0, Math.min 1, s
    l = Math.max 0, Math.min 1, l
    @setLightness l
  getHSL: ->
    { h: fmod(@color.h * 180/Math.PI, 360), s: @color.s, l: @color.l }

  # r,g,b in [0-1]
  setRGB: (r, g, b) ->
    {h, s, l} = rgbToHSL r, g, b
    @setHSL h, s, l
  getRGB: -> hslToRGB @color.h/(Math.PI*2), @color.s, @color.l

  getCSS: -> hslToCSS @color.h, @color.s, @color.l
  setCSS: (css) ->
    {r,g,b} = cssColorToRGB css
    @setRGB r, g, b

  on: (e, l) ->
    @_listeners ?= {}
    (@_listeners[e] ?= []).push l
  emit: (e, args...) ->
    l.call(this, args...) for l in @_listeners[e] ? [] if @_listeners
  removeListener: (e, l) ->
    @_listeners[e] = (k for k in @_listeners[e] when k isnt l) if @_listeners[e]

  attachEvents = ->
    @lKnob.onmousedown = (e) =>
      document.documentElement.style.cursor = 'pointer'
      window.addEventListener 'mousemove', move = (e) =>
        r = @lSlider.getBoundingClientRect()
        y = e.clientY - r.top
        @setLightness Math.max 0, Math.min 1, 1-(y / (@lSlider._height))
      window.addEventListener 'mouseup', up = (e) ->
        window.removeEventListener('mousemove', move)
        window.removeEventListener('mouseup', up)
        window.removeEventListener('blur', up)
        document.documentElement.style.cursor = ''
      window.addEventListener('blur', up)
      e.preventDefault()
      e.stopPropagation()

    c = @circleContainer
    updateCursor = (e) =>
      x = e.layerX; y = e.layerY
      dx = x-radius; dy = y-radius; d = Math.sqrt(dx*dx+dy*dy)
      t = Math.atan2 dy, dx
      r = map(@color.s, width, radius)
      if r-width < d < r
        if -Math.PI/8 < t < Math.PI/8 or t >= 7*Math.PI/8 or t <= -7*Math.PI/8
          c.style.cursor = 'ew-resize'
        else if Math.PI/8 <= t < 3*Math.PI/8 or -7*Math.PI/8 < t <= -5*Math.PI/8
          c.style.cursor = 'nwse-resize'
        else if 3*Math.PI/8 <= t < 5*Math.PI/8 or -5*Math.PI/8 < t <= -3*Math.PI/8
          c.style.cursor = 'ns-resize'
        else if 5*Math.PI/8 <= t < 7*Math.PI/8 or -3*Math.PI/8 < t <= -Math.PI/8
          c.style.cursor = 'nesw-resize'
      else
        c.style.cursor = ''
    c.addEventListener 'mouseover', (e) ->
      updateCursor e
      c.addEventListener 'mousemove', move = (e) ->
        updateCursor e
      c.addEventListener 'mouseout', out = (e) ->
        c.style.cursor = ''
        c.removeEventListener 'mousemove', move
        c.removeEventListener 'mouseout', out
        window.removeEventListener 'blur', out
      window.addEventListener 'blur', out
    c.addEventListener 'mousedown', (e) =>
      e.preventDefault()

      x = e.layerX; y = e.layerY
      dx = x-radius; dy = y-radius; d = Math.sqrt(dx*dx+dy*dy)
      t = Math.atan2 dy, dx
      r = map(@color.s, width, radius)
      return unless r-width < d < r

      document.documentElement.style.cursor = c.style.cursor
      window.addEventListener 'mousemove', move = (e) =>
        r = @circleCanvas.getBoundingClientRect()
        cx = r.left + r.width/2
        cy = r.top + r.height/2
        dx = e.clientX-cx
        dy = e.clientY-cy
        d = Math.sqrt(dx*dx+dy*dy)
        # TODO: this is copied from above
        d -= 10
        s = Math.max 0, Math.min 1, d / (radius-width/2-10)
        @setSaturation s

      window.addEventListener 'mouseup', up = (e) ->
        window.removeEventListener 'mousemove', move
        window.removeEventListener 'mouseup', up
        window.removeEventListener 'blur', up
        document.documentElement.style.cursor = ''
      window.addEventListener 'blur', up

    @hueKnob.onmousedown = (e) =>
      document.documentElement.style.cursor = 'pointer'
      window.addEventListener 'mousemove', move = (e) =>
        r = @circleCanvas.getBoundingClientRect()
        cx = r.left + r.width/2
        cy = r.top + r.height/2
        @setHue Math.atan2 e.clientY-cy, e.clientX-cx
      window.addEventListener 'mouseup', up = (e) ->
        window.removeEventListener 'mousemove', move
        window.removeEventListener 'mouseup', up
        window.removeEventListener 'blur', up
        document.documentElement.style.cursor = ''
      window.addEventListener 'blur', up
      e.preventDefault()
      e.stopPropagation()

  makeRoot = ->
    div = document.createElement 'div'
    div.className = 'picker'
    style div,
      display: 'inline-block'
      background: 'hsl(0, 0%, 97%)'
      padding: '6px'
      borderRadius: '6px'
      boxShadow: '1px 1px 5px hsla(0, 0%, 39%, 0.2), hsla(0, 0%, 100%, 0.9) 0px 0px 1em 0.3em inset'
      border: '1px solid hsla(0, 0%, 59%, 0.2)'
      position: 'absolute'
      backgroundImage: '-webkit-linear-gradient(left top, hsla(0, 0%, 0%, 0.05) 25%, transparent 25%, transparent 50%, hsla(0, 0%, 0%, 0.05) 50%, hsla(0, 0%, 0%, 0.05) 75%, transparent 75%, transparent)'
      backgroundSize: '40px 40px'
    style div,
      backgroundImage: '-moz-linear-gradient(left top, hsla(0, 0%, 0%, 0.05) 25%, transparent 25%, transparent 50%, hsla(0, 0%, 0%, 0.05) 50%, hsla(0, 0%, 0%, 0.05) 75%, transparent 75%, transparent)'
      zIndex: '1000'
    div

  makeCircle = ->
    circleContainer = document.createElement 'div'
    style circleContainer,
      display: 'inline-block'
      width: radius*2+'px'
      height: radius*2+'px'
      borderRadius: radius+'px'
      boxShadow: '0px 0px 7px rgba(0,0,0,0.3)'

    circleContainer.appendChild @circleCanvas = document.createElement 'canvas'

    @hueKnob = k = makeKnob 27
    circleContainer.appendChild k

    circleContainer

  makeLightnessSlider = ->
    lSlider = document.createElement 'div'
    style lSlider,
      display: 'inline-block'
      width: '20px'
      height: radius*2-22 + 'px'
      marginLeft: '6px'
      borderRadius: '10px'
      boxShadow: 'hsla(0, 100%, 100%, 0.1) 0 1px 2px 1px inset, hsla(0, 100%, 100%, 0.2) 0 1px inset, hsla(0, 0%, 0%, 0.4) 0 -1px 1px inset, hsla(0, 0%, 0%, 0.4) 0 1px 1px'
      position: 'relative'
      top: '-11px'
    lSlider._height = radius*2-22

    @lKnob = k = makeKnob 22
    style k, left: '-1px'
    lSlider.appendChild k

    lSlider

  makeColorPreview = ->
    colorPreview = document.createElement 'div'
    originalColor = hslToCSS(@refColor.h, @refColor.s, @refColor.l)
    originalColorTransparent = hslToCSS(@refColor.h, @refColor.s, @refColor.l, 0)
    style colorPreview,
      boxShadow: 'hsla(0, 0%, 0%, 0.5) 0 1px 5px, hsla(0, 100%, 100%, 0.4) 0 1px 1px inset, hsla(0, 0%, 0%, 0.3) 0 -1px 1px inset'
      height: '25px'
      marginTop: '6px'
      borderRadius: '3px'
      backgroundImage: '-webkit-linear-gradient(-20deg, '+originalColorTransparent+', '+originalColorTransparent+' 69%, '+originalColor+' 70%, '+originalColor+')'
    style colorPreview,
      backgroundImage: '-moz-linear-gradient(-20deg, '+originalColorTransparent+', '+originalColorTransparent+' 69%, '+originalColor+' 70%, '+originalColor+')'

    colorPreview

  makeKnob = (size) ->
    el = document.createElement 'div'
    el.className = 'knob'
    style el,
      position: 'absolute'
      width: size + 'px'
      height: size + 'px'
      backgroundColor: 'red'
      borderRadius: Math.floor(size/2) + 'px'
      cursor: 'pointer'
      backgroundImage: '-webkit-gradient(radial, 50% 0%, 0, 50% 0%, 15, color-stop(0%, rgba(255, 255, 255, 0.8)), color-stop(100%, rgba(255, 255, 255, 0.2)))'
      boxShadow: 'white 0px 1px 1px inset, rgba(0, 0, 0, 0.4) 0px -1px 1px inset, rgba(0, 0, 0, 0.4) 0px 1px 4px 0px, rgba(0, 0, 0, 0.6) 0 0 2px'

    # moz
    style el,
      backgroundImage: 'radial-gradient(circle at center top, rgba(255,255,255,0.8), rgba(255, 255, 255, 0.2) 15px'

    el

  presentModal: (x, y) ->
    style @el,
      left: x + 'px'
      top: y-10 + 'px'
      opacity: '0'
      webkitTransition: '0.15s'
      MozTransition: '0.15s'

    modalFrame = document.createElement 'div'
    modalFrame.style.position = 'fixed'
    modalFrame.style.top = modalFrame.style.left = modalFrame.style.bottom = modalFrame.style.right = '0'
    modalFrame.style.zIndex = '999'
    modalFrame.onclick = =>
      document.body.removeChild modalFrame

      @el.style.top = y+10+'px'
      @el.style.opacity = 0

      end = =>
        document.body.removeChild @el
        @el.removeEventListener 'webkitTransitionEnd', end
        @el.removeEventListener 'transitionend', end

      @el.addEventListener 'webkitTransitionEnd', end
      @el.addEventListener 'transitionend', end

      @emit 'closed'

    document.body.appendChild modalFrame
    document.body.appendChild @el
    @el.offsetHeight
    @el.style.opacity = '1'
    @el.style.top = y + 'px'
    @

  presentModalBeneath: (el) ->
    elPos = el.getBoundingClientRect()
    x = elPos.left + window.scrollX
    y = elPos.bottom + window.scrollY + 4
    @presentModal x, y


window.thistle = {
  Picker
  isValidCSSColor
}
