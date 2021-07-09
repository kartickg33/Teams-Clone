const create_btn = document.getElementById('create_btn');
const form = document.getElementById('add_form');
const attendees = document.getElementById('attendees');
const attendee_name = document.getElementById('attendee');
var users_allowed = [];
users_allowed.push(host);

form.addEventListener('submit',(form_submit)=>{
    form_submit.preventDefault(); // prevent default submit event of form
    var room_attendee = `<li>${attendee_name.value}</li>`; //append an li in the unordered list with the email of the attendee added by host
    users_allowed.push(attendee_name.value.trim());// trim() for removing whitespaces and push to array
    attendee_name.value = ""; // empty the input value to "" after adding an attendee to the list
    attendees.innerHTML+=room_attendee;
});

create_btn.addEventListener('click',async()=>{
    // console.log(users_allowed);
    var user_list = JSON.stringify(users_allowed);
    var roomLink;
    $.ajax({ // a post request using ajax in which the final attendee array (users_allowed) is passed on to the room route and fetched in the request on server side.
        type:"POST",
        url:"https://peer-connect.herokuapp.com/room/",
        data: user_list,
        contentType:"application/json; charset=utf-8",
        dataType:"json", // pass json data
        error: function(error){
            // console.log(error)
        },
        success:function(success){
            roomLink = success.roomId;
            location.href = `https://peer-connect.herokuapp.com/${success.roomId}`; // redirect to the specified room after successfull creation of the room
        }
    });
})

function suggest(key){
    fetch(`https://peer-connect.herokuapp.com/search?search_key=${key}`) // function to auto suggest the emails to the host to add to the meeting
    .then(response=>response.json())
    .then(function(data){
        document.querySelector('#suggest_ul').innerHTML = "";
        if(attendee_name.value==""){
            document.querySelector('#suggest_email').style.display = "none";
            document.querySelector('#suggest_email').style.transition = "0.3s";
        }

        document.querySelector('#suggest_email').style.display = "block";
        document.querySelector('#suggest_email').style.transition = "0.3s";
        data.val.forEach(x => {
            document.querySelector('#suggest_ul').innerHTML+=`
            <li id="${x.email}" onclick='autofill(this.id)' class="suggest_li">${x.email}</li><br>`; //append the ul with the email fetched from the url
        });

        if(attendee_name.value==""){
            document.querySelector('#suggest_email').style.display = "none";
            document.querySelector('#suggest_email').style.transition = "0.3s";
        }
    })
}

function autofill(mail){
    if(mail != ""){
        mail.trim(); // trim for removing whitespaces
        attendee_name.value = mail;
        document.querySelector('#suggest_email').style.display = "none"; // autofill the input text box with the mail selected in the list
        document.querySelector('#suggest_email').style.transition = "0.3s";
    }
}