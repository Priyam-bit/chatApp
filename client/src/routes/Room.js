import React, { useContext, useEffect, useState } from 'react';
import {HandshakeContext} from '../Context';
import Chatbox from '../components/Chatbox';
import { Link } from 'react-router-dom';

const Room = (props) => {
    const id = props.match.params.roomID;
    let videoOn = true;
    let audioOn = true;
    let screenShareOn = false;
    const {userVideo, partnerVideo,socketRef, userStream, otherUser, tracksSent, callInitiated, callAccepted, 
        setCallAccepted, callEnded, setCallEnded, roomID, setRoomID,isVideoLoading, isPartnerVideo, partnerStream, 
        sendChannel } = useContext(HandshakeContext);
    useEffect(() =>{
        setRoomID(id);
    },[])

    let screenTrack;
    function screenShare(){
        screenShareOn = !screenShareOn;
        const currentVideo = tracksSent.current.find(sender => sender.track.kind === 'video');
        let shareBtn = document.getElementById('shareButton');
        if(screenShareOn) {
            shareBtn = document.getElementById('shareButton');
            navigator.mediaDevices.getDisplayMedia({cursor : true}).then(stream =>{
            shareBtn.innerHTML = 'Stop sharing';
            shareBtn.title = 'Stop sharing';
            //only video captured
            screenTrack = stream.getTracks()[0];
            //replacing current video track with screenTrack
            if(tracksSent.current){
                if(currentVideo) currentVideo.replaceTrack(screenTrack); 
            }
            userVideo.current.srcObject = stream;
            //replace screenTrack with userStream video track after screen sharing ends
            screenTrack.onended = () => {
                //document.getElementById('shareButton').disabled = false;
                screenShareOn = false;
                shareBtn.title = 'Share screen';
                stopSharing(currentVideo);
            }
        });}
        else{
            shareBtn.title = 'Share screen';
            stopSharing(currentVideo);
        }
    }

    //function to stopsharing the screen
    function stopSharing(currentVideo){
        document.getElementById('shareButton').innerHTML = 'Share screen';
        if(currentVideo) currentVideo.replaceTrack(userStream.current.getTracks()[1]); 
        userVideo.current.srcObject = userStream.current;
    }

    //function to turn video on/off 
    function toggleVideo(){
        videoOn = !videoOn;
        userStream.current.getTracks()[1].enabled = videoOn;
        let ToggleVidBtn = document.getElementById('toggleVid');
        ToggleVidBtn.innerHTML = (videoOn)? "&#128249;" : "&#x23F8;&#xFE0F;";
        ToggleVidBtn.title = (videoOn)? 'Turn off video' : 'Turn video on';
        userVideo.current.srcObject = userStream.current;
        if(tracksSent.current){
            const currentVideo = tracksSent.current.find(sender => sender.track.kind === 'video');
            if(currentVideo) currentVideo.replaceTrack(userStream.current.getTracks()[1]); 
        } 
    }

    //function to turn audio on/off
    const toggleAudio = ()=>{
        audioOn = !audioOn;
        let toggleAud = document.getElementById('toggleAud');
        userStream.current.getTracks()[0].enabled = audioOn;
        toggleAud.innerHTML = (audioOn)? "&#128266;" : "&#128263;";
        toggleAud.title = (audioOn)? 'Mute' : 'Unmute';
        userVideo.current.srcObject = userStream.current;
        if(tracksSent.current){
            const currentAudio = tracksSent.current.find(sender => sender.track.kind === 'audio');
            if(currentAudio) currentAudio.replaceTrack(userStream.current.getTracks()[1]); 
        } 
    }

    //function to apply filter when user selects a filter
    async function changeFilter() {
        const localVid = document.getElementById('localVid');
        localVid.className = document.querySelector('select#filter').value;
        let filter = JSON.stringify({type : 'filter', data : localVid.className});
        if(sendChannel.current) sendChannel.current.send(filter);
    };

    //function to activate/ deactivate minplayer mode when user clicks the corresponding button
    const requestPictureInPicture = ()=>{
        let picInPicBtn = document.getElementById('picInPic');
        if(document.pictureInPictureElement){
            document.exitPictureInPicture()
            picInPicBtn.innerHTML = '&#8664';
            picInPicBtn.title = 'Miniplayer';
        }else{
            userVideo.current.requestPictureInPicture();
            picInPicBtn.innerHTML = '&#8662';
            picInPicBtn.title = 'Default view';
        }
    }

    //function to escape full screen mode using esc key
    document.addEventListener("keypress", function(e) {
        if (e.key === 'Escape') {
          toggleFullScreen();
        }
      }, false);

    //function to enable / disable full screen mode when user clicks on fullscreen button  
    function toggleFullScreen() {
        if (!document.fullscreenElement) {
            partnerVideo.current.requestFullscreen();
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }
    }
    
    //function to endcall and render the elements on browser 
    function endCall(){
        setCallEnded(true);
        userStream.current.getTracks().forEach(function(track) {
            track.stop();
        });
        partnerStream.current = null;
        document.getElementById('callEnded').innerHTML = 'Call ended';
        document.getElementById('callEndedDisplay').src = '../Call-ended.gif';
        //notify other user that call has ended
        if(sendChannel.current) sendChannel.current.send(JSON.stringify({type : 'endCall'}));
    }

    //function to end call if user closes window
    window.addEventListener("beforeunload", (e) =>{
        delete e['returnValue'];
        endCall();
    });

    //function to handle user clicking home link during meeting
    function handleHomeClick(e){
        if(!callInitiated || (callAccepted && !callEnded)){
            socketRef.current.disconnect();
            endCall();
            otherUser.current = null;
            setCallAccepted(false);
            if(!callInitiated) return;
        }
        if(otherUser.current || !isPartnerVideo){
            e.preventDefault();
            alert("connection active, can't go home");
        }
    }

    return (  
        <div className = 'videoControls' >
            <nav className = "navbar">
                <h1>The chat App</h1>
                <div className="links">
                    {userStream.current && <Link to = "/" onClick = {e => handleHomeClick(e)} style = {{
                    color: 'white',
                    backgroundColor: '#f1356d',
                    borderRadius: '8px'
                    }}>Home</Link>}
                </div>
            </nav>
            <h3>Room id: {roomID}</h3>
            <h2 id = 'callEnded'></h2>
            <img id = 'callEndedDisplay' className = 'callEnded-png' src = '' />
            <div className="videos">
                {userStream && !callEnded && (<video controls id = 'localVid' muted = 'muted' style = {{height: 500, width: 500}} autoPlay ref = {userVideo} />)}
                {tracksSent && !callEnded && (<video controls id = 'partnerVid' style = {{height: 500, width: 500}} autoPlay ref = {partnerVideo} />)}
            </div>
            <div className = "btn-group">
                {!callEnded && (<button onClick = {screenShare} disabled = {isVideoLoading } id = 'shareButton' title = 'Share screen'>Share screen</button>)}
                {!callEnded && (<button onClick = {toggleVideo} disabled = {isVideoLoading } id = 'toggleVid' title = 'Turn off video'>&#128249;</button>)}
                {!callEnded && (<button onClick = {toggleAudio} disabled = {isVideoLoading } id = 'toggleAud' title = 'Mute'>&#128266;</button>)}
                {!callEnded && (<button onClick = {requestPictureInPicture} disabled = {!isPartnerVideo} id = 'picInPic' title = 'Miniplayer'>&#8664;</button>)}
                {!callEnded && (<button onClick = {toggleFullScreen} disabled = {!isPartnerVideo} id = 'fullScreen' title = 'Fullscreen'>Full screen</button>)}
                {!callEnded && (<button onClick = {endCall} title = 'End call'>End call</button>)}
                {!callEnded && (<label >Filter: </label>)}
                {!callEnded && (<select id="filter" onChange = {changeFilter}>
                    <option value="none">None</option>
                    <option value="blur">Blur</option>
                    <option value="grayscale">Grayscale</option>
                    <option value="invert">Invert</option>
                    <option value="sepia">Sepia</option>
                </select>)}
            </div>
            {isPartnerVideo && <Chatbox />}
        </div>
    );
}
 
export default Room;