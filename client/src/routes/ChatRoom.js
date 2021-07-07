//sfc represnenting the actual room 
import React, {useRef, useEffect, useState} from 'react';
import io from 'socket.io-client';

const ChatRoom = (props) => {
    const peer = useRef();   //represents our own peer object
    const socketRef = useRef();   //represents the socket between us and socket io server 
    const otherUser = useRef();   //to keep track of other user's ID
    const sendChannel = useRef();
    const [text, setText] = useState('');
    const [messages, setMessages] = useState([]);
    const openButton = useRef();
    const chatbox = useRef();
    let isOpen = false;

    openButton.current = document.querySelector('.chatbox__button');
    chatbox.current = document.querySelector('.chatbox__support');
    const roomID = props.match.params.roomID;
    console.log(roomID);
    useEffect(() => {
        //whole handshake process will take place on initial render
            
        //connect user to socket
        socketRef.current = io.connect('/');
        //emiting event that we've joined room and send the roomID by parsing url
        socketRef.current.emit('join room', props.match.params.roomID);
        //server responds with existing user's ID (if any in room)
        socketRef.current.on('other user', userID =>{
            callUser(userID); //creates our own peer object and sends offer to otherUser via server
            otherUser.current = userID;
        });
        //from the perspective of existing user, server notifies new user has joined
        socketRef.current.on('user joined', userID =>{
            otherUser.current = userID;
        });
        //handshake
        //existing user receives offer from new user via server
        socketRef.current.on('offer', handleReceiveCall);
        //new user receives answer from existing user
        socketRef.current.on('answer', handleAnswer);
        //both peers send each other ice-candidates
        socketRef.current.on('ice-candidate', handleICECandidate);
    }, [roomID]);

    //function to create new user's peer and send an offer to existing user, add stream to peer object, store 
    //tracks being sent in tracksSent
    function callUser(userID){
        peer.current = createPeer(userID);
        sendChannel.current = peer.current.createDataChannel('sendChannel');
        sendChannel.current.onmessage = handleReceiveMessage;
        
    }

    //function to create new user's peer and send an offer to existing user
    function createPeer(userID){
        const peer = new RTCPeerConnection({
            iceServers : [
                {
                    urls: 'stun:stun.stunprotocol.org'
                },
                {
                    urls : 'turn:numb.viagenie.ca',
                    credential: 'muazkh',
                    username: 'webrtc@live.com'
                },
            ]
        });
        //browser sends us ice-candidates, we send it to the other peer
        peer.onicecandidate = handleICECandidateEvent;
        //handleNegotiation will actually go ahead and send new user's offer to server
        peer.onnegotiationneeded = () => handleNegotiationNeededEvent(userID);
        return peer;
    }
    
    //function to send offer
    function handleNegotiationNeededEvent(userID){
        peer.current.createOffer().then(offer =>{
            //set new user's local SDP
            return peer.current.setLocalDescription(offer);
        }).then(() => {
            //create a payload object to send to server
            const payload = {
                target: userID,
                caller: socketRef.current.id,
                sdp: peer.current.localDescription,
            };
            //send to server
            socketRef.current.emit('offer', payload);
        }).catch(e => console.log(e));
    }

    //function for existing user to receive incoming offer from new user via server
    function handleReceiveCall(incoming) {
        //creating existing user's peer object
        peer.current = createPeer();
        //setting the sendChannel as the common data channel between both the peers
        peer.current.ondatachannel = (e)=>{
            sendChannel.current = e.channel;
            sendChannel.current.onmessage = handleReceiveMessage;
            console.log('sendchannel active');
        }
        const desc = new RTCSessionDescription(incoming.sdp);
        //set existing user's remote description as SDP of new user
        peer.current.setRemoteDescription(desc).then(() => {
            //create an answer
            return peer.current.createAnswer();
        }).then(answer => {
            //set existing user's local SDP
            return peer.current.setLocalDescription(answer);
        }).then(() => {
            //creating payload object with answer, to send to server
            const payload = {
                target: incoming.caller,
                caller: socketRef.current.id,
                sdp: peer.current.localDescription
            }
            //send it to server
            socketRef.current.emit("answer", payload);
        })
    }
    //function for new user to handle incoming answer from existing user, via server
    function handleAnswer(message){
        const desc = new RTCSessionDescription(message.sdp);
        //setting new user's remote SDP as existing user's SDP
        peer.current.setRemoteDescription(desc).catch(e => console.log(e));
    }

    //function to send ice-candidates back and forth to peers until agreement
    function handleICECandidateEvent(e){
        if(e.candidate){
            const payload = {
                target: otherUser.current,
                candidate: e.candidate,
            }
            socketRef.current.emit('ice-candidate', payload);
        }
    }

    //function to handle incoming ICE candidates from other peer
    function handleICECandidate(incoming){
        const candidate = new RTCIceCandidate(incoming);
        //adding the ice candidate to our the user's peer object
        peer.current.addIceCandidate(candidate).catch(e => console.log(e));
    }

    function handleReceiveMessage(e){
        //partnerVideo.current.className = e.data;
        const parsed = JSON.parse(e.data);
        if(parsed.type === 'textMessage') setMessages(messages => [{yours: false, value: parsed.data}, ...messages]);
    }

    function toggleState(){
        isOpen = !isOpen;
        if(isOpen){
            chatbox.current.classList.add('chatbox--active');
        }
        else{
            chatbox.current.classList.remove('chatbox--active');
        }
    }

    function handleChange(e) {
        setText(e.target.value);
    }

    function sendMessage(){
        sendChannel.current.send(JSON.stringify({type: 'textMessage', data: text}));
        setMessages(messages => [{yours: true, value: text}, ...messages]);
        setText('');
    }

    function renderMessage(message, index) {
        if (message.yours) {
            return (
                <div class="messages__item messages__item--operator" >
                    {message.value}
                </div>
            )
        }

        return (
            <div class="messages__item messages__item--visitor" >
                {message.value}
            </div>
        )
    }
    return (  
        <div class="container">
            <div class="chatbox">
                <div class="chatbox__support" ref = {chatbox}>
                    <div class="chatbox__header">
                        <div class="chatbox__content--header">
                            <h4 class="chatbox__heading--header">Chat</h4>
                        </div>
                    </div>
                    <div class="chatbox__messages">
                        {messages.map(renderMessage)}
                    </div>
                    <div class="chatbox__footer"> 
                        <input type="text" value={text} onChange={handleChange} placeholder="Write a message..." />
                        {sendChannel.current && <button class="chatbox__send--footer" onClick={sendMessage}>Send</button>}
                    </div>
                </div>
                <div class="chatbox__button">
                    <button onClick = {toggleState} ref = {openButton}><img src = "../chatbox-icon.svg" ></img></button>
                </div>
            </div>
        </div>
    );
}
 
export default ChatRoom;