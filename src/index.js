const express = require("express")
const path = require("path")
const http = require("http")
const socketio = require("socket.io")
const {generateMessage} = require("./utils/messages")
const {addUser,removeUser,getUser,getUsersInRoom} = require("./utils/users")

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000

const publicDirPath = path.join(__dirname ,"../public")

app.use(express.static(publicDirPath))

io.on("connection", (socket)=>{
    console.log("New User Connection!")


    socket.on("join", function (options, callback){
        const {error , user}= addUser({"id" :socket.id, ...options})
        if(error){
            return callback(error)
        }
        socket.join(user.room)
        io.to(user.room).emit("room-list",{
            "room":user.room,
            "users":getUsersInRoom(user.room)
        })
        socket.emit("message", generateMessage("Welcome!"))
        //sends the msg to everyone except the one who sends
        socket.broadcast.to(user.room).emit("message", generateMessage(`${user.username} has joined!`))
        callback()
    });

    socket.on('typing',({username,room})=>{
        console.log(username)
        socket.broadcast.to(room).emit("typing",`${username} is typing...`)
    })

    socket.on('stop typing',({username,room})=>{
        console.log(room)
        socket.broadcast.to(room).emit("stop typing")
    })

    socket.on('chat message', function(msg, callback){
        const user = getUser(socket.id)
        io.to(user.room).emit('message', generateMessage(msg, user.username))
        callback("message delivered")
    });

    socket.on('location', function(coords , callback){
        const user = getUser(socket.id)
        io.to(user.room).emit('location',
        generateMessage(`https://google.com/maps?q=${coords.latitude},${coords.longitude}`,user.username))
        callback("location shared")
    });

    socket.on('disconnect', function(){
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit("message", generateMessage(` ${user.username} left!`))
            io.to(user.room).emit("room-list",{
                "room":user.room,
                "users":getUsersInRoom(user.room)
            })
        }
    });
})

server.listen(port,()=>{
    console.log(`Server is up on port no ${port}`)
})