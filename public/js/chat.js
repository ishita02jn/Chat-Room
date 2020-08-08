const socket = io()

//elements
const $msg = $("#msg")
const $msgForm = $("#msgFormId")
const $msgFormBtn  = $("#msgFormBtn")
const $chatMsgInput = $("#chatmsg")
const $locationButton = $("#locationBtn")

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix : true})

socket.on("message", (msg)=>{
    const html = Mustache.render(messageTemplate, {
        message: msg.text,
        username  : msg.username,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    $msg.append(html)
    //$msg.append($('<p>').text(moment(msg.createdAt).format("h:mm a") +" - "+ msg.text))  ;
})

// socket.on("chat message", (msg)=>{
//     $chatMsg.append($('<li>').text(msg));
// })
socket.on('typing',(typing_msg)=>{
    $("#typing").html(typing_msg)
})

socket.on('stop typing',()=>{
    $("#typing").html('')
})

socket.on("location", (location)=>{
    const html = Mustache.render(locationMessageTemplate, {
        url: location.text,
        username  : location.username,
        createdAt: moment(location.createdAt).format('h:mm a')
    })
    $msg.append(html)
    // $msg.append(moment(location.createdAt).format("h:mm a") + " - ")
    // $msg.append($('<a>')
    // .attr("href",location.text)
    // .attr("target", "_blank")
    // .text("My Current Location"));
})

socket.on("room-list",({room,users})=>{
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    $("#sidebar").html(html)
})

$msgForm.submit(function(e){
    e.preventDefault(); // prevents page reloading
    $msgFormBtn.prop("disabled", true);

    socket.emit('chat message', $chatMsgInput.val(),(ack)=>{
        $msgFormBtn.prop("disabled", false);
        $chatMsgInput.val('');
        $chatMsgInput.focus();
        console.log(ack)
    });
    
    return false;
});

$chatMsgInput.keypress(function(){
    socket.emit('typing',{username, room})
})

$chatMsgInput.keyup(function(){
    socket.emit('stop typing',{username, room})
})

$locationButton.click(function(){
    if(!navigator.geolocation){
       return alert("Location not available");
    }
    $locationButton.prop( "disabled", true );

    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('location', {
            "latitude": position.coords.latitude,
            "longitude": position.coords.longitude
        },(ack)=>{
            $locationButton.prop( "disabled", false );
            console.log(ack);
        });
    })
})

socket.emit("join",{username,room},(error)=>{
    if(error){
        console.log(error)
        location.href="/"
    }
})