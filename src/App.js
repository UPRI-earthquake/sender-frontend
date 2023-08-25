import './App.css';
import React, { useState } from 'react';

import Header from "./components/Header";
import Body from "./components/Body";
import DeviceInfoContainer from './components/containers/DeviceInfoContainer';
import ServersInfoContainer from './components/containers/ServersInfoContainer';

function App() {
  const [refreshFlag, setRefreshFlag] = useState(false) // if true, refresh contents of the container

  return (
    <>
      <Header />
      <Body>
        <DeviceInfoContainer setRefreshFlag={setRefreshFlag}/>
        <ServersInfoContainer refreshFlag={refreshFlag}/>
      </Body>
    </>
  );
}

export default App;
