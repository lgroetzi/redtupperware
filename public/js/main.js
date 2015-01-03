_.templateSettings = {
  interpolate:  /8\=\=\>\-(.+?)\<\=\=8/gim,
  evaluate:     /8\=\=\>(.+?)\<\=\=8/gim,
}  

$(function() {
  var ref = new Firebase("https://red-tupperware.firebaseio.com");
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
  if (window.location.pathname === "/") {
    $('#add-item').click(function() {
        var dishesRef = ref.child("dishes");
        var newDishRef = dishesRef.push();
        var dishName = $('#new-item-input').val();
        newDishRef.set({
          'name': dishName,
          'active': true
        });
    });
  }
 // END: Admin page

  // BEGIN: Homepage
  if (window.location.pathname === "/") {
    var dishesRef = new Firebase("https://red-tupperware.firebaseio.com/dishes");

    // Attach an asynchronous callback to read the data at our posts reference
    dishesRef.once("value", function(snapshot) {
      var dishes = snapshot.val();

      // Get the active dishes
      dishes = _.filter(dishes, function(dish) {
        return dish.active === true; 
      });

      _.forEach(dishes, function (dish) {
        var menu_item = _.template($('#menu_dish').html(), {
          'name': dish.name
        });
        console.log(menu_item);
        $('#menu').append(menu_item);
      });
    }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
    });
  }
  // END: Homepage

});