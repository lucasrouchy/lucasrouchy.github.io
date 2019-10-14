document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("mainHeader").onclick = function() {
      this.style.color = 'orange'
    }
  })
  $( document ).ready(function() {
    $( "#fade" ).click(function() {
      $( "#fade" ).fadeOut( "slow", function() {
      });
    });
  });