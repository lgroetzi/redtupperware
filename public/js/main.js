_.templateSettings = {
  interpolate:  /\{\{-(.+?)\}\}/gim,
  evaluate:     /\{\{(.+?)\}\}/gim,
} 

$(function() {
  var ref = new Firebase("https://red-tupperware.firebaseio.com"),
      dishesRef = new Firebase("https://red-tupperware.firebaseio.com/dishes");

  var authData = ref.getAuth();
  if (authData) {
    console.log("User " + authData.uid + " is logged in with " + authData.provider);
  } else {
    ref.authWithOAuthPopup("google", function(error, authData) {
      if (error) {
        console.log("Login Failed!", error);
      } else {
        console.log("Authenticated successfully with payload:", authData);
      }
    });
  }

  // BEGIN: Admin page
  if (window.location.pathname === "/admin") {
    $('#add-item').click(function() {
        var dishesRef = ref.child("dishes");
        var newDishRef = dishesRef.push();
        var dishName = $('#new-item-input').val();
        newDishRef.set({
          'name': dishName,
          'active': true
        });
    });
    $("#new-item-input").keyup(function(event){
        if(event.keyCode == 13){
            $("#add-item").click();
        }
    });
    

    dishesRef.on("child_added", function(snapshot) {
      render_menu_item(snapshot, {
        'rights': 'admin'
      });
    });
    
    dishesRef.on("child_changed", function(snapshot) {
      $('#' + snapshot.key()).fadeOut('fast');;
    });

  }

  $(document).on('click', '.delete-item', function() {
    var id =$(this).parents(".menu-item").attr("id");
    var itemRef = new Firebase("https://red-tupperware.firebaseio.com/dishes/" + id);
    itemRef.update({
      'active': false
    });
  });  
 // END: Admin page

  // BEGIN: Homepage
  if (window.location.pathname === "/") {
    dishesRef.on("child_added", function(snapshot) {
      render_menu_item(snapshot, {
        'rights': 'user'
      });
    });
  }
  // END: Homepage

  function render_menu_item (snapshot, settings) {
    var key = snapshot.key();
    var dish = snapshot.val();
    if(dish.active === true) {
      var menu_item = _.template($('#menu_dish').html(), {
        'name': dish.name,
        'rights': settings.rights,
        'key': key
      });
      $('#menu').append(menu_item);
    }
  }
});