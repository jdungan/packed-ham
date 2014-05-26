
var scale_colors = {
    good: '#37D7B2',
    med: '#EBC355',
    bad: '#F86C5F'
}

var color_quantile = d3.scale.quantile()
    .domain([0,1])
    .range([scale_colors['bad'], scale_colors['med'], scale_colors['good']]);
    

layouts = {

  packed: function(root) {

    var viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    var margin = 10,diameter = viewport.width;

    // var color = d3.scale.linear()
    //   .domain([-1, 5])
    //   .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
    //   .interpolate(d3.interpolateHcl);

    var color = color_quantile
      
    // color.interpolate(d3.interpolateHcl);

    var pack = d3.layout.pack()
      .padding(2)
      .size([diameter - margin, diameter - margin])
      .value(function(d) {
        return d.score;
      })
      .children(
        function children(d) {
          return d.elements;
        })

    var svg = d3.select("#canvas")
      .attr("width", diameter)
      .attr("height", viewport.height)
      .append("g")
      .attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

    var focus = root,
      nodes = pack.nodes(root),
      view;

    var circle = svg.selectAll("circle")
      .data(nodes)
      .enter().append("circle")
      .attr("class", function(d) {
        return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root";
      })
      .style("fill", function(d) {      
        // return d.children ? color(d.score) : null;
          var score = function() {
            return d.elements.map(function(d) {
              return d.score
            })
              .reduce(function(p, c, i) {
                return p + c
              }, 0) / d.elements.length;
          }
        return d.elements ? color(score()) : color(d.score)
      })
      .attr('opacity',function (d,i) {
        return 1/1/d.depth
      })
      .on("click", function(d) {
        if (focus !== d) zoom(d), d3.event.stopPropagation();
      });

    var text = svg.selectAll("text")
      .data(nodes)
      .enter().append("text")
      .attr("class", "label")
      .style("fill-opacity", function(d) {
        return d.parent === root ? 1 : 0;
      })
      .style("display", function(d) {
        return d.parent === root ? null : "none";
      })
      .text(function(d) {
        return d.label;
      });

    var node = svg.selectAll("circle,text");

    d3.select("body")
      .style("background", color(-1))
      .on("click", function() {
        zoom(root);
      });


    $(window).on( "orientationchange", function( event ) {
       viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      }

      d3.select("#canvas")
        .attr("width", viewport.width)
        .attr("height", viewport.height)
      
      diameter = viewport.width;

      pack.size([diameter - margin, diameter - margin])
      
      nodes = pack.nodes(root)
            
      zoomTo([root.x, root.y, root.r * 2 + margin]);

     } )
       
    zoomTo([root.x, root.y, root.r * 2 + margin]);
    
    

    function zoom(d) {
      var focus0 = focus;
      focus = d;

      var transition = d3.transition()
        .duration(750)//d3.event.altKey ? 7500 : 750)
        .tween("zoom", function(d) {
          var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
          return function(t) {
            zoomTo(i(t));
          };
        });

      transition.selectAll("text")
        .filter(function(d) {
          return d.parent === focus || this.style.display === "inline";
        })
        .style("fill-opacity", function(d) {
          return d.parent === focus ? 1 : 0;
        })
        .each("start", function(d) {
          if (d.parent === focus) this.style.display = "inline";
        })
        .each("end", function(d) {
          if (d.parent !== focus) this.style.display = "none";
        });
    }

    function zoomTo(v) {
      var k = diameter / v[2];
      view = v;
      node.attr("transform", function(d) {
        return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")";
      });
      circle.attr("r", function(d) {
        return d.r * k;
      });
    }
    // });

    d3.select(self.frameElement).style("height", diameter + "px");

  },

  treed: function(data) {

    var diameter = 960;

    var tree = d3.layout.tree()
      .size([360, diameter / 2 - 120])
      .separation(function(a, b) {
        return (a.parent == b.parent ? 1 : 2) / a.depth;
      })
      .children(
        function children(d) {
          return d.elements;
        })


    var diagonal = d3.svg.diagonal.radial()
      .projection(function(d) {
        return [d.y, d.x / 180 * Math.PI];
      });

    var svg = d3.select("#canvas")

    .attr("width", diameter)
      .attr("height", viewport.height)
      .append("g")
      .attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

    var nodes = tree.nodes(data),
      links = tree.links(nodes);

    var link = svg.selectAll(".link")
      .data(links)
      .enter().append("path")
      .attr("class", "link")
      .attr("d", diagonal);

    var node = svg.selectAll(".node")
      .data(nodes)
      .enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) {
        return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
      })

    node.append("circle")
      .attr("r", 4.5);

    node.append("text")
      .attr("dy", ".31em")
      .attr("text-anchor", function(d) {
        return d.x < 180 ? "start" : "end";
      })
      .attr("transform", function(d) {
        return d.x < 180 ? "translate(8)" : "rotate(180)translate(-8)";
      })
      .text(function(d) {
        return d.label;
      });

    d3.select(self.frameElement).style("height", diameter - 150 + "px");

  },

  treemap: function(data) {
    var margin = {
      top: 40,
      right: 10,
      bottom: 10,
      left: 10
    },
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

    var color = d3.scale.category20c();

    var treemap = d3.layout.treemap()
      .size([width, height])
      .sticky(true)
      .value(function(d) {
        return d.score;
      })
      .children(function(d) {
        return d.elements;
      });

    var div = d3.select("body").append("div")
      .style("position", "relative")
      .style("width", (width + margin.left + margin.right) + "px")
      .style("height", (height + margin.top + margin.bottom) + "px")
      .style("left", margin.left + "px")
      .style("top", margin.top + "px");

    var node = div.datum(data).selectAll(".node")
      .data(treemap.nodes)
      .enter().append("div")
      .attr("class", "node")
      .call(position)
      .style("background", function(d) {
        return d.children ? color(d.label) : null;
      })
      .text(function(d) {
        return d.children ? null : d.label;
      });

    d3.selectAll("input").on("change", function change() {
      var value = this.value === "count" ? function() {
          return 1;
        } : function(d) {
          return d.score;
        };

      node
        .data(treemap.value(value).nodes)
        .transition()
        .duration(1500)
        .call(position);
    });

    function position() {
      this.style("left", function(d) {
        return d.x + "px";
      })
        .style("top", function(d) {
          return d.y + "px";
        })
        .style("width", function(d) {
          return Math.max(0, d.dx - 1) + "px";
        })
        .style("height", function(d) {
          return Math.max(0, d.dy - 1) + "px";
        });
    }


  }

};
