import React, { useState } from 'react';
import { useHistory } from 'react-router';
import { Link } from 'react-router-dom';
import CreateRoom from './CreateRoom';
const Home = () => {
    const [id,setId] = useState('');
    const history = useHistory();
    const handleSubmit = (e)=>{
        e.preventDefault();
        history.push(`/room/${id}`);
    }
    return ( 
        <div className="home">
            <nav className = "navbar">
                <h1>The chat App</h1>
                <div className="links">
                    <Link to = "/">Home</Link>
                    < CreateRoom />
                </div>
            </nav>
            Welcome to chatApp
            <form onSubmit = {handleSubmit}>
                <label>Enter room id:</label>
                <input type = 'text' required value = {id} onChange = {(e)=> setId(e.target.value)} />
                <button>Join room</button>
            </form>
            <img class="CupTalk-gif" src = '../cupTalkWeb.gif' />
        </div>
    );
}
 
export default Home;