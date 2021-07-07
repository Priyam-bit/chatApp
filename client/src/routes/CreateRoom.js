//sfc to create a new room
import React from 'react';
import {v4 as uuid} from 'uuid';

const CreateRoom = (props) => {
    function create(){
        const id = uuid();
        //redirect the user to newly created room
        props.history.push(`/room/${id}`);
    }
    return (  
        <button onClick = {create}>Create Room</button>
    );
}
 
export default CreateRoom;