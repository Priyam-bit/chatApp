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
            document.getElementById('msgStatus').src = '../chatbox-icon.svg';
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

    function renderMessage(message,index) {
        if (message.yours) {
            return (
                <div className="messages__item messages__item--operator" key = {index}>
                    {message.value}
                </div>
            )
        }

        return (
            <div className="messages__item messages__item--visitor" key = {index}>
                {message.value}
            </div>
        )
    }
return (  
        <div className="container">
            <div className="chatbox">
                <div className="chatbox__support" ref = {chatbox} id = 'chatBox'>
                    <div className="chatbox__header">
                        <div className="chatbox__content--header">
                            <h4 className="chatbox__heading--header">Chat</h4>
                        </div>
                    </div>
                    <div className="chatbox__messages">
                        {messages.map(renderMessage)}
                    </div>
                    <div className="chatbox__footer"> 
                        <input type="text" value={text} onChange={handleChange} placeholder="Write a message..." />
                        {<button className="chatbox__send--footer" onClick={sendMessage}>Send</button>}
                    </div>
                </div>
                <div className="chatbox__button">
                    <button onClick = {toggleState} ref = {openButton} id = 'openButton'><img id = 'msgStatus' className = 'msgStatus' src = "../chatbox-icon.svg" alt = 'chat'></img></button>
                </div>
            </div>
        </div>
    );
}
 
export default Chatbox;