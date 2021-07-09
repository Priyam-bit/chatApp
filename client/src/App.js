import React from 'react';
import { BrowserRouter, Route, Switch } from "react-router-dom";
import Room from "./routes/Room";
import './App.css';
import Home from './routes/Home';
import HandshakeContextProvider from './Context';

function App() {
  return (
    <div className="App">
        <BrowserRouter>
          <Switch>
            <Route exact path="/" > <Home /> </ Route>
            <HandshakeContextProvider>
              <Route path="/room/:roomID" exact  component = {Room} />
            </HandshakeContextProvider>
          </Switch>
        </BrowserRouter>
    </div>
  );
}

export default App;