import React, { useContext, useEffect, useState } from 'react';
import {HandshakeContext} from '../Context';
import Chatbox from '../components/Chatbox';
//import { useParams } from 'react-router';
//import MultiStreamsMixer from 'multistreamsmixer';

const Room2 = (props) => {
    const id = props.match.params.roomID;
    //const [videoOn, setVideoOn] = useState(true);
    let videoOn = true;
    let audioOn = true;
    let screenShareOn = false;
    const {userVideo, partnerVideo, userStream, otherUser, tracksSent, callAccepted, callEnded, setCallEnded,
        roomID, setRoomID,isVideoLoading, isPartnerVideo, partnerStream, sendChannel } = useContext(HandshakeContext);
    useEffect(() =>{
        setRoomID(id);
    },[])
    let screenTrack;
    function screenShare(){
        screenShareOn = !screenShareOn;
        const currentVideo = tracksSent.current.find(sender => sender.track.kind === 'video');
        if(screenShareOn) {
            document.getElementById('shareButton').innerHTML = 'Stop sharing';
            navigator.mediaDevices.getDisplayMedia({cursor : true}).then(stream =>{
            //only video captured
            screenTrack = stream.getTracks()[0];
            //replacing current video track with screenTrack
            if(tracksSent.current){
                if(currentVideo) currentVideo.replaceTrack(screenTrack); 
            }
            console.log(tracksSent.current);
            userVideo.current.srcObject = stream;
            //replace screenTrack with userStream video track after screen sharing ends
            screenTrack.onended = () => {
                //document.getElementById('shareButton').disabled = false;
                screenShareOn = false;
                stopSharing(currentVideo);
            }
        });}
        else{
            screenTrack.ended = true;
            stopSharing(currentVideo);
        }
    }

    function stopSharing(currentVideo){
        //document.getElementById('stopButton').disabled = true;
        document.getElementById('shareButton').innerHTML = 'Share screen';
        if(currentVideo) currentVideo.replaceTrack(userStream.current.getTracks()[1]); 
        userVideo.current.srcObject = userStream.current;
    }
    function toggleVideo(){
        //setVideoOn(!videoOn);
        videoOn = !videoOn;
        console.log(tracksSent.current);
        userStream.current.getTracks()[1].enabled = videoOn;
        document.getElementById('toggleVid').innerHTML = (videoOn)? "&#128249;" : "&#x23F8;&#xFE0F;";
        userVideo.current.srcObject = userStream.current;
        if(tracksSent.current){
            const currentVideo = tracksSent.current.find(sender => sender.track.kind === 'video');
            if(currentVideo) currentVideo.replaceTrack(userStream.current.getTracks()[1]); 
        } 
    }
    const toggleAudio = ()=>{
        audioOn = !audioOn;
        console.log(tracksSent.current);
        const toggleAud = document.getElementById('toggleAud');
        //document.getElementById('localVid').muted = !audioOn;
        console.log(audioOn);
        userStream.current.getTracks()[0].enabled = audioOn;
        toggleAud.innerHTML = (audioOn)? "&#128266;" : "&#128263;";
        userVideo.current.srcObject = userStream.current;
        if(tracksSent.current){
            const currentAudio = tracksSent.current.find(sender => sender.track.kind === 'audio');
            if(currentAudio) currentAudio.replaceTrack(userStream.current.getTracks()[1]); 
        } 
    }
    async function changeFilter() {
        console.log(document.querySelector('select#filter').value);
        const localVid = document.getElementById('localVid');
        console.log(localVid);
        localVid.className = document.querySelector('select#filter').value;
        let a = JSON.stringify({type : 'filter', data : localVid.className});
        console.log(a);
        //sendChannel.current.send(localVid.className);
        if(sendChannel.current) sendChannel.current.send(a);
        // var stream = await localVid.captureStream(25);
        // console.log(stream.getTracks()[1]);
        // if(tracksSent.current){
        //     const currentVideo = tracksSent.current.find(sender => sender.track.kind === 'video');
        //     if(currentVideo) currentVideo.replaceTrack(stream.getTracks()[1]); 
        // }
    };
    const requestPictureInPicture = ()=>{
        const picInPicBtn = document.getElementById('picInPic');
        if(document.pictureInPictureElement){
            document.exitPictureInPicture()
            picInPicBtn.innerHTML = '&#8664';
        }else{
            userVideo.current.requestPictureInPicture();
            picInPicBtn.innerHTML = '&#8662';
        }
    }
    document.addEventListener("keypress", function(e) {
        if (e.key === 'Escape') {
          toggleFullScreen();
        }
      }, false);

    function toggleFullScreen() {
        if (!document.fullscreenElement) {
            partnerVideo.current.requestFullscreen();
        } else {
            document.exitPictureInPicture();
          if (document.exitFullscreen) {
          }
        }
    }
    var vid = document.getElementById('localVid');
    
// // Optional frames per second argument.
//     useEffect(()=>{
//         if(isVideoLoading || !isPartnerVideo) return;
//         const Mixer = new MultiStreamsMixer([userStream,partnerStream]);
//         var stream = Mixer.getMixedStream();
//         var recordedChunks = [];

//         console.log(stream);
//         var options = { mimeType: "video/webm; codecs=vp9" };
//         const mediaRecorder = new MediaRecorder(stream, options);

//         mediaRecorder.ondataavailable = handleDataAvailable;
//         mediaRecorder.start();

//         function handleDataAvailable(event) {
//         console.log("data-available");
//         if (event.data.size > 0) {
//             recordedChunks.push(event.data);
//             console.log(recordedChunks);
//             download();
//         } else {
//             // ...
//         }
//         }
//         function download() {
//             var blob = new Blob(recordedChunks, {
//                 type: "video/webm"
//             });
//             var url = URL.createObjectURL(blob);
//             var a = document.createElement("a");
//             document.body.appendChild(a);
//             a.style = "display: none";
//             a.href = url;
//             a.download = "test.webm";
//             a.click();
//             window.URL.revokeObjectURL(url);
//         }

//         // demo: to download after 9sec
//         setTimeout(event => {
//             console.log("stopping");
//             mediaRecorder.stop();
//         }, 9000);
//     },[isVideoLoading]);

    function endCall(){
        setCallEnded(true);
        userStream.current.getTracks().forEach(function(track) {
            track.stop();
        });
        partnerStream.current = null;
        document.getElementById('callEnded').innerHTML = 'Call ended';
        document.getElementById('callEndedDisplay').src = '../Call-Ended.gif';
        if(sendChannel.current) sendChannel.current.send(JSON.stringify({type : 'endCall'}));
    }

    function handleReload(){
        setTimeout(function(){ 
            endCall();
            console.log("Please join a new room");
        }, 1000);
    }

    window.addEventListener("beforeunload", (e) =>{
        delete e['returnValue'];
        endCall();
    });
    return (  
        <div className = 'videoControls' >
            <h3>Room id: {roomID}</h3>
            <h2 id = 'callEnded'></h2>
            <img id = 'callEndedDisplay' class = 'callEnded-png' src = '' />
            {userStream && !callEnded && (<video controls id = 'localVid' muted style = {{height: 500, width: 500}} autoPlay ref = {userVideo} />)}
            {tracksSent && !callEnded && (<video controls id = 'partnerVid' style = {{height: 500, width: 500}} autoPlay ref = {partnerVideo} />)}
            <div className = "btn-group">
                {!callEnded && (<button onClick = {screenShare} disabled = {isVideoLoading } id = 'shareButton'>Share screen</button>)}
                {!callEnded && (<button onClick = {toggleVideo} disabled = {isVideoLoading } id = 'toggleVid'>&#128249;</button>)}
                {!callEnded && (<button onClick = {toggleAudio} disabled = {isVideoLoading } id = 'toggleAud'>&#128266;</button>)}
                {!callEnded && (<button onClick = {requestPictureInPicture} disabled = {!isPartnerVideo} id = 'picInPic'>&#8664;</button>)}
                {!callEnded && (<button onClick = {toggleFullScreen} disabled = {!isPartnerVideo} id = 'fullScreen'>Full screen</button>)}
                {!callEnded && (<button onClick = {endCall}>End call</button>)}
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
 
export default Room2;