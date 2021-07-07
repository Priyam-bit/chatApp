import React, {useContext, useState, useRef} from 'react';
import { HandshakeContext } from "../Context";

const Chatbox = () => {
    const {sendChannel, messages, setMessages} = useContext(HandshakeContext);
    const [text, setText] = useState('');
    const openButton = useRef();
    const chatbox = useRef();
    let isOpen = false;
    openButton.current = document.querySelector('.chatbox__button');
    chatbox.current = document.querySelector('.chatbox__support');

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
    if(!sendChannel.current){
        return (null);
    }
    else return (  
        <div class="container">
            <div class="chatbox">
                <div class="chatbox__support" ref = {chatbox} id = 'chatBox'>
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
                        {<button class="chatbox__send--footer" onClick={sendMessage}>Send</button>}
                    </div>
                </div>
                <div class="chatbox__button">
                    <button onClick = {toggleState} ref = {openButton} id = 'openButton'><img src = "../chatbox-icon.svg" ></img></button>
                </div>
            </div>
        </div>
    );
}
 
export default Chatbox;