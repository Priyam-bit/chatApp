import React, { useContext, useEffect, useState } from 'react';
import {HandshakeContext} from '../Context';
import Filter from './Filter';

const ControlBar = () => {
    let videoOn = true;
    let audioOn = true;
    const {userVideo, partnerVideo, userStream, tracksSent, callAccepted, callEnded, roomID, setRoomID} = useContext(HandshakeContext);
    const localVideo = document.getElementById('localVid');
    const localVideoTrack = userStream.current.getTracks()[1];
    const localAudioTrack = userStream.current.getTracks()[0];
    const toggleVidBtn = document.getElementById('toggleVid');
    const toggleAudBtn = document.getElementById('toggleAud');
    function screenShare(){
        navigator.mediaDevices.getDisplayMedia({cursor : true}).then(stream =>{
            //only video captured
            const screenTrack = stream.getTracks()[0];
            //replacing current video track with screenTrack
            tracksSent.current.find(sender => sender.track.kind === 'video').replaceTrack(screenTrack);
            //replace screenTrack with userStream video track after screen sharing ends
            screenTrack.onended = () => {
                //document.getElementById('shareButton').disabled = false;
                tracksSent.current.find(sender => sender.track.kind === 'video')
                .replaceTrack(userStream.current.getTracks()[1]);
            }
        });
    }
    const toggleVideo = ()=>{
        videoOn = !videoOn;
        console.log(tracksSent.current);
        localVideoTrack.enabled = videoOn;
        toggleVidBtn.innerHTML = (videoOn)? 'Turn video off':'Turn video on';
        userVideo.current.srcObject = userStream.current;
        if(tracksSent.current){
            const currentVideo = tracksSent.current.find(sender => sender.track.kind === 'video');
            if(currentVideo) currentVideo.replaceTrack(localVideoTrack); 
        } 
    }
    const toggleAudio = ()=>{
        audioOn = !audioOn;
        console.log(tracksSent.current);
        localAudioTrack.enabled = audioOn;
        toggleAudBtn.innerHTML = (audioOn)? 'Turn audio off':'Turn audio on';
        userVideo.current.srcObject = userStream.current;
        if(tracksSent.current){
            const currentAudio = tracksSent.current.find(sender => sender.track.kind === 'audio');
            if(currentAudio) currentAudio.replaceTrack(localAudioTrack); 
        } 
    }
    return (  
        <div className="control-bar">
            <button onClick = {screenShare} disabled = {false} id = 'shareButton'>Share screen</button>
            <button onClick = {toggleVideo} id = 'toggleVid'>Turn video off</button>
            <button onClick = {toggleAudio} id = 'toggleAud'>Turn audio off</button>
            <Filter />
        </div>
    );
}
 
export default ControlBar;