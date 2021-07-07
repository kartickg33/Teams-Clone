const create_btn = document.getElementById('create_btn');
// const add_new = document.querySelector('.add_new');
const form = document.getElementById('add_form');
const attendees = document.getElementById('attendees');
const attendee_name = document.getElementById('attendee');
var users_allowed = [];
users_allowed.push(host);

form.addEventListener('submit',(form_submit)=>{
    form_submit.preventDefault();
    var room_attendee = `<li>${attendee_name.value}</li>`;
    users_allowed.push(attendee_name.value.trim());
    attendee_name.value = "";
    attendees.innerHTML+=room_attendee;
});

create_btn.addEventListener('click',async()=>{
    // console.log(users_allowed);
    var user_list = JSON.stringify(users_allowed);
    var roomLink;
    $.ajax({
        type:"POST",
        url:"https://peer-connect.herokuapp.com/room/",
        data: user_list,
        contentType:"application/json; charset=utf-8",
        dataType:"json",
        error: function(error){
            // console.log(error)
        },
        success:function(success){
            // console.log("success "+ success.roomId);
            roomLink = success.roomId;
            location.href = `https://peer-connect.herokuapp.com/${success.roomId}`;
        }
    });
})



