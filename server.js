require('dotenv').config();
const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const socket = require('socket.io');
const io = socket(server);
const path = require('path');

const rooms = {}; //represents all the rooms
const socketRoom = []; //collection of rooms corresponding to each socket

io.on('connection', socket=>{
    console.log('connected');
    socket.on('join room', roomID =>{
        console.log('user joined room ' + roomID);
        if(rooms[roomID]){
            console.log(rooms[roomID].length);
            rooms[roomID].push(socket.id);
        }
        else{
            rooms[roomID] = [socket.id];
        }
        socketRoom[socket.id] = roomID;
        const otherUser = rooms[roomID].find(id => id !== socket.id);
        if(otherUser){
            //notify the newUser that there is an existing user in room to initiate the handshake
            socket.emit('other user', otherUser);
            //also notify the existing user that a new user has joined the room
            socket.to(otherUser).emit('user joined', socket.id);
        }
    });

    //send the initial offer of new user to existing user
    socket.on('offer', payload =>{ //{from,target,sdp}
        console.log('offer received');
        io.to(payload.target).emit('offer', payload);
    });

    //send the existing user's answer to new user
    socket.on('answer', payload =>{ //{target,sdp}
        console.log('answer sent')
        io.to(payload.target).emit('answer', payload);
    });

    //send the ice candidates back and forth to both peers until mutual agreement
    socket.on('ice-candidate', incoming =>{  //{target,candidate}
        io.to(incoming.target).emit('ice-candidate', incoming.candidate);
    });

    //handle user leaving the room
    socket.on('disconnect', (reason) => {
        if (reason === "io server disconnect") {
          // the disconnection was initiated by the server, you need to reconnect manually
          socket.connect();
        }
        const roomID = socketRoom[socket.id];  //id of the room, which the user left
        let room = rooms[roomID];     //the room, which the user left
        console.log('user ' + socket.id +  ' left the room ' + roomID);
        if(room){
            room = room.filter(id => id !== socket.id);   //removing the user from the room insatnce
            rooms[roomID] = room;   //updating the actual room
            if(rooms[roomID].length !== 0) socket.to(rooms[roomID]).emit('user left');
        }
    });
});

if(process.env.NODE_ENV === 'production') {
    // set static folder
    app.use(express.static('client/build'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
    });
  }

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));