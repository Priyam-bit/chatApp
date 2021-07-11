import React, {useRef, useState, useEffect, createContext} from 'react';
import io from 'socket.io-client';

export const HandshakeContext = createContext();

const HandshakeContextProvider = (props) => {
    const userVideo = useRef();  //represents our own video element
    const partnerVideo = useRef();  //represents remote peer's video element
    const peerRef = useRef();   //represents the connected peer's peer object
    const socketRef = useRef();   //represents the socket between us and socket io server 
    const otherUser = useRef();   //to keep track of other user's ID
    const userStream = useRef();   //represents our own stream
    const tracksSent = useRef([]);  //stores the tracks(audio and video) being sent to other peer
    const sendChannel = useRef();   //data channel
    const partnerStream = useRef();    //remote peer's stream
    const [callInitiated, setCallInitiated] = useState(false); 
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [roomID, setRoomID] = useState('');
    const [isVideoLoading, setIsVideoLoading] = useState(true);
    const [isPartnerVideo, setIsPartnerVideo] = useState(false);
    const [messages, setMessages] = useState([]);   //chatbox messages

    useEffect(() => {
        if(roomID === '') return;
        setIsVideoLoading(true);
        const abortCont =  new AbortController();
        //whole handshake process will take place on initial render
        navigator.mediaDevices.getUserMedia({audio : true, video : true}).then(stream =>{
            //stream represents our own stream from the browser
            //mount it on the userVideo element
            userVideo.current.srcObject = stream;
            userStream.current = stream;
            //connect user to socket
            socketRef.current = io.connect('/', {
                'sync disconnect on unload': true});
            socketRef.current.on("connect_error", (err) => {
                console.log(`connect_error due to ${err.message}`);
                });    
            //emiting event that we've joined room and send the roomID by parsing url
            socketRef.current.emit('join room', roomID);
            //server responds with existing user's ID (if any in room)
            setIsVideoLoading(false);
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
            //leave call if other user left
            socketRef.current.on('user left', handleLeaveCall);
        }).catch(err =>{
            if(err.name === 'AbortError'){
                console.log('fetch aborted');
            }
            else{
                console.log('An error ocurred when accessing media devices', err);
            }
            return ()=> abortCont.abort();
        });
    }, [roomID]);

    //function to create new user's peer and send an offer to existing user, add stream to peer object, store 
    //tracks being sent in tracksSent
    function callUser(userID){
        setCallInitiated(true);
        peerRef.current = createPeer(userID);
        sendChannel.current = peerRef.current.createDataChannel('sendChannel');
        sendChannel.current.onmessage = handleReceiveMessage;
        if(userStream.current) userStream.current.getTracks().forEach(track => {
            tracksSent.current.push(peerRef.current.addTrack(track, userStream.current));
        });
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
        //handle incoming stream
        peer.ontrack = handleTrackEvent;
        //handleNegotiation will actually go ahead and send new user's offer to server
        peer.onnegotiationneeded = () => handleNegotiationNeededEvent(userID);
        return peer;
    }
    
    //function to send offer
    function handleNegotiationNeededEvent(userID){
        peerRef.current.createOffer().then(offer =>{
            //set new user's local SDP
            return peerRef.current.setLocalDescription(offer);
        }).then(() => {
            //create a payload object to send to server
            const payload = {
                target: userID,
                caller: socketRef.current.id,
                sdp: peerRef.current.localDescription,
            };
            //send to server
            socketRef.current.emit('offer', payload);
        }).catch(e => console.log(e));
    }

    //function for existing user to receive incoming offer from new user via server
    function handleReceiveCall(incoming) {
        //creating existing user's peer object
        setCallAccepted(true);
        peerRef.current = createPeer();
        //setting the sendChannel as the common data channel between both the peers
        peerRef.current.ondatachannel = (e)=>{
            sendChannel.current = e.channel;
            sendChannel.current.onmessage = handleReceiveMessage;
        }
        const desc = new RTCSessionDescription(incoming.sdp);
        //set existing user's remote description as SDP of new user
        peerRef.current.setRemoteDescription(desc).then(() => {
            //attach existing user's stream to its peer object and adding it to his tracksSent ref
            if(userStream.current) userStream.current.getTracks().forEach(track => tracksSent.current.push(peerRef.current.addTrack(track, userStream.current)));
        }).then(() => {
            //create an answer
            return peerRef.current.createAnswer();
        }).then(answer => {
            //set existing user's local SDP
            return peerRef.current.setLocalDescription(answer);
        }).then(() => {
            //creating payload object with answer, to send to server
            const payload = {
                target: incoming.caller,
                caller: socketRef.current.id,
                sdp: peerRef.current.localDescription
            }
            //send it to server
            socketRef.current.emit("answer", payload);
        })
    }
    //function for new user to handle incoming answer from existing user, via server
    function handleAnswer(message){
        setCallAccepted(true);
        const desc = new RTCSessionDescription(message.sdp);
        //setting new user's remote SDP as existing user's SDP
        peerRef.current.setRemoteDescription(desc).catch(e => console.log(e));
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
        peerRef.current.addIceCandidate(candidate).catch(e => console.log(e));
    }

    //function to handle the event when a user leaves the room
    async function handleLeaveCall(){
        console.log('user left emitted to ' + roomID);
        leaveCall();
        console.log(peerRef.current);
        await peerRef.current.close();
        console.log(peerRef.current);
        peerRef.current = null;
        otherUser.current = null;
        sendChannel.current = null;
        document.getElementById('openButton').remove();
        document.getElementById('chatBox').remove();
    }

    //function to handle incoming stream from parter
    function handleTrackEvent(e){
        setIsPartnerVideo(true);
        partnerStream.current = e.streams[0];
        if(partnerVideo.current) partnerVideo.current.srcObject = e.streams[0]
    }

    //function to handle incoming messages from data channel
    function handleReceiveMessage(e){
        const parsed = JSON.parse(e.data);
        if(parsed.type === 'filter') partnerVideo.current.className = parsed.data;
        if(parsed.type === 'textMessage') {
            setMessages(messages => [{yours: false, value: parsed.data}, ...messages]);
            let msgStatusPic = document.getElementById('msgStatus');
            msgStatusPic.src = '../chatbox-icon-msg.png';
        }
        else if(parsed.type === 'endCall') leaveCall();
    }

    //function to stop inputting user stream and render the page, when call is ended
    function leaveCall(){
        setCallEnded(true);
        userStream.current.getTracks().forEach(function(track) {
            track.stop();
        });
        document.getElementById('callEnded').innerHTML = 'Call ended';
        document.getElementById('callEndedDisplay').src = '../Call-ended.gif';
        partnerStream.current = null;
    }
    return (  
        <HandshakeContext.Provider value = {{
            userVideo, partnerVideo, peerRef, socketRef, otherUser, userStream, tracksSent, roomID,
            setRoomID, callInitiated, callAccepted, setCallAccepted, callEnded, setCallEnded, isVideoLoading,
            isPartnerVideo, partnerStream, sendChannel, messages, setMessages,
        }}>
            {props.children}
        </HandshakeContext.Provider>
    );
}
 
export default HandshakeContextProvider;