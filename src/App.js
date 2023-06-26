import './App.css';
import React from 'react';

import Header from "./components/Header";
import Body from "./components/Body";
import DeviceInfoContainer from './components/containers/DeviceInfoContainer';
import ServersInfoContainer from './components/containers/ServersInfoContainer';

function App() {
  return (
    <>
      <Header />
      <Body>
        <DeviceInfoContainer />
        <ServersInfoContainer />
      </Body>
    </>
  );
}

export default App;
