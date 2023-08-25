import './App.css';
import React, { useState } from 'react';

import Header from "./components/Header";
import Body from "./components/Body";
import DeviceInfoContainer from './components/containers/DeviceInfoContainer';
import ServersInfoContainer from './components/containers/ServersInfoContainer';

function App() {
  const [containerReload, setContainerReload] = useState(false)
  const handleContainerReload = () => {
    setContainerReload(true);
  }

  return (
    <>
      <Header />
      <Body>
        <DeviceInfoContainer sendReloadFlag={handleContainerReload}/>
        <ServersInfoContainer reloadContainer={containerReload}/>
      </Body>
    </>
  );
}

export default App;
