import React from 'react';
import { useHistory } from 'react-router-dom';
import {v4 as uuid} from 'uuid';

//sfc to create a new room
const CreateRoom = () => {
    let history = useHistory();
    function create(){
        const id = uuid();
        //redirect the user to newly created room
        history.push(`/room/${id}`);
    }
    return (  
        <button onClick = {create}>Create Room</button>
    );
}
 
export default CreateRoom;