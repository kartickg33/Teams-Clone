const create_btn = document.getElementById('create_btn');
// const add_new = document.querySelector('.add_new');
const form = document.getElementById('add_form');
const attendees = document.getElementById('attendees');
const attendee_name = document.getElementById('attendee');
var users_allowed = [];
users_allowed.push(host);

form.addEventListener('submit',(form_submit)=>{
    form_submit.preventDefault();
    var room_attendee = document.createElement('p');
    room_attendee.innerHTML = attendee_name.value;
    users_allowed.push(attendee_name.value);
    attendee_name.value = "";
    attendees.appendChild(room_attendee);
});

create_btn.addEventListener('click',async()=>{
    console.log(users_allowed);
    var user_list = JSON.stringify(users_allowed);
    $.ajax({
        type:"POST",
        url:"https://peer-connect.herokuapp.com/roomSetup/",
        data: user_list,
        contentType:"application/json; charset=utf-8",
        dataType:"json",
        error: function(error){
            console.log(error)
        },
        success:function(success){
            console.log(success)
        }
    });
})



