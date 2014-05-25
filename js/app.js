"use strict";

$("#dialer").on("pagecreate", function() {
  
 
  $( "#canvas" ).on( "swipeup", function( event ) {
    console.log('up')
    if (svg.wheels.length != 1) {

      svg.wheels.shift().remove()
      
      svg.wheels.forEach(function (v) {
        var scale = v.transform.scale()
        scale.x*=1/.75
        scale.y*=1/.75
        v.transform.scale(scale).animate()
      })

      var d = svg.wheels[0].focus().datum()
      
        update_grades(d)
      
        $('#title').children().last().remove();
        
        score.setScore(d)

      }
    
  });
  
  $( "#canvas" ).on( "swipedown", function( event ) {
    console.log('down')
    
    var center_icon = svg.wheels[0].focus()
    
    var d = center_icon.datum()

    if (d.elements) {

      svg.wheels.forEach(function (v) {
        var scale = v.transform.scale()
        scale.x*=.7
        scale.y*=.7
        v.transform.scale(scale).animate()
      })
      
      
      
      svg.wheels.unshift(add_wheel())
      
      update_grades(d)
      
      svg.wheels[0].data(d.elements);
          
      score.setScore(d.elements[0])
      
      d3.select('#title')
        .append('li')
        .text(d.elements[0].label)
    }




  })
  
  function turn_wheel(direction){

    var new_focus = svg.wheels[0].turn(direction)

    update_grades(new_focus.datum())      
    
    $('#title').children().last().text(new_focus.datum().label)
    
    score.setScore(new_focus.datum())
    
  }
  
  $( "#canvas" ).on( "swipeleft", function( event ) {
    console.log('left')
    turn_wheel(1)
    
  })
  
  $( "#canvas" ).on( "swiperight", function( event ) {
    console.log('right')
    turn_wheel(-1)
  })


  $( "#canvas" ).on( "info_clicked", function( event ) {
    $.mobile.changePage( "#locale", {
      changeHash: false
    });
  })

  $( "i.home_button" ).on( 'click', function( event ) {
    $.mobile.changePage( "#dialer", {
      changeHash: false
    });
  })

  // wait for the api to be ready (which means waiting for position)
  sgh.ready.done(function() {
    sgh.sample()
      .done(function(data) {
        
        layouts.packed(data)
      })  
      .error(function(d) {
        debugger;
      });
  });

});
