
layouts = {

  packed: function(root) {

    var scale_colors = {
      good: '#37D7B2',
      med: '#EBC355',
      bad: '#F86C5F'
    }

    var color = d3.scale.quantile()
      .domain([0, 1])
      .range([scale_colors['bad'], scale_colors['med'], scale_colors['good']]);
      
    var grades = d3.scale.quantile()
      .domain([0,1])
      .range(['F','F','F','D','D','C','C','B','B','A','A'])

    function View() {
      var th = $('#ham_title').height(),
        v = {
          width: window.innerWidth,
          height: window.innerHeight - th
        }
      v.diameter = Math.min(v.height,v.width)
      return v
    }

    var viewport = new View(),
        margin = 20,
        diameter = viewport.diameter;

    var pack = d3.layout.pack()
    
      .padding(2)
      .size([diameter - margin, diameter - margin])
      .value(function(d) {
        return 1-d.score;
      })
      
      .children(
        function children(d) {
          return d.elements;
        })

    
    function zoom(d) {
  
      focus = d;
  
      k=(diameter/2)
  
      s = k/(d.r)
    
      svg
        .translate({x:(-focus.x*s)+k,y:(-focus.y*s)+k})
        .scale(s)
        .animate({ease:'cubic',duration:750})

      .selectAll("text")
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

      
    var svg = d3.select("#canvas")
      .attr("width", viewport.width)
      .attr("height", viewport.height)
      .append("g")
          
    // add d3 tranform sugar
    svg.call(Transform)
    
    var focus = root,
      nodes = pack.nodes(root),
      view;

    nodes.sort(function (a,b) {
          return a.depth-b.depth
        })

    var circle = svg.selectAll("circle")
      .data(nodes)
      .enter()
      .insert("circle")
      .attr("class", function(d) {
        return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root";
      })
      .style("fill", function(d) {
        var score = function() {
          return d.elements.map(function(d) {
            return d.score
          })
            .reduce(function(p, c, i) {
              return p + c
            }, 0) / d.elements.length;
        }
        return d.score!=undefined ? color(d.score) : color(score())
      })
      .attr({
        opacity: function(d, i) {
          // return 1
          return (d.depth + 3) / 10
        },
        r: function(d) {
          return d.r;
        },
        cx: function(d) {
          return d.x;
        },
        cy: function(d) {
          return d.y;
        }
      })
      .on("click", function(d) {
          detail_body.clear()
          if (focus===d) {
            // second click
            // debugger
          }
          else{
            zoom(d)
            d3.event.stopPropagation()
          }
      })
      
      d3.selectAll('.node--leaf').on('click',function (d,i) {
        
        console.log('node--leaf')
        if (focus != d) 
          { 
            focus = d
            k=diameter/2
            s = (k/d.r)*1.4
            svg
              .translate({x:(-focus.x*s)+k,y:(-focus.y*s)+k})
              .scale(s)
              .animate({ease:'ease',duration:750})
            .selectAll("text")
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
            
              
              ham.detail({},d.boundary_id+'/'+d.slug).done(function (details) {
                detail_header.text(details.properties.display_name)
                detail_body.add_div(details.properties.metric.score_text.html)
                detail_box
                  .scale(1/s)
                  .translate({x:focus.x-(k/s),y:focus.y-(k*.9/s)})
                  .animate({opacity:'1',duration:750})
              })

              d3.event.stopPropagation()
          }
        
        
        
      })
      



    var text = svg.selectAll("text").data(nodes)
      

//scores
      // text.enter().append("text")
      //   .attr({
      //     'class':"score",
      //     x: function (d) {
      //       return d.x
      //     },
      //     y: function (d,i) {
      //       // debugger;
      //       return d.y + (d.r*.45)
      //     }
      //   })
      //   .text(function(d,i) {
      //     return grades(d.score)
      //
      //     // return Math.floor(d.score*100);
      //   })
      //   .style("font-size", function(d) {
      //     return Math.min(d.r, (d.r)/ this.getComputedTextLength() * 10) + "px"; })
      //   .attr("dy", ".35em")
      //   .style("fill-opacity", function(d) {
      //     return d.parent === root ? 1: 0;
      //   })
      //   .style("display", function(d) {
      //     return d.parent === root ? null : "none";
      //   });

    //labels      
        text.enter().append("text")     
          .attr({
            'class':"label",
            x: function (d) {
              return d.x
            },
            y: function (d,i) {
              return d.y
            }
          })
          .text(function(d) {
            return d.label;
          })      
          .style("font-size", function(d) { 
            return Math.min(2 * d.r, (2 * d.r -2 ) / this.getComputedTextLength() * 16) + "px"; })
          .attr("dy", ".35em")
          .style("fill-opacity", function(d) {
            return d.parent === root ? 1: 0;
          })
          .style("display", function(d) {
            return d.parent === root ? null : "none";
          });
          
  // detail box
    var detail_box = svg.append('g').attr({'class':'detail_box',opacity:'0'})
    detail_box.call(Transform)
    
    var detail_body = detail_box.append("foreignObject")
      .attr({
        font: "24px 'Helvetica'",
        height: viewport.height,
        width:  viewport.width
      })
      .append("xhtml:body")
        .style("font", "18px 'Helvetica'")   
      .append("div")    
    
    var detail_header = detail_body.append('div')
    

    detail_body.add_div = function (text) {
      this.append('div').html(text)
    }

    detail_body.clear = function (){
      detail_header.text('')
      detail_body.html('')
      detail_box.animate({opacity:'0'})
      
    }




    d3.select("body")
      .style("background", color(-1))
      .on("click", function() {

        // console.log(d3.event.toElement.classList)
        zoom(root);
      });
       
    $(window).on( "orientationchange resize", function( event ) {
       viewport = new View()
       diameter = viewport.diameter;

      svg
        .attr("width", viewport.width)
        .attr("height", viewport.height)
        .translate(diameter / 2)
 
        
      zoom(root);

     } )


    zoom(root);

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
