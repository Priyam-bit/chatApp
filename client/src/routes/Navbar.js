import React from 'react';
import {v4 as uuid} from 'uuid';
import { Link } from 'react-router-dom';
const Navbar = () => {
    // function create(){
    //     const id = uuid();
    //     //redirect the user to newly created room
    //     props.history.push(`/room/${id}`);
    // }
    const id = uuid();
    return ( 
        <nav className = "navbar">
            <h1>The chat App</h1>
            <div className="links">
                <Link to = "/">Home</Link>
                <Link to = {`/room/${id}`} style = {{
                    color: 'white',
                    backgroundColor: '#f1356d',
                    borderRadius: '8px'
                }}>New Room</Link>
            </div>
        </nav>
     );
}
export default Navbar;