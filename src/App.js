import './App.css';
import React from 'react';
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import 'primeicons/primeicons.css';

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
