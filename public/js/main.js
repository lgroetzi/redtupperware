_.templateSettings = {
  interpolate:  /\{\{-(.+?)\}\}/gim,
  evaluate:     /\{\{(.+?)\}\}/gim,
} 

$(function() {
  var ref       = new Firebase("https://red-tupperware.firebaseio.com"),
      dishesRef = new Firebase("https://red-tupperware.firebaseio.com/dishes"),
      usersRef  = new Firebase("https://red-tupperware.firebaseio.com/users"),
      likesRef  = new Firebase("https://red-tupperware.firebaseio.com/likes"),      
      admin     = false,
      authData  = ref.getAuth();

  if (authData) {
    console.log("User " + authData.uid + " is logged in with " + authData.provider);
    usersRef.child(authData.uid).once('value', function(snapshot) {
      admin = snapshot.val().admin;
      if (admin === true) {
        $('#header-build').show();
      }
    });
    $('#header-login').hide();
    $('#header-logout').show();
  }

  $('#header-logout').click(function() {
    ref.unauth();
    window.location = "/login";
  });

  // BEGIN: Login page
  if (window.location.pathname === "/login") {
    $('.nav').hide();
    $('#login-button').click(function() {
      ref.authWithOAuthPopup("google", function(error, authData) {
        if (error) {
          console.log("Login Failed!", error);
        } else {
          console.log("Authenticated successfully with payload:", authData);
          var isNewUser;
          usersRef.child(authData.uid).once('value', function(snapshot) {
            isNewUser = (snapshot.val() === null);
            if (authData && isNewUser) {
              // save the user's profile into Firebase so we can list users,
              // use them in Security and Firebase Rules, and show profiles
              ref.child("users").child(authData.uid).set(authData, function() {
                top.window.location = '/';
              });
            } else {
              top.window.location = '/';
            }
          });
        }
      });
    });
  }
  // END: Login page

  // BEGIN: Admin page
  if (window.location.pathname === "/admin") {
    $('#add-item').click(function() {
      if(admin) {
        var newDishRef = dishesRef.push();
        var dishName = $('#new-item-input').val();
        newDishRef.set({
          'name': dishName,
          'active': true, 
          'attributes': {
            'nut-free':   $('#check-1').is(':checked'),
            'vegetarian': $('#check-2').is(':checked'),
            'spicy':      $('#check-3').is(':checked'),
            'dairy':      $('#check-4').is(':checked')
          }
        });
      } else {g
        alert('You must be an admin to add items.');
      }
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

    $(document).on('click', '.delete-item', function() {
      if(admin) {
        var id = $(this).parents(".menu-item").attr("id");
        var itemRef = new Firebase("https://red-tupperware.firebaseio.com/dishes/" + id);
        itemRef.update({
          'active': false
        });
      } else {
        alert('You must be an admin to delete items.')
      }
    });  
  }
 // END: Admin page

  // BEGIN: Homepage
  if (window.location.pathname === "/") {
    var userLikes = [];
    if (authData) {
      likesRef.orderByChild("user").equalTo(authData.uid).once("value", function(snapshot) {
        var likeSet = snapshot.val();
        _.forEach(likeSet, function(like) {
          userLikes.push(like.dish);
        });
      });
    }
    dishesRef.on("child_added", function(snapshot) {
      render_menu_item(snapshot, {
        'rights': 'user'
      },
      userLikes);
    });

    $(document).on('click', '.like-button', function() {
      if(authData) {
        var id = $(this).parents(".menu-item").attr("id"),        
            match_count = 0,
            that = $(this);
        likesRef.orderByChild("dish").equalTo(id).once("value", function(snapshot) {
          var likes = snapshot.val();
          _.forEach(likes, function(like) {
            if(like.user === authData.uid) match_count++;
          });
          if(match_count === 0) {
            likesRef.push({
              'user': authData.uid,
              'dish': id
            }, function() {
              that.css('color', '#de686a');
            });
          }
        });
      } else {
        window.location = "/login";
      }
    });
  }
  // END: Homepage

  // BEGIN: Faves
  if (window.location.pathname === "/faves") {
    var likesSummary = [];
    likesRef.once('value', function(snapshot) {
      var likes = snapshot.val();
      _.forEach(likes, function(like) {
        var index = _.findIndex(likesSummary, function(summarizedLike) {
          return summarizedLike.dish === like.dish
        });
        if(index === -1) {
          likesSummary.push({
            'dish': like.dish,
            'count': 1 
          });
        } else {
          likesSummary[index].count = likesSummary[index].count +1;
        }
      });
      likesSummary = _.sortBy(likesSummary, function(l) {
        return l.count * -1;
      });
      _.forEach(likesSummary, function(el) {
        dishesRef.orderByKey().equalTo(el.dish).once('value', function(snapshot) {
          render_menu_item(snapshot, {
            'rights': 'display',
            'count' : el.count
          },[]);
        });
      });
    });
  }
  // END: Faves

  function render_menu_item (snapshot, settings, userLikes) {
    var dish;
    if(_.values(snapshot.val()).length === 1) {
      dish = _.values(snapshot.val())[0];
    } else {
      dish  = snapshot.val();
    }

    var key   = snapshot.key(),
        liked = ($.inArray(key, userLikes) > -1 ),
        count = settings.count || 0;

    if((dish.active === true) || (settings.rights === 'display')) {
      var menu_item = _.template($('#menu_dish').html(), {
        'name': dish.name,
        'rights': settings.rights,
        'key': key,
        'attributes': dish.attributes,
        'liked': liked,
        'count': count
      });
      $('#menu').append(menu_item);
    }
  }
});