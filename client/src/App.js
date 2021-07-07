import React from 'react';
import { BrowserRouter, Route, Switch } from "react-router-dom";
import Room2 from "./routes/Room2";
import './App.css';
import Navbar from './routes/Navbar';
import Home from './routes/Home';
import HandshakeContextProvider from './Context';

function App() {
  return (
    <div className="App">
        <BrowserRouter>
          < Navbar />
          <Switch>
            <Route exact path="/" > <Home /> </ Route>
            <HandshakeContextProvider>
              <Route path="/room/:roomID" exact  component = {Room2} />
            </HandshakeContextProvider>
          </Switch>
        </BrowserRouter>
    </div>
  );
}

export default App;