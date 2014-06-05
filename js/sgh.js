"use strict";

// add swipe up and dow to jquerymobile
//http://stackoverflow.com/questions/17131815/how-to-swipe-top-down-jquery-mobile
(function() {
  var supportTouch = $.support.touch,
    scrollEvent = "touchmove scroll",
    touchStartEvent = supportTouch ? "touchstart" : "mousedown",
    touchStopEvent = supportTouch ? "touchend" : "mouseup",
    touchMoveEvent = supportTouch ? "touchmove" : "mousemove";
  $.event.special.swipeupdown = {
    setup: function() {
      var thisObject = this;
      var $this = $(thisObject);
      $this.bind(touchStartEvent, function(event) {
        var data = event.originalEvent.touches ?
          event.originalEvent.touches[0] :
          event,
          start = {
            time: (new Date).getTime(),
            coords: [data.pageX, data.pageY],
            origin: $(event.target)
          },
          stop;

        function moveHandler(event) {
          if (!start) {
            return;
          }
          var data = event.originalEvent.touches ?
            event.originalEvent.touches[0] :
            event;
          stop = {
            time: (new Date).getTime(),
            coords: [data.pageX, data.pageY]
          };

          // prevent scrolling
          if (Math.abs(start.coords[1] - stop.coords[1]) > 10) {
            event.preventDefault();
          }
        }
        $this
          .bind(touchMoveEvent, moveHandler)
          .one(touchStopEvent, function(event) {
            $this.unbind(touchMoveEvent, moveHandler);
            if (start && stop) {
              if (stop.time - start.time < 1000 &&
                Math.abs(start.coords[1] - stop.coords[1]) > 30 &&
                Math.abs(start.coords[0] - stop.coords[0]) < 75) {
                start.origin
                  .trigger("swipeupdown")
                  .trigger(start.coords[1] > stop.coords[1] ? "swipeup" : "swipedown");
              }
            }
            start = stop = undefined;
          });
      });
    }
  };
  $.each({
    swipedown: "swipeupdown",
    swipeup: "swipeupdown"
  }, function(event, sourceEvent) {
    $.event.special[event] = {
      setup: function() {
        $(this).bind(sourceEvent, $.noop);
      }
    };
  });

})();

// location watch object

function Location() {
  var options = {
    enableHighAccuracy: true
  },
    inner_pos = {},
    dfd = new $.Deferred(),
    moved = function(pos) {
      inner_pos = pos || {};
      dfd.resolve()
    },
    fail = function(err) {
      if (err) {
        console.warn('ERROR(' + err.code + '): ' + err.message);
      }
      dfd.reject()
    };

  this.__defineGetter__("lat", function() {
    return inner_pos.coords ? inner_pos.coords.latitude : null;
  });

  this.__defineGetter__("lng", function() {

    return inner_pos.coords ? inner_pos.coords.longitude : null;
  });

  this.WatchID = navigator.geolocation.watchPosition(moved, fail, options);

  this.ready = dfd.promise()
}


// http://206.214.166.144/api/score/-95.9911,36.1498?callback=your_function

// creates a new sgh api object in the global space
var sgh = new(function api() {
  var dfd = new $.Deferred()

  this.loc = new Location();

  this.loc.__defineGetter__("position", function() {
    return this.lng + ',' + this.lat;
  });

  this.loc.ready.done(function() {
    return dfd.resolve()
  })

  this.ready = dfd.promise()

  var api_calls = [{
    'name': 'sample',
    'uri': 'api/score/'
  }]

  this.options = this.options || {
    // url: 'http://206.214.166.144/'
    url:'http://api.healtharound.me/'
  };

  this.call_api = function(uri, ajax_params) {
    ajax_params = ajax_params || {};
    ajax_params.format = 'jsonp'
    return $.ajax({
      type: "get",
      url: this.options.url + uri + this.loc.position,
      data: ajax_params,
      dataType: 'jsonp',
    })
  };

  // setup simple api mappings
  api_calls.every(function(v, i) {
    api.prototype[v.name] = function(params) {
      return this.call_api(v.uri, params)
    }
  });

})()

//handy helpers
var arc2deg = function(x) {
  return 180 * (x / Math.PI)
}
var deg2arc = function(x) {
  return (Math.PI * 2) / x
}

var absDeg = function(newDegree) {
  return (newDegree % 360 + (newDegree >= 0 ? 0 : 360))
}

var fa_translate = function(name) {
  return String.fromCharCode(parseInt(fa_ucode[name], 16))
}

var fromCenter = function(radius, radians) {
  var r = radius,
    x = r * Math.sin(radians),
    y = r * Math.cos(radians);
  return {
    x: x,
    y: -y
  }
}
var clone_node = function(node, parent) {
  return d3.select(node.parentNode.insertBefore(node.cloneNode(true),
    node.nextSibling));
}
//tranform function to be added to a d3 objects

  function Transform() {
    var order = ['translate', 'scale', 'rotate'],
    inner = {
      translate: {
        private:{x:0,y:0},
        value: xyValue,
        string: xyString,
        increment: xyIncrement
      },
      scale: {
        private:{x:1,y:1}, 
        value:  xyValue,
        string: xyString,
        increment: xyIncrement
      },
      rotate: {
        value: rotation,
        string: function() {
          return rotation()
        },
        increment:rotationIncrement
      }
    };

    function xyValue(newValue){

      if (newValue === undefined) {
        return this.private;
      }
      var newObj;
      
      if (typeof newValue ==='number'){
        newObj= {x:newValue,y:newValue}        
      } else {
        newObj=newValue  
      }
      this.private = newObj
      
      return this.private
      
    }

    function xyString() {
      return this.private.x + ',' + this.private.y
    };

    function xyIncrement(transform){
      var this_transform = transform;

      return function(newValue){
        
        if (typeof newValue ==='number'){
          this( {x:this().x+newValue,y:this().y+newValue})        
        } else {
          if (newValue.x||newValue.x) { this().x += newValue.x }
          if (newValue.y||newValue.y) { this().y += newValue.y }
        }
        
        return this_transform;
      }
    }
    
    function rotation(degree) {

      if (degree === undefined) {
        return rotation.value || 0;
      }

      if (degree != rotation.value) {
        rotation.value = Math.round((degree % 360 + (degree >= 0 ? 0 : 360)))
      }
      
      return rotation.value
    }

    function rotationIncrement(transform){
      var this_transform = transform;
      return function(value){
        this (this() + value)
        return this_transform;
      }
    }


    // add getters and setters for transform types in the order array
    order.forEach(function(v) {
      this[v] = function(d) {

        var isFunction = (typeof inner[v].value === "function")

        if (d == undefined) {
          return isFunction ? inner[v].value() : inner[v].value
        };

        var new_value = (typeof d === 'function') ? d(element) : d

        isFunction ? inner[v].value(new_value) : inner[v].value = new_value
        
        return this;

      }
    
    this[v].incr = new inner[v].increment(this)
      
    }, this);

    this.render = function() {
      return this.attr('transform', this.toString());
    }

    this.animate = function(options) {
      var options = options || {},
        duration = options.duration || 500,
        ease = options.ease || '',
        opacity = options.opacity || '1';

      return this.transition()
        .duration(duration)
        .ease(d3.ease(ease))
        .attr('transform', this.toString())
        .attr('opacity', opacity)
    }    

    this.toString = function() {
      return order.map(
        function(v) {
          return v + '(' + inner[v].string() + ')'
        },
        this).join(' ');
    }

  }


  // d3 based wheel control

  function Wheel(element) {
    var options = options || {
      colors: d3.scale.category10(),
      icon_types: ['home', 'facebook', 'github', 'twitter', 'bell', 'camera'],
      arc: 95,
      icon: 80
    },
      element = element || {},
      visible_icons = [],
      hidden_icons = [],
      spots = 9,
      interval = {
        radians: (2 * Math.PI / spots),
        degrees: (360 / spots)
      }

      function turn_wheel(direction) {

        turn_wheel.swipes = turn_wheel.swipes || 0;
        turn_wheel.swipes = direction === 0 ? 0 : turn_wheel.swipes += direction;

        var current_rotation = inner.wheel.transform.rotate(),
          new_rotate = current_rotation + (-direction * interval.degrees),
          shrink_icon = visible_icons[1],
          grow_icon = visible_icons[(direction === 1 ? 2 : 0)],
          reveal_angle = interval.radians * (turn_wheel.swipes + direction);


        //find the icon to reveal        
        var reveal_icon = direction === 1 ? hidden_icons.pop() : hidden_icons.shift()

        // move it to visible arrary
        direction === 1 ? visible_icons.push(reveal_icon) : visible_icons.unshift(reveal_icon)

        //find the icon to hide
        var hide_icon = direction === 1 ? visible_icons.shift() : visible_icons.pop()

        //move it to the hidden array
        direction === 1 ? hidden_icons.unshift(hide_icon) : hidden_icons.push(hide_icon)


        //start animations

        shrink_icon.datum()
          .transform
          .scale({
            x: .5,
            y: .5
          })
          .animate({
            'opacity': '.5',
          })

        grow_icon.datum()
          .transform
          .scale({
            x: 1.5,
            y: 1.5
          })
          .animate({
            'opacity': '1',
          })

        reveal_icon.datum()
          .transform
          .translate(fromCenter(options.icon, reveal_angle))
          .render()

        reveal_icon.datum()
          .transform
          // .translate(fromCenter(options.icon, reveal_angle))
          .rotate(arc2deg(reveal_angle))
          .scale({
            x: .5,
            y: .5
          })
          .animate({
            'opacity': '0.5'
          })

        inner.wheel
          .transform
          .rotate(new_rotate)
          .animate()

        hide_icon.datum()
          .transform
          .rotate(0)
          .scale({
            x: .5,
            y: .5
          })
          .animate({
            'opacity': '0'
          })

          // .translate({
          //   x: 0,
          //   y: 0
          // })




        return grow_icon;
      }

      function update(new_data) {

        if (new_data) {

          inner.wheel.interval = interval;

          var arc = d3.svg.arc()
            .outerRadius(options.arc)
            .innerRadius(options.arc - 2)
            .startAngle(0)
            .endAngle(2 * Math.PI)

          this
            .append("svg:path")
            .attr({
              'class': 'dont_select',
              id: function(d, i) {
                return 'path' + i
              },
              d: arc,
              fill: function(d, i) {
                return 'silver' //options.colors(i);
              }
            })


          this.selectAll('text.fa-icon').remove()

          var icons = this.selectAll('text.fa-icon').data(new_data)

          icons.enter()
            .append('text')
            .attr({
              'class': 'fa-icon dont_select',
              'font-family': 'FontAwesome',
              'font-size': '20px',
              'text-anchor': 'middle',
              'dominant-baseline': 'central',
              'opacity': '0'
            })
            .text(function(d, i) {
              d.icon = options.icon_types[i];
              // console.log({assign:d.icon})
              return fa_translate(options.icon_types[i]);
            })

          icons.exit().remove()
          visible_icons = []
          hidden_icons = []


          icons.each(function(d, i) {

            var icon = d3.select(this)

            d.transform = new Transform(icon);

            if (i <= 1 || i === (new_data.length - 1) || false) {

              i <= 1 ? visible_icons.push(icon) : visible_icons.unshift(icon)


              var pos = i <= 1 ? i : spots - 1
              var angle = interval.radians * pos, // + (interval / 2),
                r = options.icon,
                x = r * Math.sin(angle),
                y = r * Math.cos(angle);

              //beware the self executing anon function for scale
              d.transform
                .translate({
                  x: x,
                  y: -y
                })
                .rotate(arc2deg(angle))
                .scale((function(d, i) {
                  var values = {
                    x: .5,
                    y: .5
                  };
                  if (i === 0) {
                    values = {
                      x: 1.5,
                      y: 1.5
                    }
                  }
                  return values
                })(d, i))
                .render()
                
                d.transform.animate({opacity:(i===0?1:0.5)})

            } else {

              hidden_icons.unshift(icon)


            }

          })

        }

        inner.wheel.icons = icons;
        return icons
      }

      function inner() {

        if (!inner.wheel) {

          inner.wheel = element.append('g')

          inner.wheel.transform = new Transform(inner.wheel);

          inner.wheel.data = update;

          inner.wheel.turn = turn_wheel;

          inner.wheel.focus = function() {
            return visible_icons[1];
          }

        }

        return inner.wheel;

      }

    return inner;

  }

  function ScoreCard(element) {
    var options = options || {}

    var scores = d3.scale.quantize()
      .domain([0, 1])
      .range(['F', 'F', 'F', 'F', 'F', 'D', 'C', 'B', 'A']);


    var update_score = function(d) {
      
      inner.text.transition()
      .duration(300)
      .attr({opacity:0})
      .transition()
      .duration(300)
      .text(scores(d.score))
      .attr({opacity:1})
      
      
    }

      function inner() {
        if (!inner.card) {
          inner.card = element.append('g')
            .attr('id', 'score')

          inner.box = inner.card.append('rect')
            .attr({
              x:-15,
              y:0,
              width: 30,
              height: 30,
              stroke: 'silver',
              'fill-opacity': 0
            });

          inner.text = inner.card
            .append('text')
            .attr({x:-5,y:20})

          inner.info = inner.card
            .append('text')
            .attr({
              x:27,
              y:52,
              'class': 'fa-icon dont_select',
              'font-family': 'FontAwesome',
              'font-size': '20px',
              'text-anchor': 'middle',
              'dominant-baseline': 'central',
              'fill': 'grey'
            })
            .text(fa_translate('info-circle'))
            
            
            inner.info.on('click',function () {
              $( "#canvas" ).trigger('info_clicked')
            });
              
            inner.info.transform = new Transform(inner.info)
            
            inner.info.transform.scale({x:.5,y:.5}).render()

          inner.card.transform = new Transform(inner.card)
                    
          inner.card.setScore = update_score;
        }
        return inner.card;
      }
    return inner
  }

  function GradeScale(element) {
    GradeScale.element = element || {};
    var options = options || {
      bar:{
        width:100,
        height:2,        
      },
      icon_types: ['home', 'facebook', 'github', 'twitter', 'bell', 'camera']
      
    }
    var scale = d3.scale.linear()
      .range([-options.bar.width/2+5,options.bar.width/2-5]);
    
    var update = function (d) {

      scale.domain([
        //MIN
        d.reduce(function(a, b) {
          return a < b.score ? a : b.score
        },d[0].score), 
        //MAX        
        d.reduce(function(a, b) {
          return a > b.score ? a : b.score
        },d[0].score)         
      ])
      
      // inner.bar.selectAll('text.fa-icon').remove()
      
      var icons = inner.bar.selectAll('text.fa-icon')
        .data(d)
        
      icons.enter()
        .append('text')
        .attr({
          'class': 'fa-icon dont_select',
          'font-family': 'FontAwesome',
          'font-size': '5px',
          'text-anchor': 'middle',
          'dominant-baseline': 'central',
          'fill': 'grey'
          
        })
        
        icons.transition()
        .attr({
          x: function (d,i) {
            return scale(d.score)
          } ,
          y:5          
        })
        .text(function(d, i) {
          return fa_translate(options.icon_types[i]);
        })
        .ease('elastic')
        .duration(1000)
        
        icons.exit().remove()
            
    
    }
    
    var inner = function () {
      
      if (!inner.bar) {
        inner.bar = element.append('g')
        
        inner.bar.append('rect')
        .attr({
          x: -(options.bar.width/2),
          y: 0,
          width: options.bar.width,
          height: options.bar.height,
          fill: 'silver'
        })
        
        // inner.bar.append('rect')
        // .attr({
        //   x: 0,
        //   y: 0,
        //   width: 1,
        //   height: 5,
        //   fill: 'grey'
        // })
        // 
        // inner.bar.append('text')
        // .attr({
        //   x: 0,
        //   y: -5,
        //   'text-anchor': 'middle',
        //   'dominant-baseline': 'central',
        //   'font-size': '5px',
        // })
        // .text('AVG')
      }
              
      inner.bar.transform = new Transform(inner.bar)

      inner.bar.data = update;
      
      
      return inner.bar
    }
    return inner
  }
  
  //font awesome dictionary object
var fa_ucode = {
  glass: "f000",
  music: "f001",
  search: "f002",
  'envelope-o': "f003",
  heart: "f004",
  star: "f005",
  'star-o': "f006",
  user: "f007",
  film: "f008",
  'th-large': "f009",
  th: "f00a",
  'th-list': "f00b",
  check: "f00c",
  times: "f00d",
  'search-plus': "f00e",
  'search-minus': "f010",
  'power-off': "f011",
  signal: "f012",
  cog: "f013",
  'trash-o': "f014",
  home: "f015",
  'file-o': "f016",
  'clock-o': "f017",
  road: "f018",
  download: "f019",
  'arrow-circle-o-down': "f01a",
  'arrow-circle-o-up': "f01b",
  inbox: "f01c",
  'play-circle-o': "f01d",
  repeat: "f01e",
  refresh: "f021",
  'list-alt': "f022",
  lock: "f023",
  flag: "f024",
  headphones: "f025",
  'volume-off': "f026",
  'volume-down': "f027",
  'volume-up': "f028",
  qrcode: "f029",
  barcode: "f02a",
  tag: "f02b",
  tags: "f02c",
  book: "f02d",
  bookmark: "f02e",
  print: "f02f",
  camera: "f030",
  font: "f031",
  bold: "f032",
  italic: "f033",
  'text-height': "f034",
  'text-width': "f035",
  'align-left': "f036",
  'align-center': "f037",
  'align-right': "f038",
  'align-justify': "f039",
  list: "f03a",
  outdent: "f03b",
  indent: "f03c",
  'video-camera': "f03d",
  'picture-o': "f03e",
  pencil: "f040",
  'map-marker': "f041",
  adjust: "f042",
  tint: "f043",
  'pencil-square-o': "f044",
  'share-square-o': "f045",
  'check-square-o': "f046",
  arrows: "f047",
  'step-backward': "f048",
  'fast-backward': "f049",
  backward: "f04a",
  play: "f04b",
  pause: "f04c",
  'stop': "f04d",
  forward: "f04e",
  'fast-forward': "f050",
  'step-forward': "f051",
  eject: "f052",
  'chevron-left': "f053",
  'chevron-right': "f054",
  'plus-circle': "f055",
  'minus-circle': "f056",
  'times-circle': "f057",
  'check-circle': "f058",
  'question-circle': "f059",
  'info-circle': "f05a",
  crosshairs: "f05b",
  'times-circle-o': "f05c",
  'check-circle-o': "f05d",
  ban: "f05e",
  'arrow-left': "f060",
  'arrow-right': "f061",
  'arrow-up': "f062",
  'arrow-down': "f063",
  share: "f064",
  expand: "f065",
  compress: "f066",
  plus: "f067",
  minus: "f068",
  asterisk: "f069",
  'exclamation-circle': "f06a",
  gift: "f06b",
  leaf: "f06c",
  fire: "f06d",
  eye: "f06e",
  'eye-slash': "f070",
  'exclamation-triangle': "f071",
  plane: "f072",
  calendar: "f073",
  random: "f074",
  comment: "f075",
  magnet: "f076",
  'chevron-up': "f077",
  'chevron-down': "f078",
  retweet: "f079",
  'shopping-cart': "f07a",
  folder: "f07b",
  'folder-open': "f07c",
  'arrows-v': "f07d",
  'arrows-h': "f07e",
  'bar-chart-o': "f080",
  'twitter-square': "f081",
  'facebook-square': "f082",
  'camera-retro': "f083",
  key: "f084",
  cogs: "f085",
  comments: "f086",
  'thumbs-o-up': "f087",
  'thumbs-o-down': "f088",
  'star-half': "f089",
  'heart-o': "f08a",
  'sign-out': "f08b",
  'linkedin-square': "f08c",
  'thumb-tack': "f08d",
  'external-link': "f08e",
  'sign-in': "f090",
  trophy: "f091",
  'github-square': "f092",
  upload: "f093",
  'lemon-o': "f094",
  phone: "f095",
  'square-o': "f096",
  'bookmark-o': "f097",
  'phone-square': "f098",
  twitter: "f099",
  facebook: "f09a",
  github: "f09b",
  unlock: "f09c",
  'credit-card': "f09d",
  rss: "f09e",
  'hdd-o': "f0a0",
  bullhorn: "f0a1",
  bell: "f0f3",
  certificate: "f0a3",
  'hand-o-right': "f0a4",
  'hand-o-left': "f0a5",
  'hand-o-up': "f0a6",
  'hand-o-down': "f0a7",
  'arrow-circle-left': "f0a8",
  'arrow-circle-right': "f0a9",
  'arrow-circle-up': "f0aa",
  'arrow-circle-down': "f0ab",
  globe: "f0ac",
  wrench: "f0ad",
  tasks: "f0ae",
  filter: "f0b0",
  briefcase: "f0b1",
  'arrows-alt': "f0b2",
  users: "f0c0",
  link: "f0c1",
  cloud: "f0c2",
  flask: "f0c3",
  scissors: "f0c4",
  'files-o': "f0c5",
  paperclip: "f0c6",
  'floppy-o': "f0c7",
  square: "f0c8",
  bars: "f0c9",
  'list-ul': "f0ca",
  'list-ol': "f0cb",
  strikethrough: "f0cc",
  underline: "f0cd",
  table: "f0ce",
  magic: "f0d0",
  truck: "f0d1",
  pinterest: "f0d2",
  'pinterest-square': "f0d3",
  'google-plus-square': "f0d4",
  'google-plus': "f0d5",
  money: "f0d6",
  'caret-down': "f0d7",
  'caret-up': "f0d8",
  'caret-left': "f0d9",
  'caret-right': "f0da",
  columns: "f0db",
  sort: "f0dc",
  'sort-asc': "f0dd",
  'sort-desc': "f0de",
  envelope: "f0e0",
  linkedin: "f0e1",
  undo: "f0e2",
  gavel: "f0e3",
  tachometer: "f0e4",
  'comment-o': "f0e5",
  'comments-o': "f0e6",
  bolt: "f0e7",
  sitemap: "f0e8",
  umbrella: "f0e9",
  clipboard: "f0ea",
  'lightbulb-o': "f0eb",
  exchange: "f0ec",
  'cloud-download': "f0ed",
  'cloud-upload': "f0ee",
  'user-md': "f0f0",
  stethoscope: "f0f1",
  suitcase: "f0f2",
  'bell-o': "f0a2",
  coffee: "f0f4",
  cutlery: "f0f5",
  'file-text-o': "f0f6",
  'building-o': "f0f7",
  'hospital-o': "f0f8",
  ambulance: "f0f9",
  medkit: "f0fa",
  'fighter-jet': "f0fb",
  beer: "f0fc",
  'h-square': "f0fd",
  'plus-square': "f0fe",
  'angle-double-left': "f100",
  'angle-double-right': "f101",
  'angle-double-up': "f102",
  'angle-double-down': "f103",
  'angle-left': "f104",
  'angle-right': "f105",
  'angle-up': "f106",
  'angle-down': "f107",
  desktop: "f108",
  laptop: "f109",
  tablet: "f10a",
  mobile: "f10b",
  'circle-o': "f10c",
  'quote-left': "f10d",
  'quote-right': "f10e",
  spinner: "f110",
  circle: "f111",
  reply: "f112",
  'github-alt': "f113",
  'folder-o': "f114",
  'folder-open-o': "f115",
  'smile-o': "f118",
  'frown-o': "f119",
  'meh-o': "f11a",
  gamepad: "f11b",
  'keyboard-o': "f11c",
  'flag-o': "f11d",
  'flag-checkered': "f11e",
  terminal: "f120",
  code: "f121",
  'reply-all': "f122",
  'mail-reply-all': "f122",
  'star-half-o': "f123",
  'location-arrow': "f124",
  crop: "f125",
  'code-fork': "f126",
  'chain-broken': "f127",
  question: "f128",
  info: "f129",
  exclamation: "f12a",
  superscript: "f12b",
  subscript: "f12c",
  eraser: "f12d",
  'puzzle-piece': "f12e",
  microphone: "f130",
  'microphone-slash': "f131",
  shield: "f132",
  'calendar-o': "f133",
  'fire-extinguisher': "f134",
  rocket: "f135",
  maxcdn: "f136",
  'chevron-circle-left': "f137",
  'chevron-circle-right': "f138",
  'chevron-circle-up': "f139",
  'chevron-circle-down': "f13a",
  html5: "f13b",
  css3: "f13c",
  anchor: "f13d",
  'unlock-alt': "f13e",
  bullseye: "f140",
  'ellipsis-h': "f141",
  'ellipsis-v': "f142",
  'rss-square': "f143",
  'play-circle': "f144",
  ticket: "f145",
  'minus-square': "f146",
  'minus-square-o': "f147",
  'level-up': "f148",
  'level-down': "f149",
  'check-square': "f14a",
  'pencil-square': "f14b",
  'external-link-square': "f14c",
  'share-square': "f14d",
  'compass': "f14e",
  'caret-square-o-down': "f150",
  'caret-square-o-up': "f151",
  'caret-square-o-right': "f152",
  eur: "f153",
  gbp: "f154",
  usd: "f155",
  inr: "f156",
  jpy: "f157",
  rub: "f158",
  krw: "f159",
  btc: "f15a",
  file: "f15b",
  'file-text': "f15c",
  'sort-alpha-asc': "f15d",
  'sort-alpha-desc': "f15e",
  'sort-amount-asc': "f160",
  'sort-amount-desc': "f161",
  'sort-numeric-asc': "f162",
  'sort-numeric-desc': "f163",
  'thumbs-up': "f164",
  'thumbs-down': "f165",
  'youtube-square': "f166",
  youtube: "f167",
  xing: "f168",
  'xing-square': "f169",
  'youtube-play': "f16a",
  dropbox: "f16b",
  'stack-overflow': "f16c",
  instagram: "f16d",
  flickr: "f16e",
  adn: "f170",
  bitbucket: "f171",
  'bitbucket-square': "f172",
  tumblr: "f173",
  'tumblr-square': "f174",
  'long-arrow-down': "f175",
  'long-arrow-up': "f176",
  'long-arrow-left': "f177",
  'long-arrow-right': "f178",
  apple: "f179",
  windows: "f17a",
  android: "f17b",
  linux: "f17c",
  dribbble: "f17d",
  skype: "f17e",
  foursquare: "f180",
  trello: "f181",
  female: "f182",
  male: "f183",
  gittip: "f184",
  'sun-o': "f185",
  'moon-o': "f186",
  archive: "f187",
  bug: "f188",
  vk: "f189",
  weibo: "f18a",
  renren: "f18b",
  pagelines: "f18c",
  'stack-exchange': "f18d",
  'arrow-circle-o-right': "f18e",
  'arrow-circle-o-left': "f190",
  'caret-square-o-left': "f191",
  'dot-circle-o': "f192",
  wheelchair: "f193",
  'vimeo-square': "f194",
  'try': "f195",
  'plus-square-o': "f196"
}
