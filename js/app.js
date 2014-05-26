"use strict";

$("#dialer").on("pagecreate", function() {
  
 
  $( "#canvas" ).on( "swipeup", function( event ) {
    console.log('up')

    
  });
  
  $( "#canvas" ).on( "swipedown", function( event ) {
    console.log('down')
    



  })
  
  
  $( "#canvas" ).on( "swipeleft", function( event ) {
    console.log('left')
    turn_wheel(1)
    
  })
  
  $( "#canvas" ).on( "swiperight", function( event ) {
    console.log('right')
    turn_wheel(-1)
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
